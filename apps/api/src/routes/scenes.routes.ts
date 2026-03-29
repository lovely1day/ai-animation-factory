import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { imageGenerationService } from '../services/image-generation.service';

const scenesRouter: Router = Router();

/**
 * Get all scenes for an episode
 * GET /api/scenes?episode_id=...
 */
scenesRouter.get('/', async (req, res) => {
  try {
    const { episode_id } = req.query;

    if (!episode_id) {
      return res.status(400).json({ success: false, error: 'episode_id is required' });
    }

    const { data: scenes, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', episode_id)
      .order('scene_number', { ascending: true });

    if (error) throw error;

    return res.json({ success: true, data: scenes || [] });
  } catch (err: any) {
    logger.error({ error: 'Internal server error' }, 'Failed to fetch scenes');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Get single scene by ID
 * GET /api/scenes/:id
 */
scenesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: scene, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }

    return res.json({ success: true, data: scene });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', scene_id: req.params.id }, 'Failed to fetch scene');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Update scene (prompt, dialogue, narration, duration)
 * PATCH /api/scenes/:id
 */
scenesRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { visual_prompt, dialogue, narration, title, description, duration_seconds } = req.body;

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (visual_prompt !== undefined) update.visual_prompt = visual_prompt;
    if (dialogue !== undefined) update.dialogue = dialogue;
    if (narration !== undefined) update.narration = narration;
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (duration_seconds !== undefined) update.duration_seconds = duration_seconds;

    const { data: scene, error } = await supabase
      .from('scenes')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info({ scene_id: id }, 'Scene updated');

    return res.json({ success: true, data: scene });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', scene_id: req.params.id }, 'Failed to update scene');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Regenerate image for a scene
 * POST /api/scenes/:id/regenerate-image
 */
scenesRouter.post('/:id/regenerate-image', async (req, res) => {
  try {
    const { id } = req.params;
    const { visual_prompt } = req.body;

    const { data: scene, error: fetchError } = await supabase
      .from('scenes')
      .select('id, episode_id, scene_number, visual_prompt')
      .eq('id', id)
      .single();

    if (fetchError || !scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }

    const prompt = visual_prompt || scene.visual_prompt;

    // Update prompt if changed
    if (visual_prompt && visual_prompt !== scene.visual_prompt) {
      await supabase
        .from('scenes')
        .update({ visual_prompt, status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    // Generate new image
    const result = await imageGenerationService.generate({
      episode_id: scene.episode_id,
      scene_id: id,
      scene_number: scene.scene_number,
      visual_prompt: prompt,
    });

    // Save new image URL
    await supabase
      .from('scenes')
      .update({ image_url: result.image_url, status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('assets').insert({
      episode_id: scene.episode_id,
      scene_id: id,
      asset_type: 'image',
      file_url: result.image_url,
      file_key: result.file_key,
      mime_type: 'image/jpeg',
    });

    logger.info({ scene_id: id, image_url: result.image_url }, 'Scene image regenerated');

    return res.json({ success: true, data: { image_url: result.image_url, file_key: result.file_key } });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', scene_id: req.params.id }, 'Failed to regenerate scene image');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * Regenerate voice for a scene
 * POST /api/scenes/:id/regenerate-voice
 */
scenesRouter.post('/:id/regenerate-voice', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, voice_id } = req.body;

    const { data: scene, error: fetchError } = await supabase
      .from('scenes')
      .select('id, episode_id, scene_number, dialogue, narration')
      .eq('id', id)
      .single();

    if (fetchError || !scene) {
      return res.status(404).json({ success: false, error: 'Scene not found' });
    }

    const voiceText = text || scene.dialogue || scene.narration;
    if (!voiceText?.trim()) {
      return res.status(400).json({ success: false, error: 'No text available for voice generation' });
    }

    const { voiceGenerationService } = await import('../services/voice-generation.service');
    const result = await voiceGenerationService.generate({
      episode_id: scene.episode_id,
      scene_id: id,
      text: voiceText,
      voice_id,
    });

    await supabase
      .from('scenes')
      .update({ voice_url: result.voice_url, updated_at: new Date().toISOString() })
      .eq('id', id);

    logger.info({ scene_id: id }, 'Scene voice regenerated');

    return res.json({ success: true, data: { voice_url: result.voice_url, duration_seconds: result.duration_seconds } });
  } catch (err: any) {
    logger.error({ error: 'Internal server error', scene_id: req.params.id }, 'Failed to regenerate voice');
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export { scenesRouter };
export default scenesRouter;
