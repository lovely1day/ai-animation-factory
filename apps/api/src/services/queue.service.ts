import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';
import { logger } from '../utils/logger';

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

export class QueueService {
  async dispatchEpisodeGeneration(options: any = {}): Promise<string> {
    const jobData = { ...options, scene_count: options.scene_count || 8 };
    const job = await queues.idea.add('generate-idea', jobData);
    logger.info('Job dispatched to Redis', { id: job.id });
    return job.id as string;
  }

  async getQueueStats() {
    try {
      // محاولة قراءة الإحصائيات من Redis
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
}

export const queueService = new QueueService();