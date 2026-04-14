ALTER TABLE "companies" ADD COLUMN "budget_metric" text DEFAULT 'billed_cents' NOT NULL;
ALTER TABLE "budget_policies" ADD COLUMN "anchor_ts" timestamp with time zone;
