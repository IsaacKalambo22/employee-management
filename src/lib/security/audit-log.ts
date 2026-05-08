import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function logAuditEvent({
  action,
  entityType,
  entityId,
  metadata,
}: {
  action: string
  entityType: string
  entityId?: string
  metadata?: Record<string, any>
}) {
  const session = await getServerSession(authOptions)
  if (!session) return

  try {
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action,
        entityType,
        entityId: entityId || "",
        metadata: metadata || {},
      },
    })
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}

// Common audit actions
export const AuditActions = {
  // Employee actions
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  EMPLOYEE_DELETED: "EMPLOYEE_DELETED",
  
  // Leave actions
  LEAVE_REQUESTED: "LEAVE_REQUESTED",
  LEAVE_APPROVED: "LEAVE_APPROVED",
  LEAVE_REJECTED: "LEAVE_REJECTED",
  LEAVE_CANCELLED: "LEAVE_CANCELLED",
  
  // Attendance actions
  ATTENDANCE_CLOCKED_IN: "ATTENDANCE_CLOCKED_IN",
  ATTENDANCE_CLOCKED_OUT: "ATTENDANCE_CLOCKED_OUT",
  ATTENDANCE_UPDATED: "ATTENDANCE_UPDATED",
  
  // Requisition actions
  REQUISITION_CREATED: "REQUISITION_CREATED",
  REQUISITION_APPROVED: "REQUISITION_APPROVED",
  REQUISITION_REJECTED: "REQUISITION_REJECTED",
  
  // Payroll actions
  PAYROLL_PROCESSED: "PAYROLL_PROCESSED",
  PAYSLIP_GENERATED: "PAYSLIP_GENERATED",
  
  // Document actions
  DOCUMENT_UPLOADED: "DOCUMENT_UPLOADED",
  DOCUMENT_DELETED: "DOCUMENT_DELETED",
  
  // User actions
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  
  // System actions
  DATA_EXPORTED: "DATA_EXPORTED",
  SETTINGS_CHANGED: "SETTINGS_CHANGED",
}
