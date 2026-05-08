import { Vonage } from '@vonage/server-sdk'

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY!,
  apiSecret: process.env.VONAGE_API_SECRET!,
})

const FROM_NUMBER = process.env.VONAGE_FROM_NUMBER || 'HR System'

interface SMSOptions {
  to: string
  text: string
}

export async function sendSMS({ to, text }: SMSOptions) {
  try {
    const response = await vonage.sms.send({
      to,
      from: FROM_NUMBER,
      text,
    })
    
    // Check if any messages failed
    const messages = response.messages || []
    const failedMessages = messages.filter((msg: any) => msg.status !== '0')
    
    if (failedMessages.length > 0) {
      console.error('SMS failed:', failedMessages)
      return { 
        success: false, 
        error: `SMS failed: ${failedMessages.map((m: any) => m['error-text'] || m.status).join(', ')}` 
      }
    }
    
    console.log('SMS sent successfully')
    return { success: true }
  } catch (error: any) {
    console.error('SMS error:', error)
    return { success: false, error: error.message || 'Failed to send SMS' }
  }
}

export function getLeaveApprovalSMSTemplate({
  leaveType,
  startDate,
  endDate,
}: {
  leaveType: string
  startDate: string
  endDate: string
}) {
  return `Your ${leaveType} leave request from ${startDate} to ${endDate} has been APPROVED. Enjoy your leave!`
}

export function getLeaveRejectionSMSTemplate({
  leaveType,
  startDate,
  endDate,
}: {
  leaveType: string
  startDate: string
  endDate: string
}) {
  return `Your ${leaveType} leave request from ${startDate} to ${endDate} has been REJECTED. Please contact your manager.`
}

export function getLeaveRequestSMSTemplate({
  employeeName,
  leaveType,
  startDate,
  endDate,
}: {
  employeeName: string
  leaveType: string
  startDate: string
  endDate: string
}) {
  return `New leave request from ${employeeName}: ${leaveType} from ${startDate} to ${endDate}. Please review in HR system.`
}
