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
