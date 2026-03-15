import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { ideaGeneratorService } from '../services/idea-generator.service';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { emitEpisodeUpdate } from '../config/websocket';

export function createIdeaWorker() {
  return new Worker(
    JOB_QUEUE_NAMES.IDEA,
    async (job: Job) => {
      const { episode_id, genre, target_audience, theme } = job.data;
      
      logger.info({ job_id: job.id, episode_id }, 'Processing idea generation job');
      
      await job.updateProgress(10);
      
      // Generate idea using OpenAI
      const idea = await ideaGeneratorService.generate({
        genre,
        target_audience,
        theme,
      });
      
      await job.updateProgress(50);
      
      // Update episode with generated idea
      const { error: updateError } = await supabase
        .from('episodes')
        .update({
          title: idea.title,
          description: idea.description,
          theme: idea.theme,
          tags: idea.tags,
          status: 'awaiting_script_approval',
        })
        .eq('id', episode_id);
      
      if (updateError) {
        throw new Error(`Failed to update episode: ${updateError.message}`);
      }
      
      await job.updateProgress(80);
      
      // Record job completion
      await supabase.from('generation_jobs').insert({
        episode_id,
        job_type: 'idea_generation',
        status: 'completed',
        bull_job_id: job.id?.toString(),
        progress: 100,
        output_data: idea,
        completed_at: new Date().toISOString(),
      });
      
      await job.updateProgress(90);

      // Emit WebSocket event — waiting for user approval
      emitEpisodeUpdate(episode_id, {
        type: 'awaiting_script_approval',
        title: idea.title,
        description: idea.description,
        theme: idea.theme,
        tags: idea.tags,
      });

      await job.updateProgress(100);

      return {
        success: true,
        episode_id,
        idea,
        status: 'awaiting_script_approval',
      };
    },
    { 
      connection: redisConnection,
      concurrency: 1,
    }
  );
}
