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

function setupWorkerListeners(worker: ReturnType<typeof createIdeaWorker>, name: string) {
  worker.on('completed', (job) => {
    logger.info(`${name} job completed`, { job_id: job.id });
  });

  worker.on('failed', (job, err) => {
    logger.error(`${name} job failed`, {
      job_id: job?.id,
      error: err.message,
      stack: err.stack,
    });
  });

  worker.on('progress', (job, progress) => {
    logger.debug(`${name} job progress`, { job_id: job.id, progress });
  });

  worker.on('error', (err) => {
    logger.error(`${name} worker error`, { error: err.message });
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

  logger.info(`${workers.length} workers started`);

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
