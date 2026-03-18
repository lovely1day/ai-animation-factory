-- Fix Episodes-Projects Relationship Schema
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT DEFAULT 'adventure' CHECK (
    genre IN ('adventure', 'comedy', 'drama', 'sci-fi', 'fantasy', 'horror', 'romance', 'thriller', 'educational', 'mystery')
  ),
  target_audience TEXT DEFAULT 'general' CHECK (
    target_audience IN ('children', 'teens', 'adults', 'general')
  ),
  workflow_settings JSONB DEFAULT '{"approval_steps": ["script", "images"], "auto_publish": false, "default_scene_count": 8, "default_video_quality": "hd"}'::jsonb,
  stats JSONB DEFAULT '{"total_episodes": 0, "completed_episodes": 0, "in_progress_episodes": 0, "waiting_approval_episodes": 0, "total_duration_seconds": 0, "total_views": 0, "total_likes": 0}'::jsonb,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status TEXT DEFAULT 'active' CHECK (
    status IN ('active', 'paused', 'completed', 'archived')
  ),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ADD MISSING COLUMNS TO EPISODES
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE episodes ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'workflow_step'
  ) THEN
    ALTER TABLE episodes ADD COLUMN workflow_step TEXT DEFAULT 'idea';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'workflow_status'
  ) THEN
    ALTER TABLE episodes ADD COLUMN workflow_status TEXT DEFAULT 'pending';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'workflow_progress'
  ) THEN
    ALTER TABLE episodes ADD COLUMN workflow_progress INTEGER DEFAULT 0 CHECK (workflow_progress >= 0 AND workflow_progress <= 100);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'approval_steps'
  ) THEN
    ALTER TABLE episodes ADD COLUMN approval_steps JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'approvals_log'
  ) THEN
    ALTER TABLE episodes ADD COLUMN approvals_log JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'share_count'
  ) THEN
    ALTER TABLE episodes ADD COLUMN share_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'idea'
  ) THEN
    ALTER TABLE episodes ADD COLUMN idea TEXT;
  END IF;
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_episodes_project_id ON episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_workflow_step ON episodes(workflow_step);
CREATE INDEX IF NOT EXISTS idx_episodes_workflow_status ON episodes(workflow_status);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- TRIGGER FOR UPDATED_AT ON PROJECTS
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- FUNCTION: Increment Project Episode Count
CREATE OR REPLACE FUNCTION increment_project_episode_count(project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects 
  SET 
    stats = jsonb_set(
      stats,
      '{total_episodes}',
      to_jsonb(COALESCE((stats->>'total_episodes')::int, 0) + 1)
    ),
    updated_at = NOW()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES FOR PROJECTS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
CREATE POLICY "Allow public read access to projects" 
  ON projects FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert on projects" ON projects;
CREATE POLICY "Allow authenticated insert on projects" 
  ON projects FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update on projects" ON projects;
CREATE POLICY "Allow authenticated update on projects" 
  ON projects FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete on projects" ON projects;
CREATE POLICY "Allow authenticated delete on projects" 
  ON projects FOR DELETE 
  USING (true);

-- INSERT DEFAULT PROJECT
INSERT INTO projects (title, description, genre, target_audience, status)
SELECT 
  'Default Project', 
  'Auto-created default project for episodes without a project', 
  'adventure', 
  'general', 
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM projects WHERE title = 'Default Project'
);
