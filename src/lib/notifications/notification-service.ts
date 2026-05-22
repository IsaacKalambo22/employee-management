import { PrismaClient } from '@prisma/client';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

const prisma = new PrismaClient();

export interface NotificationPayload {
  recipientId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
}

export class NotificationService {
  /**
   * Queue a notification for sending
   */
  static async queueNotification(payload: NotificationPayload) {
    const notifications = [];

    for (const channel of payload.channels) {
      const notification = await prisma.notificationQueue.create({
        data: {
          recipientId: payload.recipientId,
          type: payload.type,
          channel,
          subject: payload.subject,
          message: payload.message,
          metadata: payload.metadata,
          scheduledFor: payload.scheduledFor,
          status: payload.scheduledFor ? NotificationStatus.PENDING : NotificationStatus.PENDING,
        },
      });
      notifications.push(notification);
    }

    // If not scheduled, process immediately
    if (!payload.scheduledFor) {
      await this.processNotifications(notifications.map((n) => n.id));
    }

    return notifications;
  }

  /**
   * Process pending notifications
   */
  static async processNotifications(notificationIds?: string[]) {
    const where = notificationIds
      ? { id: { in: notificationIds }, status: NotificationStatus.PENDING }
      : {
          status: NotificationStatus.PENDING,
          OR: [
            { scheduledFor: null },
            { scheduledFor: { lte: new Date() } },
          ],
        };

    const notifications = await prisma.notificationQueue.findMany({
      where,
      take: 50, // Process in batches
    });

    const results = [];

    for (const notification of notifications) {
      try {
        await this.sendNotification(notification);
        results.push({ id: notification.id, success: true });
      } catch (error) {
        console.error(`Failed to send notification ${notification.id}:`, error);
        
        // Update with error and increment retry count
        await prisma.notificationQueue.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.RETRYING,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount: { increment: 1 },
          },
        });

        results.push({ id: notification.id, success: false, error });
      }
    }

    return results;
  }

  /**
   * Send a single notification
   */
  private static async sendNotification(notification: any) {
    const recipient = await prisma.user.findUnique({
      where: { id: notification.recipientId },
      include: { employee: true },
    });

    if (!recipient) {
      throw new Error('Recipient not found');
    }

    let success = false;

    switch (notification.channel) {
      case NotificationChannel.EMAIL:
        if (recipient.email) {
          await sendEmail({
            to: recipient.email,
            subject: notification.subject || 'Notification',
            html: this.formatEmailMessage(notification.message, notification.metadata),
          });
          success = true;
        }
        break;

      case NotificationChannel.SMS:
        if (recipient.employee?.phone) {
          await sendSMS({
            to: recipient.employee.phone,
            text: notification.message,
          });
          success = true;
        }
        break;

      case NotificationChannel.IN_APP:
        // In-app notifications are stored and retrieved by the frontend
        success = true;
        break;

      default:
        throw new Error(`Unknown notification channel: ${notification.channel}`);
    }

    if (success) {
      await prisma.notificationQueue.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    }
  }

  /**
   * Format message for email
   */
  private static formatEmailMessage(message: string, metadata?: Record<string, any>): string {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">HR System Notification</h2>
        <p style="color: #666; line-height: 1.6;">${message}</p>
    `;

    if (metadata) {
      html += '<div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">';
      html += '<h3 style="margin-top: 0; color: #333;">Details</h3>';
      html += '<ul style="color: #666;">';
      
      for (const [key, value] of Object.entries(metadata)) {
        html += `<li><strong>${key}:</strong> ${value}</li>`;
      }
      
      html += '</ul></div>';
    }

    html += `
        <p style="margin-top: 30px; color: #999; font-size: 12px;">
          This is an automated notification from the HR Management System.
        </p>
      </div>
    `;

    return html;
  }

  /**
   * Get notifications for a user
   */
  static async getUserNotifications(userId: string, limit = 20) {
    return await prisma.notificationQueue.findMany({
      where: {
        recipientId: userId,
        status: { in: [NotificationStatus.SENT, NotificationStatus.PENDING] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string) {
    return await prisma.notificationQueue.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.SENT },
    });
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string) {
    return await prisma.notificationQueue.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.PENDING,
      },
    });
  }

  /**
   * Convenience methods for common notification types
   */

  static async notifyLeaveSubmission(
    recipientId: string,
    employeeName: string,
    leaveDetails: any
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.LEAVE_SUBMISSION,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'New Leave Request Submitted',
      message: `${employeeName} has submitted a leave request for ${leaveDetails.days} day(s) from ${leaveDetails.startDate} to ${leaveDetails.endDate}.`,
      metadata: leaveDetails,
    });
  }

  static async notifyLeaveApproval(
    recipientId: string,
    approverName: string,
    leaveDetails: any
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.LEAVE_APPROVAL,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP],
      subject: 'Leave Request Approved',
      message: `Your leave request has been approved by ${approverName}.`,
      metadata: leaveDetails,
    });
  }

  static async notifyLeaveRejection(
    recipientId: string,
    approverName: string,
    reason: string
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.LEAVE_REJECTION,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'Leave Request Rejected',
      message: `Your leave request has been rejected by ${approverName}. Reason: ${reason}`,
      metadata: { reason },
    });
  }

  static async notifyRequisitionSubmission(
    recipientId: string,
    employeeName: string,
    requisitionDetails: any
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.REQUISITION_SUBMISSION,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'New Requisition Submitted',
      message: `${employeeName} has submitted a requisition for ${requisitionDetails.title} (${requisitionDetails.amount}).`,
      metadata: requisitionDetails,
    });
  }

  static async notifyRequisitionApproval(
    recipientId: string,
    approverName: string,
    requisitionDetails: any
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.REQUISITION_APPROVAL,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'Requisition Approved',
      message: `Your requisition has been approved by ${approverName}.`,
      metadata: requisitionDetails,
    });
  }

  static async notifyRequisitionRejection(
    recipientId: string,
    approverName: string,
    reason: string
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.REQUISITION_REJECTION,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'Requisition Rejected',
      message: `Your requisition has been rejected by ${approverName}. Reason: ${reason}`,
      metadata: { reason },
    });
  }

  static async notifyPayrollUploaded(
    recipientId: string,
    period: string
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.PAYROLL_UPLOADED,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'Payroll Uploaded',
      message: `Payroll for period ${period} has been uploaded and is ready for review.`,
      metadata: { period },
    });
  }

  static async notifyPayrollApproved(
    recipientId: string,
    period: string
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.PAYROLL_APPROVED,
      channels: [NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.IN_APP],
      subject: 'Payroll Approved',
      message: `Payroll for period ${period} has been approved. Your payslip is now available.`,
      metadata: { period },
    });
  }

  static async notifyWorkflowEscalation(
    recipientId: string,
    entityType: string,
    entityId: string
  ) {
    return await this.queueNotification({
      recipientId,
      type: NotificationType.WORKFLOW_ESCALATION,
      channels: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
      subject: 'Workflow Escalation Required',
      message: `A workflow for ${entityType} requires your attention due to escalation.`,
      metadata: { entityType, entityId },
    });
  }
}
