import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { checkRedisHealth, redisConnection } from '../config/redis';

const router: Router = Router();

/**
 * Get queue statistics for all workers
 * GET /api/jobs/queue-stats
 */
router.get('/queue-stats', async (req, res) => {
  try {
    // Check Redis connection
    const redisHealthy = await checkRedisHealth();
    
    if (!redisHealthy) {
      return res.json({
        success: true,
        data: [],
        warning: 'Redis not connected - queue stats unavailable'
      });
    }

    // For now, return mock queue stats based on generation_jobs table
    const { data: jobs, error } = await supabase
      .from('generation_jobs')
      .select('queue_name, status')
      .not('queue_name', 'is', null);

    if (error) throw error;

    // Aggregate stats by queue
    const queueMap = new Map();
    
    const jobTypes = ['idea', 'script', 'image', 'animation', 'voice', 'music', 'assembly', 'subtitle', 'thumbnail'];
    
    jobTypes.forEach(type => {
      queueMap.set(type, {
        name: type,
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        delayed: 0
      });
    });

    // Count jobs by status
    (jobs || []).forEach((job: any) => {
      const queue = queueMap.get(job.queue_name) || queueMap.get('idea');
      if (queue) {
        if (job.status === 'active') queue.active++;
        else if (job.status === 'pending') queue.waiting++;
        else if (job.status === 'completed') queue.completed++;
        else if (job.status === 'failed') queue.failed++;
        else if (job.status === 'delayed') queue.delayed++;
      }
    });

    const queueStats = Array.from(queueMap.values());

    res.json({
      success: true,
      data: queueStats
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to get queue stats');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get job status for an episode
 * GET /api/jobs/:episodeId/status
 */
router.get('/:episodeId/status', async (req, res) => {
  try {
    const { episodeId } = req.params;

    const { data: jobs, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        episode_id: episodeId,
        jobs: jobs || []
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.episodeId }, 'Failed to get job status');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Retry failed jobs
 * POST /api/jobs/retry
 */
router.post('/retry', async (req, res) => {
  try {
    const { queue_name } = req.body;

    // Update failed jobs to pending
    const { data, error } = await supabase
      .from('generation_jobs')
      .update({ status: 'pending', error_message: null })
      .eq('status', 'failed')
      .eq('queue_name', queue_name || 'idea')
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Retried ${data?.length || 0} failed jobs`,
      data
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to retry jobs');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clean completed jobs
 * POST /api/jobs/clean
 */
router.post('/clean', async (req, res) => {
  try {
    const { days = 7 } = req.body;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { error, count } = await supabase
      .from('generation_jobs')
      .delete()
      .eq('status', 'completed')
      .lt('completed_at', cutoffDate.toISOString());

    if (error) throw error;

    res.json({
      success: true,
      message: `Cleaned ${count || 0} completed jobs older than ${days} days`
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to clean jobs');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
