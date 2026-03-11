import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function optional(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  API_PORT: parseInt(optional('API_PORT', '3001'), 10),
  API_URL: optional('API_URL', 'http://localhost:3001'),

  // Supabase
  SUPABASE_URL: required('SUPABASE_URL'),
  SUPABASE_SERVICE_KEY: required('SUPABASE_SERVICE_KEY'),

  // Redis
  REDIS_HOST: optional('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(optional('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optional('REDIS_PASSWORD'),

  // Storage
  R2_ENDPOINT: required('R2_ENDPOINT'),
  R2_ACCESS_KEY_ID: required('R2_ACCESS_KEY_ID'),
  R2_SECRET_ACCESS_KEY: required('R2_SECRET_ACCESS_KEY'),
  R2_BUCKET_NAME: required('R2_BUCKET_NAME'),
  R2_PUBLIC_URL: required('R2_PUBLIC_URL'),

  // AI Services
  OPENAI_API_KEY: required('OPENAI_API_KEY'),
  RUNWAY_API_KEY: required('RUNWAY_API_KEY'),
  RUNWAY_API_URL: optional('RUNWAY_API_URL', 'https://api.runwayml.com/v1'),
  ELEVENLABS_API_KEY: required('ELEVENLABS_API_KEY'),
  ELEVENLABS_DEFAULT_VOICE_ID: optional('ELEVENLABS_DEFAULT_VOICE_ID', '21m00Tcm4TlvDq8ikWAM'),
  MUBERT_API_KEY: required('MUBERT_API_KEY'),
  MUBERT_LICENSE: required('MUBERT_LICENSE'),

  // Auth
  JWT_SECRET: required('JWT_SECRET'),
  JWT_EXPIRY: optional('JWT_EXPIRY', '7d'),

  // Generation settings
  EPISODES_PER_HOUR: parseInt(optional('EPISODES_PER_HOUR', '5'), 10),
  MAX_CONCURRENT_JOBS: parseInt(optional('MAX_CONCURRENT_JOBS', '10'), 10),
  SCENE_COUNT: parseInt(optional('SCENE_COUNT', '8'), 10),
  VIDEO_DURATION_SECONDS: parseInt(optional('VIDEO_DURATION_SECONDS', '60'), 10),

  // Optional
  SENTRY_DSN: optional('SENTRY_DSN'),
};
