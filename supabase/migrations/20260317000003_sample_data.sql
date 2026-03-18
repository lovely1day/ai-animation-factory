-- Insert Sample Data for Testing
-- Run this to populate the database with test data

-- Insert sample projects
INSERT INTO projects (title, description, genre, target_audience, status, stats, progress) VALUES
('مغامرات الفضاء', 'مسلسل مغامرات في الفضاء للأطفال', 'adventure', 'children', 'active', 
 '{"total_episodes": 3, "completed_episodes": 2, "in_progress_episodes": 1, "waiting_approval_episodes": 0, "total_duration_seconds": 480, "total_views": 1250, "total_likes": 85}'::jsonb, 65),
('كوميديا المكتب', 'مواقف كوميدية في مكتب العمل', 'comedy', 'adults', 'active',
 '{"total_episodes": 2, "completed_episodes": 1, "in_progress_episodes": 0, "waiting_approval_episodes": 1, "total_duration_seconds": 320, "total_views": 890, "total_likes": 120}'::jsonb, 45),
('عالم الديناصورات', 'رحلة تعليمية لعالم الديناصورات', 'educational', 'children', 'paused',
 '{"total_episodes": 1, "completed_episodes": 1, "in_progress_episodes": 0, "waiting_approval_episodes": 0, "total_duration_seconds": 180, "total_views": 2100, "total_likes": 156}'::jsonb, 100);

-- Insert sample episodes for "مغامرات الفضاء"
WITH project1 AS (SELECT id FROM projects WHERE title = 'مغامرات الفضاء' LIMIT 1)
INSERT INTO episodes (title, description, genre, target_audience, status, project_id, episode_number, season_number, view_count, like_count, duration_seconds, published_at) 
SELECT 'الإطلاق الأول', 'الإطلاق المثير لسفينة الفضاء', 'adventure', 'children', 'published', project1.id, 1, 1, 450, 32, 180, NOW() - INTERVAL '5 days'
FROM project1;

WITH project1 AS (SELECT id FROM projects WHERE title = 'مغامرات الفضاء' LIMIT 1)
INSERT INTO episodes (title, description, genre, target_audience, status, project_id, episode_number, season_number, view_count, like_count, duration_seconds, published_at)
SELECT 'كوكب المريخ', 'استكشاف سطح المريخ الأحمر', 'adventure', 'children', 'published', project1.id, 2, 1, 380, 28, 200, NOW() - INTERVAL '3 days'
FROM project1;

WITH project1 AS (SELECT id FROM projects WHERE title = 'مغامرات الفضاء' LIMIT 1)
INSERT INTO episodes (title, description, genre, target_audience, status, project_id, episode_number, season_number, view_count, like_count, duration_seconds, workflow_step, workflow_status, workflow_progress)
SELECT 'العودة للأرض', 'العودة المحفوفة بالمخاطر', 'adventure', 'children', 'processing', project1.id, 3, 1, 120, 8, 100, 'animation', 'active', 65
FROM project1;

-- Insert sample episodes for "كوميديا المكتب"
WITH project2 AS (SELECT id FROM projects WHERE title = 'كوميديا المكتب' LIMIT 1)
INSERT INTO episodes (title, description, genre, target_audience, status, project_id, episode_number, season_number, view_count, like_count, duration_seconds, published_at)
SELECT 'يوم الاثنين', 'مواقف طريفة في بداية الأسبوع', 'comedy', 'adults', 'published', project2.id, 1, 1, 520, 65, 160, NOW() - INTERVAL '2 days'
FROM project2;

WITH project2 AS (SELECT id FROM projects WHERE title = 'كوميديا المكتب' LIMIT 1)
INSERT INTO episodes (title, description, genre, target_audience, status, project_id, episode_number, season_number, view_count, like_count, duration_seconds, workflow_step, workflow_status, workflow_progress, approval_steps)
SELECT 'اجتماع الزوم', 'كوارث اجتماعات الزوم', 'comedy', 'adults', 'processing', project2.id, 2, 1, 80, 12, 170, 'voice', 'waiting_approval', 45, '["script", "images"]'::jsonb
FROM project2;

-- Insert sample episodes for "عالم الديناصورات"
WITH project3 AS (SELECT id FROM projects WHERE title = 'عالم الديناصورات' LIMIT 1)
INSERT INTO episodes (title, description, genre, target_audience, status, project_id, episode_number, season_number, view_count, like_count, duration_seconds, published_at)
SELECT 'التيرانوسوروس', 'تعرف على ملك الديناصورات', 'educational', 'children', 'published', project3.id, 1, 1, 2100, 156, 180, NOW() - INTERVAL '10 days'
FROM project3;

-- Insert sample generation jobs
INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'idea_generation', 'idea', 'completed', 100
FROM episodes WHERE title = 'العودة للأرض';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'script_writing', 'script', 'completed', 100
FROM episodes WHERE title = 'العودة للأرض';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'image_generation', 'image', 'completed', 100
FROM episodes WHERE title = 'العودة للأرض';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'animation', 'animation', 'active', 65
FROM episodes WHERE title = 'العودة للأرض';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'idea_generation', 'idea', 'completed', 100
FROM episodes WHERE title = 'اجتماع الزوم';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'script_writing', 'script', 'completed', 100
FROM episodes WHERE title = 'اجتماع الزوم';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'image_generation', 'image', 'completed', 100
FROM episodes WHERE title = 'اجتماع الزوم';

INSERT INTO generation_jobs (episode_id, job_type, queue_name, status, progress)
SELECT id, 'voice_generation', 'voice', 'waiting_approval', 45
FROM episodes WHERE title = 'اجتماع الزوم';

-- Insert sample analytics events
INSERT INTO analytics_events (episode_id, event_type, created_at)
SELECT e.id, 'view', NOW() - (random() * INTERVAL '30 days')
FROM episodes e
CROSS JOIN generate_series(1, (e.view_count / 10)) AS s;

INSERT INTO analytics_events (episode_id, event_type, created_at)
SELECT e.id, 'like', NOW() - (random() * INTERVAL '30 days')
FROM episodes e
CROSS JOIN generate_series(1, (e.like_count / 2)) AS s;

-- Verify data
SELECT 'Projects' as table_name, COUNT(*) as count FROM projects
UNION ALL
SELECT 'Episodes', COUNT(*) FROM episodes
UNION ALL
SELECT 'Generation Jobs', COUNT(*) FROM generation_jobs
UNION ALL
SELECT 'Analytics Events', COUNT(*) FROM analytics_events;
