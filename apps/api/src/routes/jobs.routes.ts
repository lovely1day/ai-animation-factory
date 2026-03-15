import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { queues } from '../services/queue.service';

export const jobsRouter = Router();

// GET /api/jobs/:episodeId/status - Get job status with scenes
jobsRouter.get('/:episodeId/status', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { episodeId } = req.params;

    // Get episode
    const { data: episode, error: epError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single();

    if (epError) throw epError;

    // Get scenes
    const { data: scenes, error: scError } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', episodeId)
      .order('scene_number');

    if (scError) throw scError;

    // Get recent jobs
    const { data: jobs, error: jobError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('episode_id', episodeId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (jobError) throw jobError;

    // Calculate progress
    const totalScenes = scenes?.length || 0;
    const completedScenes = scenes?.filter(s => s.status === 'completed').length || 0;
    // Scene progress calculated but not used - reserved for future use
    void (totalScenes > 0 ? Math.round((completedScenes / totalScenes) * 100) : 0);

    // Determine current stage
    let stage = 'pending';
    let progress = 0;

    if (jobs?.some(j => j.job_type === 'idea_generation' && j.status === 'active')) {
      stage = 'generating_idea';
      progress = 10;
    } else if (jobs?.some(j => j.job_type === 'script_writing' && j.status === 'active')) {
      stage = 'writing_script';
      progress = 20;
    } else if (jobs?.some(j => j.job_type === 'image_generation' && j.status === 'active')) {
      stage = 'generating_images';
      progress = 30 + Math.round((completedScenes / totalScenes) * 40);
    } else if (jobs?.some(j => j.job_type === 'voice_generation' && j.status === 'active')) {
      stage = 'generating_voices';
      progress = 70 + Math.round((completedScenes / totalScenes) * 15);
    } else if (jobs?.some(j => j.job_type === 'video_assembly' && j.status === 'active')) {
      stage = 'assembling_video';
      progress = 90;
    } else if (episode?.status === 'completed') {
      stage = 'completed';
      progress = 100;
    }

    res.json({
      success: true,
      data: {
        episode,
        stage,
        progress,
        scenes: scenes || [],
        jobs: jobs || [],
        totalScenes,
        completedScenes,
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:episodeId/scenes - Get scenes only
jobsRouter.get('/:episodeId/scenes', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { episodeId } = req.params;

    const { data: scenes, error } = await supabase
      .from('scenes')
      .select('*')
      .eq('episode_id', episodeId)
      .order('scene_number');

    if (error) throw error;

    res.json({
      success: true,
      data: scenes || []
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/queue-stats - Get queue statistics
jobsRouter.get('/queue-stats', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const queueNames = ['idea', 'script', 'image', 'animation', 'voice', 'music', 'assembly', 'subtitle', 'thumbnail'];
    const stats = [];

    for (const name of queueNames) {
      try {
        const queue = (queues as any)[name];
        if (queue) {
          const counts = await queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed');
          stats.push({ name, ...counts });
        }
      } catch (_e) {
        stats.push({ name, error: 'Queue not available' });
      }
    }

    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default jobsRouter;
