import { Router } from 'express';
import { queueService } from '../services/queue.service';
import { logger } from '../utils/logger';

// إنشاء الـ Router
export const generationRouter = Router();

// مسار فحص الحالة
generationRouter.get('/stats', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    res.json(stats);
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to get queue stats');
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// مسار إرسال طلب جديد
generationRouter.post('/dispatch', async (req, res) => {
  try {
    const { genre, target_audience, theme, scene_count } = req.body;
    const jobId = await queueService.dispatchEpisodeGeneration({
      genre,
      target_audience,
      theme,
      scene_count
    });
    res.json({ success: true, job_id: jobId });
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Failed to dispatch generation');
    res.status(500).json({ error: 'Failed to dispatch job' });
  }
});

// مسار الوظائف النشطة
generationRouter.get('/active', async (req, res) => {
  try {
    const activeJobs = await queueService.getActiveJobs();
    res.json(activeJobs);
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch active jobs' });
  }
});

// تصدير افتراضي لضمان التوافق
export default generationRouter;