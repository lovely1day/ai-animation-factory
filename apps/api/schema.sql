-- =====================================================
-- AI Animation Factory - Database Schema
-- Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Users Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user', -- admin, editor, user
    password_hash TEXT,
    is_active BOOLEAN DEFAULT true,
    credits INTEGER DEFAULT 100,
    used_credits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO public.users (id, email, full_name, role, password_hash, is_active, credits)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin@example.com',
    'Admin User',
    'admin',
    '$2a$10$YourHashedPasswordHere', -- Replace with actual bcrypt hash
    true,
    10000
)
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- Episodes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL DEFAULT 'Untitled Episode',
    description TEXT,
    genre TEXT,
    target_audience TEXT,
    theme TEXT,
    tags TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- pending, processing, generating, completed, published, failed
    thumbnail_url TEXT,
    video_url TEXT,
    subtitle_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_episodes_status ON public.episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_genre ON public.episodes(genre);
CREATE INDEX IF NOT EXISTS idx_episodes_created_at ON public.episodes(created_at DESC);

-- =====================================================
-- Scenes Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    title TEXT,
    description TEXT,
    visual_prompt TEXT,
    dialogue TEXT,
    narration TEXT,
    duration_seconds INTEGER DEFAULT 8,
    status TEXT DEFAULT 'pending', -- pending, generating_image, generating_animation, generating_voice, completed, failed
    image_url TEXT,
    animation_url TEXT,
    voice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(episode_id, scene_number)
);

CREATE INDEX IF NOT EXISTS idx_scenes_episode_id ON public.scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON public.scenes(status);

-- =====================================================
-- Assets Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL, -- image, voice, music, animation, video, subtitle, thumbnail
    file_url TEXT NOT NULL,
    file_key TEXT NOT NULL,
    mime_type TEXT,
    duration_seconds INTEGER,
    file_size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_episode_id ON public.assets(episode_id);
CREATE INDEX IF NOT EXISTS idx_assets_scene_id ON public.assets(scene_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON public.assets(asset_type);

-- =====================================================
-- Generation Jobs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL, -- idea_generation, script_writing, image_generation, animation, voice_generation, music_generation, video_assembly, subtitle_generation, thumbnail_generation
    status TEXT DEFAULT 'pending', -- pending, active, completed, failed, retrying
    bull_job_id TEXT,
    queue_name TEXT,
    progress INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    error_stack TEXT,
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_episode_id ON public.generation_jobs(episode_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_job_type ON public.generation_jobs(job_type);

-- =====================================================
-- Analytics Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- view, like, share, download
    user_id UUID REFERENCES public.users(id),
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_episode_id ON public.analytics(episode_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics(created_at DESC);

-- =====================================================
-- Scheduler Config Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.scheduler_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default scheduler configuration
INSERT INTO public.scheduler_config (key, value, description) VALUES
('episodes_per_hour', '5', 'Number of episodes to auto-generate per hour'),
('genres', '["adventure", "comedy", "sci-fi", "fantasy", "educational", "drama", "mystery"]', 'Available genres for episode generation'),
('audiences', '["children", "teens", "adults", "general"]', 'Target audiences for episodes'),
('auto_publish', 'false', 'Automatically publish completed episodes'),
('cleanup_days', '30', 'Days to keep old completed jobs before cleanup'),
('max_concurrent_jobs', '10', 'Maximum concurrent generation jobs'),
('scene_count', '8', 'Default number of scenes per episode'),
('video_duration_seconds', '60', 'Target video duration in seconds'),
('enable_scheduler', 'true', 'Enable automatic episode generation')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- =====================================================
-- User Credits Table (for billing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    credits INTEGER DEFAULT 100,
    used_credits INTEGER DEFAULT 0,
    total_credits_purchased INTEGER DEFAULT 0,
    subscription_tier TEXT DEFAULT 'free', -- free, starter, pro, enterprise
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Insert default credits for admin
INSERT INTO public.user_credits (user_id, credits, used_credits, subscription_tier)
VALUES ('00000000-0000-0000-0000-000000000001', 10000, 0, 'enterprise')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Usage Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- create-episode, regenerate-scene, custom-voice
    credits_used INTEGER NOT NULL DEFAULT 0,
    episode_id UUID REFERENCES public.episodes(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- =====================================================
-- API Keys Table (for external integrations)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    scopes TEXT[] DEFAULT '{"read"}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Functions and Triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON public.scenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON public.generation_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduler_config_updated_at BEFORE UPDATE ON public.scheduler_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-update episode status based on scenes
CREATE OR REPLACE FUNCTION check_episode_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Update episode status when all scenes are completed
    IF NEW.status = 'completed' THEN
        UPDATE public.episodes
        SET status = 'completed', completed_at = NOW()
        WHERE id = NEW.episode_id
        AND NOT EXISTS (
            SELECT 1 FROM public.scenes 
            WHERE episode_id = NEW.episode_id 
            AND status != 'completed'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_episode_completion
    AFTER UPDATE ON public.scenes
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION check_episode_completion();

-- =====================================================
-- RPC Functions for Supabase
-- =====================================================

-- Function to deduct credits atomically
CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_cost INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits with lock
    SELECT credits INTO current_credits
    FROM public.user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Check if enough credits
    IF current_credits < p_cost THEN
        RETURN false;
    END IF;
    
    -- Deduct credits
    UPDATE public.user_credits
    SET 
        credits = credits - p_cost,
        used_credits = used_credits + p_cost,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
    total_episodes BIGINT,
    published_episodes BIGINT,
    total_views BIGINT,
    credits_remaining INTEGER,
    credits_used INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.episodes WHERE created_by = p_user_id),
        (SELECT COUNT(*) FROM public.episodes WHERE created_by = p_user_id AND status = 'published'),
        (SELECT COALESCE(SUM(view_count), 0) FROM public.episodes WHERE created_by = p_user_id),
        (SELECT credits FROM public.user_credits WHERE user_id = p_user_id),
        (SELECT used_credits FROM public.user_credits WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get episode with scenes
CREATE OR REPLACE FUNCTION get_episode_with_scenes(p_episode_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'episode', row_to_json(e.*),
        'scenes', COALESCE(
            (SELECT json_agg(row_to_json(s.*) ORDER BY s.scene_number)
             FROM public.scenes s
             WHERE s.episode_id = p_episode_id),
            '[]'::json
        ),
        'assets', COALESCE(
            (SELECT json_agg(row_to_json(a.*))
             FROM public.assets a
             WHERE a.episode_id = p_episode_id),
            '[]'::json
        ),
        'jobs', COALESCE(
            (SELECT json_agg(row_to_json(j.*) ORDER BY j.created_at DESC)
             FROM public.generation_jobs j
             WHERE j.episode_id = p_episode_id),
            '[]'::json
        )
    ) INTO result
    FROM public.episodes e
    WHERE e.id = p_episode_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies for episodes
CREATE POLICY "Public episodes are viewable by everyone" 
    ON public.episodes FOR SELECT 
    USING (status IN ('published', 'completed') OR created_by = auth.uid());

CREATE POLICY "Users can create episodes" 
    ON public.episodes FOR INSERT 
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own episodes" 
    ON public.episodes FOR UPDATE 
    USING (created_by = auth.uid());

-- Policies for scenes (viewable if episode is viewable)
CREATE POLICY "Scenes are viewable by episode viewers" 
    ON public.scenes FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.episodes e 
            WHERE e.id = scenes.episode_id 
            AND (e.status IN ('published', 'completed') OR e.created_by = auth.uid())
        )
    );

-- Policies for user_credits
CREATE POLICY "Users can view own credits" 
    ON public.user_credits FOR SELECT 
    USING (user_id = auth.uid());

-- =====================================================
-- End of Schema
-- =====================================================
