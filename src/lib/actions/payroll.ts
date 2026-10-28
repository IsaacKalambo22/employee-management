"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NotificationService } from "@/lib/notifications/notification-service"
import { AuditAction, AuditLogService } from "@/lib/audit/audit-log"
import { checkPermission, requirePermission } from "@/lib/permissions"
import { calculatePayslip, formatPeriod, periodBounds } from "@/lib/payroll/calculations"

const SalarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  baseSalary: z.coerce.number().positive("Base salary must be greater than zero"),
  allowance: z.coerce.number().min(0, "Allowance cannot be negative").default(0),
  bonus: z.coerce.number().min(0, "Bonus cannot be negative").default(0),
  deductions: z.coerce.number().min(0, "Deductions cannot be negative").default(0),
})

const DeductionSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  type: z.string().min(1, "Type is required"),
  amount: z.string().min(1, "Amount is required"),
  description: z.string().optional(),
  isRecurring: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
})

const PeriodSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Select a valid payroll month")

export type PayrollFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

function revalidatePayroll() {
  revalidatePath("/dashboard/payroll")
  revalidatePath("/dashboard/finance")
}

// Salary Management
// Creates the employee's salary record, or updates it if one already exists
export async function createSalary(
  prevState: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("UPDATE_PAYROLL") } catch { return { message: "Forbidden: only HR can manage salaries" } }

  const parsed = SalarySchema.safeParse({
    employeeId: formData.get("employeeId"),
    baseSalary: formData.get("baseSalary"),
    allowance: formData.get("allowance") || 0,
    bonus: formData.get("bonus") || 0,
    deductions: formData.get("deductions") || 0,
  })
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { employeeId, baseSalary, allowance, bonus, deductions } = parsed.data

  try {
    const salary = await prisma.salary.upsert({
      where: { employeeId },
      create: { employeeId, baseSalary, allowance, bonus, deductions },
      update: { baseSalary, allowance, bonus, deductions, effectiveDate: new Date() },
    })

    await AuditLogService.log({
      action: AuditAction.SALARY_UPDATED,
      entityType: "Salary",
      entityId: salary.id,
      details: { employeeId, baseSalary, allowance, bonus, deductions },
    })
  } catch (e) {
    return { message: "Failed to save salary" }
  }

  revalidatePayroll()
  return { success: true, message: "Salary saved successfully" }
}

export async function updateSalary(
  salaryId: string,
  baseSalary: number,
  allowance?: number,
  bonus?: number,
  deductions?: number
): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("UPDATE_PAYROLL") } catch { return { message: "Forbidden: only HR can manage salaries" } }

  try {
    await prisma.salary.update({
      where: { id: salaryId },
      data: { baseSalary, allowance, bonus, deductions },
    })

    await AuditLogService.log({
      action: AuditAction.SALARY_UPDATED,
      entityType: "Salary",
      entityId: salaryId,
      details: { baseSalary, allowance, bonus, deductions },
    })
  } catch (e) {
    return { message: "Failed to update salary" }
  }

  revalidatePayroll()
  return { success: true, message: "Salary updated successfully" }
}

export async function getSalaries() {
  await requirePermission("READ_PAYROLL")

  return prisma.salary.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
    },
    orderBy: { effectiveDate: "desc" },
  })
}

// Active employees with their current salary, for the salary management table
export async function getPayrollEmployees() {
  await requirePermission("READ_PAYROLL")

  return prisma.employee.findMany({
    where: { status: { in: ["ACTIVE", "ON_LEAVE"] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      department: { select: { name: true } },
      position: { select: { title: true } },
      salary: true,
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  })
}

export async function getSalary(employeeId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")
  if (session.user.employeeId !== employeeId) await requirePermission("READ_PAYROLL")

  return prisma.salary.findUnique({
    where: { employeeId },
  })
}

// Deduction Management
export async function createDeduction(
  prevState: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("UPDATE_PAYROLL") } catch { return { message: "Forbidden: only HR can manage deductions" } }

  const raw = {
    employeeId: formData.get("employeeId") as string,
    type: formData.get("type") as string,
    amount: formData.get("amount") as string,
    description: formData.get("description") as string,
    isRecurring: formData.get("isRecurring") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
  }

  const parsed = DeductionSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { employeeId, type, amount, description, isRecurring, startDate, endDate } = parsed.data

  try {
    await prisma.deduction.create({
      data: {
        employeeId,
        type,
        amount: parseFloat(amount),
        description,
        isRecurring: isRecurring === "true",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE_DEDUCTION",
        entityType: "Deduction",
        entityId: employeeId,
        metadata: { type, amount },
      },
    })
  } catch (e) {
    return { message: "Failed to create deduction" }
  }

  revalidatePayroll()
  return { success: true, message: "Deduction created successfully" }
}

export async function getDeductions(employeeId?: string) {
  await requirePermission("READ_PAYROLL")

  return prisma.deduction.findMany({
    where: employeeId ? { employeeId } : {},
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

// Payroll Processing
// Form action used by the "Run Payroll" dialog
export async function runPayroll(
  prevState: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  const parsed = PeriodSchema.safeParse(formData.get("period"))
  if (!parsed.success) {
    return { errors: { period: parsed.error.issues.map((i) => i.message) } }
  }

  const { startDate, endDate } = periodBounds(parsed.data)
  return processPayroll(parsed.data, startDate, endDate)
}

export async function processPayroll(period: string, startDate: Date, endDate: Date): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("CREATE_PAYROLL") } catch { return { message: "Forbidden: only HR can process payroll" } }

  const existing = await prisma.payroll.findUnique({ where: { period } })
  if (existing) {
    return { message: `A payroll for ${formatPeriod(period)} already exists` }
  }

  const salaries = await prisma.salary.findMany({
    where: { employee: { status: { in: ["ACTIVE", "ON_LEAVE"] } } },
    include: { employee: { include: { user: true } } },
  })
  if (salaries.length === 0) {
    return { message: "No active employees have a salary record. Set up salaries before running payroll." }
  }

  // Recurring deductions apply to every period they overlap; one-off deductions
  // only apply to the period their start date falls in.
  const deductions = await prisma.deduction.findMany({
    where: {
      employeeId: { in: salaries.map((s) => s.employeeId) },
      OR: [
        {
          isRecurring: true,
          startDate: { lte: endDate },
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: startDate } }] }],
        },
        { isRecurring: false, startDate: { gte: startDate, lte: endDate } },
      ],
    },
  })

  let totals = { gross: 0, net: 0 }

  try {
    const payroll = await prisma.$transaction(async (tx) => {
      const created = await tx.payroll.create({
        data: { period, startDate, endDate, status: "PROCESSING" },
      })

      for (const salary of salaries) {
        const result = calculatePayslip(
          {
            baseSalary: Number(salary.baseSalary),
            allowance: Number(salary.allowance),
            bonus: Number(salary.bonus),
            standingDeduction: Number(salary.deductions),
          },
          deductions
            .filter((d) => d.employeeId === salary.employeeId)
            .map((d) => ({ type: d.type, amount: Number(d.amount), description: d.description }))
        )

        totals = { gross: totals.gross + result.grossPay, net: totals.net + result.netPay }

        await tx.payslip.create({
          data: {
            payrollId: created.id,
            employeeId: salary.employeeId,
            baseSalary: salary.baseSalary,
            allowance: salary.allowance,
            bonus: salary.bonus,
            grossPay: result.grossPay,
            tax: result.tax,
            otherDeductions: result.otherDeductions,
            netPay: result.netPay,
            items: { create: result.items },
          },
        })
      }

      return tx.payroll.update({
        where: { id: created.id },
        data: { status: "PROCESSED", processedAt: new Date(), processedBy: session.user.id },
      })
    }, { timeout: 60_000 })

    await AuditLogService.logPayrollProcessed(payroll.id, period, salaries.length, totals.gross)
  } catch (e) {
    console.error("Payroll processing failed:", e)
    return { message: "Failed to process payroll" }
  }

  // Notifications are best-effort and must not fail a completed payroll run
  for (const salary of salaries) {
    if (!salary.employee.user?.id) continue
    try {
      await NotificationService.notifyPayrollUploaded(salary.employee.user.id, formatPeriod(period))
    } catch (e) {
      console.error("Failed to send payroll notification:", e)
    }
  }

  revalidatePayroll()
  return {
    success: true,
    message: `Payroll for ${formatPeriod(period)} processed for ${salaries.length} employee(s)`,
  }
}

export async function getPayrolls() {
  await requirePermission("READ_PAYROLL")

  return prisma.payroll.findMany({
    include: {
      payslips: {
        include: {
          employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        },
      },
    },
    orderBy: { period: "desc" },
  })
}

export async function getPayroll(id: string) {
  await requirePermission("READ_PAYROLL")

  return prisma.payroll.findUnique({
    where: { id },
    include: {
      payslips: {
        include: {
          employee: { include: { department: true } },
        },
        orderBy: { employee: { firstName: "asc" } },
      },
    },
  })
}

export async function getPayslips(employeeId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  // Salary data is confidential: only payroll staff may view other employees' payslips
  if (employeeId && session.user.employeeId !== employeeId) {
    if (!checkPermission(session.user.role, "READ_PAYROLL")) {
      throw new Error("Unauthorized to view other employees' payslips")
    }
  }

  // If no employeeId provided, use the current user's employeeId
  const targetEmployeeId = employeeId || session.user.employeeId
  if (!targetEmployeeId) return []

  return prisma.payslip.findMany({
    where: { employeeId: targetEmployeeId },
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
      payroll: true,
    },
    orderBy: { payroll: { period: "desc" } },
  })
}

// Single payslip with its itemised earnings and deductions.
// Returns null if it doesn't exist or the user may not view it.
export async function getPayslipDetail(payslipId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      payroll: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          grade: true,
          hireDate: true,
          department: { select: { name: true } },
          position: { select: { title: true } },
        },
      },
    },
  })
  if (!payslip) return null

  const isOwner = session.user.employeeId === payslip.employeeId
  if (!isOwner && !checkPermission(session.user.role, "READ_PAYROLL")) return null

  return payslip
}

// Employee self-service: Get own payslips
export async function getMyPayslips() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) throw new Error("Unauthorized")

  return prisma.payslip.findMany({
    where: { employeeId: session.user.employeeId },
    include: {
      payroll: true,
    },
    orderBy: { payroll: { period: "desc" } },
  })
}

// Employee self-service: Get own salary history
export async function getMySalaryHistory() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) throw new Error("Unauthorized")

  return prisma.salary.findMany({
    where: { employeeId: session.user.employeeId },
    orderBy: { effectiveDate: "desc" },
  })
}

// Employee self-service: Get own deductions
export async function getMyDeductions() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) throw new Error("Unauthorized")

  return prisma.deduction.findMany({
    where: { employeeId: session.user.employeeId },
    orderBy: { createdAt: "desc" },
  })
}

// Finance releases a processed payroll for payment
export async function markPayrollPaid(payrollId: string): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }
  try { await requirePermission("APPROVE_PAYROLL") } catch { return { message: "Forbidden: only Finance can release payroll" } }

  try {
    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { payslips: { include: { employee: { include: { user: true } } } } },
    })
    if (!payroll) return { message: "Payroll not found" }
    if (payroll.status !== "PROCESSED") return { message: "Only processed payrolls can be marked as paid" }
    if (payroll.processedBy === session.user.id) {
      return { message: "Segregation of duties: payroll must be released by someone other than the person who processed it" }
    }

    const paidAt = new Date()
    await prisma.$transaction([
      prisma.payroll.update({ where: { id: payrollId }, data: { status: "PAID" } }),
      prisma.payslip.updateMany({ where: { payrollId }, data: { payDate: paidAt } }),
    ])

    await AuditLogService.log({
      action: AuditAction.PAYROLL_PAID,
      entityType: "Payroll",
      entityId: payrollId,
      details: { period: payroll.period, employeeCount: payroll.payslips.length },
    })

    for (const payslip of payroll.payslips) {
      if (!payslip.employee.user?.id) continue
      try {
        await NotificationService.notifyPayrollApproved(payslip.employee.user.id, formatPeriod(payroll.period))
      } catch (e) {
        console.error("Failed to send payroll paid notification:", e)
      }
    }
  } catch (e) {
    return { message: "Failed to mark payroll as paid" }
  }

  revalidatePayroll()
  return { success: true, message: "Payroll marked as paid" }
}
