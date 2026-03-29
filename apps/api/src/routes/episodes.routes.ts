import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { safeErrorMessage } from '../middleware/error-handler';
import { approvalWorkflowService } from '../services/approval-workflow.service';
import { comfyUIGenerationService } from '../services/comfyui-generation.service';
import { PipelineService } from '../services/pipeline.service';
import { scriptWriterService } from '../services/script-writer.service';
import { WorkflowStep, WORKFLOW_STEP_DETAILS, calculateWorkflowProgress, getNextWorkflowStep } from '@ai-animation-factory/shared';

const router: Router = Router();

/**
 * Get all episodes
 * GET /api/episodes
 */
router.get('/', async (req, res) => {
  try {
    const { 
      project_id,
      status, 
      workflow_step,
      workflow_status,
      search, 
      page = '1', 
      limit = '20',
      sort_by = 'updatedAt',
      sort_order = 'desc'
    } = req.query;

    let query = supabase
      .from('episodes')
      .select('*, projects(title)', { count: 'exact' });

    // Filters
    if (project_id) {
      query = query.eq('project_id', project_id);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (workflow_step) {
      query = query.eq('workflow_step', workflow_step);
    }
    if (workflow_status) {
      query = query.eq('workflow_status', workflow_status);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Sort
    query = query.order(sort_by as string, { ascending: sort_order === 'asc' });

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

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
    logger.error({ error: error.message }, 'Failed to fetch episodes');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Get episodes waiting for approval
 * GET /api/episodes/waiting-approval
 */
router.get('/waiting-approval', async (req, res) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const { data: episodes, error, count } = await supabase
      .from('episodes')
      .select('*, projects(title)', { count: 'exact' })
      .eq('workflow_status', 'waiting_approval')
      .order('updatedAt', { ascending: false })
      .range(from, to);

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
    logger.error({ error: error.message }, 'Failed to fetch waiting approval episodes');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Get episode by ID
 * GET /api/episodes/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get episode with project info
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*, projects(*)')
      .eq('id', id)
      .single();

    if (episodeError || !episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    // Get scenes
    const { data: scenes, error: scenesError } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', id)
      .order('scene_number', { ascending: true });

    if (scenesError) {
      throw scenesError;
    }

    // Get approval logs
    const { data: approvalLogs, error: logsError } = await supabase
      .from('approval_logs')
      .select('*')
      .eq('episode_id', id)
      .order('created_at', { ascending: false });

    if (logsError) {
      throw logsError;
    }

    // Get generation jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('episode_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobsError) {
      throw jobsError;
    }

    res.json({
      success: true,
      data: {
        ...episode,
        scenes: scenes || [],
        approval_logs: approvalLogs || [],
        recent_jobs: jobs || []
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to fetch episode');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Create episode (without project)
 * POST /api/episodes
 */
router.post('/', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      idea,
      project_id,
      genre, 
      target_audience,
      episode_number 
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    // If project_id provided, use project settings
    let projectSettings = {
      approval_steps: ['script', 'images'],
      default_scene_count: 8,
      default_video_quality: 'hd'
    };

    if (project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('workflow_settings, genre, target_audience')
        .eq('id', project_id)
        .single();

      if (project) {
        projectSettings = project.workflow_settings;
      }
    }

    // Get next episode number if not provided
    let epNumber = episode_number;
    if (project_id && !epNumber) {
      const { data: lastEpisode } = await supabase
        .from('episodes')
        .select('episode_number')
        .eq('project_id', project_id)
        .order('episode_number', { ascending: false })
        .limit(1)
        .single();
      
      epNumber = (lastEpisode?.episode_number || 0) + 1;
    }

    const { data: episode, error } = await supabase
      .from('episodes')
      .insert({
        project_id,
        title,
        description,
        idea,
        genre,
        target_audience,
        episode_number: epNumber,
        season_number: 1,
        status: 'pending',
        workflow_step: 'idea',
        workflow_status: 'pending',
        workflow_progress: 0,
        approval_steps: projectSettings.approval_steps,
        approvals_log: [],
        metadata: {
          generation_settings: {
            scene_count: projectSettings.default_scene_count,
            image_width: 1024,
            image_height: 1024,
            video_quality: projectSettings.default_video_quality
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

    // Update project stats if project_id exists
    if (project_id) {
      await supabase.rpc('increment_project_episode_count', { project_id });
    }

    logger.info({ episode_id: episode.id }, 'Episode created');

    res.json({
      success: true,
      data: episode,
      message: 'Episode created successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to create episode');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Update episode
 * PATCH /api/episodes/:id
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.project_id;

    const { data: episode, error } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info({ episode_id: id }, 'Episode updated');

    res.json({
      success: true,
      data: episode,
      message: 'Episode updated successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to update episode');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Delete episode
 * DELETE /api/episodes/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get project_id before deletion for stats update
    const { data: episode } = await supabase
      .from('episodes')
      .select('project_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('episodes')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Update project stats
    if (episode?.project_id) {
      await supabase.rpc('decrement_project_episode_count', { project_id: episode.project_id });
    }

    logger.info({ episode_id: id }, 'Episode deleted');

    res.json({
      success: true,
      message: 'Episode deleted successfully'
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to delete episode');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Get episode workflow state
 * GET /api/episodes/:id/workflow
 */
router.get('/:id/workflow', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: episode, error } = await supabase
      .from('episodes')
      .select('workflow_step, workflow_status, workflow_progress, approval_steps, current_approval_step, script_data, images_data, voice_data, music_data')
      .eq('id', id)
      .single();

    if (error || !episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    // Build workflow steps with status
    const steps = ['idea', 'script', 'scenes', 'images', 'voice', 'music', 'subtitles', 'animation', 'assembly', 'final'];
    const currentStepIndex = steps.indexOf(episode.workflow_step);

    const workflowSteps = steps.map((step, index) => {
      const stepDetails = WORKFLOW_STEP_DETAILS[step as WorkflowStep];
      let status: 'pending' | 'processing' | 'completed' | 'waiting_approval' = 'pending';

      if (index < currentStepIndex) {
        status = 'completed';
      } else if (index === currentStepIndex) {
        status = episode.workflow_status === 'waiting_approval' ? 'waiting_approval' : 
                 episode.workflow_status === 'processing' ? 'processing' : 'pending';
      }

      return {
        step,
        name: stepDetails?.name || step,
        name_ar: stepDetails?.name_ar || step,
        status,
        requires_approval: episode.approval_steps?.includes(step) || false,
        estimated_duration: stepDetails?.estimated_duration_seconds || 60
      };
    });

    res.json({
      success: true,
      data: {
        current_step: episode.workflow_step,
        current_status: episode.workflow_status,
        overall_progress: episode.workflow_progress,
        steps: workflowSteps,
        can_approve_current: episode.workflow_status === 'waiting_approval',
        current_approval_step: episode.current_approval_step,
        data: {
          script_ready: !!episode.script_data,
          images_ready: !!episode.images_data,
          voice_ready: !!episode.voice_data,
          music_ready: !!episode.music_data
        }
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to fetch workflow state');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Update episode workflow step
 * POST /api/episodes/:id/workflow/advance
 */
router.post('/:id/workflow/advance', async (req, res) => {
  try {
    const { id } = req.params;

    // Get current episode
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('workflow_step, workflow_status')
      .eq('id', id)
      .single();

    if (fetchError || !episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    if (episode.workflow_status !== 'completed' && episode.workflow_status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Current step must be completed or approved before advancing'
      });
    }

    const nextStep = getNextWorkflowStep(episode.workflow_step);
    if (!nextStep) {
      // Episode is complete
      const { data: updated } = await supabase
        .from('episodes')
        .update({
          workflow_status: 'completed',
          status: 'completed',
          workflow_progress: 100,
          updatedAt: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      return res.json({
        success: true,
        data: updated,
        message: 'Episode workflow completed'
      });
    }

    const newProgress = calculateWorkflowProgress(nextStep);

    const { data: updated, error } = await supabase
      .from('episodes')
      .update({
        workflow_step: nextStep,
        workflow_status: 'pending',
        workflow_progress: newProgress,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    logger.info({ episode_id: id, from: episode.workflow_step, to: nextStep }, 'Workflow advanced');

    res.json({
      success: true,
      data: updated,
      message: `Advanced to ${nextStep}`
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to advance workflow');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Start pipeline for an existing episode
 * POST /api/episodes/:id/start
 * Generates the script directly (no Redis/queue needed).
 * Returns immediately — generation happens in the background.
 */
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: episode, error } = await supabase
      .from('episodes')
      .select('id, title, description, idea, genre, target_audience, approval_steps, scene_count, theme, tags')
      .eq('id', id)
      .single();

    if (error || !episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    // Update status immediately so frontend shows loading
    await supabase.from('episodes').update({
      status: 'generating',
      workflow_step: 'script',
      workflow_status: 'processing',
      workflow_progress: 5,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    // Respond immediately — generation runs in background
    res.json({ success: true, message: 'Generating script...', episode_id: id });

    // ── Background script generation (no Redis needed) ──
    (async () => {
      try {
        const script = await scriptWriterService.write({
          episode_id: id,
          idea: {
            title: episode.title,
            description: episode.idea || episode.description || '',
            genre: episode.genre || 'adventure',
            target_audience: episode.target_audience || 'general',
            theme: episode.theme || episode.genre || 'adventure',
            tags: episode.tags || [],
          },
          scene_count: episode.scene_count || 8,
        });

        // Remove old scenes then insert new ones
        await supabase.from('scenes').delete().eq('episode_id', id);

        for (const scene of script.scenes) {
          await supabase.from('scenes').insert({
            episode_id: id,
            scene_number: scene.scene_number,
            title: scene.title,
            description: scene.description,
            visual_prompt: scene.visual_prompt,
            dialogue: scene.dialogue,
            narration: scene.narration,
            duration_seconds: scene.duration_seconds || 8,
            status: 'pending',
          });
        }

        await supabase.from('episodes').update({
          script_data: script,
          scene_count: script.scenes.length,
          workflow_step: 'script',
          workflow_status: 'waiting_approval',
          workflow_progress: 25,
          updated_at: new Date().toISOString(),
        }).eq('id', id);

        logger.info({ episode_id: id, scenes: script.scenes.length }, 'Script generation complete');
      } catch (bgErr: any) {
        logger.error({ error: bgErr.message, episode_id: id }, 'Background script generation failed');
        await supabase.from('episodes').update({
          status: 'error',
          workflow_status: 'failed',
          updated_at: new Date().toISOString(),
        }).eq('id', id);
      }
    })();

  } catch (err: any) {
    logger.error({ error: err.message, episode_id: req.params.id }, 'Failed to start pipeline');
    return res.status(500).json({ success: false, error: safeErrorMessage(err, 'Operation failed') });
  }
});

export default router;
