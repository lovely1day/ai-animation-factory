import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { voiceGenerationService } from '../services/voice-generation.service';
import { logger } from '../utils/logger';

export function createVoiceWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.VOICE,
    async (job: Job) => {
      const { episode_id, scene_id, text } = job.data;
      logger.info({ job_id: job.id, episode_id, scene_id }, 'Processing voice generation job');

      await job.updateProgress(10);

      const result = await voiceGenerationService.generate({ episode_id, scene_id, text });

      await job.updateProgress(70);

      // Update scene with voice URL
      await supabase.from('scenes').update({ voice_url: result.voice_url }).eq('id', scene_id);

      // Save asset record
      await supabase.from('assets').insert({
        episode_id,
        scene_id,
        asset_type: 'voice',
        file_url: result.voice_url,
        file_key: result.file_key,
        mime_type: 'audio/mpeg',
        duration_seconds: result.duration_seconds,
      });

      await job.updateProgress(100);
      logger.info({ episode_id, scene_id }, 'Voice generation completed');

      return { episode_id, scene_id, voice_url: result.voice_url };
    },
    { connection: redisConnection, concurrency: 5 }
  );
}
