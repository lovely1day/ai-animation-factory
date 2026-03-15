import cron from 'node-cron';
import { queueService } from '../services/queue.service';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class Scheduler {
  private tasks: cron.ScheduledTask[] = [];

  start() {
    logger.info('Starting automation scheduler');

    // Generate episodes every hour
    const generationTask = cron.schedule('0 * * * *', async () => {
      await this.generateEpisodes();
    });
    this.tasks.push(generationTask);

    // Retry failed jobs every 30 minutes
    const retryTask = cron.schedule('*/30 * * * *', async () => {
      await this.retryFailedJobs();
    });
    this.tasks.push(retryTask);

    // Cleanup old records daily at 2 AM
    const cleanupTask = cron.schedule('0 2 * * *', async () => {
      await this.cleanup();
    });
    this.tasks.push(cleanupTask);

    // Update episode counts every 5 minutes
    const metricsTask = cron.schedule('*/5 * * * *', async () => {
      await this.updateMetrics();
    });
    this.tasks.push(metricsTask);

    logger.info('Scheduler started with 4 tasks');
  }

  stop() {
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
    logger.info('Scheduler stopped');
  }

  private async generateEpisodes() {
    try {
      // Get config
      const { data: config } = await supabase
        .from('scheduler_config')
        .select('key, value')
        .in('key', ['episodes_per_hour', 'genres', 'audiences']);

      const configMap = Object.fromEntries(
        (config || []).map((c) => [c.key, c.value])
      );

      const episodesPerHour = parseInt(String(configMap.episodes_per_hour || env.EPISODES_PER_HOUR), 10);
      const genres = this.parseJsonConfig(String(configMap.genres), [
        'adventure', 'comedy', 'sci-fi', 'fantasy', 'educational',
      ]) as string[];
      const audiences = this.parseJsonConfig(String(configMap.audiences), [
        'children', 'teens', 'adults', 'general',
      ]) as string[];

      logger.info({ count: episodesPerHour }, 'Auto-generating episodes');

      for (let i = 0; i < episodesPerHour; i++) {
        const genre = genres[Math.floor(Math.random() * genres.length)];
        const audience = audiences[Math.floor(Math.random() * audiences.length)];

        await queueService.dispatchEpisodeGeneration({ genre, target_audience: audience });

        // Stagger job submissions
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      logger.info(`Dispatched ${episodesPerHour} episode generation jobs`);
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to auto-generate episodes');
    }
  }

  private async retryFailedJobs() {
    try {
      const { data: failedJobs } = await supabase
        .from('generation_jobs')
        .select('episode_id, job_type, bull_job_id')
        .eq('status', 'failed')
        .lt('attempts', 3)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!failedJobs || failedJobs.length === 0) return;

      logger.info(`Retrying ${failedJobs.length} failed jobs`);

      for (const job of failedJobs) {
        try {
          const queueName = this.jobTypeToQueueName(job.job_type);
          if (queueName) await queueService.retryFailedJobs(queueName);
        } catch (err) {
          logger.warn({ job_type: job.job_type, error: (err as Error).message }, 'Failed to retry job');
        }
      }
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to retry jobs');
    }
  }

  private async cleanup() {
    try {
      const { data: config } = await supabase
        .from('scheduler_config')
        .select('value')
        .eq('key', 'cleanup_days')
        .single();

      const cleanupDays = parseInt(String(config?.value || 30), 10);
      const cutoffDate = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000).toISOString();

      // Delete old completed jobs
      await supabase
        .from('generation_jobs')
        .delete()
        .eq('status', 'completed')
        .lt('completed_at', cutoffDate);

      // Clean BullMQ queues
      await queueService.cleanOldJobs('idea', 7 * 24 * 60 * 60 * 1000);  // Clean 7 days old

      logger.info({ cutoff_date: cutoffDate }, 'Cleanup completed');
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Cleanup failed');
    }
  }

  private async updateMetrics() {
    try {
      // Update view counts from analytics
      const { data: viewCounts } = await supabase
        .from('analytics')
        .select('episode_id')
        .eq('event_type', 'view');

      if (!viewCounts) return;

      const counts = viewCounts.reduce((acc, row) => {
        acc[row.episode_id] = (acc[row.episode_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [episodeId, count] of Object.entries(counts)) {
        await supabase
          .from('episodes')
          .update({ view_count: count })
          .eq('id', episodeId);
      }
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Metrics update failed');
    }
  }

  private parseJsonConfig<T>(value: string, fallback: T): T {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  private jobTypeToQueueName(jobType: string): string | null {
    const map: Record<string, string> = {
      idea_generation: 'idea-generation',
      script_writing: 'script-writing',
      image_generation: 'image-generation',
      animation: 'animation',
      voice_generation: 'voice-generation',
      music_generation: 'music-generation',
      video_assembly: 'video-assembly',
      subtitle_generation: 'subtitle-generation',
      thumbnail_generation: 'thumbnail-generation',
    };
    return map[jobType] || null;
  }
}

export const scheduler = new Scheduler();
