-- إصلاح جدول scheduler_config
-- أضف العمود المفقود إذا لم يكن موجوداً

-- التأكد من وجود العمود description
ALTER TABLE public.scheduler_config 
ADD COLUMN IF NOT EXISTS description TEXT;

-- إذا كان الجدول فارغاً أو جديداً، أدخل البيانات
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

-- التحقق من البيانات
SELECT * FROM public.scheduler_config;
