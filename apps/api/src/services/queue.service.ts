import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { supabase } from '../config/supabase';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

export class QueueService {
  private queues: Record<string, Queue> = {};

  constructor() {
    for (const name of Object.values(JOB_QUEUE_NAMES)) {
      this.queues[name] = new Queue(name, { connection: redisConnection });
    }
  }

  async dispatchEpisodeGeneration(input: {
    genre: string;
    target_audience: string;
    theme?: string;
  }): Promise<string> {
    const { data: episode, error } = await supabase
      .from('episodes')
      .insert({
        genre: input.genre,
        target_audience: input.target_audience,
        theme: input.theme,
        workflow_step: 'idea',
        workflow_status: 'queued',
      })
      .select('id')
      .single();

    if (error || !episode) throw new Error(`Failed to create episode: ${error?.message}`);

    const job = await this.queues[JOB_QUEUE_NAMES.IDEA].add('generate-idea', {
      episode_id: episode.id,
      genre: input.genre,
      target_audience: input.target_audience,
      theme: input.theme,
    });

    logger.info({ episode_id: episode.id, job_id: job.id }, 'Episode generation dispatched');
    return job.id!;
  }

  async getQueueStats(): Promise<Array<{
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }>> {
    const stats = await Promise.all(
      Object.entries(this.queues).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts();
        return {
          name,
          waiting: counts.waiting ?? 0,
          active: counts.active ?? 0,
          completed: counts.completed ?? 0,
          failed: counts.failed ?? 0,
          delayed: counts.delayed ?? 0,
        };
      })
    );
    return stats;
  }

  async getActiveJobs(): Promise<Array<{ id: string | undefined; name: string; data: unknown }>> {
    const allActive: Array<{ id: string | undefined; name: string; data: unknown }> = [];
    for (const [name, queue] of Object.entries(this.queues)) {
      const jobs = await queue.getActive();
      for (const job of jobs) {
        allActive.push({ id: job.id, name, data: job.data });
      }
    }
    return allActive;
  }

  async getFailedJobs(): Promise<Array<{ id: string | undefined; name: string; data: unknown; failedReason: string }>> {
    const allFailed: Array<{ id: string | undefined; name: string; data: unknown; failedReason: string }> = [];
    for (const [name, queue] of Object.entries(this.queues)) {
      const jobs = await queue.getFailed();
      for (const job of jobs) {
        allFailed.push({ id: job.id, name, data: job.data, failedReason: job.failedReason ?? '' });
      }
    }
    return allFailed;
  }
}

export const queueService = new QueueService();
