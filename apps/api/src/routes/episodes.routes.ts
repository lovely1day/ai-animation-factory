import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { queueService } from '../services/queue.service';
import { logger } from '../utils/logger';

export const episodesRouter = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
  genre: z.string().optional(),
  target_audience: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().default('updated_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/episodes - list episodes (public)
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

    // Apply filters — status can be comma-separated (e.g. "published,completed")
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      dbQuery = statuses.length === 1
        ? dbQuery.eq('status', statuses[0])
        : dbQuery.in('status', statuses);
    } else {
      // Return all statuses by default (no filter)
    }

    if (genre) dbQuery = dbQuery.eq('genre', genre);
    if (target_audience) dbQuery = dbQuery.eq('target_audience', target_audience);
    if (search) dbQuery = dbQuery.ilike('title', `%${search}%`);

    const { data: episodes, error, count } = await dbQuery;
    if (error) throw error;

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: episodes || [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/episodes/:id - get single episode with scenes
episodesRouter.get('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Get episode
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();

    if (episodeError || !episode) {
      throw new AppError(404, 'Episode not found');
    }

    // Get scenes
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', id)
      .order('scene_number', { ascending: true });

    if (scenesError) throw scenesError;

    // Get generation jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('episode_id', id)
      .order('created_at', { ascending: false });

    if (jobsError) throw jobsError;

    // Get assets
    const { data: assets, error: assetsError } = await supabase
      .from('assets')
      .select('*')
      .eq('episode_id', id);

    if (assetsError) throw assetsError;

    res.json({
      success: true,
      data: {
        episode,
        scenes: scenes || [],
        jobs: jobs || [],
        assets: assets || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/episodes - create (public for testing)
episodesRouter.post('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      title: z.string().min(1).max(200).optional().default('Untitled Episode'),
      description: z.string().optional(),
      genre: z.string(),
      target_audience: z.string().optional(),
      targetAudience: z.string().optional(),
      theme: z.string().optional(),
      tags: z.array(z.string()).default([]),
    });

    const rawBody = schema.parse(req.body);
    
    // Normalize field names
    const body = {
      ...rawBody,
      target_audience: rawBody.target_audience || rawBody.targetAudience || 'general'
    };

    logger.info({ genre: body.genre, audience: body.target_audience }, 'Creating new episode');

    // Create episode
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        title: body.title,
        description: body.description,
        genre: body.genre,
        target_audience: body.target_audience,
        theme: body.theme,
        tags: body.tags,
        status: 'pending'
      })
      .select()
      .single();

    if (episodeError || !episode) {
      logger.error({ error: episodeError }, 'Failed to create episode');
      throw episodeError || new Error('Failed to create episode');
    }

    logger.info({ episode_id: episode.id }, 'Episode created, dispatching to queue');

    // Dispatch to generation queue
    const jobId = await queueService.dispatchEpisodeGeneration({
      episode_id: episode.id,
      genre: body.genre,
      target_audience: body.target_audience,
      theme: body.theme
    });

    res.status(201).json({ 
      success: true, 
      data: episode,
      job_id: jobId
    });
  } catch (err) {
    logger.error({ error: err }, 'Error creating episode');
    next(err);
  }
});

// PATCH /api/episodes/:id - update episode
episodesRouter.patch('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      scenes: z.array(z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        narration: z.string().optional(),
        dialogue: z.string().optional(),
      })).optional(),
    });

    const body = schema.parse(req.body);

    // Update episode basic info
    const updateData: any = {};
    if (body.title) updateData.title = body.title;
    if (body.description) updateData.description = body.description;
    if (body.status) updateData.status = body.status;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('episodes')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    }

    // Update scenes if provided
    if (body.scenes && body.scenes.length > 0) {
      for (const scene of body.scenes) {
        const sceneUpdate: any = {};
        if (scene.title) sceneUpdate.title = scene.title;
        if (scene.description) sceneUpdate.description = scene.description;
        if (scene.narration) sceneUpdate.narration = scene.narration;
        if (scene.dialogue) sceneUpdate.dialogue = scene.dialogue;

        if (Object.keys(sceneUpdate).length > 0) {
          const { error } = await supabase
            .from('scenes')
            .update(sceneUpdate)
            .eq('id', scene.id)
            .eq('episode_id', id);
          
          if (error) throw error;
        }
      }
    }

    // Get updated episode with scenes
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();

    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', id)
      .order('scene_number');

    res.json({ 
      success: true, 
      data: { episode, scenes }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/episodes/cleanup - delete all stuck pending episodes with no real data
episodesRouter.delete('/cleanup', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Delete episodes that are still 'pending' with title 'Generating...' and no video
    const { data: deleted, error } = await supabase
      .from('episodes')
      .delete()
      .eq('status', 'pending')
      .eq('title', 'Generating...')
      .is('video_url', null)
      .select('id');

    if (error) throw error;

    logger.info({ count: deleted?.length }, 'Cleaned up stuck pending episodes');
    res.json({ success: true, deleted: deleted?.length || 0 });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/episodes/:id - delete specific episode
episodesRouter.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('episodes').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Episode deleted' });
  } catch (err) {
    next(err);
  }
});

export default episodesRouter;
