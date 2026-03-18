import { Router, type Router as RouterType } from 'express';
import { Queue } from 'bullmq';
import { redisConnection, checkRedisHealth } from '../config/redis';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';

const router: RouterType = Router();

const MEDIAVORICE_URL = env.MEDIAVORICE_URL || 'http://localhost:8000';
const COMFYUI_URL = env.COMFYUI_URL || 'http://localhost:8188';
const OLLAMA_URL = env.OLLAMA_URL || 'http://localhost:11434';

const QUEUE_NAMES = [
  JOB_QUEUE_NAMES.SCRIPT,
  JOB_QUEUE_NAMES.IMAGE,
  JOB_QUEUE_NAMES.VOICE,
  JOB_QUEUE_NAMES.MUSIC,
  JOB_QUEUE_NAMES.ANIMATION,
  JOB_QUEUE_NAMES.ASSEMBLY,
  JOB_QUEUE_NAMES.SUBTITLE,
] as const;

interface HealthStatus {
  status: 'ok' | 'degraded';
  uptime_seconds: number;
  timestamp: string;
  services: {
    redis: { connected: boolean };
    supabase: { connected: boolean };
    mediavorice: { connected: boolean };
    comfyui: { connected: boolean };
    ollama: { connected: boolean };
  };
  queues: Record<string, { waiting: number }>;
}

async function checkService(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkMediaVoice(): Promise<boolean> {
  try {
    const response = await fetch(`${MEDIAVORICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkComfyUI(): Promise<boolean> {
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkOllama(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/version`, {
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkSupabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('episodes')
      .select('id', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

async function getQueueDepths(): Promise<Record<string, { waiting: number }>> {
  const depths: Record<string, { waiting: number }> = {};

  for (const queueName of QUEUE_NAMES) {
    try {
      const queue = new Queue(queueName, { connection: redisConnection });
      const waiting = await queue.getWaitingCount();
      depths[queueName] = { waiting };
      await queue.close();
    } catch {
      depths[queueName] = { waiting: -1 };
    }
  }

  return depths;
}

// Simple ping — used by Dockerfile HEALTHCHECK and Railway
router.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime_seconds: Math.floor(process.uptime()) });
});

router.get('/detailed', async (_req, res) => {
  try {
    const [
      redisConnected,
      supabaseConnected,
      mediavoriceConnected,
      comfyuiConnected,
      ollamaConnected,
      queueDepths,
    ] = await Promise.all([
      checkRedisHealth(),
      checkSupabase(),
      checkMediaVoice(),
      checkComfyUI(),
      checkOllama(),
      getQueueDepths(),
    ]);

    const allConnected =
      redisConnected &&
      supabaseConnected &&
      mediavoriceConnected &&
      comfyuiConnected &&
      ollamaConnected;

    const health: HealthStatus = {
      status: allConnected ? 'ok' : 'degraded',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        redis: { connected: redisConnected },
        supabase: { connected: supabaseConnected },
        mediavorice: { connected: mediavoriceConnected },
        comfyui: { connected: comfyuiConnected },
        ollama: { connected: ollamaConnected },
      },
      queues: queueDepths,
    };

    res.json(health);
  } catch (error) {
    logger.error({ error }, 'Health check failed');

    res.json({
      status: 'degraded',
      uptime_seconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        redis: { connected: false },
        supabase: { connected: false },
        mediavorice: { connected: false },
        comfyui: { connected: false },
        ollama: { connected: false },
      },
      queues: {},
    });
  }
});

export default router;
