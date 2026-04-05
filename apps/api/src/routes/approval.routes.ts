import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { safeErrorMessage } from '../middleware/error-handler';
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
      error: safeErrorMessage(error, 'Operation failed')
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
      .select('workflow_step, workflow_status, project_id, metadata')
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

    // Create approval log (skip if table doesn't exist)
    try {
      await supabase
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
    } catch {}

    let updateData: any = {};

    if (action === 'approved') {
      updateData.workflow_status = 'approved';

      // Update scenes if modified
      if (modifications?.scenes) {
        for (const scene of modifications.scenes) {
          await supabase
            .from('scenes')
            .upsert({
              episode_id: id,
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

      logger.info({ episode_id: id }, 'Script approved — triggering image generation (Pollinations.ai)');

      // Persist approval, then move episode to images/processing
      updateData.updated_at = new Date().toISOString();
      updateData.workflow_step = 'images';
      updateData.workflow_status = 'processing';
      updateData.workflow_progress = 30;
      await supabase.from('episodes').update(updateData).eq('id', id);

      // Background: generate images via Pollinations.ai (no Redis needed)
      (async () => {
        try {
          const { data: scenes } = await supabase
            .from('scenes')
            .select('id, scene_number, visual_prompt')
            .eq('episode_id', id)
            .order('scene_number');

          if (!scenes || scenes.length === 0) {
            logger.warn({ episode_id: id }, 'No scenes found for image generation');
            return;
          }

          for (const scene of scenes) {
            const seed = scene.scene_number * 1000 + Math.floor(Math.random() * 999);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(scene.visual_prompt)}?width=1024&height=576&seed=${seed}&model=flux&nologo=true`;
            await supabase.from('scenes').update({
              image_url: imageUrl,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }).eq('id', scene.id);
          }

          await supabase.from('episodes').update({
            workflow_step: 'images',
            workflow_status: 'waiting_approval',
            workflow_progress: 60,
            updated_at: new Date().toISOString(),
          }).eq('id', id);

          logger.info({ episode_id: id, count: scenes.length }, 'Image URLs assigned via Pollinations.ai');
        } catch (bgErr: any) {
          logger.error({ error: bgErr.message, episode_id: id }, 'Background image generation failed');
          await supabase.from('episodes').update({
            workflow_status: 'failed',
            updated_at: new Date().toISOString(),
          }).eq('id', id);
        }
      })();

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
      error: safeErrorMessage(error, 'Operation failed')
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
      .select('workflow_step, workflow_status, metadata, genre')
      .eq('id', id)
      .single();

    if (fetchError || !episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    if (episode.workflow_step !== 'images') {
      return res.status(400).json({
        success: false,
        error: `Episode is at ${episode.workflow_step} step, not images`
      });
    }

    // Create approval log (skip if table missing)
    try {
      await supabase.from('approval_logs').insert({
        episode_id: id,
        step: 'images',
        action,
        comment,
        created_at: new Date().toISOString()
      });
    } catch {}

    if (action === 'approved') {
      logger.info({ episode_id: id }, 'Images approved — marking as completed');

      await supabase.from('episodes').update({
        workflow_status: 'approved',
        workflow_step: 'completed',
        workflow_progress: 100,
        status: 'completed',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      return res.json({ success: true, message: 'Images approved — episode completed!' });
    } else if (action === 'rejected') {
      await supabase.from('episodes').update({
        workflow_status: 'rejected',
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      logger.info({ episode_id: id }, 'Images rejected');
      return res.json({ success: true, message: 'Images rejected' });
    } else {
      return res.json({ success: true, message: 'No action taken' });
    }
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id }, 'Failed to process images approval');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
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

    // Generate new image URL via Pollinations
    const seed = parseInt(sceneNumber) * 1000 + Math.floor(Math.random() * 9999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=576&seed=${seed}&model=flux&nologo=true`;

    // Update scene
    await supabase
      .from('scenes')
      .update({
        visual_prompt: prompt,
        image_url: imageUrl,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', scene.id);

    logger.info({ episode_id: id, scene_number: sceneNumber }, 'Scene regenerated via Pollinations');

    res.json({
      success: true,
      data: { image_url: imageUrl, message: 'Scene regenerated' }
    });
  } catch (error: any) {
    logger.error({ error: error.message, episode_id: req.params.id, scene_number: req.params.sceneNumber }, 'Failed to regenerate scene');
    res.status(500).json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed')
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
      error: safeErrorMessage(error, 'Operation failed')
    });
  }
});

/**
 * Upload custom image for a scene
 * POST /api/approval/episodes/:id/scenes/:sceneNumber/upload
 * Body: { image_url: "https://..." } or base64 data
 */
router.post('/episodes/:id/scenes/:sceneNumber/upload', async (req, res) => {
  try {
    const { id, sceneNumber } = req.params;
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ success: false, error: 'image_url is required' });
    }

    const { error } = await supabase
      .from('scenes')
      .update({
        image_url,
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('episode_id', id)
      .eq('scene_number', parseInt(sceneNumber));

    if (error) throw error;

    logger.info({ episode_id: id, scene_number: sceneNumber }, 'Custom image uploaded');
    res.json({ success: true, message: 'Image updated' });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Failed to upload scene image');
    res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

export default router;
