ALTER TABLE company_skills ADD COLUMN hidden boolean NOT NULL DEFAULT false;
ALTER TABLE company_roles ADD COLUMN hidden boolean NOT NULL DEFAULT false;
CREATE INDEX idx_company_skills_company_hidden ON company_skills(company_id, hidden);
CREATE INDEX idx_company_roles_company_hidden ON company_roles(company_id, hidden);
