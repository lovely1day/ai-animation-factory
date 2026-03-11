import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { scriptWriterService } from '../services/script-writer.service';
import { queues, defaultJobOptions } from '../services/queue.service';
import { logger } from '../utils/logger';

export function createScriptWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.SCRIPT,
    async (job: Job) => {
      const { episode_id, idea, scene_count } = job.data;
      logger.info('Processing script writing job', { job_id: job.id, episode_id });

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

      await job.updateProgress(70);

      // Update episode title/description from script
      await supabase
        .from('episodes')
        .update({ title: script.title, description: script.description })
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

      // Dispatch image generation jobs for each scene (in parallel batches)
      const imageJobs = scenes.map((scene) =>
        queues.image.add(
          'generate-image',
          {
            episode_id,
            scene_id: scene.id,
            scene_number: scene.scene_number,
            visual_prompt: scene.visual_prompt,
            genre: idea.genre,
            target_audience: idea.target_audience,
          },
          { ...defaultJobOptions, priority: 3 }
        )
      );
      await Promise.all(imageJobs);

      // Dispatch thumbnail generation
      await queues.thumbnail.add(
        'generate-thumbnail',
        { episode_id, title: script.title, genre: idea.genre },
        { ...defaultJobOptions, priority: 3 }
      );

      // Dispatch music generation
      await queues.music.add(
        'generate-music',
        {
          episode_id,
          genre: idea.genre,
          mood: idea.theme || 'background',
          duration: scene_count * 8 + 10,
        },
        { ...defaultJobOptions, priority: 3 }
      );

      await job.updateProgress(100);
      logger.info('Script writing completed', { episode_id, scenes: scenes.length });

      return { episode_id, scene_count: scenes.length };
    },
    { connection: redisConnection, concurrency: 3 }
  );
}
