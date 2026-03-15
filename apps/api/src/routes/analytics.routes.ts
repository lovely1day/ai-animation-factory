import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

// GET /api/analytics/summary
analyticsRouter.get('/summary', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [episodeStats, viewStats, topEpisodes] = await Promise.all([
      supabase.from('episodes').select('status', { count: 'exact' }),
      supabase
        .from('analytics')
        .select('event_type, episode_id')
        .in('event_type', ['view', 'like']),
      supabase
        .from('episodes')
        .select('id, title, view_count')
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(10),
    ]);

    const statusCounts = (episodeStats.data || []).reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalViews = (viewStats.data || []).filter((r) => r.event_type === 'view').length;
    const totalLikes = (viewStats.data || []).filter((r) => r.event_type === 'like').length;

    res.json({
      success: true,
      data: {
        total_episodes: episodeStats.count || 0,
        total_views: totalViews,
        total_likes: totalLikes,
        published_episodes: statusCounts['published'] || 0,
        generating_episodes: statusCounts['generating'] || 0,
        completed_episodes: statusCounts['completed'] || 0,
        failed_episodes: statusCounts['failed'] || 0,
        top_episodes: topEpisodes.data || [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/views-by-day
analyticsRouter.get('/views-by-day', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(String(req.query.days || 30), 10);
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analytics')
      .select('created_at')
      .eq('event_type', 'view')
      .gte('created_at', fromDate);

    if (error) throw error;

    const byDay = (data || []).reduce((acc, row) => {
      const day = row.created_at.split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = Object.entries(byDay)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/views-by-genre
analyticsRouter.get('/views-by-genre', async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase
      .from('analytics')
      .select('episodes(genre)')
      .eq('event_type', 'view');

    if (error) throw error;

    const byGenre = (data || []).reduce((acc, row) => {
      const episodes = row.episodes as { genre: string } | { genre: string }[] | null;
      const genre = Array.isArray(episodes) 
        ? episodes[0]?.genre 
        : episodes?.genre || 'unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({ success: true, data: byGenre });
  } catch (err) {
    next(err);
  }
});

// POST /api/analytics/track
analyticsRouter.post('/track', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { episode_id, event_type, watch_duration_seconds } = req.body;

    await supabase.from('analytics').insert({
      episode_id,
      event_type,
      user_id: req.user?.id,
      session_id: req.headers['x-session-id'] as string,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      watch_duration_seconds,
    });

    // Update like/view counts on episodes
    if (event_type === 'like') {
      await supabase.rpc('increment', { x: 1, row_id: episode_id, field_name: 'like_count' });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
