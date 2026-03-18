-- Add updatedAt columns for API compatibility

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE episodes ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'episodes' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE episodes ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE projects ADD COLUMN "updatedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE projects ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION sync_updated_at_columns()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_episodes_updated_at ON episodes;
DROP TRIGGER IF EXISTS sync_projects_updated_at ON projects;

CREATE TRIGGER sync_episodes_updated_at
  BEFORE UPDATE ON episodes
  FOR EACH ROW
  EXECUTE FUNCTION sync_updated_at_columns();

CREATE TRIGGER sync_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION sync_updated_at_columns();
