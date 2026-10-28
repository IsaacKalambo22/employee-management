"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NotificationService } from "@/lib/notifications/notification-service"
import { AuditAction, AuditLogService } from "@/lib/audit/audit-log"
import { requirePermission } from "@/lib/permissions"
import {
  calculateLoanInstallment,
  formatMWK,
  validateLoanRequest,
} from "@/lib/payroll/calculations"

const LoanSchema = z.object({
  amount: z.coerce.number().positive("Loan amount must be greater than zero"),
  termMonths: z.coerce.number().int("Term must be a whole number of months").min(1, "Term must be at least 1 month"),
  purpose: z.string().trim().min(10, "Please describe the purpose (at least 10 characters)"),
})

export type LoanFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

function revalidateLoans() {
  revalidatePath("/dashboard/loans")
  revalidatePath("/dashboard/finance")
  revalidatePath("/dashboard/finance/approvals")
}

async function notifyEmployee(employeeId: string, subject: string, message: string) {
  try {
    const user = await prisma.user.findUnique({ where: { employeeId } })
    if (user) await NotificationService.notifyFinanceUpdate(user.id, subject, message)
  } catch (e) {
    console.error("Failed to send loan notification:", e)
  }
}

// Loans count as active while pending review or still being repaid
async function findOpenLoan(employeeId: string) {
  return prisma.loanApplication.findFirst({
    where: {
      employeeId,
      OR: [
        { status: "PENDING" },
        { status: "APPROVED", repaymentEnd: { gte: new Date() } },
      ],
    },
  })
}

export async function applyForLoan(
  prevState: LoanFormState,
  formData: FormData
): Promise<LoanFormState> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return { message: "Unauthorized - no employee linked" }
  try { await requirePermission("APPLY_LOAN") } catch { return { message: "Forbidden: you cannot apply for loans" } }

  const parsed = LoanSchema.safeParse({
    amount: formData.get("amount"),
    termMonths: formData.get("termMonths"),
    purpose: formData.get("purpose"),
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { amount, termMonths, purpose } = parsed.data
  const employeeId = session.user.employeeId

  try {
    const [salary, openLoan] = await Promise.all([
      prisma.salary.findUnique({ where: { employeeId } }),
      findOpenLoan(employeeId),
    ])

    if (openLoan) {
      return {
        message: openLoan.status === "PENDING"
          ? "You already have a loan application awaiting review"
          : "You have an active loan that is still being repaid",
      }
    }

    const monthlyGross = salary
      ? Number(salary.baseSalary) + Number(salary.allowance) + Number(salary.bonus)
      : 0
    const validationError = validateLoanRequest(amount, termMonths, monthlyGross)
    if (validationError) return { message: validationError }

    const loan = await prisma.loanApplication.create({
      data: {
        employeeId,
        amount,
        termMonths,
        monthlyInstallment: calculateLoanInstallment(amount, termMonths),
        purpose,
      },
    })

    await AuditLogService.log({
      action: AuditAction.LOAN_APPLIED,
      entityType: "LoanApplication",
      entityId: loan.id,
      details: { amount, termMonths },
    })
  } catch (e) {
    return { message: "Failed to submit loan application" }
  }

  revalidateLoans()
  return { success: true, message: "Loan application submitted for Finance review" }
}

export async function cancelLoanApplication(loanId: string): Promise<LoanFormState> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return { message: "Unauthorized" }

  try {
    const loan = await prisma.loanApplication.findUnique({ where: { id: loanId } })
    if (!loan || loan.employeeId !== session.user.employeeId) return { message: "Loan application not found" }
    if (loan.status !== "PENDING") return { message: "Only pending applications can be cancelled" }

    await prisma.loanApplication.update({ where: { id: loanId }, data: { status: "CANCELLED" } })

    await AuditLogService.log({
      action: AuditAction.LOAN_CANCELLED,
      entityType: "LoanApplication",
      entityId: loanId,
    })
  } catch (e) {
    return { message: "Failed to cancel loan application" }
  }

  revalidateLoans()
  return { success: true, message: "Loan application cancelled" }
}

// Own loans with the amount actually recovered through processed payslips
export async function getMyLoans() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return []
  const employeeId = session.user.employeeId

  const loans = await prisma.loanApplication.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
  })

  return Promise.all(
    loans.map(async (loan) => {
      if (loan.status !== "APPROVED" || !loan.repaymentStart || !loan.repaymentEnd) {
        return { ...loan, repaid: 0 }
      }
      const repayments = await prisma.payslipItem.aggregate({
        _sum: { amount: true },
        where: {
          code: "LOAN",
          payslip: {
            employeeId,
            payroll: { startDate: { gte: loan.repaymentStart, lte: loan.repaymentEnd } },
          },
        },
      })
      return { ...loan, repaid: Number(repayments._sum.amount ?? 0) }
    })
  )
}

// Loan eligibility shown on the application form
export async function getMyLoanEligibility() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return null

  const [salary, openLoan] = await Promise.all([
    prisma.salary.findUnique({ where: { employeeId: session.user.employeeId } }),
    findOpenLoan(session.user.employeeId),
  ])

  const monthlyGross = salary
    ? Number(salary.baseSalary) + Number(salary.allowance) + Number(salary.bonus)
    : 0

  return { monthlyGross, hasSalary: !!salary, hasOpenLoan: !!openLoan }
}

export async function getLoanApplications(status?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED") {
  await requirePermission("REVIEW_LOAN")

  return prisma.loanApplication.findMany({
    where: status ? { status } : {},
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
          salary: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function approveLoan(loanId: string, comment?: string): Promise<LoanFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("REVIEW_LOAN") } catch { return { message: "Forbidden: only Finance can approve loans" } }

  try {
    const loan = await prisma.loanApplication.findUnique({ where: { id: loanId } })
    if (!loan) return { message: "Loan application not found" }
    if (loan.status !== "PENDING") return { message: "This application has already been reviewed" }
    if (loan.employeeId === session.user.employeeId) return { message: "You cannot approve your own loan application" }

    // Repayment starts with the next payroll month
    const now = new Date()
    const repaymentStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const repaymentEnd = new Date(now.getFullYear(), now.getMonth() + 1 + loan.termMonths, 0, 23, 59, 59, 999)

    await prisma.$transaction(async (tx) => {
      const deduction = await tx.deduction.create({
        data: {
          employeeId: loan.employeeId,
          type: "LOAN",
          amount: loan.monthlyInstallment,
          description: `Staff Loan Repayment (${loan.termMonths} months)`,
          isRecurring: true,
          startDate: repaymentStart,
          endDate: repaymentEnd,
        },
      })

      await tx.loanApplication.update({
        where: { id: loanId },
        data: {
          status: "APPROVED",
          reviewedBy: session.user.id,
          reviewedAt: now,
          reviewComment: comment?.trim() || null,
          deductionId: deduction.id,
          repaymentStart,
          repaymentEnd,
        },
      })
    })

    await AuditLogService.log({
      action: AuditAction.LOAN_APPROVED,
      entityType: "LoanApplication",
      entityId: loanId,
      details: { amount: Number(loan.amount), termMonths: loan.termMonths },
    })

    await notifyEmployee(
      loan.employeeId,
      "Loan Approved",
      `Your loan of ${formatMWK(loan.amount)} has been approved. Repayments of ${formatMWK(loan.monthlyInstallment)} will be deducted from payroll starting ${repaymentStart.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}.`
    )
  } catch (e) {
    return { message: "Failed to approve loan" }
  }

  revalidateLoans()
  return { success: true, message: "Loan approved and repayment schedule created" }
}

export async function rejectLoan(loanId: string, comment: string): Promise<LoanFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("REVIEW_LOAN") } catch { return { message: "Forbidden: only Finance can reject loans" } }
  if (!comment?.trim()) return { message: "A reason is required when rejecting a loan" }

  try {
    const loan = await prisma.loanApplication.findUnique({ where: { id: loanId } })
    if (!loan) return { message: "Loan application not found" }
    if (loan.status !== "PENDING") return { message: "This application has already been reviewed" }

    await prisma.loanApplication.update({
      where: { id: loanId },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: comment.trim(),
      },
    })

    await AuditLogService.log({
      action: AuditAction.LOAN_REJECTED,
      entityType: "LoanApplication",
      entityId: loanId,
      details: { reason: comment.trim() },
    })

    await notifyEmployee(
      loan.employeeId,
      "Loan Application Declined",
      `Your loan application of ${formatMWK(loan.amount)} was declined. Reason: ${comment.trim()}`
    )
  } catch (e) {
    return { message: "Failed to reject loan" }
  }

  revalidateLoans()
  return { success: true, message: "Loan application rejected" }
}
