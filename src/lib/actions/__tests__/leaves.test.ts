import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLeaveRequest, getLeaveBalances, getLeaveRequests } from '../leaves'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    leaveRequest: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leaveBalance: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    leavePolicy: {
      findFirst: vi.fn(),
    },
    employee: {
      findUnique: vi.fn(),
    },
    leaveApproval: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

vi.mock('@/lib/sms', () => ({
  sendSMS: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}))

describe('Leave Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createLeaveRequest', () => {
    it('should return unauthorized if no session', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const formData = new FormData()
      formData.append('policyId', '1')
      formData.append('startDate', '2024-01-01')
      formData.append('endDate', '2024-01-05')
      formData.append('reason', 'Test reason')

      const result = await createLeaveRequest({ message: '' }, formData)

      expect(result).toEqual({ message: 'Unauthorized - no employee linked' })
    })

    it('should validate leave balance before creating request', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'user-id', employeeId: 'test-id' } })

      const { prisma } = await import('@/lib/db')
      vi.mocked(prisma.leaveBalance.findFirst).mockResolvedValue({
        id: 'balance-id',
        employeeId: 'test-id',
        policyId: '1',
        year: 2024,
        allocated: 10,
        used: 5,
        pending: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const formData = new FormData()
      formData.append('policyId', '1')
      formData.append('startDate', '2024-01-01')
      formData.append('endDate', '2024-01-05')
      formData.append('reason', 'Test reason')

      const result = await createLeaveRequest({ message: '' }, formData)

      expect(result.message).toContain('Insufficient balance')
    })
  })

  describe('getLeaveBalances', () => {
    it('should throw error if no session', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      await expect(getLeaveBalances('test-id')).rejects.toThrow('Unauthorized')
    })
  })

  describe('getLeaveRequests', () => {
    it('should throw error if no session', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      await expect(getLeaveRequests()).rejects.toThrow('Unauthorized')
    })
  })
})
