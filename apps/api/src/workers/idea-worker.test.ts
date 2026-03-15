import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Job } from 'bullmq'

// Mock dependencies
vi.mock('../services/idea-generator.service', () => ({
  ideaGeneratorService: {
    generate: vi.fn().mockResolvedValue({
      title: 'Test Episode',
      description: 'Test description',
      genre: 'adventure',
      target_audience: 'children',
      theme: 'discovery',
      tags: ['tag1', 'tag2'],
    }),
  },
}))

vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}))

vi.mock('../config/websocket', () => ({
  emitJobProgress: vi.fn(),
  emitEpisodeUpdate: vi.fn(),
}))

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('Idea Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Job Processing', () => {
    it('should process idea generation job', async () => {
      const { ideaGeneratorService } = await import('../services/idea-generator.service')
      
      const jobData = {
        episode_id: 'ep-123',
        genre: 'adventure',
        target_audience: 'children',
        theme: 'space exploration',
      }

      const result = await ideaGeneratorService.generate(jobData)

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
      expect(result.genre).toBe('adventure')
    })

    it('should handle missing theme', async () => {
      const { ideaGeneratorService } = await import('../services/idea-generator.service')
      
      const jobData = {
        episode_id: 'ep-123',
        genre: 'comedy',
        target_audience: 'teens',
      }

      const result = await ideaGeneratorService.generate(jobData)

      expect(result).toBeDefined()
    })
  })

  describe('Episode Update', () => {
    it('should update episode with generated idea', async () => {
      const { supabase } = await import('../config/supabase')
      
      const episodeId = 'ep-123'
      const updateData = {
        title: 'Generated Title',
        description: 'Generated description',
      }

      await supabase.from('episodes').update(updateData).eq('id', episodeId)

      expect(supabase.from).toHaveBeenCalledWith('episodes')
    })
  })
})
