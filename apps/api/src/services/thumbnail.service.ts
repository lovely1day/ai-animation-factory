import { ThumbnailGenerationInput } from '@ai-animation-factory/shared';
import { imageGenerationService } from './image-generation.service';
import { logger } from '../utils/logger';

export interface ThumbnailResult {
  thumbnail_url: string;
  file_key: string;
}

export class ThumbnailService {
  async generate(input: ThumbnailGenerationInput): Promise<ThumbnailResult> {
    logger.info({ episode_id: input.episode_id }, 'Generating thumbnail');

    const result = await imageGenerationService.generateThumbnail(
      input.episode_id,
      input.title,
      input.genre
    );

    return {
      thumbnail_url: result.image_url,
      file_key: result.file_key,
    };
  }
}

export const thumbnailService = new ThumbnailService();
