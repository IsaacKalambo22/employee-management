"use server"

import { prisma } from "@/lib/db"
import { requirePermission } from "@/lib/permissions"
import { utilizationRate } from "@/lib/finance/project-budget"

// Requisition states that sit in the Finance review queue
const FINANCE_REVIEW_REQUISITION_STATUSES = ["MANAGER_APPROVED", "PENDING_FINANCE_APPROVAL"] as const

export type DepartmentBudgetSummary = {
  departmentId: string
  department: string
  projectCount: number
  pendingCount: number
  proposed: number
  approved: number
  spent: number
  remaining: number
  utilizationRate: number
  projects: {
    id: string
    name: string
    status: string
    proposed: number
    approved: number
    spent: number
    utilizationRate: number
  }[]
}

// Department budgets are the sum of their approved project budgets for the year
export async function getDepartmentBudgets(fiscalYear: number = new Date().getFullYear()) {
  await requirePermission("VIEW_FINANCE")

  const departments = await prisma.department.findMany({
    include: {
      projects: {
        where: { fiscalYear, status: { in: ["PENDING_REVIEW", "APPROVED", "COMPLETED"] } },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  const summaries: DepartmentBudgetSummary[] = departments.map((dept) => {
    const funded = dept.projects.filter((p) => p.status !== "PENDING_REVIEW")
    const approved = funded.reduce((sum, p) => sum + Number(p.approvedBudget ?? 0), 0)
    const spent = funded.reduce((sum, p) => sum + Number(p.spentAmount), 0)

    return {
      departmentId: dept.id,
      department: dept.name,
      projectCount: dept.projects.length,
      pendingCount: dept.projects.length - funded.length,
      proposed: dept.projects.reduce((sum, p) => sum + Number(p.proposedBudget), 0),
      approved,
      spent,
      remaining: approved - spent,
      utilizationRate: utilizationRate(spent, approved),
      projects: dept.projects.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        proposed: Number(p.proposedBudget),
        approved: Number(p.approvedBudget ?? 0),
        spent: Number(p.spentAmount),
        utilizationRate: utilizationRate(Number(p.spentAmount), Number(p.approvedBudget ?? 0)),
      })),
    }
  })

  const totals = summaries.reduce(
    (acc, d) => ({
      proposed: acc.proposed + d.proposed,
      approved: acc.approved + d.approved,
      spent: acc.spent + d.spent,
    }),
    { proposed: 0, approved: 0, spent: 0 }
  )

  return {
    fiscalYear,
    departments: summaries,
    totals: {
      ...totals,
      remaining: totals.approved - totals.spent,
      utilizationRate: utilizationRate(totals.spent, totals.approved),
    },
  }
}

// Everything awaiting a Finance decision: budgets, loans, spend and payroll release
export async function getPendingFinanceApprovals() {
  await requirePermission("VIEW_FINANCE")

  const [projects, loans, requisitions, payrolls] = await Promise.all([
    prisma.project.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        department: { select: { name: true } },
        proposedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.loanApplication.findMany({
      where: { status: "PENDING" },
      include: {
        employee: {
          select: { firstName: true, lastName: true, department: { select: { name: true } }, salary: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.requisition.findMany({
      where: { status: { in: [...FINANCE_REVIEW_REQUISITION_STATUSES] } },
      include: {
        employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
        project: { select: { name: true, approvedBudget: true, spentAmount: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.payroll.findMany({
      where: { status: "PROCESSED" },
      include: { payslips: { select: { grossPay: true, netPay: true } } },
      orderBy: { period: "asc" },
    }),
  ])

  return {
    projects,
    loans,
    requisitions,
    payrolls: payrolls.map((p) => ({
      id: p.id,
      period: p.period,
      processedAt: p.processedAt,
      processedBy: p.processedBy,
      employeeCount: p.payslips.length,
      totalGross: p.payslips.reduce((sum, s) => sum + Number(s.grossPay), 0),
      totalNet: p.payslips.reduce((sum, s) => sum + Number(s.netPay), 0),
    })),
    total: projects.length + loans.length + requisitions.length + payrolls.length,
  }
}

export async function getPendingFinanceApprovalCount() {
  await requirePermission("VIEW_FINANCE")

  const counts = await Promise.all([
    prisma.project.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.loanApplication.count({ where: { status: "PENDING" } }),
    prisma.requisition.count({ where: { status: { in: [...FINANCE_REVIEW_REQUISITION_STATUSES] } } }),
    prisma.payroll.count({ where: { status: "PROCESSED" } }),
  ])
  return counts.reduce((a, b) => a + b, 0)
}
