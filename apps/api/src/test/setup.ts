import { vi } from 'vitest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-key'
process.env.REDIS_HOST = 'localhost'
process.env.REDIS_PORT = '6379'
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock Redis connection
vi.mock('../config/redis', () => ({
  redisConnection: {
    host: 'localhost',
    port: 6379,
  },
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    quit: vi.fn(),
  },
}))

// Mock Supabase
vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock shared constants
vi.mock('@ai-animation-factory/shared', () => ({
  JOB_QUEUE_NAMES: {
    IDEA: 'idea-queue',
    SCRIPT: 'script-queue',
    IMAGE: 'image-queue',
    ANIMATION: 'animation-queue',
    VOICE: 'voice-queue',
    MUSIC: 'music-queue',
    ASSEMBLY: 'assembly-queue',
    SUBTITLE: 'subtitle-queue',
    THUMBNAIL: 'thumbnail-queue',
  },
}))
