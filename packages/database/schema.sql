-- ============================================================
-- AI Animation Factory - Complete PostgreSQL Schema
-- Version 2.0 - With Projects & Advanced Workflow
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROJECTS (المشاريع)
-- ============================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  target_audience TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('draft', 'active', 'paused', 'completed', 'archived')
  ),
  
  -- إعدادات سير العمل
  workflow_settings JSONB DEFAULT '{
    "approval_steps": ["script", "images"],
    "auto_publish": false,
    "default_scene_count": 8,
    "default_video_quality": "hd"
  }',
  
  -- الإحصائيات
  stats JSONB DEFAULT '{
    "total_episodes": 0,
    "completed_episodes": 0,
    "in_progress_episodes": 0,
    "waiting_approval_episodes": 0,
    "total_duration_seconds": 0,
    "total_views": 0,
    "total_likes": 0
  }',
  
  -- تقدم المشروع
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- معلومات الإنشاء
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EPISODES (الحلقات)
-- ============================================================
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- البيانات الأساسية
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  idea TEXT,
  
  -- التصنيف
  genre TEXT,
  target_audience TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- حالة النشر
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'generating', 'processing', 'waiting_approval', 'approved', 'completed', 'published', 'archived')
  ),
  episode_number INTEGER,
  season_number INTEGER DEFAULT 1,
  
  -- سير العمل
  workflow_step TEXT DEFAULT 'idea' CHECK (
    workflow_step IN ('idea', 'script', 'scenes', 'images', 'voice', 'music', 'subtitles', 'animation', 'assembly', 'final')
  ),
  workflow_status TEXT DEFAULT 'pending' CHECK (
    workflow_status IN ('pending', 'processing', 'waiting_approval', 'approved', 'rejected', 'completed')
  ),
  workflow_progress INTEGER DEFAULT 0 CHECK (workflow_progress >= 0 AND workflow_progress <= 100),
  
  -- البيانات المُنشأة
  script_data JSONB,
  images_data JSONB,
  voice_data JSONB,
  music_data JSONB,
  
  -- الملفات النهائية
  final_video_url TEXT,
  final_video_hd_url TEXT,
  subtitle_url TEXT,
  thumbnail_url TEXT,
  
  -- المدة والحجم
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  
  -- الموافقات
  approval_steps TEXT[] DEFAULT '{"script", "images"}',
  current_approval_step TEXT,
  
  -- المؤشرات
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}',
  
  -- معلومات الإنشاء
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPROVAL LOGS (سجلات الموافقات)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  step TEXT NOT NULL CHECK (
    step IN ('script', 'images', 'voice', 'music', 'final')
  ),
  action TEXT NOT NULL CHECK (
    action IN ('approved', 'rejected', 'requested_changes')
  ),
  
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_by_name TEXT,
  comment TEXT,
  
  -- التعديلات المطلوبة
  requested_changes JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCENES (المشاهد)
-- ============================================================
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  scene_number INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  visual_prompt TEXT NOT NULL,
  dialogue TEXT,
  narration TEXT,
  duration_seconds INTEGER DEFAULT 8,
  
  -- الملفات المُنشأة
  image_url TEXT,
  voice_url TEXT,
  video_url TEXT,
  
  -- الحالة
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),
  
  -- معرفات التوليد
  generation_ids JSONB DEFAULT '{}',
  
  -- البيانات الوصفية
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(episode_id, scene_number)
);

-- ============================================================
-- ASSETS (الأصول)
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
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
-- GENERATION JOBS (مهام التوليد)
-- ============================================================
CREATE TABLE IF NOT EXISTS generation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
  
  job_type TEXT NOT NULL CHECK (
    job_type IN (
      'idea_generation', 'script_writing', 'scene_prompts',
      'image_generation', 'animation', 'voice_generation',
      'music_generation', 'video_assembly', 'subtitle_generation',
      'thumbnail_generation'
    )
  ),
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'active', 'completed', 'failed', 'retrying', 'cancelled')
  ),
  
  bull_job_id TEXT,
  external_job_id TEXT, -- ComfyUI prompt_id, etc.
  
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  
  error_message TEXT,
  error_stack TEXT,
  
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS (التحليلات)
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL CHECK (
    event_type IN ('view', 'like', 'share', 'complete', 'skip', 'pause', 'search')
  ),
  
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  
  watch_duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USERS (المستخدمين)
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
-- SCHEDULER CONFIG (إعدادات الجدولة)
-- ============================================================
CREATE TABLE IF NOT EXISTS scheduler_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES (الفهارس)
-- ============================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Episodes indexes
CREATE INDEX IF NOT EXISTS idx_episodes_project_id ON episodes(project_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_workflow_step ON episodes(workflow_step);
CREATE INDEX IF NOT EXISTS idx_episodes_workflow_status ON episodes(workflow_status);
CREATE INDEX IF NOT EXISTS idx_episodes_published_at ON episodes(published_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at ON episodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_episodes_episode_number ON episodes(project_id, episode_number);

-- Scenes indexes
CREATE INDEX IF NOT EXISTS idx_scenes_episode_id ON scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_episode_id ON assets(episode_id);
CREATE INDEX IF NOT EXISTS idx_assets_scene_id ON assets(scene_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);

-- Approval logs indexes
CREATE INDEX IF NOT EXISTS idx_approval_logs_episode_id ON approval_logs(episode_id);
CREATE INDEX IF NOT EXISTS idx_approval_logs_created_at ON approval_logs(created_at DESC);

-- Generation jobs indexes
CREATE INDEX IF NOT EXISTS idx_generation_jobs_episode_id ON generation_jobs(episode_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_type ON generation_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_created_at ON generation_jobs(created_at DESC);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_episode_id ON analytics(episode_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);

-- ============================================================
-- TRIGGERS - auto update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at
  BEFORE UPDATE ON scenes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (created_by = auth.uid() OR auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'editor')
  ));

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (created_by = auth.uid() OR auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'editor')
  ));

-- Episodes policies
CREATE POLICY "Users can view project episodes"
  ON episodes FOR SELECT
  USING (created_by = auth.uid() OR auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'editor')
  ));

CREATE POLICY "Users can create episodes"
  ON episodes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own episodes"
  ON episodes FOR UPDATE
  USING (created_by = auth.uid() OR auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'editor')
  ));

-- Scenes policies
CREATE POLICY "Users can view project scenes"
  ON scenes FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE created_by = auth.uid()
  ) OR auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'editor')
  ));

-- Approval logs policies
CREATE POLICY "Users can view approval logs"
  ON approval_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create approval logs"
  ON approval_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Generation jobs policies
CREATE POLICY "Users can view generation jobs"
  ON generation_jobs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Analytics policies
CREATE POLICY "Anyone can insert analytics"
  ON analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view analytics"
  ON analytics FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'editor')
  ));

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO scheduler_config (key, value, description) VALUES
  ('episodes_per_hour', '5', 'Number of episodes to auto-generate per hour'),
  ('max_concurrent_jobs', '10', 'Maximum concurrent generation jobs'),
  ('scene_count', '8', 'Number of scenes per episode'),
  ('video_duration_seconds', '60', 'Target video duration in seconds'),
  ('auto_publish', 'false', 'Automatically publish completed episodes'),
  ('cleanup_days', '30', 'Days to keep failed job records'),
  ('genres', '["adventure","comedy","drama","sci-fi","fantasy","educational"]', 'Active genres for auto-generation'),
  ('audiences', '["children","teens","adults","general"]', 'Target audiences for auto-generation')
ON CONFLICT (key) DO NOTHING;
