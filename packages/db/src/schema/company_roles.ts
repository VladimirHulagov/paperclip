import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { roleSources } from "./role_sources.js";

export const companyRoles = pgTable(
  "company_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    sourceId: uuid("source_id").references(() => roleSources.id),
    key: text("key").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category"),
    markdown: text("markdown").notNull(),
    sourceType: text("source_type").notNull().default("local"),
    sourceRef: text("source_ref"),
    sourcePath: text("source_path"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyKeyUniqueIdx: uniqueIndex("company_roles_company_key_idx").on(
      table.companyId,
      table.key,
    ),
    companyNameIdx: index("company_roles_company_name_idx").on(
      table.companyId,
      table.name,
    ),
  }),
);
