import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueueService } from './queue.service'

// Mock BullMQ
vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation((name: string) => ({
    name,
    add: vi.fn().mockResolvedValue({ id: 'job-123' }),
    getJobCounts: vi.fn().mockResolvedValue({
      waiting: 5,
      active: 2,
      completed: 100,
      failed: 3,
      delayed: 0,
    }),
    getActive: vi.fn().mockResolvedValue([]),
    getFailed: vi.fn().mockResolvedValue([]),
  })),
}))

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ 
            data: { id: 'episode-123' }, 
            error: null 
          }),
        })),
      })),
    })),
  },
}))

describe('QueueService', () => {
  let service: QueueService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new QueueService()
  })

  describe('dispatchEpisodeGeneration', () => {
    it('should create episode and dispatch job', async () => {
      const jobId = await service.dispatchEpisodeGeneration({
        genre: 'comedy',
        target_audience: 'children',
      })
      
      expect(jobId).toBe('job-123')
    })
  })

  describe('getQueueStats', () => {
    it('should return stats for all queues', async () => {
      const stats = await service.getQueueStats()
      
      expect(Array.isArray(stats)).toBe(true)
      expect(stats.length).toBeGreaterThan(0)
      expect(stats[0]).toHaveProperty('name')
      expect(stats[0]).toHaveProperty('waiting')
      expect(stats[0]).toHaveProperty('active')
    })
  })

  describe('getActiveJobs', () => {
    it('should return active jobs', async () => {
      const jobs = await service.getActiveJobs()
      
      expect(Array.isArray(jobs)).toBe(true)
    })
  })
})
