import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ScriptWriterService } from './script-writer.service'

// Mock hybrid-ai service
vi.mock('./hybrid-ai.service', () => ({
  hybridGenerateScript: vi.fn().mockImplementation(async () => ({
    result: {
      title: 'Space Adventure',
      description: 'A space adventure',
      genre: 'adventure',
      target_audience: 'children',
      tags: ['space', 'adventure'],
      scenes: [
        {
          scene_number: 1,
          title: 'Launch',
          description: 'Rocket launches',
          visual_prompt: 'Colorful rocket launching',
          dialogue: 'NARRATOR: We are ready!',
          narration: 'The rocket launches into space',
          duration_seconds: 8
        },
        {
          scene_number: 2,
          title: 'Discovery',
          description: 'Discover new planet',
          visual_prompt: 'Beautiful planet',
          dialogue: 'Wow!',
          narration: 'A new world awaits',
          duration_seconds: 8
        }
      ]
    },
    engine: 'mock',
    reviewed: false,
  }))
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('ScriptWriterService', () => {
  let service: ScriptWriterService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ScriptWriterService()
  })

  describe('write', () => {
    it('should write script with correct number of scenes', async () => {
      const input = {
        episode_id: 'ep-123',
        idea: {
          title: 'Space Adventure',
          description: 'A space adventure',
          genre: 'adventure' as const,
          target_audience: 'children' as const,
          theme: 'discovery',
          tags: ['space', 'adventure']
        },
        scene_count: 2
      }

      const result = await service.write(input)

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('scenes')
      expect(Array.isArray(result.scenes)).toBe(true)
      expect(result.scenes.length).toBe(2)
    })

    it('should include required fields in each scene', async () => {
      const input = {
        episode_id: 'ep-123',
        idea: {
          title: 'Test Episode',
          description: 'Test description',
          genre: 'comedy' as const,
          target_audience: 'teens' as const,
          theme: 'friendship',
          tags: ['comedy', 'fun']
        },
        scene_count: 1
      }

      const result = await service.write(input)

      const scene = result.scenes[0]
      expect(scene).toHaveProperty('scene_number')
      expect(scene).toHaveProperty('title')
      expect(scene).toHaveProperty('description')
      expect(scene).toHaveProperty('visual_prompt')
      expect(scene).toHaveProperty('dialogue')
      expect(scene).toHaveProperty('narration')
      expect(scene).toHaveProperty('duration_seconds')
    })

    it('should handle scene count mismatch gracefully', async () => {
      const input = {
        episode_id: 'ep-123',
        idea: {
          title: 'Test',
          description: 'Test',
          genre: 'drama' as const,
          target_audience: 'adults' as const,
          theme: 'drama',
          tags: ['drama']
        },
        scene_count: 5
      }

      // Will return 2 scenes but request 5 - should log warning
      const result = await service.write(input)
      expect(result.scenes).toBeDefined()
    })
  })
})
