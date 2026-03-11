import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { animationService } from '../services/animation.service';
import { logger } from '../utils/logger';

export function createAnimationWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.ANIMATION,
    async (job: Job) => {
      const { episode_id, scene_id, scene_number, image_url, prompt, duration } = job.data;
      logger.info('Processing animation job', { job_id: job.id, episode_id, scene_number });

      await job.updateProgress(10);

      const result = await animationService.generate({
        episode_id,
        scene_id,
        image_url,
        prompt,
        duration: duration || 8,
      });

      await job.updateProgress(70);

      // Update scene with animation URL
      await supabase
        .from('scenes')
        .update({ animation_url: result.animation_url, status: 'completed' })
        .eq('id', scene_id);

      // Save asset record
      await supabase.from('assets').insert({
        episode_id,
        scene_id,
        asset_type: 'animation',
        file_url: result.animation_url,
        file_key: result.file_key,
        mime_type: 'video/mp4',
        duration_seconds: duration || 8,
      });

      await job.updateProgress(90);

      // Check if all scenes for this episode have animations
      await checkAndTriggerAssembly(episode_id);

      await job.updateProgress(100);
      logger.info('Animation generation completed', { episode_id, scene_id });

      return { episode_id, scene_id, animation_url: result.animation_url };
    },
    { connection: redisConnection, concurrency: 2 }
  );
}

async function checkAndTriggerAssembly(episodeId: string) {
  const { data: scenes } = await supabase
    .from('scenes')
    .select('id, scene_number, animation_url, image_url, voice_url, duration_seconds, status')
    .eq('episode_id', episodeId);

  if (!scenes || scenes.length === 0) return;

  const allAnimated = scenes.every((s) => s.animation_url || s.image_url);
  if (!allAnimated) return;

  // Check if assembly job already exists
  const { data: existingJob } = await supabase
    .from('generation_jobs')
    .select('id')
    .eq('episode_id', episodeId)
    .eq('job_type', 'video_assembly')
    .not('status', 'eq', 'failed')
    .single();

  if (existingJob) return;

  // Check for music
  const { data: musicAsset } = await supabase
    .from('assets')
    .select('file_url')
    .eq('episode_id', episodeId)
    .eq('asset_type', 'music')
    .single();

  const { queues: queueInstances, defaultJobOptions } = await import('../services/queue.service');

  await queueInstances.assembly.add(
    'assemble-video',
    {
      episode_id: episodeId,
      scenes: scenes.map((s) => ({
        scene_id: s.id,
        scene_number: s.scene_number,
        animation_url: s.animation_url,
        image_url: s.image_url,
        voice_url: s.voice_url,
        duration_seconds: s.duration_seconds || 8,
      })),
      music_url: musicAsset?.file_url,
    },
    { ...defaultJobOptions, priority: 5 }
  );

  logger.info('Video assembly triggered', { episode_id: episodeId });
}
