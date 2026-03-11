import { scheduler } from './scheduler/scheduler';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './utils/logger';
import { apiRateLimit } from './middleware/rate-limit';
import { errorHandler, notFound } from './middleware/error-handler';
import { episodesRouter } from './routes/episodes.routes';
import { generationRouter } from './routes/generation.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { authRouter } from './routes/auth.routes';
import { testRouter } from './routes/test.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiRateLimit);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Diagnostic routes (no auth required — for setup-and-test.ps1)
app.use('/api/test', testRouter);

// Application routes
app.use('/api/auth', authRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/generation', generationRouter);
app.use('/api/analytics', analyticsRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    app.listen(env.API_PORT, () => {
      logger.info(`API server running on port ${env.API_PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });
  } catch (err) {
    logger.error('Failed to start server', { error: err });
    process.exit(1);
  }
}

start();

export { app };

