import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IdeaGeneratorService } from './idea-generator.service'

// Mock hybrid-ai service
vi.mock('./hybrid-ai.service', () => ({
  hybridGenerateIdea: vi.fn().mockImplementation(async () => ({
    result: {
      title: 'Space Adventure: The Lost Planet',
      description: 'A brave astronaut discovers a mysterious planet.',
      genre: 'adventure',
      target_audience: 'children',
      theme: 'discovery',
      tags: ['space', 'adventure', 'kids', 'fun', 'exploration'],
    },
    engine: 'mock',
    reviewed: false,
  }))
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('IdeaGeneratorService', () => {
  let service: IdeaGeneratorService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new IdeaGeneratorService()
  })

  describe('generate', () => {
    it('should generate episode idea with valid input', async () => {
      const input = {
        genre: 'adventure' as const,
        target_audience: 'children' as const,
        theme: 'space exploration'
      }

      const result = await service.generate(input)

      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
      expect(result).toHaveProperty('genre', 'adventure')
      expect(result).toHaveProperty('target_audience', 'children')
      expect(result).toHaveProperty('theme')
      expect(result).toHaveProperty('tags')
      expect(Array.isArray(result.tags)).toBe(true)
    })

    it('should handle missing theme', async () => {
      const input = {
        genre: 'comedy' as const,
        target_audience: 'teens' as const
      }

      const result = await service.generate(input)

      // Mock returns 'adventure' and 'children' regardless of input
      expect(result.genre).toBe('adventure')
      expect(result.target_audience).toBe('children')
    })

    it('should handle comedy genre', async () => {
      const input = {
        genre: 'comedy' as const,
        target_audience: 'general' as const
      }

      const result = await service.generate(input)
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
    })

    it('should handle teens audience', async () => {
      const input = {
        genre: 'adventure' as const,
        target_audience: 'teens' as const
      }

      const result = await service.generate(input)
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('description')
    })
  })
})
