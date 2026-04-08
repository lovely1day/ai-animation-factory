import { AnimationInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { sleep } from '../utils/sleep';

export interface AnimationResult {
  animation_url: string;
  file_key: string;
}

interface RunwayTask {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  output?: string[];
  failure?: string;
  progress?: number;
}

export class AnimationService {
  private readonly apiUrl = env.RUNWAY_API_URL;
  private readonly apiKey = env.RUNWAY_API_KEY;

  private async resolveImageForRunway(imageUrl: string): Promise<string> {
    if (imageUrl.startsWith('https://')) return imageUrl;
    // localhost or http URL — fetch bytes and convert to data URI (Runway accepts data:image/)
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Failed to fetch image for Runway: ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  private async createTask(input: AnimationInput): Promise<string> {
    const promptImage = await this.resolveImageForRunway(input.image_url);
    const response = await fetch(`${this.apiUrl}/image_to_video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify({
        model: 'gen3a_turbo',
        promptImage,
        promptText: input.prompt,
        duration: input.duration >= 8 ? 10 : 5,  // Runway only accepts 5 or 10
        ratio: '1280:768',
        watermark: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Runway API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as { id: string };
    return data.id;
  }

  private async pollTask(taskId: string, maxWaitMs = 300000): Promise<string> {
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const response = await fetch(`${this.apiUrl}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!response.ok) {
        throw new Error(`Runway poll error: ${response.status}`);
      }

      const task = await response.json() as RunwayTask;

      if (task.status === 'SUCCEEDED' && task.output?.[0]) {
        return task.output[0];
      }

      if (task.status === 'FAILED') {
        throw new Error(`Runway animation failed: ${task.failure || 'Unknown error'}`);
      }

      await sleep(5000);
    }

    throw new Error('Runway animation timed out after 5 minutes');
  }

  async generate(input: AnimationInput): Promise<AnimationResult> {
    logger.info({
      episode_id: input.episode_id,
      scene_id: input.scene_id,
    }, 'Starting animation generation');

    // Skip Runway if API key not configured — return EMPTY animation_url
    // so assembly-worker falls back to image_url path (which uses imageToVideo).
    // Returning input.image_url here was the bug: assembly thought it had a real
    // mp4, named the file scene_X.mp4 but it was actually a JPEG → 1-frame video.
    const runwayReady = this.apiKey && !this.apiKey.includes('your-') && this.apiKey.length > 10;
    if (!runwayReady) {
      logger.warn({ scene_id: input.scene_id }, 'Runway not configured — leaving animation_url empty (assembly will use image)');
      return {
        animation_url: '',
        file_key: '',
      };
    }

    const taskId = await this.createTask(input);
    logger.debug({ task_id: taskId }, 'Runway task created');

    const videoUrl = await this.pollTask(taskId);

    // Download the video and upload to our storage
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) throw new Error('Failed to download animation from Runway');

    const buffer = Buffer.from(await videoResponse.arrayBuffer());
    const fileKey = `episodes/${input.episode_id}/scenes/${input.scene_id}/animation.mp4`;

    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'video/mp4');

    logger.info({
      episode_id: input.episode_id,
      file_key: fileKey,
    }, 'Animation generated and uploaded');

    return { animation_url: uploadedUrl, file_key: fileKey };
  }
}

export const animationService = new AnimationService();
