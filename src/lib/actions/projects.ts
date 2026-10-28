"use server"

import { revalidatePath } from "next/cache"
import type { ProjectStatus } from "@prisma/client"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NotificationService } from "@/lib/notifications/notification-service"
import { AuditAction, AuditLogService } from "@/lib/audit/audit-log"
import { requirePermission } from "@/lib/permissions"
import { getManagedDepartmentIds } from "@/lib/finance/project-budget"
import { formatMWK } from "@/lib/payroll/calculations"

const ProjectSchema = z
  .object({
    departmentId: z.string().min(1, "Department is required"),
    name: z.string().trim().min(3, "Project name must be at least 3 characters"),
    description: z.string().trim().min(20, "Describe the project scope and justification (at least 20 characters)"),
    proposedBudget: z.coerce.number().positive("Proposed budget must be greater than zero"),
    fiscalYear: z.coerce.number().int().min(2000).max(2100),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || new Date(d.endDate) >= new Date(d.startDate), {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  })

export type ProjectFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

function revalidateProjects() {
  revalidatePath("/dashboard/projects")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/utilization")
  revalidatePath("/dashboard/finance/approvals")
}

async function notifyProposer(proposedById: string | null, subject: string, message: string) {
  if (!proposedById) return
  try {
    const user = await prisma.user.findUnique({ where: { employeeId: proposedById } })
    if (user) await NotificationService.notifyFinanceUpdate(user.id, subject, message)
  } catch (e) {
    console.error("Failed to send project notification:", e)
  }
}

// Managers are limited to their own departments; HR, Finance and Admin see all
async function getDepartmentScope(): Promise<string[] | null> {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  if (session.user.role !== "MANAGER") return null
  return getManagedDepartmentIds(session.user.employeeId)
}

export async function getProposableDepartments() {
  await requirePermission("PROPOSE_PROJECT")
  const scope = await getDepartmentScope()

  return prisma.department.findMany({
    where: scope ? { id: { in: scope } } : {},
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })
}

export async function proposeProject(
  prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("PROPOSE_PROJECT") } catch { return { message: "Forbidden: you cannot propose projects" } }

  const parsed = ProjectSchema.safeParse({
    departmentId: formData.get("departmentId"),
    name: formData.get("name"),
    description: formData.get("description"),
    proposedBudget: formData.get("proposedBudget"),
    fiscalYear: formData.get("fiscalYear"),
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { departmentId, name, description, proposedBudget, fiscalYear, startDate, endDate } = parsed.data

  const scope = await getDepartmentScope()
  if (scope && !scope.includes(departmentId)) {
    return { message: "You can only propose projects for your own department" }
  }

  try {
    const project = await prisma.project.create({
      data: {
        departmentId,
        name,
        description,
        proposedBudget,
        fiscalYear,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        proposedById: session.user.employeeId || null,
      },
    })

    await AuditLogService.log({
      action: AuditAction.PROJECT_PROPOSED,
      entityType: "Project",
      entityId: project.id,
      details: { departmentId, proposedBudget, fiscalYear },
    })
  } catch (e) {
    return { message: "Failed to submit project proposal" }
  }

  revalidateProjects()
  return { success: true, message: "Project proposal submitted for Finance review" }
}

export async function getProjects(filters: { fiscalYear?: number; status?: ProjectStatus } = {}) {
  await requirePermission("PROPOSE_PROJECT")
  const scope = await getDepartmentScope()

  return prisma.project.findMany({
    where: {
      ...(scope && { departmentId: { in: scope } }),
      ...(filters.fiscalYear && { fiscalYear: filters.fiscalYear }),
      ...(filters.status && { status: filters.status }),
    },
    include: {
      department: { select: { name: true } },
      proposedBy: { select: { firstName: true, lastName: true } },
      _count: { select: { requisitions: true } },
    },
    orderBy: [{ fiscalYear: "desc" }, { createdAt: "desc" }],
  })
}

// Approved, funded projects in the employee's department, for linking requisitions
export async function getRequisitionProjectOptions() {
  const session = await getServerSession(authOptions)
  if (!session?.user.employeeId) return []

  const employee = await prisma.employee.findUnique({
    where: { id: session.user.employeeId },
    select: { departmentId: true },
  })
  if (!employee?.departmentId) return []

  const projects = await prisma.project.findMany({
    where: {
      departmentId: employee.departmentId,
      status: "APPROVED",
      fiscalYear: new Date().getFullYear(),
    },
    select: { id: true, name: true, approvedBudget: true, spentAmount: true },
    orderBy: { name: "asc" },
  })

  return projects.map((p) => ({
    id: p.id,
    name: p.name,
    remaining: Number(p.approvedBudget ?? 0) - Number(p.spentAmount),
  }))
}

export async function approveProject(
  projectId: string,
  approvedBudget: number,
  comment?: string
): Promise<ProjectFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("REVIEW_PROJECT") } catch { return { message: "Forbidden: only Finance can approve project budgets" } }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return { message: "Project not found" }
    if (project.status !== "PENDING_REVIEW") return { message: "This project has already been reviewed" }
    if (project.proposedById && project.proposedById === session.user.employeeId) {
      return { message: "You cannot approve a project you proposed" }
    }
    if (!Number.isFinite(approvedBudget) || approvedBudget <= 0) {
      return { message: "Approved budget must be greater than zero" }
    }
    if (approvedBudget > Number(project.proposedBudget)) {
      return { message: "Approved budget cannot exceed the proposed budget" }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "APPROVED",
        approvedBudget,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment?.trim() || null,
      },
    })

    await AuditLogService.log({
      action: AuditAction.PROJECT_APPROVED,
      entityType: "Project",
      entityId: projectId,
      details: { proposedBudget: Number(project.proposedBudget), approvedBudget },
    })

    await notifyProposer(
      project.proposedById,
      "Project Budget Approved",
      `Your project "${project.name}" has been approved with a budget of ${formatMWK(approvedBudget)}.`
    )
  } catch (e) {
    return { message: "Failed to approve project" }
  }

  revalidateProjects()
  return { success: true, message: "Project budget approved" }
}

export async function rejectProject(projectId: string, comment: string): Promise<ProjectFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("REVIEW_PROJECT") } catch { return { message: "Forbidden: only Finance can reject project budgets" } }
  if (!comment?.trim()) return { message: "A reason is required when rejecting a project" }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } })
    if (!project) return { message: "Project not found" }
    if (project.status !== "PENDING_REVIEW") return { message: "This project has already been reviewed" }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment.trim(),
      },
    })

    await AuditLogService.log({
      action: AuditAction.PROJECT_REJECTED,
      entityType: "Project",
      entityId: projectId,
      details: { reason: comment.trim() },
    })

    await notifyProposer(
      project.proposedById,
      "Project Budget Declined",
      `Your project "${project.name}" was declined. Reason: ${comment.trim()}`
    )
  } catch (e) {
    return { message: "Failed to reject project" }
  }

  revalidateProjects()
  return { success: true, message: "Project proposal rejected" }
}
