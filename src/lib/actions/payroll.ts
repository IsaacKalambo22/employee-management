"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const SalarySchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  baseSalary: z.string().min(1, "Base salary is required"),
  allowance: z.string().optional(),
  bonus: z.string().optional(),
  deductions: z.string().optional(),
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

export type PayrollFormState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

// Salary Management
export async function createSalary(
  prevState: PayrollFormState,
  formData: FormData
): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  const raw = {
    employeeId: formData.get("employeeId") as string,
    baseSalary: formData.get("baseSalary") as string,
    allowance: formData.get("allowance") as string,
    bonus: formData.get("bonus") as string,
    deductions: formData.get("deductions") as string,
  }

  const parsed = SalarySchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const { employeeId, baseSalary, allowance, bonus, deductions } = parsed.data

  try {
    await prisma.salary.create({
      data: {
        employeeId,
        baseSalary: parseFloat(baseSalary),
        allowance: allowance ? parseFloat(allowance) : 0,
        bonus: bonus ? parseFloat(bonus) : 0,
        deductions: deductions ? parseFloat(deductions) : 0,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CREATE_SALARY",
        entityType: "Salary",
        entityId: employeeId,
        metadata: { baseSalary, allowance, bonus },
      },
    })
  } catch (e) {
    return { message: "Failed to create salary" }
  }

  revalidatePath("/dashboard/payroll")
  return { success: true, message: "Salary created successfully" }
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

  try {
    await prisma.salary.update({
      where: { id: salaryId },
      data: { baseSalary, allowance, bonus, deductions },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "UPDATE_SALARY",
        entityType: "Salary",
        entityId: salaryId,
        metadata: { baseSalary, allowance, bonus },
      },
    })
  } catch (e) {
    return { message: "Failed to update salary" }
  }

  revalidatePath("/dashboard/payroll")
  return { success: true, message: "Salary updated successfully" }
}

export async function getSalaries() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.salary.findMany({
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
    },
    orderBy: { effectiveDate: "desc" },
  })
}

export async function getSalary(employeeId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

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

  revalidatePath("/dashboard/payroll")
  return { success: true, message: "Deduction created successfully" }
}

export async function getDeductions(employeeId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.deduction.findMany({
    where: employeeId ? { employeeId } : {},
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

// Tax Calculation (simplified for Malawi)
const TAX_RATE = 0.2 // 20% tax rate
const TAX_THRESHOLD = 100000 // Monthly tax threshold in MWK

function calculateTax(grossPay: number): number {
  if (grossPay <= TAX_THRESHOLD) return 0
  return (grossPay - TAX_THRESHOLD) * TAX_RATE
}

// Payroll Processing
export async function processPayroll(period: string, startDate: Date, endDate: Date): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    // Create payroll record
    const payroll = await prisma.payroll.create({
      data: {
        period,
        startDate,
        endDate,
        status: "PROCESSING",
      },
    })

    // Get all employees with salaries
    const salaries = await prisma.salary.findMany({
      include: { employee: true },
    })

    // Process each employee
    for (const salary of salaries) {
      // Calculate gross pay
      const grossPay = Number(salary.baseSalary) + Number(salary.allowance) + Number(salary.bonus)

      // Calculate tax
      const tax = calculateTax(grossPay)

      // Get employee deductions for the period
      const deductions = await prisma.deduction.findMany({
        where: {
          employeeId: salary.employeeId,
          startDate: { lte: endDate },
          OR: [{ endDate: null }, { endDate: { gte: startDate } }],
        },
      })

      const totalDeductions = deductions.reduce((sum: number, d: any) => sum + Number(d.amount), 0) + Number(salary.deductions)

      // Calculate net pay
      const netPay = grossPay - tax - totalDeductions

      // Create payslip
      await prisma.payslip.create({
        data: {
          payrollId: payroll.id,
          employeeId: salary.employeeId,
          baseSalary: salary.baseSalary,
          allowance: salary.allowance,
          bonus: salary.bonus,
          grossPay,
          tax,
          otherDeductions: totalDeductions,
          netPay,
        },
      })
    }

    // Update payroll status
    await prisma.payroll.update({
      where: { id: payroll.id },
      data: {
        status: "PROCESSED",
        processedAt: new Date(),
        processedBy: session.user.id,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "PROCESS_PAYROLL",
        entityType: "Payroll",
        entityId: payroll.id,
        metadata: { period, employeeCount: salaries.length },
      },
    })
  } catch (e) {
    return { message: "Failed to process payroll" }
  }

  revalidatePath("/dashboard/payroll")
  return { success: true, message: "Payroll processed successfully" }
}

export async function getPayrolls() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

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
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.payroll.findUnique({
    where: { id },
    include: {
      payslips: {
        include: {
          employee: { include: { department: true } },
        },
      },
    },
  })
}

export async function getPayslips(employeeId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.payslip.findMany({
    where: employeeId ? { employeeId } : {},
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
      payroll: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function markPayrollPaid(payrollId: string): Promise<PayrollFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    await prisma.payroll.update({
      where: { id: payrollId },
      data: { status: "PAID" },
    })

    await prisma.payslip.updateMany({
      where: { payrollId },
      data: { payDate: new Date() },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "MARK_PAID",
        entityType: "Payroll",
        entityId: payrollId,
      },
    })
  } catch (e) {
    return { message: "Failed to mark payroll as paid" }
  }

  revalidatePath("/dashboard/payroll")
  return { success: true, message: "Payroll marked as paid" }
}
