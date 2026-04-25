export interface TeamSkill {
  agentId: string;
  agentName: string;
  category: string;
  skillName: string;
  path: string;
  description: string;
  tags: string[];
  version: string;
  fileCount: number;
  createdAt: string;
  modifiedAt: string;
}

export interface TeamSkillDetail extends TeamSkill {
  markdown: string;
  files: { path: string; kind: string }[];
}
