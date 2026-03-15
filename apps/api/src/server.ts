import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { env } from './config/env';
import { logger } from './utils/logger';
import { apiRateLimit } from './middleware/rate-limit';
import { errorHandler, notFound } from './middleware/error-handler';
import { episodesRouter } from './routes/episodes.routes';
import { approvalRouter } from './routes/approval.routes';
import { generationRouter } from './routes/generation.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { authRouter } from './routes/auth.routes';
import { scenesRouter } from './routes/scenes.routes';
import { testRouter } from './routes/test.routes';
import { jobsRouter } from './routes/jobs.routes';
import { scheduler } from './scheduler/scheduler';
import { initWebSocket } from './config/websocket';
import { supabase } from './config/supabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3003', 'http://127.0.0.1:3000', 'http://127.0.0.1:3003', 'null', 'file://'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Local uploads (dev mode — when R2 is not configured)
app.use('/uploads', express.static(path.join(__dirname, '..', '..', '..', 'uploads')));

// Rate limiting
app.use('/api', apiRateLimit);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Root route - API info
app.get('/', (_req, res) => {
  res.json({
    name: 'AI Animation Factory API',
    version: '1.0.0',
    status: 'running',
    websocket: 'ws://localhost:3004',
    endpoints: {
      health: '/health',
      test: '/api/test/full',
      generation: '/api/generation',
      episodes: '/api/episodes'
    }
  });
});

// Diagnostic routes (no auth required)
app.use('/api/test', testRouter);

// Test simple route
app.post('/api/test-simple-upload', (req, res) => {
  res.json({ success: true, message: 'simple upload works' });
});

// Upload image route - REAL UPLOAD TO SUPABASE
app.post('/api/scene-upload', (req, res, next) => {
  const { scene_id, image_base64, mime_type = 'image/jpeg' } = req.body;
  console.log('>>> Uploading image for scene:', scene_id?.substring(0, 10));
  
  if (!scene_id || !image_base64) {
    res.status(400).json({ success: false, error: 'scene_id and image_base64 are required' });
    return;
  }
  
  // Step 1: Get scene info
  supabase.from('scenes').select('episode_id, scene_number').eq('id', scene_id).single()
    .then(({ data: scene, error: sceneErr }) => {
      if (sceneErr || !scene) {
        console.error('Scene not found:', sceneErr);
        res.status(404).json({ success: false, error: 'Scene not found' });
        return;
      }
      
      console.log('>>> Scene found:', scene.episode_id, scene.scene_number);
      
      // Step 2: Prepare upload
      const buffer = Buffer.from(image_base64, 'base64');
      const ext = mime_type.split('/')[1] || 'jpg';
      const filePath = `episodes/${scene.episode_id}/scenes/scene_${scene.scene_number}_custom.${ext}`;
      
      console.log('>>> Uploading to path:', filePath);
      
      // Step 3: Upload to Supabase
      return supabase.storage.from('ai-animation-factory').upload(filePath, buffer, { 
        contentType: mime_type, upsert: true 
      }).then(({ error: uploadErr }) => {
        if (uploadErr) {
          console.error('Upload error:', uploadErr);
          res.status(500).json({ success: false, error: `Upload failed: ${uploadErr.message}` });
          return;
        }
        
        // Step 4: Get public URL
        const { data: { publicUrl } } = supabase.storage.from('ai-animation-factory').getPublicUrl(filePath);
        
        console.log('>>> Upload successful! URL:', publicUrl.substring(0, 50) + '...');
        
        // Step 5: Update database
        return supabase.from('scenes')
          .update({ image_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', scene_id)
          .then(() => {
            res.json({ success: true, image_url: publicUrl });
          });
      });
    })
    .catch((err) => next(err));
});

// Regenerate route
app.post('/api/regen-scene', (req, res) => {
  const { episode_id, scene_id, asset_type } = req.body;
  logger.info({ episode_id, scene_id, asset_type }, 'Regenerate request');
  
  res.json({ 
    success: true, 
    message: `Regeneration job queued for ${asset_type}`,
    episode_id,
    scene_id
  });
});

// Application routes
app.use('/api/auth', authRouter);
app.use('/api/episodes', episodesRouter);
app.use('/api/episodes', approvalRouter);
app.use('/api/generation', generationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/scenes', scenesRouter);

// Error handling
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    const httpServer = createServer(app);
    initWebSocket(httpServer);
    logger.info('WebSocket initialized on ws://localhost:' + env.API_PORT);
    
    httpServer.listen(env.API_PORT, '0.0.0.0', () => {
      logger.info(`API server running on port ${env.API_PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
    });

    try {
      scheduler.start();
    } catch (err) {
      logger.error({ error: (err as Error).message }, 'Failed to start scheduler');
    }
  } catch (err) {
    logger.error({ error: err instanceof Error ? err.message : String(err) }, 'Failed to start server');
    process.exit(1);
  }
}

start();

export { app };
