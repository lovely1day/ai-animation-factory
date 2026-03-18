import express from 'express';

import authRouter from './auth.routes';
import workflowRoutes from './workflow.routes';
import universeRoutes from './universe.routes';
import projectsRoutes from './projects.routes';
import episodesRoutes from './episodes.routes';
import scenesRouter from './scenes.routes';
import approvalRoutes from './approval.routes';
import generationRoutes from './generation.routes';
import jobsRoutes from './jobs.routes';
import analyticsRoutes from './analytics.routes';
import ollamaRoutes from './ollama.routes';
import imagePromptsRoutes from './image-prompts.routes';
import charactersRoutes from './characters.routes';
import mockRoutes from './mock.routes';

const router: express.Router = express.Router();

const isMockMode = process.env.MOCK_MODE === 'true';

if (isMockMode) {
  console.log('🎭 MOCK MODE ENABLED: Using in-memory data store');
}

// Health check
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Animation Factory API',
    version: '2.0.0',
    mockMode: isMockMode,
  });
});

// Auth routes (always available, even in mock mode)
router.use('/auth', authRouter);

if (isMockMode) {
  router.use(mockRoutes);
} else {
  router.use('/workflow', workflowRoutes);
  router.use('/universe', universeRoutes);
  router.use('/projects', projectsRoutes);
  router.use('/episodes', episodesRoutes);
  router.use('/scenes', scenesRouter);
  router.use('/approval', approvalRoutes);
  router.use('/generation', generationRoutes);
  router.use('/jobs', jobsRoutes);
  router.use('/analytics', analyticsRoutes);
  router.use('/ollama', ollamaRoutes);
  router.use('/image-prompts', imagePromptsRoutes);
  router.use('/characters', charactersRoutes);
}

export default router;
