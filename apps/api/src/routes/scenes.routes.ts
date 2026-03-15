import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { AppError } from '../middleware/error-handler';

export const scenesRouter = Router();

// GET /api/scenes/:episodeId/script - Get full script with all scenes
scenesRouter.get('/:episodeId/script', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { episodeId } = req.params;

    // Get episode info
    const { data: episode, error: epError } = await supabase
      .from('episodes')
      .select('id, title, description, genre, theme, status, created_at')
      .eq('id', episodeId)
      .single();

    if (epError || !episode) {
      throw new AppError(404, 'Episode not found');
    }

    // Get all scenes with full details
    const { data: scenes, error: scError } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', episodeId)
      .order('scene_number', { ascending: true });

    if (scError) throw scError;

    // Format as script
    const script = {
      episode: {
        id: episode.id,
        title: episode.title,
        description: episode.description,
        genre: episode.genre,
        theme: episode.theme,
        status: episode.status,
        created_at: episode.created_at,
      },
      scenes: scenes?.map(scene => ({
        id: scene.id,
        scene_number: scene.scene_number,
        title: scene.title,
        description: scene.description,
        visual_prompt: scene.visual_prompt,
        narration: scene.narration,
        dialogue: scene.dialogue,
        duration_seconds: scene.duration_seconds,
        status: scene.status,
        image_url: scene.image_url,
        voice_url: scene.voice_url,
        animation_url: scene.animation_url,
      })) || [],
      total_scenes: scenes?.length || 0,
      total_duration: scenes?.reduce((sum, s) => sum + (s.duration_seconds || 8), 0) || 0,
    };

    res.json({
      success: true,
      data: script,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/scenes/:episodeId/export - Export script as text
scenesRouter.get('/:episodeId/export', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { episodeId } = req.params;

    const { data: episode } = await supabase
      .from('episodes')
      .select('title, description, genre')
      .eq('id', episodeId)
      .single();

    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', episodeId)
      .order('scene_number');

    if (!scenes || scenes.length === 0) {
      throw new AppError(404, 'No scenes found for this episode');
    }

    // Format as screenplay text
    let screenplay = `========================================\n`;
    screenplay += `📽️ ${episode?.title || 'Untitled Episode'}\n`;
    screenplay += `النوع: ${episode?.genre || '-'}\n`;
    screenplay += `========================================\n\n`;
    screenplay += `📋 ملخص:\n${episode?.description || '-'}\n\n`;
    screenplay += `========================================\n\n`;

    scenes.forEach((scene) => {
      screenplay += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      screenplay += `🎬 مشهد ${scene.scene_number}: ${scene.title || 'بدون عنوان'}\n`;
      screenplay += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      if (scene.description) {
        screenplay += `📖 الوصف:\n${scene.description}\n\n`;
      }
      
      if (scene.narration) {
        screenplay += `🎙️ التعليق الصوتي:\n"${scene.narration}"\n\n`;
      }
      
      if (scene.dialogue) {
        screenplay += `💬 الحوار:\n"${scene.dialogue}"\n\n`;
      }
      
      screenplay += `⏱️ المدة: ${scene.duration_seconds || 8} ثانية\n\n`;
    });

    screenplay += `========================================\n`;
    screenplay += `✨ نهاية السيناريو\n`;
    screenplay += `========================================\n`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(screenplay);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/scenes/:sceneId - Update scene (script editing)
scenesRouter.patch('/:sceneId', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sceneId } = req.params;
    const { title, description, narration, dialogue, visual_prompt } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (narration !== undefined) updateData.narration = narration;
    if (dialogue !== undefined) updateData.dialogue = dialogue;
    if (visual_prompt !== undefined) updateData.visual_prompt = visual_prompt;

    const { data: scene, error } = await supabase
      .from('scenes')
      .update(updateData)
      .eq('id', sceneId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: scene,
      message: 'Scene updated successfully',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scenes/:sceneId/regenerate - Regenerate scene image/voice
scenesRouter.post('/:sceneId/regenerate', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sceneId } = req.params;
    const { type } = req.body; // 'image' or 'voice'

    const { data: scene, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('id', sceneId)
      .single();

    if (error || !scene) {
      throw new AppError(404, 'Scene not found');
    }

    // Import queue service dynamically
    const { queues, defaultJobOptions } = await import('../services/queue.service');

    let job;
    if (type === 'image') {
      job = await queues.image.add(
        'regenerate-image',
        {
          episode_id: scene.episode_id,
          scene_id: sceneId,
          scene_number: scene.scene_number,
          visual_prompt: scene.visual_prompt,
        },
        defaultJobOptions
      );
    } else if (type === 'voice') {
      const text = scene.narration || scene.dialogue;
      if (!text) {
        throw new AppError(400, 'Scene has no narration or dialogue');
      }
      job = await queues.voice.add(
        'regenerate-voice',
        {
          episode_id: scene.episode_id,
          scene_id: sceneId,
          text,
        },
        defaultJobOptions
      );
    } else {
      throw new AppError(400, 'Invalid regenerate type. Use "image" or "voice"');
    }

    res.json({
      success: true,
      message: `${type} regeneration queued`,
      job_id: job.id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/scenes/:sceneId/upload-image
// Body: { image_base64: string, mime_type: string }
scenesRouter.post('/:sceneId/upload-image', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { sceneId } = req.params;
    const { image_base64, mime_type = 'image/jpeg' } = req.body;

    if (!image_base64) {
      throw new AppError(400, 'image_base64 is required');
    }

    // Get scene to find episode_id
    const { data: scene, error: sceneErr } = await supabase
      .from('scenes')
      .select('episode_id, scene_number')
      .eq('id', sceneId)
      .single();

    if (sceneErr || !scene) throw new AppError(404, 'Scene not found');

    // Upload to Supabase Storage
    const buffer = Buffer.from(image_base64, 'base64');
    const ext = mime_type.split('/')[1] || 'jpg';
    const filePath = `episodes/${scene.episode_id}/scenes/scene_${scene.scene_number}_custom.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from(process.env.STORAGE_BUCKET || 'ai-animation-factory')
      .upload(filePath, buffer, { contentType: mime_type, upsert: true });

    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from(process.env.STORAGE_BUCKET || 'ai-animation-factory')
      .getPublicUrl(filePath);

    // Update scene image_url
    await supabase.from('scenes').update({ image_url: publicUrl }).eq('id', sceneId);

    return res.json({ success: true, image_url: publicUrl });
  } catch (err) {
    next(err);
  }
});

export default scenesRouter;
