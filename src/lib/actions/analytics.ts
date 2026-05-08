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

  const approved = leaveRequests.filter((lr: any) => lr.status === "APPROVED").length
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

  const approved = requisitions.filter((r: any) => r.status === "APPROVED").length
  const pending = requisitions.filter((r: any) => r.status === "PENDING").length
  const rejected = requisitions.filter((r: any) => r.status === "REJECTED").length
  const cancelled = requisitions.filter((r: any) => r.status === "CANCELLED").length

  // Total amount spent
  const totalAmount = requisitions
    .filter((r: any) => r.status === "APPROVED")
    .reduce((sum: number, r: any) => sum + Number(r.estimatedAmount), 0)

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
