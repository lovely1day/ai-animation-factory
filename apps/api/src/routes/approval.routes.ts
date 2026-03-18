import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { approvalWorkflowService } from '../services/approval-workflow.service';
import { comfyUIGenerationService } from '../services/comfyui-generation.service';
import { PipelineService } from '../services/pipeline.service';

const router: Router = Router();

/**
 * Get approval logs for an episode
 * GET /api/approval/episodes/:id/logs
 */
router.get('/episodes/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: logs, error } = await supabase
      .from('approval_logs')
      .select('*')
      .eq('episode_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: logs || []
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to fetch approval logs');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Approve or reject script
 * POST /api/approval/episodes/:id/script
 */
router.post('/episodes/:id/script', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, modifications } = req.body;

    if (!['approved', 'rejected', 'requested_changes'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: approved, rejected, or requested_changes'
      });
    }

    // Get current episode
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('workflow_step, workflow_status, script_data, project_id')
      .eq('id', id)
      .single();

    if (fetchError || !episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    if (episode.workflow_step !== 'script') {
      return res.status(400).json({
        success: false,
        error: `Episode is at ${episode.workflow_step} step, not script`
      });
    }

    // Create approval log
    const { error: logError } = await supabase
      .from('approval_logs')
      .insert({
        episode_id: id,
        project_id: episode.project_id,
        step: 'script',
        action,
        comment,
        requested_changes: modifications || null,
        created_at: new Date().toISOString()
      });

    if (logError) {
      throw logError;
    }

    let updateData: any = {};

    if (action === 'approved') {
      // Update script with modifications if provided
      if (modifications && episode.script_data) {
        updateData.script_data = {
          ...episode.script_data,
          ...modifications,
          scenes: modifications.scenes || episode.script_data.scenes
        };
      }

      updateData.workflow_status = 'approved';
      updateData.current_approval_step = null;

      // Update scenes if modified
      if (modifications?.scenes) {
        for (const scene of modifications.scenes) {
          await supabase
            .from('scenes')
            .upsert({
              episode_id: id,
              project_id: episode.project_id,
              scene_number: scene.scene_number,
              title: scene.title,
              description: scene.description,
              visual_prompt: scene.visual_prompt,
              dialogue: scene.dialogue,
              narration: scene.narration,
              duration_seconds: scene.duration_seconds || 8,
              status: 'pending'
            }, {
              onConflict: 'episode_id,scene_number'
            });
        }
      }

      logger.info({ episode_id: id }, 'Script approved — triggering image generation');

      // Persist approval first, then kick off image pipeline
      updateData.updatedAt = new Date().toISOString();
      await supabase.from('episodes').update(updateData).eq('id', id);
      await PipelineService.dispatchImages(id);
      return res.json({ success: true, message: 'Script approved and image generation started' });
    } else if (action === 'rejected') {
      updateData.workflow_status = 'rejected';
      updateData.status = 'draft';
      
      logger.info({ episode_id: id }, 'Script rejected');
    } else if (action === 'requested_changes') {
      updateData.workflow_status = 'pending';
      
      logger.info({ episode_id: id }, 'Script changes requested');
    }

    updateData.updatedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: updated,
      message: `Script ${action.replace('_', ' ')} successfully`
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to process script approval');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Approve or reject images
 * POST /api/approval/episodes/:id/images
 */
router.post('/episodes/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment, regenerate_scenes } = req.body;

    if (!['approved', 'rejected', 'requested_changes'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: approved, rejected, or requested_changes'
      });
    }

    // Get current episode
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('workflow_step, workflow_status, images_data, project_id')
      .eq('id', id)
      .single();

    if (fetchError || !episode) {
      return res.status(404).json({
        success: false,
        error: 'Episode not found'
      });
    }

    if (episode.workflow_step !== 'images') {
      return res.status(400).json({
        success: false,
        error: `Episode is at ${episode.workflow_step} step, not images`
      });
    }

    // Create approval log
    const { error: logError } = await supabase
      .from('approval_logs')
      .insert({
        episode_id: id,
        project_id: episode.project_id,
        step: 'images',
        action,
        comment,
        requested_changes: regenerate_scenes ? { regenerate_scenes } : null,
        created_at: new Date().toISOString()
      });

    if (logError) {
      throw logError;
    }

    let updateData: any = {};

    if (action === 'approved') {
      updateData.workflow_status = 'approved';
      updateData.current_approval_step = null;
      updateData.images_data = {
        ...episode.images_data,
        approved: true,
        pending_approval: false
      };

      logger.info({ episode_id: id }, 'Images approved — triggering animation/voice/music pipeline');

      // Persist approval first, then kick off the rest of the pipeline
      updateData.updatedAt = new Date().toISOString();
      await supabase.from('episodes').update(updateData).eq('id', id);

      const { data: ep } = await supabase
        .from('episodes')
        .select('genre, duration_seconds')
        .eq('id', id)
        .single();

      await Promise.all([
        PipelineService.dispatchAnimations(id),
        PipelineService.dispatchVoice(id),
        PipelineService.dispatchMusic(id, ep?.genre || 'adventure', ep?.duration_seconds || 60),
      ]);

      return res.json({ success: true, message: 'Images approved and animation pipeline started' });
    } else if (action === 'rejected') {
      updateData.workflow_status = 'rejected';
      
      logger.info({ episode_id: id }, 'Images rejected');
    } else if (action === 'requested_changes') {
      updateData.workflow_status = 'processing';
      
      // Regenerate specific scenes if provided
      if (regenerate_scenes && Array.isArray(regenerate_scenes)) {
        const { data: scenes } = await supabase
          .from('scenes')
          .select('*')
          .eq('episode_id', id)
          .in('scene_number', regenerate_scenes);

        if (scenes) {
          for (const scene of scenes) {
            // Submit regeneration job
            await comfyUIGenerationService.generateSceneImage({
              episode_id: id,
              scene_number: scene.scene_number,
              visual_prompt: scene.visual_prompt,
            });

            // Update scene status
            await supabase
              .from('scenes')
              .update({ status: 'pending' })
              .eq('id', scene.id);
          }
        }
      }
      
      logger.info({ episode_id: id, regenerate_scenes }, 'Image regeneration requested');
    }

    updateData.updatedAt = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('episodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: updated,
      message: `Images ${action.replace('_', ' ')} successfully`
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to process images approval');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update scene and regenerate image
 * POST /api/approval/episodes/:id/scenes/:sceneNumber/regenerate
 */
router.post('/episodes/:id/scenes/:sceneNumber/regenerate', async (req, res) => {
  try {
    const { id, sceneNumber } = req.params;
    const { visual_prompt } = req.body;

    // Get scene
    const { data: scene, error: sceneError } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', id)
      .eq('scene_number', parseInt(sceneNumber))
      .single();

    if (sceneError || !scene) {
      return res.status(404).json({
        success: false,
        error: 'Scene not found'
      });
    }

    // Use new prompt or existing
    const prompt = visual_prompt || scene.visual_prompt;

    // Update scene with new prompt
    const { error: updateError } = await supabase
      .from('scenes')
      .update({
        visual_prompt: prompt,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', scene.id);

    if (updateError) {
      throw updateError;
    }

    // Submit regeneration
    const result = await comfyUIGenerationService.generateSceneImage({
      episode_id: id,
      scene_number: parseInt(sceneNumber),
      visual_prompt: prompt,
    });

    // Update scene with generation ID
    await supabase
      .from('scenes')
      .update({
        generation_ids: { ...scene.generation_ids, comfyui_prompt_id: result.prompt_id }
      })
      .eq('id', scene.id);

    logger.info({ episode_id: id, scene_number: sceneNumber }, 'Scene regeneration started');

    res.json({
      success: true,
      data: {
        prompt_id: result.prompt_id,
        message: 'Scene regeneration started'
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id, scene_number: req.params.sceneNumber }, 'Failed to regenerate scene');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get pending approvals count
 * GET /api/approval/pending-count
 */
router.get('/pending-count', async (req, res) => {
  try {
    const { data: episodes, error, count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_status', 'waiting_approval');

    if (error) {
      throw error;
    }

    // Group by step manually
    const { data: allPending } = await supabase
      .from('episodes')
      .select('workflow_step')
      .eq('workflow_status', 'waiting_approval');

    const byStep = (allPending || []).reduce((acc: any, ep: any) => {
      const step = ep.workflow_step;
      const existing = acc.find((s: any) => s.workflow_step === step);
      if (existing) {
        existing.count = (existing.count || 0) + 1;
      } else {
        acc.push({ workflow_step: step, count: 1 });
      }
      return acc;
    }, []);

    res.json({
      success: true,
      data: {
        total: count || 0,
        by_step: byStep
      }
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to fetch pending count');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
