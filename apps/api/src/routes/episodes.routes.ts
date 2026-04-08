import { Router } from 'express';
import { Queue } from 'bullmq';
import { supabase } from '../config/supabase';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';
import { safeErrorMessage } from '../middleware/error-handler';
import { approvalWorkflowService } from '../services/approval-workflow.service';
import { comfyUIGenerationService } from '../services/comfyui-generation.service';
import { PipelineService } from '../services/pipeline.service';
import { scriptWriterService } from '../services/script-writer.service';
import { WorkflowStep, WORKFLOW_STEP_DETAILS, calculateWorkflowProgress, getNextWorkflowStep } from '@ai-animation-factory/shared';

const router: Router = Router();

// Production queues for the from-approved pipeline
const _voiceQueue = new Queue('voice-generation', { connection: redisConnection });
const _musicQueue = new Queue('music-generation', { connection: redisConnection });
const _animationQueue = new Queue('animation', { connection: redisConnection });

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

    // Get episode
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();

    if (episodeError || !episode) {
      logger.error({ error: episodeError?.message, code: episodeError?.code, id }, 'Episode fetch failed');
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

    // Get approval logs (table may not exist yet — skip gracefully)
    let approvalLogs: any[] = [];
    try {
      const { data } = await supabase
        .from('approval_logs')
        .select('*')
        .eq('episode_id', id)
        .order('created_at', { ascending: false });
      approvalLogs = data || [];
    } catch {}

    // Get generation jobs (skip gracefully if table missing)
    let jobs: any[] = [];
    try {
      const { data } = await supabase
        .from('generation_jobs')
        .select('*')
        .eq('episode_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      jobs = data || [];
    } catch {}

    res.json({
      success: true,
      data: {
        ...episode,
        scenes: scenes || [],
        approval_logs: approvalLogs,
        recent_jobs: jobs
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
      default_scene_count: 4,
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
      .select('id, title, description, idea, genre, target_audience, approval_steps, tags, metadata')
      .eq('id', id)
      .single();

    if (error || !episode) {
      logger.error({ error: error?.message, id }, 'Episode start: not found');
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    const sceneCount = (episode.metadata as any)?.generation_settings?.scene_count || 4;

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

    // ── Background script generation via Creative Council pipeline ──
    (async () => {
      try {
        // Stage 1: Script Writer (cinematic shot-by-shot)
        const script = await scriptWriterService.write({
          episode_id: id,
          idea: {
            title: episode.title,
            description: episode.idea || episode.description || '',
            genre: episode.genre || 'adventure',
            target_audience: episode.target_audience || 'general',
            theme: episode.genre || 'adventure',
            tags: episode.tags || [],
          },
          scene_count: sceneCount,
        });

        // Stage 2 (Visual Director) REMOVED — was adding 25-30s without much gain.
        // The script writer already generates cinematic prompts with shot types.
        // ScenePromptService still runs at image-gen time for genre/audience styling.

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
            duration_seconds: scene.duration_seconds || 3,
            status: 'pending',
          });
        }

        await supabase.from('episodes').update({
          workflow_step: 'script',
          workflow_status: 'waiting_approval',
          workflow_progress: 25,
          metadata: { ...(episode.metadata as any || {}), script_data: script },
          updated_at: new Date().toISOString(),
        }).eq('id', id);

        logger.info({ episode_id: id, scenes: script.scenes.length }, 'Creative Council pipeline complete');
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

/**
 * POST /api/episodes/from-approved
 *
 * Fast-track endpoint: takes pre-generated scenes with approved images,
 * creates an episode, saves all scenes, and triggers the full production
 * pipeline (voice + music + animation → assembly → subtitle → final video).
 *
 * Used by the idea-generator "final" step to skip ComfyUI and produce a
 * real video via FFmpeg.
 *
 * Body: {
 *   title, description, genre, target_audience,
 *   scenes: [{ scene_number, title, description, visual_prompt, image_url,
 *              dialogue?, narration?, duration_seconds? }]
 * }
 */
router.post('/from-approved', async (req, res) => {
  try {
    const { title, description, genre = 'adventure', target_audience = 'general', scenes } = req.body;

    if (!title || !scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({ success: false, error: 'title and scenes[] are required' });
    }

    // 1. Create episode directly at "images approved" state
    const { data: episode, error: epErr } = await supabase
      .from('episodes')
      .insert({
        title,
        description,
        idea: description,
        genre,
        target_audience,
        status: 'generating',
        workflow_step: 'production',
        workflow_status: 'processing',
        workflow_progress: 65,
        approval_steps: ['script', 'images'],
        approvals_log: [],
        metadata: {
          generation_settings: { scene_count: scenes.length, image_width: 1024, image_height: 576, video_quality: 'hd' },
          source: 'idea-generator-fast-track',
        },
        view_count: 0,
        like_count: 0,
        share_count: 0,
      })
      .select()
      .single();

    if (epErr || !episode) {
      throw new Error(`Failed to create episode: ${epErr?.message || 'unknown'}`);
    }

    // 2. Insert all scenes with images already set
    const sceneRows = scenes.map((s: any, i: number) => ({
      episode_id: episode.id,
      scene_number: s.scene_number || i + 1,
      title: s.title || `Scene ${i + 1}`,
      description: s.description || '',
      visual_prompt: s.visual_prompt || '',
      dialogue: s.dialogue || '',
      narration: s.narration || '',
      duration_seconds: s.duration_seconds || 4,
      image_url: s.image_url,
      status: 'completed',
    }));

    const { error: scenesErr } = await supabase.from('scenes').insert(sceneRows);
    if (scenesErr) {
      throw new Error(`Failed to save scenes: ${scenesErr.message}`);
    }

    logger.info({ episode_id: episode.id, scene_count: scenes.length }, 'Fast-track episode created, dispatching production pipeline');

    // 3. Respond immediately
    res.json({
      success: true,
      episode_id: episode.id,
      message: 'Episode created, production pipeline started',
    });

    // 4. Dispatch production jobs in background (non-blocking)
    (async () => {
      try {
        const { data: savedScenes } = await supabase
          .from('scenes')
          .select('id, scene_number, image_url, visual_prompt, dialogue, narration, duration_seconds')
          .eq('episode_id', episode.id)
          .order('scene_number');

        if (!savedScenes || savedScenes.length === 0) return;

        // FAST MODE: skip voice + music — silent video first, audio added later
        // (Saves ~60-90s. Voice/music can be regenerated separately after the video works.)
        const SKIP_AUDIO = true;
        const totalDuration = savedScenes.reduce((sum, s) => sum + (s.duration_seconds || 5), 0);

        if (!SKIP_AUDIO) {
          for (const scene of savedScenes) {
            const text = [scene.dialogue, scene.narration].filter(Boolean).join(' ');
            if (text.trim()) {
              await _voiceQueue.add(`voice-scene-${scene.scene_number}`, {
                episode_id: episode.id,
                scene_id: scene.id,
                text,
              });
            }
          }
          await _musicQueue.add(`music-${episode.id}`, { episode_id: episode.id, genre, mood: genre, duration: totalDuration });
        }

        // Music job (skipped in FAST MODE)
        if (false) await _musicQueue.add(`music-${episode.id}`, {
          episode_id: episode.id,
          genre,
          mood: genre,
          duration: totalDuration,
        });

        // Animation jobs — will auto-trigger assembly when all done
        for (const scene of savedScenes) {
          await _animationQueue.add(`animation-scene-${scene.scene_number}`, {
            episode_id: episode.id,
            scene_id: scene.id,
            scene_number: scene.scene_number,
            image_url: scene.image_url,
            prompt: scene.visual_prompt,
            duration_seconds: scene.duration_seconds || 4,
          });
        }

        logger.info({
          episode_id: episode.id,
          voice_jobs: savedScenes.filter(s => s.dialogue || s.narration).length,
          animation_jobs: savedScenes.length,
        }, 'Fast-track production pipeline dispatched');
      } catch (bgErr: any) {
        logger.error({ error: bgErr.message, episode_id: episode.id }, 'Fast-track dispatch failed');
        await supabase.from('episodes').update({
          workflow_status: 'failed',
          updated_at: new Date().toISOString(),
        }).eq('id', episode.id);
      }
    })();

  } catch (err: any) {
    logger.error({ error: err.message }, 'from-approved failed');
    return res.status(500).json({ success: false, error: safeErrorMessage(err, 'Failed to start production') });
  }
});

export default router;
