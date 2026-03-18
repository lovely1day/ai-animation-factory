import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { calculateWorkflowProgress } from '@ai-animation-factory/shared';

const router: Router = Router();

/**
 * Get all projects
 * GET /api/projects
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      search, 
      page = '1', 
      limit = '20',
      sort_by = 'updatedAt',
      sort_order = 'desc'
    } = req.query;

    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' });

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Search by title
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Sort
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data: projects, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to fetch projects');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create new project
 * POST /api/projects
 */
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      genre, 
      target_audience,
      workflow_settings 
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        genre,
        target_audience,
        workflow_settings: workflow_settings || {
          approval_steps: ['script', 'images'],
          auto_publish: false,
          default_scene_count: 8,
          default_video_quality: 'hd'
        },
        stats: {
          total_episodes: 0,
          completed_episodes: 0,
          in_progress_episodes: 0,
          waiting_approval_episodes: 0,
          total_duration_seconds: 0,
          total_views: 0,
          total_likes: 0
        },
        progress: 0,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info({ project_id: project.id }, 'Project created');

    res.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to create project');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get project by ID
 * GET /api/projects/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get project with episodes summary
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get episodes summary
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('id, title, episode_number, status, workflow_step, workflow_progress, thumbnail_url, duration_seconds, view_count, like_count, createdAt, updatedAt')
      .eq('project_id', id)
      .order('episode_number', { ascending: true });

    if (episodesError) {
      throw episodesError;
    }

    res.json({
      success: true,
      data: {
        ...project,
        episodes: episodes || []
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, project_id: req.params.id }, 'Failed to fetch project');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update project
 * PATCH /api/projects/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, genre, target_audience, status, workflow_settings } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (genre !== undefined) updateData.genre = genre;
    if (target_audience !== undefined) updateData.target_audience = target_audience;
    if (status !== undefined) updateData.status = status;
    if (workflow_settings !== undefined) updateData.workflow_settings = workflow_settings;

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info({ project_id: id }, 'Project updated');

    res.json({
      success: true,
      data: project,
      message: 'Project updated successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message, project_id: req.params.id }, 'Failed to update project');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete project
 * DELETE /api/projects/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    logger.info({ project_id: id }, 'Project deleted');

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message, project_id: req.params.id }, 'Failed to delete project');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get project episodes
 * GET /api/projects/:id/episodes
 */
router.get('/:id/episodes', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, workflow_step, page = '1', limit = '20' } = req.query;

    let query = supabase
      .from('episodes')
      .select('*', { count: 'exact' })
      .eq('project_id', id);

    if (status) {
      query = query.eq('status', status);
    }

    if (workflow_step) {
      query = query.eq('workflow_step', workflow_step);
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to).order('episode_number', { ascending: true });

    const { data: episodes, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: episodes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, project_id: req.params.id }, 'Failed to fetch project episodes');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create episode in project
 * POST /api/projects/:id/episodes
 */
router.post('/:id/episodes', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, idea, genre, target_audience } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // Get project settings
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('workflow_settings, genre, target_audience')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Get next episode number
    const { data: lastEpisode, error: countError } = await supabase
      .from('episodes')
      .select('episode_number')
      .eq('project_id', id)
      .order('episode_number', { ascending: false })
      .limit(1)
      .single();

    const nextEpisodeNumber = (lastEpisode?.episode_number || 0) + 1;

    // Create episode
    const { data: episode, error } = await supabase
      .from('episodes')
      .insert({
        project_id: id,
        title,
        description,
        idea,
        genre: genre || project.genre,
        target_audience: target_audience || project.target_audience,
        episode_number: nextEpisodeNumber,
        status: 'draft',
        workflow_step: 'idea',
        workflow_status: 'pending',
        workflow_progress: 0,
        approval_steps: project.workflow_settings?.approval_steps || ['script', 'images'],
        approvals_log: [],
        metadata: {
          generation_settings: {
            scene_count: project.workflow_settings?.default_scene_count || 8,
            image_width: 1024,
            image_height: 1024,
            video_quality: project.workflow_settings?.default_video_quality || 'hd'
          }
        },
        view_count: 0,
        like_count: 0,
        share_count: 0
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update project stats
    await supabase.rpc('increment_project_episode_count', { project_id: id });

    logger.info({ project_id: id, episode_id: episode.id }, 'Episode created in project');

    res.json({
      success: true,
      data: episode,
      message: 'Episode created successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message, project_id: req.params.id }, 'Failed to create episode');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get project statistics
 * GET /api/projects/:id/stats
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    // Get detailed stats
    const { data: stats, error } = await supabase
      .from('episodes')
      .select('status, workflow_step, workflow_status, view_count, like_count, duration_seconds')
      .eq('project_id', id);

    if (error) {
      throw error;
    }

    const summary = {
      total_episodes: stats.length,
      by_status: {} as Record<string, number>,
      by_workflow_step: {} as Record<string, number>,
      waiting_approval: 0,
      total_views: 0,
      total_likes: 0,
      total_duration: 0,
      avg_progress: 0
    };

    let totalProgress = 0;

    stats.forEach(episode => {
      // Count by status
      summary.by_status[episode.status] = (summary.by_status[episode.status] || 0) + 1;
      
      // Count by workflow step
      summary.by_workflow_step[episode.workflow_step] = (summary.by_workflow_step[episode.workflow_step] || 0) + 1;
      
      // Count waiting approval
      if (episode.workflow_status === 'waiting_approval') {
        summary.waiting_approval++;
      }
      
      // Sum metrics
      summary.total_views += episode.view_count || 0;
      summary.total_likes += episode.like_count || 0;
      summary.total_duration += episode.duration_seconds || 0;
      
      // Calculate progress
      totalProgress += calculateWorkflowProgress(episode.workflow_step);
    });

    summary.avg_progress = stats.length > 0 ? Math.round(totalProgress / stats.length) : 0;

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    logger.error({ error: error.message, project_id: req.params.id }, 'Failed to fetch project stats');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
