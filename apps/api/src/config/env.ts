import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

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
  API_URL: optional('API_URL', 'http://localhost:3004'),

  // Supabase
  SUPABASE_URL: optional('SUPABASE_URL', 'http://localhost:54321'),
  SUPABASE_SERVICE_KEY: optional('SUPABASE_SERVICE_KEY', 'dev-key'),

  // Redis
  REDIS_HOST: optional('REDIS_HOST', 'localhost'),
  REDIS_PORT: parseInt(optional('REDIS_PORT', '6379'), 10),
  REDIS_PASSWORD: optional('REDIS_PASSWORD'),

  // Storage — Supabase Storage
  STORAGE_BUCKET: optional('STORAGE_BUCKET', 'ai-animation-factory'),
  STORAGE_PUBLIC_URL: optional('STORAGE_PUBLIC_URL', ''),

  // AI Services - Multi Provider Support
  // Primary: Gemini (Recommended)
  GEMINI_API_KEY: optional('GEMINI_API_KEY', ''),
  GEMINI_MODEL: optional('GEMINI_MODEL', 'gemini-2.5-flash'),
  
  // Alternative Providers (Optional)
  OPENAI_API_KEY: optional('OPENAI_API_KEY', ''),
  CLAUDE_API_KEY: optional('CLAUDE_API_KEY', ''),      // Anthropic Claude
  GROK_API_KEY: optional('GROK_API_KEY', ''),          // xAI Grok
  KIMI_API_KEY: optional('KIMI_API_KEY', ''),          // Moonshot Kimi
  
  // Other AI Services
  RUNWAY_API_KEY: optional('RUNWAY_API_KEY', ''),
  RUNWAY_API_URL: optional('RUNWAY_API_URL', 'https://api.runwayml.com/v1'),
  ELEVENLABS_API_KEY: optional('ELEVENLABS_API_KEY', ''),
  ELEVENLABS_DEFAULT_VOICE_ID: optional('ELEVENLABS_DEFAULT_VOICE_ID', '21m00Tcm4TlvDq8ikWAM'),
  MUBERT_API_KEY: optional('MUBERT_API_KEY', ''),
  MUBERT_LICENSE: optional('MUBERT_LICENSE', ''),

  // Auth (optional for development)
  JWT_SECRET: optional('JWT_SECRET', 'dev-secret-key-for-testing-only-change-in-production'),
  JWT_EXPIRY: optional('JWT_EXPIRY', '7d'),

  // ComfyUI
  COMFYUI_URL: optional('COMFYUI_URL', 'http://localhost:8188'),

  // MediaVoice Studio (local TTS/STT service)
  MEDIAVORICE_URL: optional('MEDIAVORICE_URL', 'http://localhost:8000'),

  // Ollama (Local LLM)
  OLLAMA_URL: optional('OLLAMA_URL', 'http://localhost:11434'),
  OLLAMA_MODEL: optional('OLLAMA_MODEL', 'llama3'),

  // AI Provider selection: "gemini" | "ollama" | "auto" (default: auto = gemini first, ollama fallback)
  AI_PROVIDER: optional('AI_PROVIDER', 'auto'),

  // Generation settings
  EPISODES_PER_HOUR: parseInt(optional('EPISODES_PER_HOUR', '5'), 10),
  MAX_CONCURRENT_JOBS: parseInt(optional('MAX_CONCURRENT_JOBS', '10'), 10),
  SCENE_COUNT: parseInt(optional('SCENE_COUNT', '8'), 10),
  VIDEO_DURATION_SECONDS: parseInt(optional('VIDEO_DURATION_SECONDS', '60'), 10),

  // Optional
  SENTRY_DSN: optional('SENTRY_DSN'),
};
