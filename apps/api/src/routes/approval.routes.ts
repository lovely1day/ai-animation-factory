import { Router, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { queues, defaultJobOptions } from '../services/queue.service';
import { logger } from '../utils/logger';
import { emitEpisodeUpdate } from '../config/websocket';
import { AuthRequest } from '../middleware/auth';

export const approvalRouter = Router();

// POST /api/episodes/:id/approve-script
// Body: { title, description, theme, tags }
approvalRouter.post('/:id/approve-script', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, theme, tags } = req.body;

    // Check episode exists and is awaiting approval
    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    if (episode.status !== 'awaiting_script_approval') {
      return res.status(400).json({ success: false, error: `Episode is not awaiting script approval (status: ${episode.status})` });
    }

    // Update episode with any edits
    await supabase
      .from('episodes')
      .update({ title, description, theme, tags, status: 'processing' })
      .eq('id', id);

    // Get the idea from generation_jobs
    const { data: ideaJob } = await supabase
      .from('generation_jobs')
      .select('output_data')
      .eq('episode_id', id)
      .eq('job_type', 'idea_generation')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const idea = {
      ...(ideaJob?.output_data || {}),
      title,
      description,
      theme,
      tags,
    };

    // Dispatch script writing job
    const scriptJob = await queues.script.add(
      'write-script',
      { episode_id: id, idea, scene_count: 8 },
      { ...defaultJobOptions, priority: 1 }
    );

    emitEpisodeUpdate(id, { type: 'script_approved', next_job: 'script_writing' });

    logger.info({ episode_id: id, script_job_id: scriptJob.id }, 'Script approved — dispatching script job');

    return res.json({ success: true, message: 'Script approved', script_job_id: scriptJob.id });
  } catch (err) {
    next(err);
  }
});

// POST /api/episodes/:id/approve-images
// Body: { scenes: [{ id, visual_prompt }] }
approvalRouter.post('/:id/approve-images', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { scenes: editedScenes } = req.body as { scenes: { id: string; visual_prompt: string }[] };

    const { data: episode, error: fetchError } = await supabase
      .from('episodes')
      .select('*, scenes(*)')
      .eq('id', id)
      .single();

    if (fetchError || !episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    if (episode.status !== 'awaiting_image_approval') {
      return res.status(400).json({ success: false, error: `Episode is not awaiting image approval (status: ${episode.status})` });
    }

    // Update visual_prompts if edited
    if (editedScenes && editedScenes.length > 0) {
      await Promise.all(
        editedScenes.map(({ id: sceneId, visual_prompt }) =>
          supabase.from('scenes').update({ visual_prompt }).eq('id', sceneId)
        )
      );
    }

    // Set episode processing
    await supabase.from('episodes').update({ status: 'processing' }).eq('id', id);

    // Get idea for genre/target_audience
    const { data: ideaJob } = await supabase
      .from('generation_jobs')
      .select('output_data')
      .eq('episode_id', id)
      .eq('job_type', 'idea_generation')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const idea = ideaJob?.output_data || {};

    // Get all scenes
    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', id)
      .order('scene_number', { ascending: true });

    if (!scenes || scenes.length === 0) {
      return res.status(400).json({ success: false, error: 'No scenes found for episode' });
    }

    // Dispatch image generation jobs
    const imageJobs = scenes.map((scene) =>
      queues.image.add(
        'generate-image',
        {
          episode_id: id,
          scene_id: scene.id,
          scene_number: scene.scene_number,
          visual_prompt: scene.visual_prompt,
          genre: idea.genre || episode.genre,
          target_audience: idea.target_audience || episode.target_audience,
        },
        { ...defaultJobOptions, priority: 3 }
      )
    );
    await Promise.all(imageJobs);

    // Dispatch thumbnail, music
    await queues.thumbnail.add(
      'generate-thumbnail',
      { episode_id: id, title: episode.title, genre: episode.genre },
      { ...defaultJobOptions, priority: 3 }
    );

    await queues.music.add(
      'generate-music',
      {
        episode_id: id,
        genre: episode.genre,
        mood: episode.theme || 'background',
        duration: (scenes.length * 8) + 10,
      },
      { ...defaultJobOptions, priority: 3 }
    );

    emitEpisodeUpdate(id, { type: 'images_approved', sceneCount: scenes.length });

    logger.info({ episode_id: id, scenes: scenes.length }, 'Images approved — dispatching image jobs');

    return res.json({ success: true, message: 'Image prompts approved', scene_count: scenes.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/episodes/:id/review — get full review data
approvalRouter.get('/:id/review', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: episode, error } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !episode) return res.status(404).json({ success: false, error: 'Not found' });

    const { data: scenes } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', id)
      .order('scene_number', { ascending: true });

    const { data: jobs } = await supabase
      .from('generation_jobs')
      .select('job_type, output_data, created_at')
      .eq('episode_id', id)
      .order('created_at', { ascending: false });

    return res.json({ success: true, data: { episode, scenes: scenes || [], jobs: jobs || [] } });
  } catch (err) {
    next(err);
  }
});
