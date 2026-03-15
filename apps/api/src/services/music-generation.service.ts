import { MusicGenerationInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { sleep } from '../utils/sleep';

export interface MusicGenerationResult {
  music_url: string;
  file_key: string;
  duration_seconds: number;
}

const GENRE_MOOD_MAP: Record<string, { mood: string; tags: string[] }> = {
  adventure: { mood: 'epic', tags: ['orchestral', 'adventure', 'heroic', 'cinematic'] },
  comedy: { mood: 'playful', tags: ['upbeat', 'quirky', 'fun', 'lighthearted'] },
  drama: { mood: 'emotional', tags: ['piano', 'dramatic', 'cinematic', 'strings'] },
  'sci-fi': { mood: 'futuristic', tags: ['electronic', 'synth', 'futuristic', 'atmospheric'] },
  fantasy: { mood: 'magical', tags: ['orchestral', 'magical', 'fantasy', 'mystical'] },
  horror: { mood: 'dark', tags: ['ambient', 'dark', 'suspense', 'eerie'] },
  romance: { mood: 'romantic', tags: ['soft', 'romantic', 'acoustic', 'gentle'] },
  thriller: { mood: 'tense', tags: ['suspense', 'thriller', 'tension', 'dramatic'] },
  educational: { mood: 'cheerful', tags: ['upbeat', 'positive', 'educational', 'fun'] },
  mystery: { mood: 'mysterious', tags: ['mysterious', 'ambient', 'noir', 'suspense'] },
};

export class MusicGenerationService {
  private readonly apiKey = env.MUBERT_API_KEY;
  private readonly license = env.MUBERT_LICENSE;
  private readonly baseUrl = 'https://api-b2b.mubert.com/v2';

  async generate(input: MusicGenerationInput): Promise<MusicGenerationResult> {
    logger.info({ episode_id: input.episode_id, genre: input.genre }, 'Generating background music');

    // Skip Mubert if not configured
    const mubertReady = this.apiKey && !this.apiKey.includes('your-') && this.apiKey.length > 10;
    if (!mubertReady) {
      logger.warn({ episode_id: input.episode_id }, 'Mubert not configured — skipping music generation');
      return {
        music_url: '',
        file_key: `episodes/${input.episode_id}/music.mp3`,
        duration_seconds: Math.max(30, input.duration),
      };
    }

    const genreConfig = GENRE_MOOD_MAP[input.genre] || { mood: 'ambient', tags: ['background', 'ambient'] };
    const tags = genreConfig.tags.join(',');
    const duration = Math.max(30, input.duration);

    // Step 1: Get access token
    const tokenResponse = await fetch(`${this.baseUrl}/GetServiceAccess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'GetServiceAccess',
        params: {
          email: this.apiKey,
          license: this.license,
          token: this.apiKey,
          mode: 'loop',
        },
      }),
    });

    if (!tokenResponse.ok) throw new Error(`Mubert auth failed: ${tokenResponse.status}`);
    const tokenData = await tokenResponse.json() as { data: { pat: string } };
    const pat = tokenData.data?.pat;
    if (!pat) throw new Error('No Mubert PAT received');

    // Step 2: Request track generation
    const trackResponse = await fetch(`${this.baseUrl}/RecordTrackTTM`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'RecordTrackTTM',
        params: {
          pat,
          text: `${input.mood} ${input.genre} background music for animated series`,
          tags,
          duration,
          format: 'mp3',
          intensity: 'medium',
        },
      }),
    });

    if (!trackResponse.ok) throw new Error(`Mubert track request failed: ${trackResponse.status}`);
    const trackData = await trackResponse.json() as { data: { tasks: Array<{ task_id: string }> } };
    const taskId = trackData.data?.tasks?.[0]?.task_id;
    if (!taskId) throw new Error('No Mubert task ID received');

    // Step 3: Poll for completion
    const trackUrl = await this.pollTask(pat, taskId);

    // Step 4: Download and upload to storage
    const audioResponse = await fetch(trackUrl);
    if (!audioResponse.ok) throw new Error('Failed to download Mubert track');

    const buffer = Buffer.from(await audioResponse.arrayBuffer());
    const fileKey = `episodes/${input.episode_id}/music.mp3`;
    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'audio/mpeg');

    logger.info({ episode_id: input.episode_id, duration }, 'Music generated and uploaded');

    return {
      music_url: uploadedUrl,
      file_key: fileKey,
      duration_seconds: duration,
    };
  }

  private async pollTask(pat: string, taskId: string, maxWaitMs = 120000): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      await sleep(3000);

      const response = await fetch(`${this.baseUrl}/GetTaskStatus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'GetTaskStatus',
          params: { pat, task_id: taskId },
        }),
      });

      if (!response.ok) throw new Error(`Mubert poll failed: ${response.status}`);

      const data = await response.json() as {
        data: { tasks: Array<{ task_id: string; status: string; download_link?: string }> }
      };
      const task = data.data?.tasks?.[0];

      if (task?.status === 'done' && task.download_link) {
        return task.download_link;
      }

      if (task?.status === 'failed') {
        throw new Error('Mubert track generation failed');
      }
    }

    throw new Error('Mubert music generation timed out');
  }
}

export const musicGenerationService = new MusicGenerationService();
