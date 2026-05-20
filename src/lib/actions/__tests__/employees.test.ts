import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadDocument } from '../documents'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  prisma: {
    employeeDocument: {
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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/file.pdf' } })),
      })),
    },
  },
  STORAGE_BUCKET: 'test-bucket',
}))

describe('Document Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadDocument', () => {
    it('should return unauthorized if no session', async () => {
      const { getServerSession } = await import('next-auth')
      vi.mocked(getServerSession).mockResolvedValue(null)

      const formData = new FormData()
      formData.append('employeeId', 'test-id')
      formData.append('documentType', 'ID_CARD')
      formData.append('file', new File(['test'], 'test.pdf'))

      const result = await uploadDocument({ message: '' }, formData)

      expect(result).toEqual({ message: 'Unauthorized' })
    })
  })
})
