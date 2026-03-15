import { describe, it, expect, vi, beforeEach } from 'vitest'
import { uploadBuffer, uploadFile, getSignedDownloadUrl } from './storage.service'

// Mock Supabase
const mockUpload = vi.fn()
const mockCreateSignedUrl = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        createSignedUrl: mockCreateSignedUrl,
      }))
    }
  }))
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadBuffer', () => {
    it('should upload buffer successfully', async () => {
      mockUpload.mockResolvedValueOnce({ error: null })

      const buffer = Buffer.from('test-data')
      const key = 'test/file.jpg'
      const contentType = 'image/jpeg'

      const result = await uploadBuffer(buffer, key, contentType)

      expect(result).toContain(key)
      expect(mockUpload).toHaveBeenCalledWith(
        key,
        buffer,
        { contentType, upsert: true }
      )
    })

    it('should throw error when upload fails', async () => {
      mockUpload.mockResolvedValueOnce({
        error: { message: 'Storage error' }
      })

      const buffer = Buffer.from('test-data')
      
      await expect(uploadBuffer(buffer, 'test.jpg', 'image/jpeg'))
        .rejects.toThrow('Storage upload failed')
    })
  })

  describe('uploadFile', () => {
    it('should upload file and return success', async () => {
      mockUpload.mockResolvedValueOnce({ error: null })

      const buffer = Buffer.from('file-data')
      const result = await uploadFile('file.jpg', buffer, 'image/jpeg')

      expect(result).toEqual({ success: true, key: 'file.jpg' })
    })
  })

  describe('getSignedDownloadUrl', () => {
    it('should return signed URL', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://signed-url.com/file.jpg' },
        error: null
      })

      const result = await getSignedDownloadUrl('file.jpg', 3600)

      expect(result).toBe('https://signed-url.com/file.jpg')
    })

    it('should fallback to public URL when signed URL fails', async () => {
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed' }
      })

      const result = await getSignedDownloadUrl('file.jpg')

      expect(result).toContain('file.jpg')
    })
  })
})
