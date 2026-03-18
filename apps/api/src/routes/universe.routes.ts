import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';

const router: Router = Router();

/**
 * Create a show (project) in the universe
 * POST /api/universe/shows
 */
router.post('/shows', async (req, res) => {
  try {
    const { title, description, genre, target_audience, tags } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        genre: genre || null,
        target_audience: target_audience || null,
        tags: tags || [],
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    logger.info({ project_id: project.id, title }, 'Universe show created');

    return res.status(201).json({ success: true, data: project });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to create universe show');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * List all shows (projects)
 * GET /api/universe/shows
 */
router.get('/shows', async (req, res) => {
  try {
    const { status, genre, search, page = '1', limit = '20' } = req.query;

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (genre) query = query.eq('genre', genre);
    if (search) query = query.ilike('title', `%${search}%`);

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    query = query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    const { data: projects, error, count } = await query;

    if (error) throw error;

    return res.json({
      success: true,
      data: projects || [],
      pagination: { page: pageNum, limit: limitNum, total: count || 0 },
    });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to list universe shows');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Get a single show with its episodes
 * GET /api/universe/shows/:id
 */
router.get('/shows/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: project, error } = await supabase
      .from('projects')
      .select('*, episodes(id, title, status, episode_number, season_number, thumbnail_url, view_count)')
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({ success: false, error: 'Show not found' });
    }

    return res.json({ success: true, data: project });
  } catch (err: any) {
    logger.error({ error: err.message, project_id: req.params.id }, 'Failed to get universe show');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Update a show
 * PATCH /api/universe/shows/:id
 */
router.patch('/shows/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, genre, target_audience, tags, status } = req.body;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (title !== undefined) update.title = title.trim();
    if (description !== undefined) update.description = description?.trim() || null;
    if (genre !== undefined) update.genre = genre;
    if (target_audience !== undefined) update.target_audience = target_audience;
    if (tags !== undefined) update.tags = tags;
    if (status !== undefined) update.status = status;

    const { data: project, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, data: project });
  } catch (err: any) {
    logger.error({ error: err.message, project_id: req.params.id }, 'Failed to update universe show');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Create an entity (character, location, etc.) linked to a show
 * POST /api/universe/entities
 */
router.post('/entities', async (req, res) => {
  try {
    const { type, name, description, project_id, metadata } = req.body;

    if (!name?.trim() || !type?.trim()) {
      return res.status(400).json({ success: false, error: 'name and type are required' });
    }

    // Store entities in project metadata (or a dedicated table if it exists)
    // For now we store in the project's metadata JSONB field
    if (project_id) {
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', project_id)
        .single();

      if (fetchError || !project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const entities = (project.metadata as any)?.entities || [];
      const newEntity = {
        id: crypto.randomUUID(),
        type,
        name: name.trim(),
        description: description?.trim() || null,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      };

      entities.push(newEntity);

      await supabase
        .from('projects')
        .update({ metadata: { ...(project.metadata as any), entities }, updated_at: new Date().toISOString() })
        .eq('id', project_id);

      logger.info({ project_id, entity_name: name, type }, 'Entity created');

      return res.status(201).json({ success: true, data: newEntity });
    }

    // No project_id — return entity object only
    return res.status(201).json({
      success: true,
      data: { id: crypto.randomUUID(), type, name: name.trim(), description: description?.trim() || null },
    });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to create entity');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * List entities for a show
 * GET /api/universe/entities?project_id=...
 */
router.get('/entities', async (req, res) => {
  try {
    const { project_id } = req.query;

    if (!project_id) {
      return res.status(400).json({ success: false, error: 'project_id is required' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', project_id)
      .single();

    if (error || !project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const entities = (project.metadata as any)?.entities || [];

    return res.json({ success: true, data: entities });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to list entities');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * Link entity to show (add relationship)
 * POST /api/universe/link
 */
router.post('/link', async (req, res) => {
  try {
    const { showId, entityId, relationship } = req.body;

    if (!showId || !entityId) {
      return res.status(400).json({ success: false, error: 'showId and entityId are required' });
    }

    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('metadata')
      .eq('id', showId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({ success: false, error: 'Show not found' });
    }

    const links = (project.metadata as any)?.entity_links || [];
    const link = { showId, entityId, relationship: relationship || 'member', created_at: new Date().toISOString() };

    // Avoid duplicates
    const exists = links.some((l: any) => l.entityId === entityId);
    if (!exists) {
      links.push(link);
      await supabase
        .from('projects')
        .update({ metadata: { ...(project.metadata as any), entity_links: links }, updated_at: new Date().toISOString() })
        .eq('id', showId);
    }

    logger.info({ showId, entityId }, 'Entity linked to show');

    return res.json({ success: true, data: link });
  } catch (err: any) {
    logger.error({ error: err.message }, 'Failed to link entity');
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
