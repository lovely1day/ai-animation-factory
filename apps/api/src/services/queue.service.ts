import { Queue, QueueEvents } from 'bullmq';
import { redisConnection } from '../config/redis';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

// Define all queues
export const queues = {
  idea: new Queue(JOB_QUEUE_NAMES.IDEA, { connection: redisConnection }),
  script: new Queue(JOB_QUEUE_NAMES.SCRIPT, { connection: redisConnection }),
  image: new Queue(JOB_QUEUE_NAMES.IMAGE, { connection: redisConnection }),
  animation: new Queue(JOB_QUEUE_NAMES.ANIMATION, { connection: redisConnection }),
  voice: new Queue(JOB_QUEUE_NAMES.VOICE, { connection: redisConnection }),
  music: new Queue(JOB_QUEUE_NAMES.MUSIC, { connection: redisConnection }),
  assembly: new Queue(JOB_QUEUE_NAMES.ASSEMBLY, { connection: redisConnection }),
  subtitle: new Queue(JOB_QUEUE_NAMES.SUBTITLE, { connection: redisConnection }),
  thumbnail: new Queue(JOB_QUEUE_NAMES.THUMBNAIL, { connection: redisConnection }),
};

// Queue events for monitoring
export const queueEvents = {
  idea: new QueueEvents(JOB_QUEUE_NAMES.IDEA, { connection: redisConnection }),
  script: new QueueEvents(JOB_QUEUE_NAMES.SCRIPT, { connection: redisConnection }),
  image: new QueueEvents(JOB_QUEUE_NAMES.IMAGE, { connection: redisConnection }),
  animation: new QueueEvents(JOB_QUEUE_NAMES.ANIMATION, { connection: redisConnection }),
  assembly: new QueueEvents(JOB_QUEUE_NAMES.ASSEMBLY, { connection: redisConnection }),
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
};

export class QueueService {
  /**
   * Dispatch a full episode generation pipeline starting with idea generation
   */
  async dispatchEpisodeGeneration(options: {
    genre?: string;
    target_audience?: string;
    theme?: string;
    scene_count?: number;
  } = {}): Promise<string> {
    const jobData = {
      genre: options.genre || this.randomGenre(),
      target_audience: options.target_audience || this.randomAudience(),
      theme: options.theme,
      scene_count: options.scene_count || parseInt(process.env.SCENE_COUNT || '8', 10),
    };

    const job = await queues.idea.add('generate-idea', jobData, {
      ...defaultJobOptions,
      priority: 1,
    });

    logger.info('Episode generation dispatched', { job_id: job.id, genre: jobData.genre });
    return job.id as string;
  }

  async getQueueStats() {
    const stats = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
        return { name, ...counts };
      })
    );
    return stats;
  }

  async getActiveJobs() {
    const activeJobs = await Promise.all(
      Object.entries(queues).map(async ([name, queue]) => {
        const jobs = await queue.getActive(0, 10);
        return jobs.map((j) => ({ queue: name, id: j.id, name: j.name, progress: j.progress }));
      })
    );
    return activeJobs.flat();
  }

  async retryFailedJobs(queueName: string): Promise<number> {
    const queue = Object.values(queues).find(
      (q) => q.name === queueName
    );
    if (!queue) throw new Error(`Queue ${queueName} not found`);

    const failedJobs = await queue.getFailed(0, 100);
    await Promise.all(failedJobs.map((job) => job.retry()));
    return failedJobs.length;
  }

  async cleanOldJobs(): Promise<void> {
    const grace = 24 * 60 * 60 * 1000; // 24 hours
    await Promise.all(
      Object.values(queues).map((queue) =>
        Promise.all([
          queue.clean(grace, 1000, 'completed'),
          queue.clean(grace * 7, 1000, 'failed'),
        ])
      )
    );
    logger.info('Old queue jobs cleaned');
  }

  private randomGenre(): string {
    const genres = ['adventure', 'comedy', 'sci-fi', 'fantasy', 'educational', 'mystery'];
    return genres[Math.floor(Math.random() * genres.length)];
  }

  private randomAudience(): string {
    const audiences = ['children', 'teens', 'adults', 'general'];
    return audiences[Math.floor(Math.random() * audiences.length)];
  }
}

export const queueService = new QueueService();
