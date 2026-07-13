ALTER TABLE "instance_settings" ADD COLUMN "messaging" jsonb DEFAULT '{}'::jsonb NOT NULL;
