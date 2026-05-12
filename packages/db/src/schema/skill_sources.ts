import {
  pgTable,
  uuid,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const skillSources = pgTable(
  "skill_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    name: text("name").notNull(),
    repoUrl: text("repo_url"),
    ref: text("ref").notNull().default("main"),
    sourceType: text("source_type").notNull(),
    sourceLocator: text("source_locator"),
    sourceKind: text("source_kind").notNull().default("git"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyTypeLocatorIdx: uniqueIndex("skill_sources_company_type_locator_idx").on(
      table.companyId,
      table.sourceType,
      table.sourceLocator,
    ),
  }),
);
