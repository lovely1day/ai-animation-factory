-- ============================================================
-- Supabase Setup Script for AI Animation Factory
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EPISODES
-- ============================================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT NOT NULL DEFAULT 'adventure' CHECK (
    genre IN ('adventure', 'comedy', 'drama', 'sci-fi', 'fantasy', 'horror', 'romance', 'thriller', 'educational', 'mystery')
  ),
  target_audience TEXT NOT NULL DEFAULT 'general' CHECK (
    target_audience IN ('children', 'teens', 'adults', 'general')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'generating', 'processing', 'completed', 'failed', 'published', 'archived')
  ),
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  video_url TEXT,
  video_url_hd TEXT,
  subtitle_url TEXT,
  episode_number INTEGER,
  season_number INTEGER DEFAULT 1,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCENES
-- ============================================================
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  visual_prompt TEXT NOT NULL,
  dialogue TEXT,
  narration TEXT,
  duration_seconds INTEGER DEFAULT 8,
  image_url TEXT,
  animation_url TEXT,
  voice_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'generating', 'completed', 'failed')
  ),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(episode_id, scene_number)
);

-- ============================================================
-- ASSETS
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (
    asset_type IN ('image', 'animation', 'voice', 'music', 'video', 'thumbnail', 'subtitle')
  ),
  file_url TEXT NOT NULL,
  file_key TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  duration_seconds FLOAT,
  width INTEGER,
  height INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GENERATION JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (
    job_type IN ('idea_generation', 'script_writing', 'image_generation', 'animation', 'voice_generation', 'music_generation', 'video_assembly', 'subtitle_generation', 'thumbnail_generation')
  ),
  queue_name TEXT NOT NULL,
  job_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'completed', 'failed', 'retrying')
  ),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (
    event_type IN ('view', 'like', 'share', 'complete_view', 'click')
  ),
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_genre ON episodes(genre);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at ON episodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenes_episode_id ON scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_episode_id ON generation_jobs(episode_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_episode_id ON analytics_events(episode_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- ============================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STORAGE BUCKET SETUP (Run in Storage section)
-- ============================================================
-- Note: Create bucket 'ai-animation-factory' manually in Supabase Dashboard
-- Make it public for direct access

-- ============================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================
-- Uncomment if you want sample data
/*
INSERT INTO episodes (title, description, genre, target_audience, status, view_count, like_count)
VALUES 
  ('Space Adventure: Episode 1', 'A journey to the stars', 'adventure', 'children', 'published', 1500, 230),
  ('Comedy Show: Funny Moments', 'Hilarious animated scenes', 'comedy', 'general', 'published', 890, 120);
*/

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Optional but recommended
-- ============================================================
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published episodes
CREATE POLICY "Allow public read access" ON episodes
  FOR SELECT USING (status = 'published' OR status = 'completed');

-- Allow authenticated users to read their own episodes
CREATE POLICY "Allow users to read own episodes" ON episodes
  FOR SELECT USING (auth.uid() = created_by);

-- Allow admin full access
CREATE POLICY "Allow admin full access" ON episodes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
