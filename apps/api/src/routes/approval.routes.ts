import { Router } from 'express';
import { Queue } from 'bullmq';
import { supabase } from '../config/supabase';
import { redisConnection } from '../config/redis';
import { logger } from '../utils/logger';
import { safeErrorMessage } from '../middleware/error-handler';
import { approvalWorkflowService } from '../services/approval-workflow.service';
import { comfyUIGenerationService } from '../services/comfyui-generation.service';
import { PipelineService } from '../services/pipeline.service';
import { scenePromptService } from '../services/scene-prompt.service';
import { injectCharacterIntoScene } from '@ai-animation-factory/shared';

const router: Router = Router();

// Production pipeline queues
const voiceQueue = new Queue('voice-generation', { connection: redisConnection });
const musicQueue = new Queue('music-generation', { connection: redisConnection });
const animationQueue = new Queue('animation', { connection: redisConnection });

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

      // Background: enhance prompts + generate images via Pollinations.ai
      (async () => {
        try {
          const { data: scenes } = await supabase
            .from('scenes')
            .select('id, scene_number, visual_prompt, description, dialogue, narration')
            .eq('episode_id', id)
            .order('scene_number');

          if (!scenes || scenes.length === 0) {
            logger.warn({ episode_id: id }, 'No scenes found for image generation');
            return;
          }

          const genre = episode.metadata?.genre || 'adventure';
          const audience = episode.metadata?.target_audience || 'general';

          // Fetch characters linked to this project/episode for DNA injection
          let characterDNA: string | null = null;
          if (episode.project_id) {
            const { data: chars } = await supabase
              .from('characters')
              .select('dna, name')
              .eq('project_id', episode.project_id)
              .limit(1);
            if (chars && chars.length > 0 && chars[0].dna) {
              characterDNA = chars[0].dna;
              logger.info({ character: chars[0].name, episode_id: id }, 'Injecting character DNA into scene prompts');
            }
          }

          for (const scene of scenes) {
            // Enhance prompt using ScenePromptService
            const enhanced = await scenePromptService.enhance(
              { scene_number: scene.scene_number, visual_prompt: scene.visual_prompt, title: '', description: scene.description || '', dialogue: scene.dialogue || '', narration: scene.narration || '', duration_seconds: 8 } as any,
              genre,
              audience
            );

            // Inject character DNA if available
            let finalPrompt = enhanced.visual_prompt;
            if (characterDNA) {
              finalPrompt = injectCharacterIntoScene(finalPrompt, characterDNA, 'foreground');
            }
            const cleanPrompt = finalPrompt.slice(0, 400).replace(/[^\w\s,.\-()]/g, ' ').trim();
            const seed = scene.scene_number * 1000 + Math.floor(Math.random() * 999);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPrompt)}?width=1024&height=576&seed=${seed}&model=flux&nologo=true`;

            await supabase.from('scenes').update({
              visual_prompt: finalPrompt,
              image_url: imageUrl,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }).eq('id', scene.id);

            logger.debug({ scene_number: scene.scene_number, enhanced: finalPrompt.slice(0, 80) }, 'Scene prompt enhanced');
          }

          await supabase.from('episodes').update({
            workflow_step: 'images',
            workflow_status: 'waiting_approval',
            workflow_progress: 60,
            updated_at: new Date().toISOString(),
          }).eq('id', id);

          logger.info({ episode_id: id, count: scenes.length }, 'Enhanced prompts + image URLs assigned via Pollinations.ai');
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
      .select('workflow_step, workflow_status, metadata, genre, project_id')
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
      logger.info({ episode_id: id }, 'Images approved — starting production pipeline (voice + music + animation)');

      // Move to production stage
      await supabase.from('episodes').update({
        workflow_status: 'processing',
        workflow_step: 'production',
        workflow_progress: 65,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      // Dispatch production jobs in background
      (async () => {
        try {
          const { data: scenes } = await supabase
            .from('scenes')
            .select('id, scene_number, image_url, visual_prompt, dialogue, narration, duration_seconds')
            .eq('episode_id', id)
            .order('scene_number');

          if (!scenes || scenes.length === 0) {
            logger.warn({ episode_id: id }, 'No scenes found for production');
            return;
          }

          const genre = episode.metadata?.genre || episode.genre || 'adventure';
          const totalDuration = scenes.reduce((sum, s) => sum + (s.duration_seconds || 8), 0);

          // 1. Voice jobs — one per scene with dialogue/narration
          for (const scene of scenes) {
            const text = [scene.dialogue, scene.narration].filter(Boolean).join(' ');
            if (text.trim()) {
              await voiceQueue.add(`voice-scene-${scene.scene_number}`, {
                episode_id: id,
                scene_id: scene.id,
                text,
              });
            }
          }

          // 2. Music job — one per episode
          await musicQueue.add(`music-${id}`, {
            episode_id: id,
            genre,
            mood: genre,
            duration: totalDuration,
          });

          // 3. Animation jobs — one per scene (will auto-trigger assembly when all done)
          for (const scene of scenes) {
            await animationQueue.add(`animation-scene-${scene.scene_number}`, {
              episode_id: id,
              scene_id: scene.id,
              scene_number: scene.scene_number,
              image_url: scene.image_url,
              prompt: scene.visual_prompt,
              duration_seconds: scene.duration_seconds || 8,
            });
          }

          logger.info({
            episode_id: id,
            voice_jobs: scenes.filter(s => s.dialogue || s.narration).length,
            animation_jobs: scenes.length,
          }, 'Production pipeline dispatched: voice + music + animation');
        } catch (bgErr: any) {
          logger.error({ error: bgErr.message, episode_id: id }, 'Production pipeline dispatch failed');
          await supabase.from('episodes').update({
            workflow_status: 'failed',
            updated_at: new Date().toISOString(),
          }).eq('id', id);
        }
      })();

      return res.json({ success: true, message: 'Images approved — production pipeline started (voice + music + animation)' });
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
