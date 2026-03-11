import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { musicGenerationService } from '../services/music-generation.service';
import { logger } from '../utils/logger';

export function createMusicWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.MUSIC,
    async (job: Job) => {
      const { episode_id, genre, mood, duration } = job.data;
      logger.info('Processing music generation job', { job_id: job.id, episode_id });

      await job.updateProgress(10);

      const result = await musicGenerationService.generate({ episode_id, genre, mood, duration });

      await job.updateProgress(80);

      // Save asset record
      await supabase.from('assets').insert({
        episode_id,
        asset_type: 'music',
        file_url: result.music_url,
        file_key: result.file_key,
        mime_type: 'audio/mpeg',
        duration_seconds: result.duration_seconds,
      });

      await job.updateProgress(100);
      logger.info('Music generation completed', { episode_id });

      return { episode_id, music_url: result.music_url };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}
