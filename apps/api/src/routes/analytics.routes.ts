import { Router } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { safeErrorMessage } from '../middleware/error-handler';

const router: Router = Router();

/**
 * Get analytics summary
 * GET /api/analytics/summary
 */
router.get('/summary', async (_req, res) => {
  try {
    // Get total episodes
    const { count: totalEpisodes, error: episodesError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true });

    if (episodesError) {
      logger.error({ error: episodesError.message }, 'Analytics: failed to get total episodes');
    }

    // Get published episodes
    const { count: publishedEpisodes, error: publishedError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (publishedError) {
      logger.error({ error: publishedError.message }, 'Analytics: failed to get published episodes');
    }

    // Get generating episodes
    const { count: generatingEpisodes, error: generatingError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .in('status', ['generating', 'processing']);

    if (generatingError) {
      logger.error({ error: generatingError.message }, 'Analytics: failed to get generating episodes');
    }

    // Get total views and likes
    const { data: stats, error: statsError } = await supabase
      .from('episodes')
      .select('view_count, like_count');

    if (statsError) {
      logger.error({ error: statsError.message }, 'Analytics: failed to get stats');
    }

    const totalViews = stats?.reduce((sum, ep) => sum + (ep.view_count || 0), 0) || 0;
    const totalLikes = stats?.reduce((sum, ep) => sum + (ep.like_count || 0), 0) || 0;

    // Get top episodes by views
    const { data: topEpisodes, error: topError } = await supabase
      .from('episodes')
      .select('id, title, view_count')
      .order('view_count', { ascending: false })
      .limit(5);

    if (topError) {
      logger.error({ error: topError.message }, 'Analytics: failed to get top episodes');
    }

    res.json({
      success: true,
      data: {
        total_episodes: totalEpisodes || 0,
        total_views: totalViews,
        total_likes: totalLikes,
        published_episodes: publishedEpisodes || 0,
        generating_episodes: generatingEpisodes || 0,
        top_episodes: topEpisodes || [],
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Analytics: summary error');
    res.json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed'),
      data: {
        total_episodes: 0,
        total_views: 0,
        total_likes: 0,
        published_episodes: 0,
        generating_episodes: 0,
        top_episodes: [],
      },
    });
  }
});

/**
 * Get views by day
 * GET /api/analytics/views-by-day?days=30
 */
router.get('/views-by-day', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get analytics events
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('created_at')
      .eq('event_type', 'view')
      .gte('created_at', startDate.toISOString());

    if (error) {
      logger.error({ error: error.message }, 'Analytics: views-by-day error');
    }

    // Group by day
    const viewsByDay: Record<string, number> = {};
    
    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      viewsByDay[dateStr] = 0;
    }

    // Count events
    (events || []).forEach((event: any) => {
      const dateStr = event.created_at.split('T')[0];
      if (viewsByDay[dateStr] !== undefined) {
        viewsByDay[dateStr]++;
      }
    });

    // Convert to array format
    const result = Object.entries(viewsByDay)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Analytics: views-by-day error');
    res.json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed'),
      data: [],
    });
  }
});

/**
 * Get views by genre
 * GET /api/analytics/views-by-genre
 */
router.get('/views-by-genre', async (_req, res) => {
  try {
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('genre, view_count');

    if (error) {
      logger.error({ error: error.message }, 'Analytics: views-by-genre error');
    }

    // Group by genre
    const viewsByGenre: Record<string, number> = {};
    
    (episodes || []).forEach((ep: any) => {
      const genre = ep.genre || 'unknown';
      viewsByGenre[genre] = (viewsByGenre[genre] || 0) + (ep.view_count || 0);
    });

    res.json({
      success: true,
      data: viewsByGenre,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Analytics: views-by-genre error');
    res.json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed'),
      data: {},
    });
  }
});

/**
 * Track analytics event
 * POST /api/analytics/track
 */
router.post('/track', async (req, res) => {
  try {
    const { episode_id, event_type, metadata = {} } = req.body;

    const { data, error } = await supabase
      .from('analytics_events')
      .insert({
        episode_id,
        event_type,
        metadata,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
      })
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message }, 'Analytics: track error');
      return res.json({
        success: false,
        error: safeErrorMessage(error, 'Operation failed'),
      });
    }

    // Update episode view/like count
    if (event_type === 'view') {
      const { error: rpcErr } = await supabase.rpc('increment_episode_views', { episode_id });
      if (rpcErr) logger.error({ error: rpcErr.message }, 'Analytics: failed to increment views');
    } else if (event_type === 'like') {
      const { error: rpcErr } = await supabase.rpc('increment_episode_likes', { episode_id });
      if (rpcErr) logger.error({ error: rpcErr.message }, 'Analytics: failed to increment likes');
    }

    res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Analytics: track error');
    res.json({
      success: false,
      error: safeErrorMessage(error, 'Operation failed'),
    });
  }
});

export default router;
