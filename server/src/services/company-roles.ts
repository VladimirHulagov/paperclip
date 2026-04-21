import { eq, and } from "drizzle-orm";
import { companyRoles, agents } from "@paperclipai/db";
import type { Db } from "@paperclipai/db";
import { roleSourceService } from "./role-sources.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const result: Record<string, string> = {};
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { frontmatter: result, body: content };
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) return { frontmatter: result, body: content };
  const frontmatter = normalized.slice(4, closing);
  for (const line of frontmatter.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    result[key] = val;
  }
  return { frontmatter: result, body: normalized.slice(closing + 5) };
}

export function companyRoleService(db: Db) {
  const sources = roleSourceService(db);

  return {
    async list(companyId: string) {
      const roles = await db
        .select()
        .from(companyRoles)
        .where(eq(companyRoles.companyId, companyId))
        .orderBy(companyRoles.name);

      const agentRows = await db
        .select({ adapterConfig: agents.adapterConfig })
        .from(agents)
        .where(eq(agents.companyId, companyId));

      const agentRoleCounts = new Map<string, number>();
      for (const row of agentRows) {
        const config = typeof row.adapterConfig === "object" && row.adapterConfig !== null
          ? (row.adapterConfig as Record<string, unknown>)
          : {};
        const roleKey = config.assignedRole;
        if (typeof roleKey === "string" && roleKey) {
          agentRoleCounts.set(roleKey, (agentRoleCounts.get(roleKey) || 0) + 1);
        }
      }

      return roles.map((r) => ({
        id: r.id,
        companyId: r.companyId,
        key: r.key,
        slug: r.slug,
        name: r.name,
        description: r.description,
        category: r.category,
        sourceType: r.sourceType,
        sourcePath: r.sourcePath,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        assignedAgentCount: agentRoleCounts.get(r.key) || 0,
      }));
    },

    async detail(companyId: string, roleId: string) {
      const [row] = await db
        .select()
        .from(companyRoles)
        .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.id, roleId)));
      if (!row) return null;

      const agentRows = await db
        .select({ id: agents.id, name: agents.name, adapterConfig: agents.adapterConfig })
        .from(agents)
        .where(eq(agents.companyId, companyId));

      const usedByAgents = agentRows.filter((a) => {
        const config = typeof a.adapterConfig === "object" && a.adapterConfig !== null
          ? (a.adapterConfig as Record<string, unknown>)
          : {};
        return config.assignedRole === row.key;
      }).map((a) => ({ id: a.id, name: a.name, urlKey: a.name.toLowerCase().replace(/\s+/g, "-") }));

      return {
        ...row,
        assignedAgentCount: usedByAgents.length,
        usedByAgents,
      };
    },

    async getByKey(companyId: string, key: string) {
      const [row] = await db
        .select()
        .from(companyRoles)
        .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.key, key)));
      return row ?? null;
    },

    async create(companyId: string, data: { name: string; slug?: string | null; description?: string | null; category?: string | null; markdown: string }) {
      const slug = data.slug || slugify(data.name);
      const key = `local/${slug}`;
      const [row] = await db
        .insert(companyRoles)
        .values({
          companyId,
          key,
          slug,
          name: data.name,
          description: data.description || null,
          category: data.category || null,
          markdown: data.markdown,
          sourceType: "local",
        })
        .onConflictDoUpdate({
          target: [companyRoles.companyId, companyRoles.key],
          set: {
            name: data.name,
            description: data.description || null,
            category: data.category || null,
            markdown: data.markdown,
            updatedAt: new Date(),
          },
        })
        .returning();
      return row;
    },

    async update(companyId: string, roleId: string, data: Partial<{ name: string; description: string | null; category: string | null; markdown: string }>) {
      const [row] = await db
        .update(companyRoles)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.id, roleId)))
        .returning();
      return row ?? null;
    },

    async deleteRole(companyId: string, roleId: string) {
      await db
        .delete(companyRoles)
        .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.id, roleId)));
    },

    async importFromSource(companyId: string, sourceId: string, paths: string[]) {
      const source = await sources.getById(companyId, sourceId);
      if (!source) throw new Error("Source not found");

      const imported: typeof companyRoles.$inferSelect[] = [];
      const warnings: string[] = [];

      for (const relativePath of paths) {
        try {
          const content = await sources.readFileFromSource(sourceId, relativePath);
          const { frontmatter } = parseFrontmatter(content);

          const fileName = relativePath.split("/").pop() || relativePath;
          const rawSlug = slugify(frontmatter.name || fileName.replace(/\.md$/, ""));
          const category = relativePath.split("/")[0] || "uncategorized";
          const key = `${slugify(source.name)}/${category}/${rawSlug}`;

          const [row] = await db
            .insert(companyRoles)
            .values({
              companyId,
              sourceId,
              key,
              slug: rawSlug,
              name: frontmatter.name || fileName.replace(/\.md$/, ""),
              description: frontmatter.description || null,
              category,
              markdown: content,
              sourceType: "git",
              sourceRef: source.ref,
              sourcePath: relativePath,
              metadata: Object.keys(frontmatter).length > 0 ? frontmatter : null,
            })
            .onConflictDoUpdate({
              target: [companyRoles.companyId, companyRoles.key],
              set: {
                name: frontmatter.name || fileName.replace(/\.md$/, ""),
                description: frontmatter.description || null,
                markdown: content,
                sourceRef: source.ref,
                sourcePath: relativePath,
                metadata: Object.keys(frontmatter).length > 0 ? frontmatter : null,
                updatedAt: new Date(),
              },
            })
            .returning();

          if (row) imported.push(row);
        } catch (err) {
          warnings.push(`Failed to import ${relativePath}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return { imported, warnings };
    },

    async resolveRoleKey(companyId: string, ref: string) {
      const isUuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref);

      const [byKey] = await db
        .select()
        .from(companyRoles)
        .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.key, ref)));
      if (byKey) return byKey.key;

      const [bySlug] = await db
        .select()
        .from(companyRoles)
        .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.slug, ref)));
      if (bySlug) return bySlug.key;

      if (isUuidLike) {
        const [byId] = await db
          .select()
          .from(companyRoles)
          .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.id, ref)));
        if (byId) return byId.key;
      }

      return null;
    },
  };
}
