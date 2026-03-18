ALTER TABLE episodes
ADD COLUMN workflow_mode TEXT DEFAULT 'auto';

ALTER TABLE episodes
ADD COLUMN workflow_step TEXT DEFAULT 'idea';

ALTER TABLE episodes
ADD COLUMN workflow_status TEXT DEFAULT 'pending';

ALTER TABLE episodes
ADD COLUMN approval_steps JSONB DEFAULT '[]';