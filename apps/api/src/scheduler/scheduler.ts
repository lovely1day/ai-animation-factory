import cron from "node-cron";
import { supabase } from "../config/supabase";
import { PipelineService } from "../services/pipeline.service";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import { JOB_QUEUE_NAMES } from "@ai-animation-factory/shared";
import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

let tasks: cron.ScheduledTask[] = [];

// Queue instances for recovery
const recoveryQueues: Record<string, Queue> = {};

function getQueue(name: string): Queue {
  if (!recoveryQueues[name]) {
    recoveryQueues[name] = new Queue(name, { connection: redisConnection });
  }
  return recoveryQueues[name];
}

/**
 * Auto-generate new episodes on a schedule.
 * Picks episodes in 'draft' status and runs the pipeline on them.
 */
async function runAutoGeneration() {
  try {
    const limit = Math.min(env.EPISODES_PER_HOUR, 10);

    const { data: episodes, error } = await supabase
      .from("episodes")
      .select("id, title, description, genre, target_audience, approval_steps")
      .eq("status", "draft")
      .is("workflow_step", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      logger.error({ error: error.message }, "Scheduler: failed to fetch draft episodes");
      return;
    }

    if (!episodes || episodes.length === 0) {
      logger.debug("Scheduler: no draft episodes to process");
      return;
    }

    logger.info({ count: episodes.length }, "Scheduler: starting auto-generation");

    for (const episode of episodes) {
      try {
        await PipelineService.run(episode);
        logger.info({ episode_id: episode.id, title: episode.title }, "Scheduler: pipeline started");
      } catch (err: any) {
        logger.error({ error: err.message, episode_id: episode.id }, "Scheduler: pipeline start failed");
      }
    }
  } catch (err: any) {
    logger.error({ error: err.message }, "Scheduler: auto-generation error");
  }
}


/**
 * Daily cleanup: archive episodes that are stuck for > 24 hours.
 */
async function dailyCleanup() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from("episodes")
      .update({
        status: "archived",
        workflow_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "generating")
      .lt("updated_at", oneDayAgo);

    if (error) {
      logger.error({ error: error.message }, "Scheduler: cleanup failed");
    } else {
      logger.info("Scheduler: daily cleanup complete");
    }
  } catch (err: any) {
    logger.error({ error: err.message }, "Scheduler: cleanup error");
  }
}

/**
 * Map workflow_step (DB enum) → BullMQ queue name.
 * Only steps that exist in the schema CHECK constraint are listed.
 */
const STEP_QUEUE_MAP: Record<string, string> = {
  script:    JOB_QUEUE_NAMES.SCRIPT,
  images:    JOB_QUEUE_NAMES.IMAGE,
  voice:     JOB_QUEUE_NAMES.VOICE,
  music:     JOB_QUEUE_NAMES.MUSIC,
  animation: JOB_QUEUE_NAMES.ANIMATION,
  assembly:  JOB_QUEUE_NAMES.ASSEMBLY,
  subtitles: JOB_QUEUE_NAMES.SUBTITLE,
};

/**
 * Recover episodes stuck in processing states after server restart.
 * On startup, scan Supabase for episodes stuck in processing states and re-enqueue them.
 * 
 * @returns Number of episodes successfully recovered
 */
async function recoverStuckJobs(): Promise<number> {
  const STUCK_THRESHOLD_MINUTES = 30;
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();

  // Find episodes stuck in processing workflow_status (older than threshold)
  const { data: stuckEpisodes, error } = await supabase
    .from("episodes")
    .select("id, status, workflow_step, workflow_status, title")
    .eq("status", "generating")
    .eq("workflow_status", "processing")
    .lt("updated_at", cutoff);

  if (error) {
    logger.error({ error: error.message }, "Scheduler: recoverStuckJobs query failed");
    return 0;
  }

  if (!stuckEpisodes?.length) {
    logger.info("Scheduler: no stuck episodes to recover");
    return 0;
  }

  logger.warn({ count: stuckEpisodes.length }, "Scheduler: recovering stuck episodes");

  let recoveredCount = 0;

  for (const episode of stuckEpisodes) {
    const step = episode.workflow_step;
    const mapping = STEP_QUEUE_MAP[step];

    if (!mapping) {
      logger.warn({ episode_id: episode.id, step }, "Scheduler: unknown workflow step, skipping recovery");
      continue;
    }

    try {
      // Reset workflow_status to allow reprocessing (preserves all progress data)
      await supabase
        .from("episodes")
        .update({
          workflow_status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", episode.id);

      // Re-enqueue to the specific step's queue (not full restart)
      const queue = getQueue(mapping);
      await queue.add(
        `recover-${step}`,
        { episode_id: episode.id, recovered: true, original_step: step },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        }
      );

      recoveredCount++;
      logger.info(
        { episode_id: episode.id, step, queue: mapping },
        "Scheduler: recovered stuck episode"
      );
    } catch (err: any) {
      logger.error(
        { error: err.message, episode_id: episode.id },
        "Scheduler: failed to recover episode"
      );
    }
  }

  return recoveredCount;
}

/**
 * Initialize scheduler and recover any stuck jobs from previous crashes.
 */
async function initScheduler() {
  logger.info("Scheduler: initializing");

  // Recover stuck jobs from previous crashes (run once on startup)
  const recoveredCount = await recoverStuckJobs();
  if (recoveredCount > 0) {
    logger.info({ recoveredCount }, "Scheduler: recovered stuck episodes");
  }

  return recoveredCount;
}

export const scheduler = {
  async start() {
    logger.info("Scheduler: starting cron jobs");

    // Initialize and recover stuck jobs
    await initScheduler();

    // Auto-generation: every hour
    tasks.push(
      cron.schedule("0 * * * *", runAutoGeneration, { name: "auto-generation" })
    );

    // Recover stuck jobs: every 30 minutes (smarter than full restart)
    tasks.push(
      cron.schedule("*/30 * * * *", recoverStuckJobs, { name: "recover-stuck" })
    );

    // Daily cleanup: every day at 03:00 AM
    tasks.push(
      cron.schedule("0 3 * * *", dailyCleanup, { name: "daily-cleanup" })
    );

    logger.info({ jobs: tasks.length }, "Scheduler: all cron jobs registered");
  },

  stop() {
    logger.info("Scheduler: stopping cron jobs");
    for (const task of tasks) {
      task.stop();
    }
    tasks = [];
    logger.info("Scheduler: all cron jobs stopped");
  },
};
