import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { ideaGeneratorService } from '../services/idea-generator.service';
import { queues, defaultJobOptions } from '../services/queue.service';
import { logger } from '../utils/logger';

export function createIdeaWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.IDEA,
    async (job: Job) => {
      const { genre, target_audience, theme, scene_count } = job.data;

      logger.info('Processing idea generation job', { job_id: job.id, genre });

      await job.updateProgress(10);

      // Generate episode idea
      const idea = await ideaGeneratorService.generate({ genre, target_audience, theme });
      await job.updateProgress(50);

      // Create episode record in database
      const { data: episode, error } = await supabase
        .from('episodes')
        .insert({
          title: idea.title,
          description: idea.description,
          genre: idea.genre,
          target_audience: idea.target_audience,
          status: 'generating',
          tags: idea.tags,
          metadata: { theme: idea.theme },
        })
        .select()
        .single();

      if (error || !episode) throw new Error(`Failed to create episode: ${error?.message}`);

      await job.updateProgress(70);

      // Create job record
      await supabase.from('generation_jobs').insert({
        episode_id: episode.id,
        job_type: 'idea_generation',
        status: 'completed',
        bull_job_id: job.id,
        progress: 100,
        output_data: { idea },
        completed_at: new Date().toISOString(),
      });

      await job.updateProgress(90);

      // Dispatch script writing job
      await queues.script.add(
        'write-script',
        { episode_id: episode.id, idea, scene_count },
        { ...defaultJobOptions, priority: 2 }
      );

      await job.updateProgress(100);
      logger.info('Idea generation completed', { episode_id: episode.id });

      return { episode_id: episode.id, idea };
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );
}
