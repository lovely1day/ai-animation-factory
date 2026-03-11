import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { subtitleGenerationService } from '../services/subtitle-generation.service';
import { logger } from '../utils/logger';

export function createSubtitleWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.SUBTITLE,
    async (job: Job) => {
      const { episode_id, video_url } = job.data;
      logger.info('Processing subtitle generation job', { job_id: job.id, episode_id });

      await job.updateProgress(10);

      const result = await subtitleGenerationService.generate({ episode_id, video_url });

      await job.updateProgress(80);

      // Update episode with subtitle URL
      await supabase
        .from('episodes')
        .update({ subtitle_url: result.subtitle_url })
        .eq('id', episode_id);

      // Save asset record
      await supabase.from('assets').insert({
        episode_id,
        asset_type: 'subtitle',
        file_url: result.subtitle_url,
        file_key: result.file_key,
        mime_type: 'text/plain',
      });

      await job.updateProgress(100);
      logger.info('Subtitle generation completed', { episode_id });

      return { episode_id, subtitle_url: result.subtitle_url };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}
