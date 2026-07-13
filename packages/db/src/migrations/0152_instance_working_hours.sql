ALTER TABLE instance_settings ADD COLUMN IF NOT EXISTS working_hours jsonb NOT NULL DEFAULT '{}';
