import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { thumbnailService } from '../services/thumbnail.service';
import { logger } from '../utils/logger';

export function createThumbnailWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.THUMBNAIL,
    async (job: Job) => {
      const { episode_id, title, genre } = job.data;
      logger.info({ job_id: job.id, episode_id }, 'Processing thumbnail generation job');

      await job.updateProgress(10);

      const result = await thumbnailService.generate({ episode_id, title, genre });

      await job.updateProgress(80);

      // Update episode thumbnail
      await supabase
        .from('episodes')
        .update({ thumbnail_url: result.thumbnail_url })
        .eq('id', episode_id);

      // Save asset record
      await supabase.from('assets').insert({
        episode_id,
        asset_type: 'thumbnail',
        file_url: result.thumbnail_url,
        file_key: result.file_key,
        mime_type: 'image/png',
        width: 1792,
        height: 1024,
      });

      await job.updateProgress(100);
      logger.info({ episode_id }, 'Thumbnail generation completed');

      return { episode_id, thumbnail_url: result.thumbnail_url };
    },
    { connection: redisConnection, concurrency: 5 }
  );
}
