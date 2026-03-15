import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { scriptWriterService } from '../services/script-writer.service';
import { logger } from '../utils/logger';
import { emitEpisodeUpdate } from '../config/websocket';

export function createScriptWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.SCRIPT,
    async (job: Job) => {
      const { episode_id, idea, scene_count } = job.data;
      logger.info({ job_id: job.id, episode_id }, 'Processing script writing job');

      await job.updateProgress(10);

      const script = await scriptWriterService.write({ episode_id, idea, scene_count });
      await job.updateProgress(50);

      // Save scenes to database
      const sceneInserts = script.scenes.map((scene) => ({
        episode_id,
        scene_number: scene.scene_number,
        title: scene.title,
        description: scene.description,
        visual_prompt: scene.visual_prompt,
        dialogue: scene.dialogue,
        narration: scene.narration,
        duration_seconds: scene.duration_seconds,
        status: 'pending',
      }));

      const { data: scenes, error: sceneError } = await supabase
        .from('scenes')
        .insert(sceneInserts)
        .select();

      if (sceneError || !scenes) throw new Error(`Failed to create scenes: ${sceneError?.message}`);

      // Emit scenes created event
      emitEpisodeUpdate(episode_id, {
        type: 'scenes_created',
        sceneCount: scenes.length,
        scenes: scenes.map(s => ({
          id: s.id,
          scene_number: s.scene_number,
          title: s.title,
          status: s.status,
        })),
      });

      await job.updateProgress(70);

      // Update episode title/description from script
      await supabase
        .from('episodes')
        .update({ title: script.title, description: script.description, status: 'awaiting_image_approval' })
        .eq('id', episode_id);

      // Record job completion
      await supabase.from('generation_jobs').insert({
        episode_id,
        job_type: 'script_writing',
        status: 'completed',
        bull_job_id: job.id,
        progress: 100,
        output_data: { scene_count: scenes.length },
        completed_at: new Date().toISOString(),
      });

      await job.updateProgress(90);

      // Emit WebSocket event — waiting for user to approve image prompts
      emitEpisodeUpdate(episode_id, {
        type: 'awaiting_image_approval',
        title: script.title,
        sceneCount: scenes.length,
        scenes: scenes.map(s => ({
          id: s.id,
          scene_number: s.scene_number,
          title: s.title,
          visual_prompt: s.visual_prompt,
          description: s.description,
        })),
      });

      await job.updateProgress(100);
      logger.info({ episode_id, scenes: scenes.length }, 'Script writing completed — awaiting image approval');

      return { episode_id, scene_count: scenes.length, status: 'awaiting_image_approval' };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}
