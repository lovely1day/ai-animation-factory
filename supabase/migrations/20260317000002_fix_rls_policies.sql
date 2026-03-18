-- Fix Row Level Security (RLS) Policies
-- This allows inserts and updates without authentication for development

-- Disable RLS on all tables (for development)
ALTER TABLE IF EXISTS episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS generation_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shows DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS characters DISABLE ROW LEVEL SECURITY;

-- Alternative: Keep RLS but allow anonymous access
-- If you want to keep RLS enabled, use these policies instead:

-- Allow all operations for anonymous users (development only)
DROP POLICY IF EXISTS "Allow anonymous all on episodes" ON episodes;
CREATE POLICY "Allow anonymous all on episodes" 
  ON episodes FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on projects" ON projects;
CREATE POLICY "Allow anonymous all on projects" 
  ON projects FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on scenes" ON scenes;
CREATE POLICY "Allow anonymous all on scenes" 
  ON scenes FOR ALL 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous all on generation_jobs" ON generation_jobs;
CREATE POLICY "Allow anonymous all on generation_jobs" 
  ON generation_jobs FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Re-enable RLS with the new policies
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
