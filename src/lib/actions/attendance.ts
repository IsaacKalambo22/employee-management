"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const STANDARD_START_TIME = 8 // 8:00 AM
const STANDARD_END_TIME = 17 // 5:00 PM
const LATE_THRESHOLD_MINUTES = 15 // 15 minutes late

export type AttendanceFormState = {
  message?: string
  success?: boolean
  errors?: Record<string, string[]>
}

export async function clockIn(): Promise<AttendanceFormState> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return { message: "Unauthorized - no employee linked" }

  try {
    const employeeId = session.user.employeeId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Check if already clocked in today
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    })

    if (existingAttendance && existingAttendance.clockIn) {
      return { message: "Already clocked in today" }
    }

    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()

    // Check if late
    const isLate = hour > STANDARD_START_TIME || (hour === STANDARD_START_TIME && minute > LATE_THRESHOLD_MINUTES)

    // Create or update attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
      update: {
        clockIn: now,
        status: isLate ? "LATE" : "PRESENT",
        isLate,
      },
      create: {
        employeeId,
        date: today,
        clockIn: now,
        status: isLate ? "LATE" : "PRESENT",
        isLate,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CLOCK_IN",
        entityType: "Attendance",
        entityId: attendance.id,
        metadata: { time: now.toISOString(), isLate },
      },
    })

    revalidatePath("/dashboard/attendance")
    return { success: true, message: isLate ? "Clocked in (Late)" : "Clocked in successfully" }
  } catch (e) {
    return { message: "Failed to clock in" }
  }
}

export async function clockOut(): Promise<AttendanceFormState> {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.employeeId) return { message: "Unauthorized - no employee linked" }

  try {
    const employeeId = session.user.employeeId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    })

    if (!attendance || !attendance.clockIn) {
      return { message: "Must clock in first" }
    }

    if (attendance.clockOut) {
      return { message: "Already clocked out today" }
    }

    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()

    // Check if early departure
    const isEarlyDeparture = hour < STANDARD_END_TIME || (hour === STANDARD_END_TIME && minute === 0)

    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: now,
        status: isEarlyDeparture ? "EARLY_DEPARTURE" : attendance.status,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CLOCK_OUT",
        entityType: "Attendance",
        entityId: attendance.id,
        metadata: { time: now.toISOString(), isEarlyDeparture },
      },
    })

    revalidatePath("/dashboard/attendance")
    return { success: true, message: isEarlyDeparture ? "Clocked out (Early departure)" : "Clocked out successfully" }
  } catch (e) {
    return { message: "Failed to clock out" }
  }
}

export async function getAttendance(employeeId?: string, startDate?: Date, endDate?: Date) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const where: any = {}
  if (employeeId) where.employeeId = employeeId
  if (startDate && endDate) {
    where.date = {
      gte: startDate,
      lte: endDate,
    }
  } else if (startDate) {
    where.date = { gte: startDate }
  } else if (endDate) {
    where.date = { lte: endDate }
  }

  return prisma.attendance.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
    },
    orderBy: { date: "desc" },
  })
}

export async function getTodayAttendance(employeeId?: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.attendance.findMany({
    where: {
      date: today,
      employeeId: employeeId || undefined,
    },
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
    },
    orderBy: { clockIn: "desc" },
  })
}

export async function getEmployeeAttendance(employeeId: string) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  return prisma.attendance.findMany({
    where: { employeeId },
    orderBy: { date: "desc" },
  })
}

// Manual correction for attendance
export async function correctAttendance(
  attendanceId: string,
  clockIn?: Date,
  clockOut?: Date,
  status?: string,
  notes?: string
): Promise<AttendanceFormState> {
  const session = await getServerSession(authOptions)
  if (!session) return { message: "Unauthorized" }

  try {
    const updateData: any = { isManual: true, correctedBy: session.user.id }
    if (clockIn) updateData.clockIn = clockIn
    if (clockOut) updateData.clockOut = clockOut
    if (status) updateData.status = status
    if (notes) updateData.notes = notes

    await prisma.attendance.update({
      where: { id: attendanceId },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "CORRECT_ATTENDANCE",
        entityType: "Attendance",
        entityId: attendanceId,
        metadata: { clockIn, clockOut, status, notes },
      },
    })

    revalidatePath("/dashboard/attendance")
    return { success: true, message: "Attendance corrected successfully" }
  } catch (e) {
    return { message: "Failed to correct attendance" }
  }
}

// Get attendance report
export async function getAttendanceReport(employeeId?: string, month?: number, year?: number) {
  const session = await getServerSession(authOptions)
  if (!session) throw new Error("Unauthorized")

  const where: any = {}
  if (employeeId) where.employeeId = employeeId
  if (month !== undefined && year !== undefined) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)
    where.date = { gte: startDate, lte: endDate }
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: {
      employee: { select: { firstName: true, lastName: true, department: { select: { name: true } } } },
    },
    orderBy: { date: "asc" },
  })

  // Calculate statistics
  const totalDays = attendances.length
  const presentDays = attendances.filter((a: any) => a.status === "PRESENT").length
  const lateDays = attendances.filter((a: any) => a.status === "LATE").length
  const absentDays = attendances.filter((a: any) => a.status === "ABSENT").length
  const earlyDepartureDays = attendances.filter((a: any) => a.status === "EARLY_DEPARTURE").length
  const halfDays = attendances.filter((a: any) => a.status === "HALF_DAY").length

  return {
    attendances,
    statistics: {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      earlyDepartureDays,
      halfDays,
      attendanceRate: totalDays > 0 ? ((presentDays + lateDays + halfDays) / totalDays) * 100 : 0,
    },
  }
}
