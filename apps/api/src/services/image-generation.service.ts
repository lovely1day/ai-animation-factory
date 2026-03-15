import { ImageGenerationInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';
import * as crypto from 'crypto';

export interface ImageGenerationResult {
  image_url: string;
  file_key: string;
  revised_prompt?: string;
}

// Free image generation services (no API key required)
async function fetchImageBuffer(prompt: string, width = 1792, height = 1024): Promise<Buffer> {
  const clean = prompt.slice(0, 400).replace(/[^\w\s,.-]/g, ' ');

  // Try Pollinations.ai (flux model)
  const pollinationsUrl =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(clean)}` +
    `?width=${width}&height=${height}&model=flux&nologo=true&seed=${Date.now() % 99999}`;

  try {
    const res = await fetch(pollinationsUrl, { signal: AbortSignal.timeout(55_000) });
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length > 10_000) return buf; // valid image
    }
  } catch {
    // fall through to placeholder
  }

  // Fallback: Picsum Photos (deterministic placeholder based on prompt hash)
  const seed = parseInt(crypto.createHash('md5').update(prompt).digest('hex').slice(0, 8), 16) % 1000;
  const picsumUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
  const res = await fetch(picsumUrl, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`Image fallback failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export class ImageGenerationService {
  async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    logger.info({ episode_id: input.episode_id, scene_number: input.scene_number }, 'Generating image');

    const buffer = await fetchImageBuffer(
      `${input.visual_prompt}, vibrant animated style, cel-shaded, colorful, cinematic`
    );
    const fileKey = `episodes/${input.episode_id}/scenes/${input.scene_id}/image.jpg`;
    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'image/jpeg');

    logger.info({ episode_id: input.episode_id, file_key: fileKey }, 'Image generated and uploaded');
    return { image_url: uploadedUrl, file_key: fileKey };
  }

  async generateThumbnail(episodeId: string, title: string, genre: string): Promise<ImageGenerationResult> {
    const prompt = `Netflix-style animated thumbnail, "${title}", ${genre}, dramatic composition, bold colors, no text`;
    const buffer = await fetchImageBuffer(prompt, 1792, 1024);
    const fileKey = `episodes/${episodeId}/thumbnail.jpg`;
    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'image/jpeg');
    return { image_url: uploadedUrl, file_key: fileKey };
  }
}

export const imageGenerationService = new ImageGenerationService();
