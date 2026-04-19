import type {
  RoleSource,
  RoleSourceBrowseResult,
  CompanyRoleListItem,
  CompanyRoleDetail,
  CompanyRoleCreateRequest,
  CompanyRoleImportResult,
} from "@paperclipai/shared";
import { api } from "./client";

export const roleSourcesApi = {
  list: (companyId: string) =>
    api.get<RoleSource[]>(`/companies/${encodeURIComponent(companyId)}/role-sources`),

  create: (companyId: string, payload: { name: string; url: string; ref?: string | null }) =>
    api.post<RoleSource>(`/companies/${encodeURIComponent(companyId)}/role-sources`, payload),

  delete: (companyId: string, sourceId: string) =>
    api.delete<void>(`/companies/${encodeURIComponent(companyId)}/role-sources/${encodeURIComponent(sourceId)}`),

  browse: (companyId: string, sourceId: string) =>
    api.get<RoleSourceBrowseResult>(
      `/companies/${encodeURIComponent(companyId)}/role-sources/${encodeURIComponent(sourceId)}/browse`,
    ),
};

export const companyRolesApi = {
  list: (companyId: string) =>
    api.get<CompanyRoleListItem[]>(`/companies/${encodeURIComponent(companyId)}/roles`),

  detail: (companyId: string, roleId: string) =>
    api.get<CompanyRoleDetail>(
      `/companies/${encodeURIComponent(companyId)}/roles/${encodeURIComponent(roleId)}`,
    ),

  create: (companyId: string, payload: CompanyRoleCreateRequest) =>
    api.post<CompanyRoleDetail>(`/companies/${encodeURIComponent(companyId)}/roles`, payload),

  delete: (companyId: string, roleId: string) =>
    api.delete<void>(`/companies/${encodeURIComponent(companyId)}/roles/${encodeURIComponent(roleId)}`),

  importFromSource: (companyId: string, sourceId: string, paths: string[]) =>
    api.post<CompanyRoleImportResult>(
      `/companies/${encodeURIComponent(companyId)}/roles/import`,
      { sourceId, paths },
    ),
};
