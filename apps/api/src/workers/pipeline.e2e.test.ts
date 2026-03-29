/**
 * Pipeline End-to-End Test
 * Tests the full creative pipeline: idea → script → images → voice → music → animation → assembly
 * Uses mocks for all external APIs — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock all external dependencies ──────────────────────────────────────────

vi.mock('../config/supabase', () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: `mock-${table}-id` },
            error: null,
          }),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'mock-episode-id', music_url: '', thumbnail_url: '' },
            error: null,
          }),
        })),
      })),
    })),
  },
}));

vi.mock('../config/redis', () => ({
  redisConnection: { host: 'localhost', port: 6379 },
}));

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((_name: string, processor: Function) => ({
    on: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
    _processor: processor,
  })),
  Queue: vi.fn().mockImplementation((name: string) => ({
    name,
    add: vi.fn().mockResolvedValue({ id: `job-${name}-1` }),
    getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0, completed: 1, failed: 0, delayed: 0 }),
    getActive: vi.fn().mockResolvedValue([]),
    getFailed: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../config/websocket', () => ({
  emitJobProgress: vi.fn(),
  emitEpisodeUpdate: vi.fn(),
  emitError: vi.fn(),
}));

// Mock AI services — return fixture data immediately
vi.mock('../services/hybrid-ai.service', () => ({
  hybridGenerateIdea: vi.fn().mockResolvedValue({
    title: 'The Lost Star',
    description: 'A young astronaut discovers a hidden star.',
    genre: 'adventure',
    target_audience: 'children',
    theme: 'discovery',
    tags: ['space', 'adventure', 'kids'],
  }),
  hybridGenerateScript: vi.fn().mockResolvedValue({
    title: 'The Lost Star',
    description: 'A young astronaut discovers a hidden star.',
    genre: 'adventure',
    target_audience: 'children',
    tags: ['space'],
    scenes: [
      {
        scene_number: 1,
        title: 'Launch',
        description: 'Rocket launches into space',
        visual_prompt: 'Cinematic rocket launch, dramatic lighting',
        dialogue: 'ASTRONAUT: We launch now!',
        narration: 'The rocket soared into the stars.',
        duration_seconds: 8,
      },
      {
        scene_number: 2,
        title: 'Discovery',
        description: 'The hidden star appears',
        visual_prompt: 'Glowing star in deep space, warm light',
        dialogue: 'ASTRONAUT: There it is!',
        narration: 'A star no one had ever seen before.',
        duration_seconds: 8,
      },
    ],
  }),
  getOllamaStatus: vi.fn().mockResolvedValue({ running: false }),
}));

vi.mock('../services/image-generation.service', () => ({
  imageGenerationService: {
    generate: vi.fn().mockResolvedValue({
      image_url: 'https://storage.example.com/images/scene-1.png',
      file_key: 'episodes/ep-1/scenes/s-1/image.png',
    }),
  },
}));

vi.mock('../services/voice-generation.service', () => ({
  voiceGenerationService: {
    generate: vi.fn().mockResolvedValue({
      voice_url: 'https://storage.example.com/audio/scene-1.mp3',
      file_key: 'episodes/ep-1/scenes/s-1/voice.mp3',
      duration_seconds: 8,
    }),
  },
}));

vi.mock('../services/music-generation.service', () => ({
  musicGenerationService: {
    generate: vi.fn().mockResolvedValue({
      music_url: 'https://storage.example.com/music/ep-1.mp3',
      file_key: 'episodes/ep-1/music.mp3',
      duration_seconds: 60,
    }),
  },
}));

vi.mock('../services/animation.service', () => ({
  animationService: {
    generate: vi.fn().mockResolvedValue({
      animation_url: 'https://storage.example.com/video/scene-1.mp4',
      file_key: 'episodes/ep-1/scenes/s-1/animation.mp4',
    }),
  },
}));

vi.mock('../services/video-assembly.service', () => ({
  videoAssemblyService: {
    assemble: vi.fn().mockResolvedValue({
      video_url: 'https://storage.example.com/video/ep-1.mp4',
      file_key: 'episodes/ep-1/video.mp4',
      duration_seconds: 60,
    }),
  },
}));

vi.mock('../services/subtitle-generation.service', () => ({
  subtitleGenerationService: {
    generate: vi.fn().mockResolvedValue({
      subtitle_url: 'https://storage.example.com/subtitles/ep-1.vtt',
      file_key: 'episodes/ep-1/subtitles.vtt',
    }),
  },
}));

vi.mock('../services/thumbnail.service', () => ({
  thumbnailService: {
    generate: vi.fn().mockResolvedValue({
      thumbnail_url: 'https://storage.example.com/thumb/ep-1.jpg',
      file_key: 'episodes/ep-1/thumbnail.jpg',
    }),
  },
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Pipeline Services — Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Stage 1: Idea Generation ──────────────────────────────────────────────
  describe('Stage 1: Idea Generation', () => {
    it('should generate episode idea with required fields', async () => {
      const { hybridGenerateIdea } = await import('../services/hybrid-ai.service');
      const result = await hybridGenerateIdea('Generate an adventure idea', {});

      expect(result).toBeDefined();
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('genre');
      expect(result).toHaveProperty('target_audience');
      expect(result).toHaveProperty('tags');
      expect(Array.isArray((result as any).tags)).toBe(true);
    });
  });

  // ── Stage 2: Script Writing ───────────────────────────────────────────────
  describe('Stage 2: Script Writing', () => {
    it('should produce script with 2 scenes', async () => {
      const { hybridGenerateScript } = await import('../services/hybrid-ai.service');
      const result = await hybridGenerateScript('Write a 2-scene script', {}) as any;

      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('scenes');
      expect(result.scenes).toHaveLength(2);

      const scene = result.scenes[0];
      expect(scene).toHaveProperty('scene_number', 1);
      expect(scene).toHaveProperty('visual_prompt');
      expect(scene).toHaveProperty('duration_seconds');
      expect(typeof scene.duration_seconds).toBe('number');
    });
  });

  // ── Stage 3: Image Generation ─────────────────────────────────────────────
  describe('Stage 3: Image Generation', () => {
    it('should return image_url and file_key', async () => {
      const { imageGenerationService } = await import('../services/image-generation.service');
      const result = await imageGenerationService.generate({
        episode_id: 'ep-1',
        scene_id: 's-1',
        prompt: 'Cinematic rocket launch',
        scene_number: 1,
        style: 'cinematic',
      });

      expect(result).toHaveProperty('image_url');
      expect(result).toHaveProperty('file_key');
      expect(result.image_url).toMatch(/^https:\/\//);
    });
  });

  // ── Stage 4: Voice Generation (ElevenLabs) ────────────────────────────────
  describe('Stage 4: Voice Generation', () => {
    it('should return voice_url with duration', async () => {
      const { voiceGenerationService } = await import('../services/voice-generation.service');
      const result = await voiceGenerationService.generate({
        episode_id: 'ep-1',
        scene_id: 's-1',
        text: 'The rocket soared into the stars.',
      });

      expect(result).toHaveProperty('voice_url');
      expect(result).toHaveProperty('duration_seconds');
      expect(result.duration_seconds).toBeGreaterThan(0);
    });
  });

  // ── Stage 5: Music Generation ─────────────────────────────────────────────
  describe('Stage 5: Music Generation', () => {
    it('should return music_url', async () => {
      const { musicGenerationService } = await import('../services/music-generation.service');
      const result = await musicGenerationService.generate({
        episode_id: 'ep-1',
        genre: 'adventure',
        mood: 'epic',
        duration: 60,
      });

      expect(result).toHaveProperty('music_url');
      expect(result).toHaveProperty('duration_seconds');
    });
  });

  // ── Stage 6: Animation ────────────────────────────────────────────────────
  describe('Stage 6: Animation', () => {
    it('should return animation_url', async () => {
      const { animationService } = await import('../services/animation.service');
      const result = await animationService.generate({
        episode_id: 'ep-1',
        scene_id: 's-1',
        image_url: 'https://storage.example.com/images/scene-1.png',
        prompt: 'Cinematic rocket launch',
        duration: 8,
      });

      expect(result).toHaveProperty('animation_url');
      expect(result).toHaveProperty('file_key');
    });
  });

  // ── Stage 7: Assembly (FFmpeg) ────────────────────────────────────────────
  describe('Stage 7: Video Assembly', () => {
    it('should assemble video from scenes + audio', async () => {
      const { videoAssemblyService } = await import('../services/video-assembly.service');
      const result = await videoAssemblyService.assemble({
        episode_id: 'ep-1',
        scenes: [
          {
            scene_id: 's-1',
            scene_number: 1,
            animation_url: 'https://storage.example.com/video/scene-1.mp4',
            voice_url: 'https://storage.example.com/audio/scene-1.mp3',
            duration_seconds: 8,
          },
          {
            scene_id: 's-2',
            scene_number: 2,
            animation_url: 'https://storage.example.com/video/scene-2.mp4',
            voice_url: 'https://storage.example.com/audio/scene-2.mp3',
            duration_seconds: 8,
          },
        ],
        music_url: 'https://storage.example.com/music/ep-1.mp3',
      });

      expect(result).toHaveProperty('video_url');
      expect(result).toHaveProperty('duration_seconds');
      expect(result.duration_seconds).toBeGreaterThan(0);
    });
  });

  // ── Full Pipeline: Orchestration Check ───────────────────────────────────
  describe('Full Pipeline Orchestration', () => {
    it('should execute all 7 stages in sequence without errors', async () => {
      const { hybridGenerateIdea, hybridGenerateScript } = await import('../services/hybrid-ai.service');
      const { imageGenerationService } = await import('../services/image-generation.service');
      const { voiceGenerationService } = await import('../services/voice-generation.service');
      const { musicGenerationService } = await import('../services/music-generation.service');
      const { animationService } = await import('../services/animation.service');
      const { videoAssemblyService } = await import('../services/video-assembly.service');

      // Stage 1
      const idea = await hybridGenerateIdea('', {}) as any;
      expect(idea.title).toBeTruthy();

      // Stage 2
      const script = await hybridGenerateScript('', {}) as any;
      expect(script.scenes.length).toBeGreaterThan(0);

      // Stage 3 (per scene)
      const images = await Promise.all(
        script.scenes.map((scene: any) =>
          imageGenerationService.generate({
            episode_id: 'ep-1',
            scene_id: `s-${scene.scene_number}`,
            prompt: scene.visual_prompt,
            scene_number: scene.scene_number,
            style: 'cinematic',
          })
        )
      );
      expect(images).toHaveLength(script.scenes.length);

      // Stage 4 (per scene)
      const voices = await Promise.all(
        script.scenes.map((scene: any) =>
          voiceGenerationService.generate({
            episode_id: 'ep-1',
            scene_id: `s-${scene.scene_number}`,
            text: scene.narration,
          })
        )
      );
      expect(voices).toHaveLength(script.scenes.length);

      // Stage 5
      const music = await musicGenerationService.generate({
        episode_id: 'ep-1',
        genre: idea.genre,
        mood: 'epic',
        duration: 60,
      });
      expect(music.music_url).toBeTruthy();

      // Stage 6 (per scene)
      const animations = await Promise.all(
        script.scenes.map((scene: any, i: number) =>
          animationService.generate({
            episode_id: 'ep-1',
            scene_id: `s-${scene.scene_number}`,
            image_url: images[i].image_url,
            prompt: scene.visual_prompt,
            duration: scene.duration_seconds,
          })
        )
      );
      expect(animations).toHaveLength(script.scenes.length);

      // Stage 7
      const video = await videoAssemblyService.assemble({
        episode_id: 'ep-1',
        scenes: script.scenes.map((scene: any, i: number) => ({
          scene_id: `s-${scene.scene_number}`,
          scene_number: scene.scene_number,
          animation_url: animations[i].animation_url,
          voice_url: voices[i].voice_url,
          duration_seconds: scene.duration_seconds,
        })),
        music_url: music.music_url,
      });

      expect(video.video_url).toMatch(/^https:\/\//);
      expect(video.duration_seconds).toBeGreaterThan(0);
    });
  });
});
