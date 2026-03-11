import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { generationRateLimit } from '../middleware/rate-limit';
import { queueService } from '../services/queue.service';
import { supabase } from '../config/supabase';

export const generationRouter = Router();

// All generation routes require authentication
generationRouter.use(authenticate);

const generateSchema = z.object({
  genre: z.string().optional(),
  target_audience: z.string().optional(),
  theme: z.string().optional(),
  scene_count: z.number().min(3).max(20).default(8),
  count: z.number().min(1).max(10).default(1),
});

// POST /api/generation/start - trigger episode generation
generationRouter.post(
  '/start',
  requireRole('admin', 'editor'),
  generationRateLimit,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const body = generateSchema.parse(req.body);
      const jobIds: string[] = [];

      for (let i = 0; i < body.count; i++) {
        const jobId = await queueService.dispatchEpisodeGeneration({
          genre: body.genre,
          target_audience: body.target_audience,
          theme: body.theme,
          scene_count: body.scene_count,
        });
        jobIds.push(jobId);
      }

      res.status(202).json({
        success: true,
        message: `${body.count} episode generation job(s) dispatched`,
        data: { job_ids: jobIds },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/generation/queue - get queue statistics
generationRouter.get('/queue', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await queueService.getQueueStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// GET /api/generation/active - get active jobs
generationRouter.get('/active', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const activeJobs = await queueService.getActiveJobs();
    res.json({ success: true, data: activeJobs });
  } catch (err) {
    next(err);
  }
});

// POST /api/generation/retry/:queueName
generationRouter.post(
  '/retry/:queueName',
  requireRole('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const count = await queueService.retryFailedJobs(req.params.queueName);
      res.json({ success: true, message: `Retried ${count} jobs` });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/generation/jobs - list all generation jobs
generationRouter.get('/jobs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 50, status, job_type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('generation_jobs')
      .select('*, episodes(title, genre, status)', { count: 'exact' })
      .range(offset, offset + Number(limit) - 1)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status as string);
    if (job_type) query = query.eq('job_type', job_type as string);

    const { data: jobs, error, count } = await query;
    if (error) throw error;

    res.json({
      success: true,
      data: jobs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        total_pages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/generation/clean
generationRouter.post(
  '/clean',
  requireRole('admin'),
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await queueService.cleanOldJobs();
      res.json({ success: true, message: 'Queue cleaned' });
    } catch (err) {
      next(err);
    }
  }
);
