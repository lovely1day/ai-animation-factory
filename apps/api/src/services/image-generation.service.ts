import { openai } from '../config/openai';
import { ImageGenerationInput } from '@ai-animation-factory/shared';
import { storageService } from './storage.service';
import { logger } from '../utils/logger';

export interface ImageGenerationResult {
  image_url: string;
  file_key: string;
  revised_prompt?: string;
}

export class ImageGenerationService {
  async generate(input: ImageGenerationInput): Promise<ImageGenerationResult> {
    logger.info('Generating image', {
      episode_id: input.episode_id,
      scene_number: input.scene_number,
    });

    const style = input.style || 'vivid';

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: input.visual_prompt,
      n: 1,
      size: '1792x1024',
      quality: 'standard',
      style: style as 'vivid' | 'natural',
      response_format: 'url',
    });

    const imageData = response.data[0];
    if (!imageData?.url) throw new Error('No image URL returned from DALL-E');

    // Download and upload to storage
    const imageResponse = await fetch(imageData.url);
    if (!imageResponse.ok) throw new Error('Failed to download generated image');

    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileKey = `episodes/${input.episode_id}/scenes/${input.scene_id}/image.png`;

    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'image/png');

    logger.info('Image generated and uploaded', { episode_id: input.episode_id, file_key: fileKey });

    return {
      image_url: uploadedUrl,
      file_key: fileKey,
      revised_prompt: imageData.revised_prompt,
    };
  }

  async generateThumbnail(
    episodeId: string,
    title: string,
    genre: string
  ): Promise<ImageGenerationResult> {
    const prompt = `Create a stunning animated series thumbnail for an episode titled "${title}".
Genre: ${genre}. Style: vibrant, eye-catching, Netflix-style thumbnail art, animated characters,
dramatic composition, bold colors, cinematic quality, no text overlay.`;

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024',
      quality: 'hd',
      style: 'vivid',
      response_format: 'url',
    });

    const imageData = response.data[0];
    if (!imageData?.url) throw new Error('No thumbnail URL returned from DALL-E');

    const imageResponse = await fetch(imageData.url);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());
    const fileKey = `episodes/${episodeId}/thumbnail.png`;

    const uploadedUrl = await storageService.uploadBuffer(buffer, fileKey, 'image/png');

    return { image_url: uploadedUrl, file_key: fileKey };
  }
}

export const imageGenerationService = new ImageGenerationService();
