/**
 * Diagnostic / test routes — no authentication required.
 * Used by setup-and-test.ps1 to verify infrastructure connectivity.
 * Expose NO sensitive data (keys, passwords, connection strings).
 */
import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { redis } from '../config/redis';
import { queues } from '../services/queue.service';
import { env } from '../config/env';

export const testRouter = Router();

// ── GET /api/test/supabase ─────────────────────────────────────────────────────
// Runs a lightweight query to verify the Supabase connection is live.
testRouter.get('/supabase', async (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    // A simple count query that works even on an empty database
    const { error } = await supabase
      .from('scheduler_config')
      .select('key', { count: 'exact', head: true });

    if (error) {
      // Table might not exist yet (schema not applied)
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return res.status(200).json({
          success: false,
          connected: true,          // reached Supabase
          schema_ready: false,
          message: 'Connected to Supabase but schema tables are missing. Run packages/database/schema.sql.',
          latency_ms: Date.now() - start,
        });
      }
      throw error;
    }

    return res.json({
      success: true,
      connected: true,
      schema_ready: true,
      message: 'Supabase connection OK — schema is in place.',
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(200).json({
      success: false,
      connected: false,
      schema_ready: false,
      message: `Supabase unreachable: ${msg}`,
      latency_ms: Date.now() - start,
    });
  }
});

// ── GET /api/test/redis ────────────────────────────────────────────────────────
// Sends PING to the Redis instance and measures round-trip latency.
testRouter.get('/redis', async (_req: Request, res: Response) => {
  const start = Date.now();
  try {
    await redis.connect().catch(() => {}); // no-op if already connected
    const pong = await redis.ping();
    return res.json({
      success: pong === 'PONG',
      message: pong === 'PONG' ? 'Redis connection OK' : `Unexpected response: ${pong}`,
      latency_ms: Date.now() - start,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(200).json({
      success: false,
      message: `Redis unreachable: ${msg}`,
      latency_ms: Date.now() - start,
    });
  }
});

// ── GET /api/test/env ──────────────────────────────────────────────────────────
// Reports which environment variable groups are configured.
// Never returns the actual values — only boolean presence flags.
testRouter.get('/env', (_req: Request, res: Response) => {
  const isSet = (v: string | undefined) =>
    !!v && v.length > 0 && !/(your-|sk-your|your_|placeholder|xxxx)/i.test(v);

  return res.json({
    success: true,
    keys: {
      supabase:    isSet(env.SUPABASE_URL) && isSet(env.SUPABASE_SERVICE_KEY),
      openai:      isSet(env.OPENAI_API_KEY),
      runway:      isSet(env.RUNWAY_API_KEY),
      elevenlabs:  isSet(env.ELEVENLABS_API_KEY),
      mubert:      isSet(env.MUBERT_API_KEY),
      storage:     isSet(env.SUPABASE_URL) && isSet(env.STORAGE_BUCKET),
      jwt:         isSet(env.JWT_SECRET),
    },
  });
});

// ── GET /api/test/queue-stats ──────────────────────────────────────────────────
// Returns queue depths and active worker counts across all 9 queues.
testRouter.get('/queue-stats', async (_req: Request, res: Response) => {
  try {
    const queueEntries = Object.entries(queues);
    const stats = await Promise.all(
      queueEntries.map(async ([name, queue]) => {
        const [counts, workers] = await Promise.all([
          queue.getJobCounts('active', 'waiting', 'completed', 'failed', 'delayed', 'paused'),
          queue.getWorkers(),
        ]);
        return {
          name,
          full_name: queue.name,
          worker_count: workers.length,
          ...counts,
        };
      })
    );

    const totalWorkers   = stats.reduce((s, q) => s + q.worker_count, 0);
    const totalActive    = stats.reduce((s, q) => s + q.active, 0);
    const totalWaiting   = stats.reduce((s, q) => s + q.waiting, 0);
    const totalCompleted = stats.reduce((s, q) => s + q.completed, 0);
    const totalFailed    = stats.reduce((s, q) => s + q.failed, 0);

    return res.json({
      success: true,
      summary: {
        total_queues:    stats.length,
        total_workers:   totalWorkers,
        total_active:    totalActive,
        total_waiting:   totalWaiting,
        total_completed: totalCompleted,
        total_failed:    totalFailed,
      },
      queues: stats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(200).json({
      success: false,
      message: `Queue stats error: ${msg}`,
      summary: null,
      queues: [],
    });
  }
});

// ── GET /api/test/full ─────────────────────────────────────────────────────────
// Single endpoint that aggregates all diagnostics in one shot.
testRouter.get('/full', async (req: Request, res: Response) => {
  // Fire all sub-requests internally
  const [supResp, redisResp, envResp, queueResp] = await Promise.allSettled([
    fetch(`http://localhost:${env.API_PORT}/api/test/supabase`).then((r) => r.json()),
    fetch(`http://localhost:${env.API_PORT}/api/test/redis`).then((r) => r.json()),
    fetch(`http://localhost:${env.API_PORT}/api/test/env`).then((r) => r.json()),
    fetch(`http://localhost:${env.API_PORT}/api/test/queue-stats`).then((r) => r.json()),
  ]);

  const get = (r: PromiseSettledResult<unknown>) =>
    r.status === 'fulfilled' ? r.value : { success: false, message: 'Request failed' };

  return res.json({
    success: true,
    timestamp: new Date().toISOString(),
    supabase:    get(supResp),
    redis:       get(redisResp),
    env:         get(envResp),
    queue_stats: get(queueResp),
  });
});
