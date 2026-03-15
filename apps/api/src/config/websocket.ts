import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../utils/logger';

let io: SocketServer | null = null;

// WebSocket event data interfaces
interface EpisodeUpdateData {
  status?: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  [key: string]: unknown;
}

interface SceneUpdateData {
  status?: string;
  title?: string;
  description?: string;
  image_url?: string;
  animation_url?: string;
  [key: string]: unknown;
}

interface JobProgressData {
  stage?: string;
  message?: string;
  [key: string]: unknown;
}

interface GenerationCompleteData {
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  [key: string]: unknown;
}

interface ErrorDetails {
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

export function initWebSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'null', 'file://'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'Client connected to WebSocket');

    // Join episode room for updates
    socket.on('subscribe', (episodeId: string) => {
      socket.join(`episode:${episodeId}`);
      logger.info({ socketId: socket.id, episodeId }, 'Client subscribed to episode');
    });

    // Leave episode room
    socket.on('unsubscribe', (episodeId: string) => {
      socket.leave(`episode:${episodeId}`);
      logger.info({ socketId: socket.id, episodeId }, 'Client unsubscribed from episode');
    });

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected from WebSocket');
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initWebSocket first.');
  }
  return io;
}

// Emit episode update
export function emitEpisodeUpdate(episodeId: string, data: EpisodeUpdateData) {
  if (!io) return;
  io.to(`episode:${episodeId}`).emit('episode:update', {
    episodeId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Emit scene update
export function emitSceneUpdate(episodeId: string, sceneId: string, data: SceneUpdateData) {
  if (!io) return;
  io.to(`episode:${episodeId}`).emit('scene:update', {
    episodeId,
    sceneId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Emit job progress
export function emitJobProgress(episodeId: string, jobType: string, progress: number, data?: JobProgressData) {
  if (!io) return;
  io.to(`episode:${episodeId}`).emit('job:progress', {
    episodeId,
    jobType,
    progress,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Emit generation complete
export function emitGenerationComplete(episodeId: string, data: GenerationCompleteData) {
  if (!io) return;
  io.to(`episode:${episodeId}`).emit('generation:complete', {
    episodeId,
    ...data,
    timestamp: new Date().toISOString(),
  });
  
  // Also emit to all clients for dashboard updates
  io.emit('episode:completed', {
    episodeId,
    ...data,
    timestamp: new Date().toISOString(),
  });
}

// Emit error
export function emitError(episodeId: string, error: string, details?: ErrorDetails) {
  if (!io) return;
  io.to(`episode:${episodeId}`).emit('generation:error', {
    episodeId,
    error,
    details,
    timestamp: new Date().toISOString(),
  });
}
