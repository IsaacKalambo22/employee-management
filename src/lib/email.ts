import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT!),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM!,
      to,
      subject,
      html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export function getLeaveApprovalEmailTemplate({
  employeeName,
  leaveType,
  startDate,
  endDate,
  approverName,
}: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  approverName: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #10b981;">Leave Request Approved</h2>
      <p>Dear ${employeeName},</p>
      <p>Your leave request has been approved by ${approverName}.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Leave Type:</strong> ${leaveType}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
      </div>
      <p>Please ensure you complete any pending work before your leave begins.</p>
      <p>Best regards,<br>HR Team</p>
    </div>
  `
}

export function getLeaveRejectionEmailTemplate({
  employeeName,
  leaveType,
  startDate,
  endDate,
  approverName,
  reason,
}: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  approverName: string
  reason?: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #ef4444;">Leave Request Rejected</h2>
      <p>Dear ${employeeName},</p>
      <p>Your leave request has been rejected by ${approverName}.</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Leave Type:</strong> ${leaveType}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p>If you have any questions, please contact your manager or HR.</p>
      <p>Best regards,<br>HR Team</p>
    </div>
  `
}

export function getLeaveRequestEmailTemplate({
  approverName,
  employeeName,
  leaveType,
  startDate,
  endDate,
  reason,
}: {
  approverName: string
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
  reason?: string
}) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #3b82f6;">New Leave Request</h2>
      <p>Dear ${approverName},</p>
      <p>A new leave request requires your approval:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Employee:</strong> ${employeeName}</p>
        <p><strong>Leave Type:</strong> ${leaveType}</p>
        <p><strong>Start Date:</strong> ${startDate}</p>
        <p><strong>End Date:</strong> ${endDate}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>
      <p>Please review and approve or reject this request in the HR system.</p>
      <p>Best regards,<br>HR System</p>
    </div>
  `
}
