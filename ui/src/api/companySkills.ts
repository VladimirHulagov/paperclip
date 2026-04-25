import type {
  CompanySkill,
  CompanySkillCreateRequest,
  CompanySkillDetail,
  CompanySkillFileDetail,
  CompanySkillImportResult,
  CompanySkillListItem,
  CompanySkillProjectScanRequest,
  CompanySkillProjectScanResult,
  CompanySkillUpdateStatus,
  TeamSkill,
  TeamSkillDetail,
} from "@paperclipai/shared";
import { api } from "./client";

export const companySkillsApi = {
  list: (companyId: string) =>
    api.get<CompanySkillListItem[]>(`/companies/${encodeURIComponent(companyId)}/skills`),
  detail: (companyId: string, skillId: string) =>
    api.get<CompanySkillDetail>(
      `/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(skillId)}`,
    ),
  updateStatus: (companyId: string, skillId: string) =>
    api.get<CompanySkillUpdateStatus>(
      `/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(skillId)}/update-status`,
    ),
  file: (companyId: string, skillId: string, relativePath: string) =>
    api.get<CompanySkillFileDetail>(
      `/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(skillId)}/files?path=${encodeURIComponent(relativePath)}`,
    ),
  updateFile: (companyId: string, skillId: string, path: string, content: string) =>
    api.patch<CompanySkillFileDetail>(
      `/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(skillId)}/files`,
      { path, content },
    ),
  create: (companyId: string, payload: CompanySkillCreateRequest) =>
    api.post<CompanySkill>(
      `/companies/${encodeURIComponent(companyId)}/skills`,
      payload,
    ),
  importFromSource: (companyId: string, source: string) =>
    api.post<CompanySkillImportResult>(
      `/companies/${encodeURIComponent(companyId)}/skills/import`,
      { source },
    ),
  scanProjects: (companyId: string, payload: CompanySkillProjectScanRequest = {}) =>
    api.post<CompanySkillProjectScanResult>(
      `/companies/${encodeURIComponent(companyId)}/skills/scan-projects`,
      payload,
    ),
  installUpdate: (companyId: string, skillId: string) =>
    api.post<CompanySkill>(
      `/companies/${encodeURIComponent(companyId)}/skills/${encodeURIComponent(skillId)}/install-update`,
      {},
    ),
  hiddenSources: (companyId: string) =>
    api.get<{ source_type: string; source_locator: string }[]>(
      `/companies/${encodeURIComponent(companyId)}/hidden-sources`,
    ),
  setHiddenSources: (companyId: string, sources: { source_type: string; source_locator: string }[]) =>
    api.put<{ source_type: string; source_locator: string }[]>(
      `/companies/${encodeURIComponent(companyId)}/hidden-sources`,
      sources,
    ),
  deleteBySource: (companyId: string, sourceType: string, sourceLocator: string) =>
    api.delete<{ deletedCount: number }>(
      `/companies/${encodeURIComponent(companyId)}/skills-by-source?sourceType=${encodeURIComponent(sourceType)}&sourceLocator=${encodeURIComponent(sourceLocator)}`,
    ),
  listTeamSkills: (companyId: string) =>
    api.get<TeamSkill[]>(
      `/companies/${encodeURIComponent(companyId)}/team-skills`,
    ),
  getTeamSkill: (companyId: string, agentId: string, category: string, skillName: string) =>
    api.get<TeamSkillDetail>(
      `/companies/${encodeURIComponent(companyId)}/team-skills/${agentId}/${category}/${skillName}`,
    ),
  updateTeamSkill: (companyId: string, agentId: string, category: string, skillName: string, markdown: string) =>
    api.put<{ ok: boolean }>(
      `/companies/${encodeURIComponent(companyId)}/team-skills/${agentId}/${category}/${skillName}`,
      { markdown },
    ),
  deleteTeamSkill: (companyId: string, agentId: string, category: string, skillName: string) =>
    api.delete<{ ok: boolean }>(
      `/companies/${encodeURIComponent(companyId)}/team-skills/${agentId}/${category}/${skillName}`,
    ),
};
