import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { imageGenerationService } from '../services/image-generation.service';
import { queues, defaultJobOptions } from '../services/queue.service';
import { logger } from '../utils/logger';
import { emitSceneUpdate } from '../config/websocket';

export function createImageWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.IMAGE,
    async (job: Job) => {
      const { episode_id, scene_id, scene_number, visual_prompt } = job.data;
      logger.info({ job_id: job.id, episode_id, scene_number }, 'Processing image generation job');

      await job.updateProgress(10);

      // Update scene status
      await supabase.from('scenes').update({ status: 'generating' }).eq('id', scene_id);

      const result = await imageGenerationService.generate({
        episode_id,
        scene_id,
        scene_number,
        visual_prompt,
      });

      await job.updateProgress(60);

      // Save image URL to scene
      await supabase
        .from('scenes')
        .update({ image_url: result.image_url, status: 'completed' })
        .eq('id', scene_id);

      // Emit scene update
      emitSceneUpdate(episode_id, scene_id, {
        type: 'image_generated',
        scene_number,
        image_url: result.image_url,
        status: 'completed',
      });

      // Save asset record
      await supabase.from('assets').insert({
        episode_id,
        scene_id,
        asset_type: 'image',
        file_url: result.image_url,
        file_key: result.file_key,
        mime_type: 'image/png',
        width: 1792,
        height: 1024,
      });

      await job.updateProgress(80);

      // Dispatch animation job
      await queues.animation.add(
        'generate-animation',
        {
          episode_id,
          scene_id,
          scene_number,
          image_url: result.image_url,
          prompt: visual_prompt,
          duration: job.data.duration_seconds || 8,
        },
        { ...defaultJobOptions, priority: 4 }
      );

      // Dispatch voice generation for dialogue/narration
      const text = job.data.dialogue || job.data.narration;
      if (text?.trim()) {
        await queues.voice.add(
          'generate-voice',
          { episode_id, scene_id, scene_number, text },
          { ...defaultJobOptions, priority: 4 }
        );
      }

      await job.updateProgress(100);
      logger.info({ episode_id, scene_id }, 'Image generation completed');

      // Final scene update
      emitSceneUpdate(episode_id, scene_id, {
        type: 'image_complete',
        scene_number,
        image_url: result.image_url,
        next_jobs: ['animation', 'voice'],
      });

      return { episode_id, scene_id, image_url: result.image_url };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}
