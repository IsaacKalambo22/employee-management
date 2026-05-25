"use server"

import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Employee Analytics
export async function getEmployeeAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const totalEmployees = await prisma.employee.count()
  const activeEmployees = await prisma.employee.count({ where: { status: "ACTIVE" } })
  const inactiveEmployees = await prisma.employee.count({ where: { status: "INACTIVE" } })

  // Employees by department
  const employeesByDepartment = await prisma.employee.groupBy({
    by: ["departmentId"],
    _count: { id: true },
    where: { status: "ACTIVE" },
  })

  const departmentData = await Promise.all(
    employeesByDepartment.map(async (group) => {
      const dept = group.departmentId ? await prisma.department.findUnique({ where: { id: group.departmentId } }) : null
      return {
        name: dept?.name || "Unknown",
        count: group._count.id || 0,
      }
    })
  )

  // Employees by position
  const employeesByPosition = await prisma.employee.groupBy({
    by: ["positionId"],
    _count: { id: true },
    where: { status: "ACTIVE" },
  })

  const positionData = await Promise.all(
    employeesByPosition.map(async (group) => {
      const position = group.positionId ? await prisma.position.findUnique({ where: { id: group.positionId } }) : null
      return {
        name: position?.title || "Unknown",
        count: group._count.id || 0,
      }
    })
  )

  // New hires this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const newHiresThisMonth = await prisma.employee.count({
    where: { hireDate: { gte: startOfMonth } },
  })

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    employeesByDepartment: departmentData,
    employeesByPosition: positionData,
    newHiresThisMonth,
  }
}

// Attendance Analytics
export async function getAttendanceAnalytics(month?: number, year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const currentMonth = month ?? new Date().getMonth() + 1
  const currentYear = year ?? new Date().getFullYear()

  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0)

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
  })

  const present = attendances.filter((a: any) => a.status === "PRESENT").length
  const absent = attendances.filter((a: any) => a.status === "ABSENT").length
  const late = attendances.filter((a: any) => a.status === "LATE").length
  const earlyDeparture = attendances.filter((a: any) => a.status === "EARLY_DEPARTURE").length
  const halfDay = attendances.filter((a: any) => a.status === "HALF_DAY").length

  // Daily attendance trends
  const dailyAttendance = await prisma.attendance.groupBy({
    by: ["date"],
    _count: { id: true },
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  })

  return {
    present,
    absent,
    late,
    earlyDeparture,
    halfDay,
    total: attendances.length,
    attendanceRate: attendances.length > 0 ? ((present + late + halfDay) / attendances.length) * 100 : 0,
    dailyAttendance: dailyAttendance.map((d) => ({
      date: d.date.toISOString().split("T")[0],
      count: d._count.id,
    })),
  }
}

// Leave Analytics
export async function getLeaveAnalytics(month?: number, year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const currentMonth = month ?? new Date().getMonth() + 1
  const currentYear = year ?? new Date().getFullYear()

  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0)

  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      startDate: { gte: startDate, lte: endDate },
    },
  })

  const approved = leaveRequests.filter((lr: any) => 
    lr.status === "APPROVED" || lr.status === "MANAGER_APPROVED" || lr.status === "HR_APPROVED"
  ).length
  const pending = leaveRequests.filter((lr: any) => lr.status === "PENDING").length
  const rejected = leaveRequests.filter((lr: any) => lr.status === "REJECTED").length
  const cancelled = leaveRequests.filter((lr: any) => lr.status === "CANCELLED").length

  // Leave by type (policy)
  const leaveByType = await prisma.leaveRequest.groupBy({
    by: ["policyId"],
    _count: { id: true },
    where: {
      startDate: { gte: startDate, lte: endDate },
      status: "APPROVED",
    },
  })

  const leaveByTypeData = await Promise.all(
    leaveByType.map(async (lt) => {
      const policy = await prisma.leavePolicy.findUnique({ where: { id: lt.policyId } })
      return {
        type: policy?.name || "Unknown",
        count: lt._count.id || 0,
      }
    })
  )

  return {
    approved,
    pending,
    rejected,
    cancelled,
    total: leaveRequests.length,
    leaveByType: leaveByTypeData,
  }
}

// Requisition Analytics
export async function getRequisitionAnalytics(month?: number, year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const currentMonth = month ?? new Date().getMonth() + 1
  const currentYear = year ?? new Date().getFullYear()

  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0)

  const requisitions = await prisma.requisition.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  const approved = requisitions.filter((r: any) => 
    r.status === "APPROVED" || r.status === "MANAGER_APPROVED" || r.status === "FINANCE_APPROVED"
  ).length
  const pending = requisitions.filter((r: any) => r.status === "PENDING").length
  const rejected = requisitions.filter((r: any) => r.status === "REJECTED").length
  const cancelled = requisitions.filter((r: any) => r.status === "CANCELLED").length

  // Total amount spent
  const totalAmount = requisitions
    .filter((r: any) => r.status === "APPROVED" || r.status === "MANAGER_APPROVED" || r.status === "FINANCE_APPROVED")
    .reduce((sum: number, r: any) => sum + (r.estimatedAmount ? Number(r.estimatedAmount) : 0), 0)

  // Requisitions by category
  const requisitionsByCategory = await prisma.requisition.groupBy({
    by: ["category"],
    _count: { id: true },
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  return {
    approved,
    pending,
    rejected,
    cancelled,
    total: requisitions.length,
    totalAmount,
    requisitionsByCategory: requisitionsByCategory.map((rc) => ({
      category: rc.category,
      count: rc._count.id,
    })),
  }
}

// Payroll Analytics
export async function getPayrollAnalytics(month?: number, year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const currentMonth = month ?? new Date().getMonth() + 1
  const currentYear = year ?? new Date().getFullYear()

  const startDate = new Date(currentYear, currentMonth - 1, 1)
  const endDate = new Date(currentYear, currentMonth, 0)

  const payslips = await prisma.payslip.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  })

  const totalGrossPay = payslips.reduce((sum: number, p: any) => sum + Number(p.grossPay), 0)
  const totalNetPay = payslips.reduce((sum: number, p: any) => sum + Number(p.netPay), 0)
  const totalTax = payslips.reduce((sum: number, p: any) => sum + Number(p.tax), 0)
  const totalDeductions = payslips.reduce((sum: number, p: any) => sum + Number(p.otherDeductions), 0)

  return {
    totalEmployees: payslips.length,
    totalGrossPay,
    totalNetPay,
    totalTax,
    totalDeductions,
    averageGrossPay: payslips.length > 0 ? totalGrossPay / payslips.length : 0,
    averageNetPay: payslips.length > 0 ? totalNetPay / payslips.length : 0,
  }
}

// Dashboard Analytics (combined)
export async function getDashboardAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const [employeeAnalytics, attendanceAnalytics, leaveAnalytics, requisitionAnalytics, payrollAnalytics] =
    await Promise.all([
      getEmployeeAnalytics(),
      getAttendanceAnalytics(),
      getLeaveAnalytics(),
      getRequisitionAnalytics(),
      getPayrollAnalytics(),
    ])

  return {
    employee: employeeAnalytics,
    attendance: attendanceAnalytics,
    leave: leaveAnalytics,
    requisition: requisitionAnalytics,
    payroll: payrollAnalytics,
  }
}

// Workflow Analytics
export async function getWorkflowAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const activeWorkflows = await prisma.workflowInstance.count({
    where: { status: "ACTIVE" },
  })
  const completedWorkflows = await prisma.workflowInstance.count({
    where: { status: "COMPLETED" },
  })
  const cancelledWorkflows = await prisma.workflowInstance.count({
    where: { status: "CANCELLED" },
  })

  // Workflow instances by entity type
  const workflowsByEntity = await prisma.workflowInstance.groupBy({
    by: ["entityType"],
    _count: { id: true },
  })

  // Average workflow completion time
  const completedInstances = await prisma.workflowInstance.findMany({
    where: { status: "COMPLETED", completedAt: { not: null } },
    select: { initiatedAt: true, completedAt: true },
  })

  const avgCompletionTime = completedInstances.length > 0
    ? completedInstances.reduce((sum, wi) => {
        const duration = wi.completedAt!.getTime() - wi.initiatedAt.getTime()
        return sum + duration
      }, 0) / completedInstances.length
    : 0

  return {
    activeWorkflows,
    completedWorkflows,
    cancelledWorkflows,
    total: activeWorkflows + completedWorkflows + cancelledWorkflows,
    workflowsByEntity: workflowsByEntity.map((w) => ({
      entityType: w.entityType,
      count: w._count.id,
    })),
    avgCompletionTime: Math.round(avgCompletionTime / (1000 * 60 * 60)), // in hours
  }
}

// Team Analytics (for managers)
export async function getTeamAnalytics(managerId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const targetManagerId = managerId || session.user.employeeId

  // Get direct reports
  const directReports = await prisma.employee.findMany({
    where: { lineManagerId: targetManagerId },
    include: {
      department: true,
      attendance: {
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      leaveRequests: {
        where: {
          startDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
    },
  })

  const teamSize = directReports.length
  const presentToday = directReports.filter((e) =>
    e.attendance.some((a) => a.date.toDateString() === new Date().toDateString() && a.status === "PRESENT")
  ).length
  const onLeaveToday = directReports.filter((e) =>
    e.leaveRequests.some((lr) => {
      const today = new Date()
      const start = new Date(lr.startDate)
      const end = new Date(lr.endDate)
      return today >= start && today <= end && lr.status === "APPROVED"
    })
  ).length

  // Pending approvals for this manager
  const pendingLeaveApprovals = await prisma.leaveRequest.count({
    where: {
      status: "PENDING",
      employee: { lineManagerId: targetManagerId },
    },
  })

  const pendingRequisitionApprovals = await prisma.requisition.count({
    where: {
      status: "PENDING",
      employee: { lineManagerId: targetManagerId },
    },
  })

  return {
    teamSize,
    presentToday,
    onLeaveToday,
    pendingLeaveApprovals,
    pendingRequisitionApprovals,
    teamMembers: directReports.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      department: e.department?.name,
      status: e.status,
    })),
  }
}

// Department Budget Analytics
export async function getBudgetAnalytics(departmentId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const currentYear = new Date().getFullYear()

  const budgets = await prisma.departmentBudget.findMany({
    where: {
      fiscalYear: currentYear,
      ...(departmentId && { departmentId }),
    },
    include: { department: true },
  })

  const totalAllocated = budgets.reduce((sum, b) => sum + Number(b.allocatedAmount), 0)
  const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spentAmount), 0)
  const totalRemaining = totalAllocated - totalSpent

  return {
    totalAllocated,
    totalSpent,
    totalRemaining,
    utilizationRate: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
    budgets: budgets.map((b) => ({
      id: b.id,
      department: b.department?.name,
      category: b.category,
      allocated: Number(b.allocatedAmount),
      spent: Number(b.spentAmount),
      remaining: Number(b.allocatedAmount) - Number(b.spentAmount),
      utilizationRate: (Number(b.spentAmount) / Number(b.allocatedAmount)) * 100,
    })),
  }
}

// HR-specific Analytics
export async function getHRDashboardAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const [employeeAnalytics, attendanceAnalytics, leaveAnalytics, requisitionAnalytics, workflowAnalytics, budgetAnalytics] = await Promise.all([
    getEmployeeAnalytics(),
    getAttendanceAnalytics(),
    getLeaveAnalytics(),
    getRequisitionAnalytics(),
    getWorkflowAnalytics(),
    getBudgetAnalytics(),
  ])

  // Pending actions requiring HR attention
  const pendingLeaveRequests = await prisma.leaveRequest.count({
    where: { status: "PENDING" },
  })

  const pendingRequisitions = await prisma.requisition.count({
    where: { status: "PENDING" },
  })

  const expiringContracts = await prisma.employee.count({
    where: {
      status: "ACTIVE",
      // Add contract expiry logic if needed
    },
  })

  return {
    employee: employeeAnalytics,
    attendance: attendanceAnalytics,
    leave: leaveAnalytics,
    requisition: requisitionAnalytics,
    workflow: workflowAnalytics,
    budget: budgetAnalytics,
    pendingActions: {
      leaveRequests: pendingLeaveRequests,
      requisitions: pendingRequisitions,
      expiringContracts,
    },
  }
}

// Manager-specific Analytics
export async function getManagerDashboardAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) throw new Error("Unauthorized")

  const [teamAnalytics, leaveAnalytics, requisitionAnalytics] = await Promise.all([
    getTeamAnalytics(session.user.employeeId),
    getLeaveAnalytics(),
    getRequisitionAnalytics(),
  ])

  return {
    team: teamAnalytics,
    leave: leaveAnalytics,
    requisition: requisitionAnalytics,
  }
}

// Employee-specific Analytics
export async function getEmployeeDashboardAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) throw new Error("Unauthorized")

  const currentYear = new Date().getFullYear()

  // Leave balance
  const leaveBalances = await prisma.leaveBalance.findMany({
    where: {
      employeeId: session.user.employeeId,
      year: currentYear,
    },
    include: { policy: true },
  })

  // Recent leave requests
  const recentLeaveRequests = await prisma.leaveRequest.findMany({
    where: { employeeId: session.user.employeeId },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Recent requisitions
  const recentRequisitions = await prisma.requisition.findMany({
    where: { employeeId: session.user.employeeId },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  // Recent payslips
  const recentPayslips = await prisma.payslip.findMany({
    where: { employeeId: session.user.employeeId },
    include: { payroll: true },
    orderBy: { createdAt: "desc" },
    take: 3,
  })

  // Attendance this month
  const currentMonth = new Date().getMonth()
  const attendanceThisMonth = await prisma.attendance.findMany({
    where: {
      employeeId: session.user.employeeId,
      date: {
        gte: new Date(currentYear, currentMonth, 1),
        lte: new Date(currentYear, currentMonth + 1, 0),
      },
    },
  })

  const presentDays = attendanceThisMonth.filter((a) => a.status === "PRESENT").length
  const lateDays = attendanceThisMonth.filter((a) => a.status === "LATE").length

  return {
    leaveBalances: leaveBalances.map((lb) => ({
      policy: lb.policy.name,
      allocated: lb.allocated,
      used: lb.used,
      pending: lb.pending,
      remaining: lb.allocated - lb.used - lb.pending,
    })),
    recentLeaveRequests,
    recentRequisitions,
    recentPayslips,
    attendance: {
      presentDays,
      lateDays,
      totalDays: attendanceThisMonth.length,
    },
  }
}

// Finance-specific Analytics
export async function getFinanceDashboardAnalytics() {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const [requisitionAnalytics, budgetAnalytics, payrollAnalytics] = await Promise.all([
    getRequisitionAnalytics(),
    getBudgetAnalytics(),
    getPayrollAnalytics(),
  ])

  // Pending finance approvals
  const pendingFinanceApprovals = await prisma.requisition.count({
    where: { status: "PENDING_FINANCE_APPROVAL" },
  })

  return {
    requisition: requisitionAnalytics,
    budget: budgetAnalytics,
    payroll: payrollAnalytics,
    pendingFinanceApprovals,
  }
}
