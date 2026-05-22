import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export enum AuditAction {
  // Workflow Actions
  WORKFLOW_INITIATED = "WORKFLOW_INITIATED",
  WORKFLOW_APPROVED = "WORKFLOW_APPROVED",
  WORKFLOW_REJECTED = "WORKFLOW_REJECTED",
  WORKFLOW_CANCELLED = "WORKFLOW_CANCELLED",
  WORKFLOW_COMPLETED = "WORKFLOW_COMPLETED",
  WORKFLOW_DELEGATED = "WORKFLOW_DELEGATED",
  
  // Leave Actions
  LEAVE_REQUEST_CREATED = "LEAVE_REQUEST_CREATED",
  LEAVE_REQUEST_APPROVED = "LEAVE_REQUEST_APPROVED",
  LEAVE_REQUEST_REJECTED = "LEAVE_REQUEST_REJECTED",
  LEAVE_REQUEST_CANCELLED = "LEAVE_REQUEST_CANCELLED",
  LEAVE_BALANCE_UPDATED = "LEAVE_BALANCE_UPDATED",
  
  // Requisition Actions
  REQUISITION_CREATED = "REQUISITION_CREATED",
  REQUISITION_APPROVED = "REQUISITION_APPROVED",
  REQUISITION_REJECTED = "REQUISITION_REJECTED",
  REQUISITION_CANCELLED = "REQUISITION_CANCELLED",
  BUDGET_UPDATED = "BUDGET_UPDATED",
  
  // Payroll Actions
  PAYROLL_PROCESSED = "PAYROLL_PROCESSED",
  PAYSLIP_GENERATED = "PAYSLIP_GENERATED",
  SALARY_UPDATED = "SALARY_UPDATED",
  
  // Employee Actions
  EMPLOYEE_CREATED = "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED = "EMPLOYEE_UPDATED",
  EMPLOYEE_TERMINATED = "EMPLOYEE_TERMINATED",
  EMPLOYEE_REINSTATED = "EMPLOYEE_REINSTATED",
  
  // System Actions
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  PERMISSION_GRANTED = "PERMISSION_GRANTED",
  PERMISSION_REVOKED = "PERMISSION_REVOKED",
}

export interface AuditLogData {
  action: AuditAction
  entityType: string
  entityId: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

export class AuditLogService {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData) {
    const session = await getServerSession(authOptions)
    const actorId = session?.user?.id

    try {
      await prisma.auditLog.create({
        data: {
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          actorId: actorId || "system",
          metadata: data.details || {},
        },
      })
    } catch (error) {
      console.error("Failed to create audit log:", error)
      // Don't throw - audit logging failures shouldn't break the application
    }
  }

  /**
   * Log workflow initiation
   */
  static async logWorkflowInitiated(
    entityType: string,
    entityId: string,
    workflowInstanceId: string,
    templateName: string
  ) {
    await this.log({
      action: AuditAction.WORKFLOW_INITIATED,
      entityType,
      entityId,
      details: {
        workflowInstanceId,
        templateName,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log workflow approval
   */
  static async logWorkflowApproval(
    entityType: string,
    entityId: string,
    workflowInstanceId: string,
    stepName: string,
    approverId: string,
    comment?: string
  ) {
    await this.log({
      action: AuditAction.WORKFLOW_APPROVED,
      entityType,
      entityId,
      details: {
        workflowInstanceId,
        stepName,
        approverId,
        comment,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log workflow rejection
   */
  static async logWorkflowRejection(
    entityType: string,
    entityId: string,
    workflowInstanceId: string,
    stepName: string,
    approverId: string,
    reason?: string
  ) {
    await this.log({
      action: AuditAction.WORKFLOW_REJECTED,
      entityType,
      entityId,
      details: {
        workflowInstanceId,
        stepName,
        approverId,
        reason,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log workflow completion
   */
  static async logWorkflowCompleted(
    entityType: string,
    entityId: string,
    workflowInstanceId: string
  ) {
    await this.log({
      action: AuditAction.WORKFLOW_COMPLETED,
      entityType,
      entityId,
      details: {
        workflowInstanceId,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log leave request creation
   */
  static async logLeaveRequestCreated(
    leaveRequestId: string,
    employeeId: string,
    leaveType: string,
    startDate: Date,
    endDate: Date,
    days: number
  ) {
    await this.log({
      action: AuditAction.LEAVE_REQUEST_CREATED,
      entityType: "LEAVE_REQUEST",
      entityId: leaveRequestId,
      details: {
        employeeId,
        leaveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
    })
  }

  /**
   * Log leave request approval
   */
  static async logLeaveRequestApproved(
    leaveRequestId: string,
    approverId: string,
    comment?: string
  ) {
    await this.log({
      action: AuditAction.LEAVE_REQUEST_APPROVED,
      entityType: "LEAVE_REQUEST",
      entityId: leaveRequestId,
      details: {
        approverId,
        comment,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log leave request rejection
   */
  static async logLeaveRequestRejected(
    leaveRequestId: string,
    approverId: string,
    reason?: string
  ) {
    await this.log({
      action: AuditAction.LEAVE_REQUEST_REJECTED,
      entityType: "LEAVE_REQUEST",
      entityId: leaveRequestId,
      details: {
        approverId,
        reason,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log requisition creation
   */
  static async logRequisitionCreated(
    requisitionId: string,
    employeeId: string,
    category: string,
    estimatedAmount: number
  ) {
    await this.log({
      action: AuditAction.REQUISITION_CREATED,
      entityType: "REQUISITION",
      entityId: requisitionId,
      details: {
        employeeId,
        category,
        estimatedAmount,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log requisition approval
   */
  static async logRequisitionApproved(
    requisitionId: string,
    approverId: string,
    stepName: string,
    comment?: string
  ) {
    await this.log({
      action: AuditAction.REQUISITION_APPROVED,
      entityType: "REQUISITION",
      entityId: requisitionId,
      details: {
        approverId,
        stepName,
        comment,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Log payroll processing
   */
  static async logPayrollProcessed(
    payrollId: string,
    period: string,
    employeeCount: number,
    totalAmount: number
  ) {
    await this.log({
      action: AuditAction.PAYROLL_PROCESSED,
      entityType: "PAYROLL",
      entityId: payrollId,
      details: {
        period,
        employeeCount,
        totalAmount,
        timestamp: new Date().toISOString(),
      },
    })
  }

  /**
   * Get audit logs for an entity
   */
  static async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    limit: number = 50
  ) {
    return await prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    actorId: string,
    limit: number = 50
  ) {
    return await prisma.auditLog.findMany({
      where: {
        actorId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })
  }

  /**
   * Get audit logs by action type
   */
  static async getAuditLogsByAction(
    action: AuditAction,
    limit: number = 50
  ) {
    return await prisma.auditLog.findMany({
      where: {
        action,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    })
  }
}
