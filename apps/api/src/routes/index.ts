// ============================================================
// SECURITY: All routes (except /health and /auth) MUST have:
//   1. authenticate middleware (JWT verification)
//   2. Rate limiting (apiRateLimit or generationRateLimit)
// DO NOT add unprotected routes. See JL-PROJECT-STANDARDS.md
// ============================================================

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
import ideaRoutes from './idea.routes';
import imagePromptsRoutes from './image-prompts.routes';
import charactersRoutes from './characters.routes';
import mockRoutes from './mock.routes';
import { authenticate } from '../middleware/auth';
import { apiRateLimit, authRateLimit, generationRateLimit } from '../middleware/rate-limit';

const router: express.Router = express.Router();

let isMockMode = process.env.MOCK_MODE === 'true';
if (isMockMode && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: MOCK_MODE is enabled in production — disabling it for safety');
  isMockMode = false;
}

if (isMockMode) {
  console.log('MOCK MODE ENABLED: Using in-memory data store');
}

// Health check — public, no auth needed
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Animation Factory API',
    version: '2.0.0',
    mockMode: isMockMode,
  });
});

// Auth routes — rate-limited but no auth required
router.use('/auth', authRateLimit, authRouter);

if (isMockMode) {
  router.use(mockRoutes);
} else {
  // All protected routes — require authentication + rate limiting
  router.use('/workflow', apiRateLimit, authenticate, workflowRoutes);
  router.use('/universe', apiRateLimit, authenticate, universeRoutes);
  router.use('/projects', apiRateLimit, authenticate, projectsRoutes);
  router.use('/episodes', apiRateLimit, authenticate, episodesRoutes);
  router.use('/scenes', apiRateLimit, authenticate, scenesRouter);
  router.use('/approval', apiRateLimit, authenticate, approvalRoutes);
  router.use('/generation', generationRateLimit, authenticate, generationRoutes);
  router.use('/jobs', apiRateLimit, authenticate, jobsRoutes);
  router.use('/analytics', apiRateLimit, authenticate, analyticsRoutes);
  router.use('/idea', generationRateLimit, authenticate, ideaRoutes);
  router.use('/image-prompts', apiRateLimit, authenticate, imagePromptsRoutes);
  router.use('/characters', apiRateLimit, authenticate, charactersRoutes);
}

export default router;
