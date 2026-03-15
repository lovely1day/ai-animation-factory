import { createIdeaWorker } from './idea-worker';
import { createScriptWorker } from './script-worker';
import { createImageWorker } from './image-worker';
import { createAnimationWorker } from './animation-worker';
import { createVoiceWorker } from './voice-worker';
import { createMusicWorker } from './music-worker';
import { createAssemblyWorker } from './assembly-worker';
import { createSubtitleWorker } from './subtitle-worker';
import { createThumbnailWorker } from './thumbnail-worker';
import { logger } from '../utils/logger';
import { emitJobProgress, emitEpisodeUpdate, emitError } from '../config/websocket';

function setupWorkerListeners(worker: ReturnType<typeof createIdeaWorker>, name: string) {
  worker.on('completed', (job) => {
    logger.info({ job_id: job.id }, `${name} job completed`);
    
    // Emit WebSocket event
    if (job.data.episode_id) {
      emitJobProgress(job.data.episode_id, name, 100, {
        status: 'completed',
        jobId: job.id,
        output: job.returnvalue,
      });
      
      emitEpisodeUpdate(job.data.episode_id, {
        type: 'job_completed',
        jobType: name,
        status: 'completed',
      });
    }
  });

  worker.on('failed', (job, err) => {
    logger.error({ 
      job_id: job?.id,
      error: err.message,
      stack: err.stack 
    }, `${name} job failed`);
    
    // Emit error via WebSocket
    if (job?.data?.episode_id) {
      emitError(job.data.episode_id, `${name} job failed`, {
        jobType: name,
        error: err.message,
        jobId: job.id,
      });
    }
  });

  worker.on('progress', (job, progress) => {
    const progressValue = typeof progress === 'number' ? progress : 0;
    logger.debug({ job_id: job.id, progress: progressValue }, `${name} job progress`);
    
    // Emit progress via WebSocket
    if (job.data.episode_id) {
      emitJobProgress(job.data.episode_id, name, progressValue, {
        jobId: job.id,
        sceneId: job.data.scene_id,
      });
    }
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, `${name} worker error`);
  });

  return worker;
}

export function startAllWorkers() {
  logger.info('Starting all workers...');

  const workers = [
    setupWorkerListeners(createIdeaWorker(), 'idea'),
    setupWorkerListeners(createScriptWorker(), 'script'),
    setupWorkerListeners(createImageWorker(), 'image'),
    setupWorkerListeners(createAnimationWorker(), 'animation'),
    setupWorkerListeners(createVoiceWorker(), 'voice'),
    setupWorkerListeners(createMusicWorker(), 'music'),
    setupWorkerListeners(createAssemblyWorker(), 'assembly'),
    setupWorkerListeners(createSubtitleWorker(), 'subtitle'),
    setupWorkerListeners(createThumbnailWorker(), 'thumbnail'),
  ];

  logger.info(`${workers.length} workers started with WebSocket support`);

  // Graceful shutdown
  async function gracefulShutdown() {
    logger.info('Shutting down workers...');
    await Promise.all(workers.map((w) => w.close()));
    logger.info('All workers shut down');
    process.exit(0);
  }

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return workers;
}

// Start workers if run directly
if (require.main === module) {
  startAllWorkers();
}
