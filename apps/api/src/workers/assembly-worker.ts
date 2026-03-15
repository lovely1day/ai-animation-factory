import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { videoAssemblyService } from '../services/video-assembly.service';
import { queues, defaultJobOptions } from '../services/queue.service';
import { logger } from '../utils/logger';

export function createAssemblyWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.ASSEMBLY,
    async (job: Job) => {
      const { episode_id, scenes, music_url } = job.data;
      logger.info({ job_id: job.id, episode_id }, 'Processing video assembly job');

      // Record job start
      await supabase.from('generation_jobs').insert({
        episode_id,
        job_type: 'video_assembly',
        status: 'active',
        bull_job_id: job.id,
        progress: 0,
        started_at: new Date().toISOString(),
      });

      await supabase.from('episodes').update({ status: 'processing' }).eq('id', episode_id);

      await job.updateProgress(5);

      const result = await videoAssemblyService.assemble({ episode_id, scenes, music_url });

      await job.updateProgress(80);

      // Update episode with video URL and duration
      await supabase
        .from('episodes')
        .update({
          video_url: result.video_url,
          duration_seconds: result.duration_seconds,
          status: 'completed',
        })
        .eq('id', episode_id);

      // Save video asset
      await supabase.from('assets').insert({
        episode_id,
        asset_type: 'video',
        file_url: result.video_url,
        file_key: result.file_key,
        mime_type: 'video/mp4',
        duration_seconds: result.duration_seconds,
      });

      // Update job record
      await supabase
        .from('generation_jobs')
        .update({
          status: 'completed',
          progress: 90,
          completed_at: new Date().toISOString(),
        })
        .eq('episode_id', episode_id)
        .eq('job_type', 'video_assembly');

      await job.updateProgress(90);

      // Dispatch subtitle generation
      await queues.subtitle.add(
        'generate-subtitles',
        { episode_id, video_url: result.video_url },
        { ...defaultJobOptions, priority: 6 }
      );

      // Auto-publish if configured
      const { data: config } = await supabase
        .from('scheduler_config')
        .select('value')
        .eq('key', 'auto_publish')
        .single();

      if (config?.value === 'true' || config?.value === true) {
        await supabase
          .from('episodes')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', episode_id);
        logger.info({ episode_id }, 'Episode auto-published');
      }

      await job.updateProgress(100);
      logger.info({ episode_id, video_url: result.video_url }, 'Video assembly completed');

      return { episode_id, video_url: result.video_url };
    },
    { connection: redisConnection, concurrency: 2 }
  );
}
