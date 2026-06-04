"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail, getLeaveApprovalEmailTemplate, getLeaveRejectionEmailTemplate, getLeaveRequestEmailTemplate } from "@/lib/email"
import { sendSMS, getLeaveApprovalSMSTemplate, getLeaveRejectionSMSTemplate, getLeaveRequestSMSTemplate } from "@/lib/sms"
import { LeaveEntitlementService } from "@/lib/workflow/leave-entitlement"
import { NotificationService } from "@/lib/notifications/notification-service"
import { AuditLogService } from "@/lib/audit/audit-log"
import { requirePermission } from "@/lib/permissions"

const LeaveRequestSchema = z.object({
  policyId: z.string().min(1, "Policy is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().optional(),
})

export type LeaveFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function getLeaveBalances(employeeId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const currentYear = new Date().getFullYear()
  const balances = await prisma.leaveBalance.findMany({
    where: { employeeId, year: currentYear },
    include: { policy: true },
  })

  // Calculate remaining days for each balance
  return balances.map((balance) => ({
    ...balance,
    remaining: balance.allocated - balance.used - balance.pending,
  }))
}

export async function getLeaveRequests(employeeId?: string, status?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.leaveRequest.findMany({
    where: {
      AND: [
        employeeId ? { employeeId } : {},
        status ? { status } as any : {},
      ],
    },
    include: {
      employee: { select: { firstName: true, lastName: true } },
      policy: { select: { name: true } },
      approvals: { orderBy: { level: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getLeaveRequest(id: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: { include: { department: true } },
      policy: true,
      approvals: { orderBy: { level: "asc" } },
    },
  })
}

export async function getPolicies() {
  return prisma.leavePolicy.findMany({ orderBy: { name: "asc" } })
}

export async function createLeaveRequest(
  prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return { message: "Unauthorized - no employee linked" }

  const raw = {
    policyId: formData.get("policyId") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
    reason: formData.get("reason") as string,
  }

  const parsed = LeaveRequestSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { policyId, startDate, endDate, reason } = parsed.data

  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) return { message: "End date must be after start date" }

  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

  // Use LeaveEntitlementService to check balance
  const hasSufficientBalance = await LeaveEntitlementService.hasSufficientBalance(
    session.user.employeeId,
    policyId,
    days,
    new Date().getFullYear()
  )

  if (!hasSufficientBalance) {
    const balance = await LeaveEntitlementService.getOrCreateLeaveBalance(
      session.user.employeeId,
      policyId,
      new Date().getFullYear()
    )
    const available = balance.allocated - balance.used - balance.pending
    return { message: `Insufficient balance. Available: ${available} days, Requested: ${days} days` }
  }

  try {
    const employee = await prisma.employee.findUnique({
      where: { id: session.user.employeeId },
      include: { department: { include: { manager: { include: { user: true } } } } }
    })

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: session.user.employeeId,
        policyId,
        startDate: start,
        endDate: end,
        days,
        reason,
      },
    })

    // Update pending balance
    const balance = await LeaveEntitlementService.getOrCreateLeaveBalance(
      session.user.employeeId,
      policyId,
      new Date().getFullYear()
    )
    await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { pending: { increment: days } },
    })

    await prisma.leaveApproval.createMany({
      data: [
        { requestId: request.id, approverId: "", level: 1, status: "PENDING" },
        { requestId: request.id, approverId: "", level: 2, status: "PENDING" },
      ],
    })

    // Log leave request creation using AuditLogService
    await AuditLogService.logLeaveRequestCreated(
      request.id,
      session.user.employeeId,
      (await prisma.leavePolicy.findUnique({ where: { id: policyId } }))?.name || "Unknown",
      start,
      end,
      days
    )

    // Send notification to line manager using NotificationService
    if (employee?.lineManagerId) {
      await NotificationService.notifyLeaveSubmission(
        employee.lineManagerId,
        `${employee.firstName} ${employee.lastName}`,
        {
          leaveType: (await prisma.leavePolicy.findUnique({ where: { id: policyId } }))?.name,
          startDate: start.toLocaleDateString(),
          endDate: end.toLocaleDateString(),
          days,
          reason,
        }
      )
    }
  } catch (e) {
    return { message: "Failed to create leave request" }
  }

  revalidatePath("/dashboard/leave")
  return { success: true, message: "Leave request submitted successfully" }
}

export async function approveLeave(requestId: string, level: number): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("APPROVE_LEAVE_REQUEST") } catch { return { message: "Forbidden: only managers or HR can approve leave" } }

  try {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { approvals: true, employee: { include: { user: true } }, policy: true }
    })
    if (!request) return { message: "Request not found" }

    const approval = request.approvals.find((a: any) => a.level === level)
    if (!approval) return { message: "Approval level not found" }

    await prisma.leaveApproval.update({
      where: { id: approval.id },
      data: { approverId: session.user.id, status: "APPROVED", actedAt: new Date() },
    })

    const remainingPending = request.approvals.filter((a: any) => a.status === "PENDING").length - 1

    if (remainingPending === 0) {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" },
      })
      
      // Use LeaveEntitlementService to update balance
      await LeaveEntitlementService.updateBalanceOnApproval(requestId)

      // Send approval notification to employee
      if (request.employee.user?.id) {
        const approver = await prisma.user.findUnique({ where: { id: session.user.id } })
        await NotificationService.notifyLeaveApproval(
          request.employee.user.id,
          approver?.email ?? "HR",
          {
            leaveType: request.policy.name,
            startDate: new Date(request.startDate).toLocaleDateString(),
            endDate: new Date(request.endDate).toLocaleDateString(),
            days: request.days,
          }
        )
      }
    } else {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: level === 1 ? "MANAGER_APPROVED" : "HR_APPROVED" },
      })
    }

    // Log leave approval using AuditLogService
    await AuditLogService.logLeaveRequestApproved(
      requestId,
      session.user.id,
      `Approved at level ${level}`
    )
  } catch (e) {
    return { message: "Failed to approve request" }
  }

  revalidatePath("/dashboard/leave")
  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/hr")
  revalidatePath("/dashboard/manager")
  revalidatePath("/dashboard/employee")
  return { success: true }
}

export async function rejectLeave(requestId: string, comment: string): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("REJECT_LEAVE_REQUEST") } catch { return { message: "Forbidden: only managers or HR can reject leave" } }

  try {
    const request = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: { include: { user: true } }, policy: true }
    })
    if (!request) return { message: "Request not found" }

    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    })

    // Use LeaveEntitlementService to update balance on cancellation
    await LeaveEntitlementService.updateBalanceOnCancellation(requestId)

    await prisma.leaveApproval.updateMany({
      where: { requestId },
      data: { status: "REJECTED", actedAt: new Date(), comment },
    })

    // Send rejection notification to employee
    if (request.employee.user?.id) {
      const approver = await prisma.user.findUnique({ where: { id: session.user.id } })
      await NotificationService.notifyLeaveRejection(
        request.employee.user.id,
        approver?.email ?? "HR",
        comment || "No reason provided"
      )
    }

    // Log leave rejection using AuditLogService
    await AuditLogService.logLeaveRequestRejected(
      requestId,
      session.user.id,
      comment || "No reason provided"
    )
  } catch (e) {
    return { message: "Failed to reject request" }
  }

  revalidatePath("/dashboard/leave")
  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/hr")
  revalidatePath("/dashboard/manager")
  revalidatePath("/dashboard/employee")
  return { success: true }
}

export async function cancelLeave(requestId: string): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } })
    if (!request) return { message: "Request not found" }
    if (request.status !== "PENDING") return { message: "Can only cancel pending requests" }

    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    })

    // Use LeaveEntitlementService to update balance on cancellation
    await LeaveEntitlementService.updateBalanceOnCancellation(requestId)

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CANCEL",
        entityType: "LeaveRequest",
        entityId: requestId,
      },
    })
  } catch (e) {
    return { message: "Failed to cancel request" }
  }

  revalidatePath("/dashboard/leave")
  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/hr")
  revalidatePath("/dashboard/manager")
  revalidatePath("/dashboard/employee")
  return { success: true }
}

export async function deleteLeave(requestId: string): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } })
    if (!request) return { message: "Request not found" }
    if (request.status !== "PENDING") return { message: "Can only delete pending requests" }

    await prisma.leaveRequest.delete({
      where: { id: requestId },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "DELETE",
        entityType: "LeaveRequest",
        entityId: requestId,
      },
    })
  } catch (e) {
    return { message: "Failed to delete request" }
  }

  revalidatePath("/dashboard/leave")
  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/hr")
  revalidatePath("/dashboard/manager")
  revalidatePath("/dashboard/employee")
  return { success: true }
}

export async function updateLeave(
  requestId: string,
  prevState: LeaveFormState,
  formData: FormData
): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const request = await prisma.leaveRequest.findUnique({ where: { id: requestId } })
    if (!request) return { message: "Request not found" }
    if (request.status !== "PENDING") return { message: "Can only edit pending requests" }

    const startDate = new Date(formData.get("startDate") as string)
    const endDate = new Date(formData.get("endDate") as string)
    const policyId = formData.get("policyId") as string
    const reason = formData.get("reason") as string

    if (startDate > endDate) {
      return { message: "Start date must be before end date" }
    }

    const policy = await prisma.leavePolicy.findUnique({ where: { id: policyId } })
    if (!policy) return { message: "Policy not found" }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        startDate,
        endDate,
        policyId,
        reason,
        days,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "UPDATE",
        entityType: "LeaveRequest",
        entityId: requestId,
      },
    })
  } catch (e) {
    return { message: "Failed to update request" }
  }

  revalidatePath("/dashboard/leave")
  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/hr")
  revalidatePath("/dashboard/manager")
  revalidatePath("/dashboard/employee")
  return { success: true }
}
