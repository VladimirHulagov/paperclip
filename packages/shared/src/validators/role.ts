import { z } from "zod";

export const roleSourceTypeSchema = z.enum(["git", "local"]);

export const roleSourceSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  name: z.string().min(1),
  url: z.string().min(1),
  ref: z.string().min(1),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const companyRoleSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  sourceId: z.string().uuid().nullable(),
  key: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable(),
  markdown: z.string(),
  sourceType: roleSourceTypeSchema,
  sourceRef: z.string().nullable(),
  sourcePath: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  hidden: z.boolean(),
});

export const companyRoleListItemSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  key: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().nullable(),
  sourceType: roleSourceTypeSchema,
  sourcePath: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  assignedAgentCount: z.number().int().nonnegative(),
  hidden: z.boolean(),
});

export const companyRoleUsageAgentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  urlKey: z.string().min(1),
});

export const companyRoleDetailSchema = companyRoleSchema.extend({
  assignedAgentCount: z.number().int().nonnegative(),
  usedByAgents: z.array(companyRoleUsageAgentSchema).default([]),
});

export const roleSourceBrowseEntrySchema = z.object({
  path: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: z.string().min(1),
});

export const roleSourceBrowseResultSchema = z.object({
  sourceId: z.string().uuid(),
  categories: z.array(
    z.object({
      name: z.string().min(1),
      entries: z.array(roleSourceBrowseEntrySchema),
    }),
  ),
});

export const companyRoleCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).nullable().optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  markdown: z.string().min(1),
});

export const companyRoleImportSchema = z.object({
  sourceId: z.string().uuid(),
  paths: z.array(z.string().min(1)).min(1),
});

export const companyRoleImportResultSchema = z.object({
  imported: z.array(companyRoleSchema),
  warnings: z.array(z.string()),
});

export const roleSourceCreateSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  ref: z.string().min(1).nullable().optional(),
});

export type RoleSourceCreate = z.infer<typeof roleSourceCreateSchema>;
export type CompanyRoleCreate = z.infer<typeof companyRoleCreateSchema>;
export type CompanyRoleImport = z.infer<typeof companyRoleImportSchema>;

export const companyRoleVisibilitySchema = z.object({
  hidden: z.boolean(),
  force: z.boolean().optional(),
});

export type CompanyRoleVisibility = z.infer<typeof companyRoleVisibilitySchema>;
