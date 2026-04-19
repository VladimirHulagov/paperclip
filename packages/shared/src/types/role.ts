export type RoleSourceType = "git" | "local";

export interface RoleSource {
  id: string;
  companyId: string;
  name: string;
  url: string;
  ref: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyRole {
  id: string;
  companyId: string;
  sourceId: string | null;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  markdown: string;
  sourceType: RoleSourceType;
  sourceRef: string | null;
  sourcePath: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyRoleListItem {
  id: string;
  companyId: string;
  key: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  sourceType: RoleSourceType;
  sourcePath: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignedAgentCount: number;
}

export interface CompanyRoleDetail extends CompanyRole {
  assignedAgentCount: number;
  usedByAgents: CompanyRoleUsageAgent[];
}

export interface CompanyRoleUsageAgent {
  id: string;
  name: string;
  urlKey: string;
}

export interface RoleSourceBrowseEntry {
  path: string;
  name: string;
  description: string | null;
  category: string;
}

export interface RoleSourceBrowseResult {
  sourceId: string;
  categories: {
    name: string;
    entries: RoleSourceBrowseEntry[];
  }[];
}

export interface CompanyRoleCreateRequest {
  name: string;
  slug?: string | null;
  description?: string | null;
  category?: string | null;
  markdown: string;
}

export interface CompanyRoleImportRequest {
  sourceId: string;
  paths: string[];
}

export interface CompanyRoleImportResult {
  imported: CompanyRole[];
  warnings: string[];
}

export interface RoleSourceCreateRequest {
  name: string;
  url: string;
  ref?: string | null;
}
