ALTER TABLE company_skills ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
ALTER TABLE company_roles ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_company_skills_company_hidden ON company_skills(company_id, hidden);
CREATE INDEX IF NOT EXISTS idx_company_roles_company_hidden ON company_roles(company_id, hidden);
