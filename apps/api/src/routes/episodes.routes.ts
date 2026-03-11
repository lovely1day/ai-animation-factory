import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export const episodesRouter = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  genre: z.string().optional(),
  target_audience: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/episodes - list episodes
episodesRouter.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const { page, limit, status, genre, target_audience, search, sort, order } = query;
    const offset = (page - 1) * limit;

    let dbQuery = supabase
      .from('episodes')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order(sort, { ascending: order === 'asc' });

    // Apply filters
    if (status) dbQuery = dbQuery.eq('status', status);
    else dbQuery = dbQuery.in('status', ['published', 'completed']); // Public default

    if (genre) dbQuery = dbQuery.eq('genre', genre);
    if (target_audience) dbQuery = dbQuery.eq('target_audience', target_audience);
    if (search) dbQuery = dbQuery.ilike('title', `%${search}%`);

    const { data: episodes, error, count } = await dbQuery;
    if (error) throw error;

    const total = count || 0;
    res.json({
      success: true,
      data: episodes,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/episodes/:id
episodesRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data: episode, error } = await supabase
      .from('episodes')
      .select('*, scenes(*), assets(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !episode) throw new AppError('Episode not found', 404);

    // Track view
    await supabase.from('analytics').insert({
      episode_id: episode.id,
      event_type: 'view',
      session_id: req.headers['x-session-id'] as string,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
    });

    res.json({ success: true, data: episode });
  } catch (err) {
    next(err);
  }
});

// POST /api/episodes - create (admin/editor only)
episodesRouter.post(
  '/',
  authenticate,
  requireRole('admin', 'editor'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(200),
        description: z.string().optional(),
        genre: z.string(),
        target_audience: z.string(),
        tags: z.array(z.string()).default([]),
      });

      const body = schema.parse(req.body);
      const { data: episode, error } = await supabase
        .from('episodes')
        .insert({ ...body, created_by: req.user!.id })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ success: true, data: episode });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/episodes/:id
episodesRouter.patch(
  '/:id',
  authenticate,
  requireRole('admin', 'editor'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const schema = z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        status: z.string().optional(),
        tags: z.array(z.string()).optional(),
        published_at: z.string().optional(),
      });

      const body = schema.parse(req.body);

      if (body.status === 'published' && !body.published_at) {
        body.published_at = new Date().toISOString();
      }

      const { data: episode, error } = await supabase
        .from('episodes')
        .update(body)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error || !episode) throw new AppError('Episode not found', 404);
      res.json({ success: true, data: episode });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/episodes/:id
episodesRouter.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { error } = await supabase.from('episodes').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true, message: 'Episode deleted' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/episodes/:id/jobs - get generation jobs for episode
episodesRouter.get(
  '/:id/jobs',
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { data: jobs, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('episode_id', req.params.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      res.json({ success: true, data: jobs });
    } catch (err) {
      next(err);
    }
  }
);
