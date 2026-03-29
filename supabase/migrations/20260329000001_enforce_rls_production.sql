-- ============================================================
-- ENFORCE ROW LEVEL SECURITY — Production-Ready Policies
-- Date: 2026-03-29
-- ============================================================
-- IMPORTANT: The API backend uses SUPABASE_SERVICE_KEY (service_role)
-- which BYPASSES RLS. These policies protect against:
-- 1. Direct Supabase access via anon key
-- 2. Leaked anon keys
-- 3. Frontend-only access attempts
-- ============================================================

-- ============================================================
-- STEP 1: Drop all overly-permissive "development" policies
-- ============================================================
DROP POLICY IF EXISTS "Allow anonymous all on episodes" ON episodes;
DROP POLICY IF EXISTS "Allow anonymous all on projects" ON projects;
DROP POLICY IF EXISTS "Allow anonymous all on scenes" ON scenes;
DROP POLICY IF EXISTS "Allow anonymous all on generation_jobs" ON generation_jobs;
DROP POLICY IF EXISTS "characters_own_crud" ON characters;

-- ============================================================
-- STEP 2: Enable RLS on ALL tables
-- ============================================================
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS scheduler_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: PROJECTS — authenticated users see their own projects
-- ============================================================
CREATE POLICY "projects_select_own"
  ON projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "projects_insert_own"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "projects_update_own"
  ON projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "projects_delete_own"
  ON projects FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================
-- STEP 4: EPISODES — user sees episodes of their own projects
-- ============================================================
CREATE POLICY "episodes_select_own"
  ON episodes FOR SELECT
  TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

CREATE POLICY "episodes_insert_own"
  ON episodes FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

CREATE POLICY "episodes_update_own"
  ON episodes FOR UPDATE
  TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

CREATE POLICY "episodes_delete_own"
  ON episodes FOR DELETE
  TO authenticated
  USING (
    project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
  );

-- ============================================================
-- STEP 5: SCENES — tied to episodes → projects → user
-- ============================================================
CREATE POLICY "scenes_select_own"
  ON scenes FOR SELECT
  TO authenticated
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "scenes_insert_own"
  ON scenes FOR INSERT
  TO authenticated
  WITH CHECK (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "scenes_update_own"
  ON scenes FOR UPDATE
  TO authenticated
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- ============================================================
-- STEP 6: GENERATION_JOBS — tied to episodes → projects → user
-- ============================================================
CREATE POLICY "jobs_select_own"
  ON generation_jobs FOR SELECT
  TO authenticated
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

CREATE POLICY "jobs_insert_own"
  ON generation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- ============================================================
-- STEP 7: CHARACTERS — user manages own characters
-- ============================================================
CREATE POLICY "characters_select_own"
  ON characters FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "characters_insert_own"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_update_own"
  ON characters FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "characters_delete_own"
  ON characters FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================
-- STEP 8: USERS — each user sees only their own record
-- ============================================================
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- STEP 9: ASSETS — tied to episodes → projects → user
-- ============================================================
CREATE POLICY "assets_select_own"
  ON assets FOR SELECT
  TO authenticated
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- ============================================================
-- STEP 10: ANALYTICS / ANALYTICS_EVENTS — read own data
-- ============================================================
CREATE POLICY "analytics_select_own"
  ON analytics FOR SELECT
  TO authenticated
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- analytics_events: if table has user_id column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analytics_events' AND column_name = 'user_id'
  ) THEN
    EXECUTE 'CREATE POLICY "analytics_events_select_own" ON analytics_events FOR SELECT TO authenticated USING (user_id = auth.uid())';
  END IF;
END $$;

-- ============================================================
-- STEP 11: APPROVAL_LOGS — read-only for authenticated
-- ============================================================
CREATE POLICY "approval_logs_select_own"
  ON approval_logs FOR SELECT
  TO authenticated
  USING (
    episode_id IN (
      SELECT e.id FROM episodes e
      JOIN projects p ON e.project_id = p.id
      WHERE p.created_by = auth.uid()
    )
  );

-- ============================================================
-- STEP 12: SCHEDULER_CONFIG — admin only (via service_role)
-- No anon/authenticated access needed
-- ============================================================
-- (No policies = no access for non-service-role = correct)

-- ============================================================
-- VERIFICATION: All tables should have RLS ON
-- Run this query to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ============================================================
