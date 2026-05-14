-- Custom features for hw-rnd-ai-crew fork

-- Budget metric toggle
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "budget_metric" text DEFAULT 'billed_cents' NOT NULL;
ALTER TABLE "budget_policies" ADD COLUMN IF NOT EXISTS "anchor_ts" timestamp with time zone;

-- Messaging settings
ALTER TABLE "instance_settings" ADD COLUMN IF NOT EXISTS "messaging" jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Roles system
CREATE TABLE IF NOT EXISTS "role_sources" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "name" text NOT NULL,
  "url" text NOT NULL,
  "ref" text NOT NULL DEFAULT 'main',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "role_sources_company_url_idx" ON "role_sources" USING btree ("company_id","url");

CREATE TABLE IF NOT EXISTS "company_roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "source_id" uuid REFERENCES "role_sources"("id"),
  "key" text NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "category" text,
  "markdown" text NOT NULL,
  "source_type" text NOT NULL DEFAULT 'local',
  "source_ref" text,
  "source_path" text,
  "metadata" jsonb,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "company_roles_company_key_idx" ON "company_roles" USING btree ("company_id","key");
CREATE INDEX IF NOT EXISTS "company_roles_company_name_idx" ON "company_roles" USING btree ("company_id","name");

-- Issue checklist
ALTER TABLE "issues" ADD COLUMN IF NOT EXISTS "checklist" jsonb;

-- Hidden sources for skills
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "hidden_sources" jsonb DEFAULT '[]';

-- Skills sync
ALTER TABLE "instance_settings" ADD COLUMN IF NOT EXISTS "skills_sync" jsonb NOT NULL DEFAULT '{}';

-- Working hours
ALTER TABLE "instance_settings" ADD COLUMN IF NOT EXISTS "working_hours" jsonb NOT NULL DEFAULT '{}';

-- Hidden skills/roles
ALTER TABLE IF NOT EXISTS "company_skills" ADD COLUMN IF NOT EXISTS "hidden" boolean NOT NULL DEFAULT false;
ALTER TABLE IF NOT EXISTS "company_roles" ADD COLUMN IF NOT EXISTS "hidden" boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "idx_company_skills_company_hidden" ON "company_skills"("company_id", "hidden");
CREATE INDEX IF NOT EXISTS "idx_company_roles_company_hidden" ON "company_roles"("company_id", "hidden");
