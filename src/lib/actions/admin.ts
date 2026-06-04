"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { requirePermission } from "@/lib/permissions"

const DEFAULT_LEAVE_POLICIES = [
  { name: "Annual Leave",        description: "Paid annual leave",                    daysPerYear: 21, carryOver: true,  maxCarryOver: 5 },
  { name: "Sick Leave",          description: "Medical sick leave",                   daysPerYear: 10, carryOver: false, maxCarryOver: 0 },
  { name: "Maternity Leave",     description: "Paid maternity leave",                 daysPerYear: 90, carryOver: false, maxCarryOver: 0 },
  { name: "Paternity Leave",     description: "Paid paternity leave",                 daysPerYear: 14, carryOver: false, maxCarryOver: 0 },
  { name: "Compassionate Leave", description: "Bereavement and compassionate leave",  daysPerYear: 5,  carryOver: false, maxCarryOver: 0 },
  { name: "Study Leave",         description: "Leave for examinations and study",     daysPerYear: 10, carryOver: false, maxCarryOver: 0 },
  { name: "Unpaid Leave",        description: "Unpaid extended leave",                daysPerYear: 30, carryOver: false, maxCarryOver: 0 },
]

export async function seedLeavePoliciesAndBalances(): Promise<{
  success: boolean
  message: string
  details?: string
}> {
  const session = await getServerSession(authOptions)
  if (!session) return { success: false, message: "Unauthorized" }
  try { await requirePermission("MANAGE_LEAVE_POLICIES") } catch {
    return { success: false, message: "Forbidden: only HR or Admin can manage leave policies" }
  }

  const currentYear = new Date().getFullYear()

  try {
    // Upsert all default leave policies
    const policies: { id: string; daysPerYear: number }[] = []
    for (const p of DEFAULT_LEAVE_POLICIES) {
      const policy = await prisma.leavePolicy.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      })
      policies.push(policy)
    }

    // Get all active employees
    const employees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
    })

    let balancesCreated = 0
    for (const emp of employees) {
      for (const policy of policies) {
        const existing = await prisma.leaveBalance.findUnique({
          where: {
            employeeId_policyId_year: {
              employeeId: emp.id,
              policyId: policy.id,
              year: currentYear,
            },
          },
        })
        if (!existing) {
          await prisma.leaveBalance.create({
            data: {
              employeeId: emp.id,
              policyId: policy.id,
              year: currentYear,
              allocated: policy.daysPerYear,
              used: 0,
              pending: 0,
              carriedOver: 0,
            },
          })
          balancesCreated++
        }
      }
    }

    return {
      success: true,
      message: `Done. ${policies.length} policies ensured, ${balancesCreated} new leave balances created for ${employees.length} employees.`,
    }
  } catch (e: any) {
    return { success: false, message: `Failed: ${e?.message ?? "Unknown error"}` }
  }
}
