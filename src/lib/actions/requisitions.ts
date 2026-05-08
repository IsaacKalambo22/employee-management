"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const RequisitionSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  amount: z.string().optional(),
  category: z.string().min(1, "Category is required"),
})

export type RequisitionFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function getRequisitions(status?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.requisition.findMany({
    where: status ? { status } as any : {},
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
      approvals: { orderBy: { level: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getRequisition(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.requisition.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      approvals: { orderBy: { level: "asc" } },
    },
  })
}

export async function createRequisition(
  prevState: RequisitionFormState,
  formData: FormData
): Promise<RequisitionFormState> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return { message: "Unauthorized - no employee linked" }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    amount: formData.get("amount") as string,
    category: formData.get("category") as string,
  }

  const parsed = RequisitionSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { title, description, amount, category } = parsed.data

  try {
    const requisition = await prisma.requisition.create({
      data: {
        employeeId: session.user.employeeId,
        title,
        description,
        amount: amount ? parseFloat(amount) : null,
        category,
      },
    })

    await prisma.requisitionApproval.createMany({
      data: [
        { requisitionId: requisition.id, approverId: "", level: 1, role: "MANAGER", status: "PENDING" },
        { requisitionId: requisition.id, approverId: "", level: 2, role: "FINANCE", status: "PENDING" },
      ],
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE",
        entityType: "Requisition",
        entityId: requisition.id,
        metadata: { title, category, amount },
      },
    })
  } catch (e) {
    return { message: "Failed to create requisition" }
  }

  revalidatePath("/dashboard/requisitions")
  return { success: true, message: "Requisition submitted successfully" }
}

export async function approveRequisition(requisitionId: string, level: number): Promise<RequisitionFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const requisition = await prisma.requisition.findUnique({ where: { id: requisitionId }, include: { approvals: true } })
    if (!requisition) return { message: "Requisition not found" }

    // Finance fund availability check for level 2 (Finance approval)
    if (level === 2 && requisition.amount) {
      const currentYear = new Date().getFullYear()
      const budget = await prisma.budget.findFirst({
        where: {
          category: requisition.category,
          year: currentYear,
        },
      })

      if (!budget) {
        return { message: `No budget found for category: ${requisition.category}` }
      }

      const available = budget.amount.minus(budget.spent)
      if (available.lt(requisition.amount)) {
        return { message: `Insufficient funds. Available: ${available}, Required: ${requisition.amount}` }
      }
    }

    const approval = requisition.approvals.find((a) => a.level === level)
    if (!approval) return { message: "Approval level not found" }

    await prisma.requisitionApproval.update({
      where: { id: approval.id },
      data: { approverId: session.user.id, status: "APPROVED", actedAt: new Date() },
    })

    const remainingPending = requisition.approvals.filter((a) => a.status === "PENDING").length - 1

    if (remainingPending === 0) {
      await prisma.requisition.update({
        where: { id: requisitionId },
        data: { status: "APPROVED" },
      })

      // Update budget spent amount if requisition has amount
      if (requisition.amount) {
        const currentYear = new Date().getFullYear()
        const budget = await prisma.budget.findFirst({
          where: {
            category: requisition.category,
            year: currentYear,
          },
        })

        if (budget) {
          await prisma.budget.update({
            where: { id: budget.id },
            data: { spent: { increment: requisition.amount } },
          })
        }
      }
    } else {
      await prisma.requisition.update({
        where: { id: requisitionId },
        data: { status: level === 1 ? "MANAGER_APPROVED" : "FINANCE_APPROVED" },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "APPROVE",
        entityType: "Requisition",
        entityId: requisitionId,
        metadata: { level },
      },
    })
  } catch (e) {
    return { message: "Failed to approve requisition" }
  }

  revalidatePath("/dashboard/requisitions")
  return { success: true }
}

export async function rejectRequisition(requisitionId: string, comment: string): Promise<RequisitionFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    await prisma.requisition.update({
      where: { id: requisitionId },
      data: { status: "REJECTED" },
    })

    await prisma.requisitionApproval.updateMany({
      where: { requisitionId },
      data: { status: "REJECTED", actedAt: new Date(), comment },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "REJECT",
        entityType: "Requisition",
        entityId: requisitionId,
        metadata: { comment },
      },
    })
  } catch (e) {
    return { message: "Failed to reject requisition" }
  }

  revalidatePath("/dashboard/requisitions")
  return { success: true }
}

// LPO Processing
export async function createLPO(
  requisitionId: string,
  vendorName: string,
  vendorContact?: string,
  expectedDelivery?: string
): Promise<RequisitionFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const requisition = await prisma.requisition.findUnique({ where: { id: requisitionId } })
    if (!requisition) return { message: "Requisition not found" }
    if (requisition.status !== "APPROVED") return { message: "Requisition must be approved before creating LPO" }
    if (!requisition.amount) return { message: "Requisition must have an amount to create LPO" }

    // Generate unique LPO number
    const year = new Date().getFullYear()
    const lpoCount = await prisma.lPO.count()
    const lpoNumber = `LPO-${year}-${String(lpoCount + 1).padStart(4, '0')}`

    await prisma.lPO.create({
      data: {
        requisitionId,
        lpoNumber,
        vendorName,
        vendorContact,
        estimatedAmount: requisition.amount,
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE_LPO",
        entityType: "LPO",
        entityId: requisitionId,
        metadata: { lpoNumber, vendorName },
      },
    })
  } catch (e) {
    return { message: "Failed to create LPO" }
  }

  revalidatePath("/dashboard/requisitions")
  return { success: true, message: "LPO created successfully" }
}

export async function getLPOs() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.lPO.findMany({
    include: {
      requisition: {
        include: {
          employee: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { issuedDate: "desc" },
  })
}

export async function getLPO(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.lPO.findUnique({
    where: { id },
    include: {
      requisition: {
        include: {
          employee: { include: { department: true } },
          approvals: true,
        },
      },
    },
  })
}
