import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: 10,
  removeOnFail: 5,
};

// دالة مساعدة لإنشاء الطابور بقيمة احتياطية في حال كان الـ Shared مفقوداً
const createQueue = (name: string, fallback: string) => {
  const queueName = name || fallback;
  return new Queue(queueName, { connection: redisConnection });
};

export const queues = {
  get idea() { return createQueue(JOB_QUEUE_NAMES?.IDEA, 'idea-queue'); },
  get script() { return createQueue(JOB_QUEUE_NAMES?.SCRIPT, 'script-queue'); },
  get image() { return createQueue(JOB_QUEUE_NAMES?.IMAGE, 'image-queue'); },
  get animation() { return createQueue(JOB_QUEUE_NAMES?.ANIMATION, 'animation-queue'); },
  get voice() { return createQueue(JOB_QUEUE_NAMES?.VOICE, 'voice-queue'); },
  get music() { return createQueue(JOB_QUEUE_NAMES?.MUSIC, 'music-queue'); },
  get assembly() { return createQueue(JOB_QUEUE_NAMES?.ASSEMBLY, 'assembly-queue'); },
  get subtitle() { return createQueue(JOB_QUEUE_NAMES?.SUBTITLE, 'subtitle-queue'); },
  get thumbnail() { return createQueue(JOB_QUEUE_NAMES?.THUMBNAIL, 'thumbnail-queue'); },
};

interface EpisodeGenerationOptions {
  genre?: string;
  target_audience?: string;
  theme?: string;
  scene_count?: number;
  [key: string]: unknown;
}

export class QueueService {
  async dispatchEpisodeGeneration(options: EpisodeGenerationOptions = {}): Promise<string> {
    // Create episode row first so workers have a valid UUID to update
    const { data: episode, error } = await supabase
      .from('episodes')
      .insert({
        title: 'Generating...',
        genre: options.genre || 'adventure',
        target_audience: options.target_audience || 'general',
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !episode) {
      throw new Error(`Failed to create episode: ${error?.message}`);
    }

    const jobData = {
      ...options,
      episode_id: episode.id,
      scene_count: options.scene_count || 8,
    };
    const job = await queues.idea.add('generate-idea', jobData, defaultJobOptions);
    logger.info({ id: job.id, episode_id: episode.id }, 'Job dispatched to Redis');
    return job.id as string;
  }

  async getQueueStats() {
    try {
      const stats = await Promise.all(
        Object.entries(queues).map(async ([name, queue]) => {
          const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
          return { name, ...counts };
        })
      );
      return stats;
    } catch (error) {
      console.error("🔴 Redis Error:", error);
      throw error;
    }
  }

  async getActiveJobs() {
    const activeJobs = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const jobs = await queue.getActive(0, 10);
        return jobs.map((j) => ({ queue: name, id: j.id, name: j.name }));
      })
    );
    return activeJobs.flat();
  }

  async retryFailedJobs(queueName: keyof typeof queues) {
    const queue = queues[queueName];
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    const failedJobs = await queue.getFailed();
    for (const job of failedJobs) {
      await job.retry();
    }
    return failedJobs.length;
  }

  async cleanOldJobs(queueName: keyof typeof queues, gracePeriodMs: number) {
    const queue = queues[queueName];
    if (!queue) throw new Error(`Queue ${queueName} not found`);
    
    await queue.clean(gracePeriodMs, 'completed');
    await queue.clean(gracePeriodMs, 'failed');
  }
}

export const queueService = new QueueService();
