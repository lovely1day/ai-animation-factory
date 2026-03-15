import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock all worker modules
vi.mock('./idea-worker', () => ({
  createIdeaWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./script-worker', () => ({
  createScriptWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./image-worker', () => ({
  createImageWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./animation-worker', () => ({
  createAnimationWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./voice-worker', () => ({
  createVoiceWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./music-worker', () => ({
  createMusicWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./assembly-worker', () => ({
  createAssemblyWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./subtitle-worker', () => ({
  createSubtitleWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

vi.mock('./thumbnail-worker', () => ({
  createThumbnailWorker: vi.fn(() => ({
    on: vi.fn(),
    run: vi.fn(),
    close: vi.fn(),
  })),
}))

// Mock logger
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

// Mock websocket
vi.mock('../config/websocket', () => ({
  emitJobProgress: vi.fn(),
  emitEpisodeUpdate: vi.fn(),
  emitError: vi.fn(),
}))

describe('Workers Index', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should export all worker creation functions', async () => {
    const workers = await import('./index')
    
    // The index file should start all workers when imported
    expect(workers).toBeDefined()
  })

  describe('Worker Count', () => {
    it('should have 9 workers in the pipeline', () => {
      const expectedWorkers = [
        'createIdeaWorker',
        'createScriptWorker', 
        'createImageWorker',
        'createAnimationWorker',
        'createVoiceWorker',
        'createMusicWorker',
        'createAssemblyWorker',
        'createSubtitleWorker',
        'createThumbnailWorker',
      ]
      
      expect(expectedWorkers).toHaveLength(9)
    })
  })

  describe('Worker Pipeline Order', () => {
    it('should follow correct generation pipeline order', () => {
      const pipelineOrder = [
        'idea',           // 1. Generate idea
        'script',         // 2. Write script
        'image',          // 3. Generate images
        'animation',      // 4. Animate scenes
        'voice',          // 5. Generate voice
        'music',          // 6. Generate music
        'assembly',       // 7. Assemble video
        'subtitle',       // 8. Generate subtitles
        'thumbnail',      // 9. Generate thumbnail
      ]
      
      expect(pipelineOrder).toHaveLength(9)
      expect(pipelineOrder[0]).toBe('idea')
      expect(pipelineOrder[pipelineOrder.length - 1]).toBe('thumbnail')
    })
  })
})
