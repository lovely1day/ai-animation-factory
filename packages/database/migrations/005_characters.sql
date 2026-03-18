-- ============================================================
-- 005 — Characters / غرفة النجم (CharacterDNA)
-- ============================================================

-- ─── TABLE ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS characters (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  dna         TEXT        NOT NULL,

  -- Optional links
  user_id     UUID        REFERENCES auth.users(id)  ON DELETE SET NULL,
  project_id  UUID        REFERENCES projects(id)    ON DELETE SET NULL,

  -- Derived from DNA (stored for fast queries / filtering)
  era_code    TEXT,
  gender      TEXT        CHECK (gender IN ('M', 'F')),

  -- ComfyUI preview image (stored after successful generation)
  preview_url TEXT,

  -- Timestamps
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS characters_user_id_idx    ON characters(user_id);
CREATE INDEX IF NOT EXISTS characters_project_id_idx ON characters(project_id);
CREATE INDEX IF NOT EXISTS characters_era_code_idx   ON characters(era_code);
CREATE INDEX IF NOT EXISTS characters_created_at_idx ON characters(created_at DESC);

-- ─── AUTO-UPDATE updated_at ─────────────────────────────────

CREATE OR REPLACE FUNCTION update_characters_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS characters_updated_at ON characters;
CREATE TRIGGER characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_characters_updated_at();

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own characters.
-- NULL user_id = created via service role (dev / server-side).
CREATE POLICY "characters_own_crud" ON characters
  FOR ALL
  USING (
    auth.uid() IS NULL          -- service role or dev (no JWT)
    OR auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NULL
    OR auth.uid() = user_id
  );
