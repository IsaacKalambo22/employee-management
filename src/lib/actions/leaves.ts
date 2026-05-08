"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sendEmail, getLeaveApprovalEmailTemplate, getLeaveRejectionEmailTemplate, getLeaveRequestEmailTemplate } from "@/lib/email"
import { sendSMS, getLeaveApprovalSMSTemplate, getLeaveRejectionSMSTemplate, getLeaveRequestSMSTemplate } from "@/lib/sms"

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
  return prisma.leaveBalance.findMany({
    where: { employeeId, year: currentYear },
    include: { policy: true },
  })
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

  const balance = await prisma.leaveBalance.findFirst({
    where: { employeeId: session.user.employeeId, policyId, year: new Date().getFullYear() },
  })

  if (!balance) return { message: "No leave balance found for this policy" }
  const available = balance.allocated - balance.used - balance.pending
  if (days > available) return { message: `Insufficient balance. Available: ${available} days, Requested: ${days} days` }

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

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE",
        entityType: "LeaveRequest",
        entityId: request.id,
        metadata: { days, policyId },
      },
    })

    // Send email notification to manager/approver
    const policy = await prisma.leavePolicy.findUnique({ where: { id: policyId } })
    if (employee?.department?.manager?.user?.email && policy) {
      await sendEmail({
        to: employee.department.manager.user.email,
        subject: "New Leave Request for Approval",
        html: getLeaveRequestEmailTemplate({
          approverName: employee.department.manager.user.email,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          leaveType: policy.name,
          startDate: start.toLocaleDateString(),
          endDate: end.toLocaleDateString(),
          reason,
        }),
      })
      // Send SMS to manager if phone number exists
      if (employee.department.manager.phone) {
        await sendSMS({
          to: employee.department.manager.phone,
          text: getLeaveRequestSMSTemplate({
            employeeName: `${employee.firstName} ${employee.lastName}`,
            leaveType: policy.name,
            startDate: start.toLocaleDateString(),
            endDate: end.toLocaleDateString(),
          }),
        })
      }
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
      const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: request.employeeId, policyId: request.policyId, year: new Date().getFullYear() },
      })
      if (balance) {
        await prisma.leaveBalance.update({
          where: { id: balance.id },
          data: { pending: { decrement: request.days }, used: { increment: request.days } },
        })
      }

      // Send approval email to employee
      if (request.employee.user?.email) {
        const approver = await prisma.user.findUnique({ where: { id: session.user.id } })
        await sendEmail({
          to: request.employee.user.email,
          subject: "Leave Request Approved",
          html: getLeaveApprovalEmailTemplate({
            employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
            leaveType: request.policy.name,
            startDate: new Date(request.startDate).toLocaleDateString(),
            endDate: new Date(request.endDate).toLocaleDateString(),
            approverName: approver?.email ?? "HR",
          }),
        })
        // Send SMS to employee if phone number exists
        if (request.employee.phone) {
          await sendSMS({
            to: request.employee.phone,
            text: getLeaveApprovalSMSTemplate({
              leaveType: request.policy.name,
              startDate: new Date(request.startDate).toLocaleDateString(),
              endDate: new Date(request.endDate).toLocaleDateString(),
            }),
          })
        }
      }
    } else {
      await prisma.leaveRequest.update({
        where: { id: requestId },
        data: { status: level === 1 ? "MANAGER_APPROVED" : "HR_APPROVED" },
      })
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "APPROVE",
        entityType: "LeaveRequest",
        entityId: requestId,
        metadata: { level },
      },
    })
  } catch (e) {
    return { message: "Failed to approve request" }
  }

  revalidatePath("/dashboard/leave")
  return { success: true }
}

export async function rejectLeave(requestId: string, comment: string): Promise<LeaveFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

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

    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: request.employeeId, policyId: request.policyId, year: new Date().getFullYear() },
    })
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { decrement: request.days } },
      })
    }

    await prisma.leaveApproval.updateMany({
      where: { requestId },
      data: { status: "REJECTED", actedAt: new Date(), comment },
    })

    // Send rejection email to employee
    if (request.employee.user?.email) {
      const approver = await prisma.user.findUnique({ where: { id: session.user.id } })
      await sendEmail({
        to: request.employee.user.email,
        subject: "Leave Request Rejected",
        html: getLeaveRejectionEmailTemplate({
          employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
          leaveType: request.policy.name,
          startDate: new Date(request.startDate).toLocaleDateString(),
          endDate: new Date(request.endDate).toLocaleDateString(),
          approverName: approver?.email ?? "HR",
          reason: comment,
        }),
      })
      // Send SMS to employee if phone number exists
      if (request.employee.phone) {
        await sendSMS({
          to: request.employee.phone,
          text: getLeaveRejectionSMSTemplate({
            leaveType: request.policy.name,
            startDate: new Date(request.startDate).toLocaleDateString(),
            endDate: new Date(request.endDate).toLocaleDateString(),
          }),
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "REJECT",
        entityType: "LeaveRequest",
        entityId: requestId,
        metadata: { comment },
      },
    })
  } catch (e) {
    return { message: "Failed to reject request" }
  }

  revalidatePath("/dashboard/leave")
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

    const balance = await prisma.leaveBalance.findFirst({
      where: { employeeId: request.employeeId, policyId: request.policyId, year: new Date().getFullYear() },
    })
    if (balance) {
      await prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { decrement: request.days } },
      })
    }

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
  return { success: true }
}
