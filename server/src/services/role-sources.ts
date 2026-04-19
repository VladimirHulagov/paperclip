import { eq, and } from "drizzle-orm";
import { mkdir, rm, readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";
import { roleSources } from "@paperclipai/db";
import type { Db } from "@paperclipai/db";

const execFile = promisify(execFileCb);

const ROLE_SOURCES_DIR = process.env.ROLE_SOURCES_DIR || "/tmp/role-sources";

function sourceCloneDir(sourceId: string) {
  return join(ROLE_SOURCES_DIR, sourceId);
}

function parseFrontmatter(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return result;
  const closing = normalized.indexOf("\n---\n", 4);
  if (closing < 0) return result;
  const frontmatter = normalized.slice(4, closing);
  for (const line of frontmatter.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx < 0) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    result[key] = val;
  }
  return result;
}

export function roleSourceService(db: Db) {
  return {
    async list(companyId: string) {
      return db
        .select()
        .from(roleSources)
        .where(eq(roleSources.companyId, companyId))
        .orderBy(roleSources.name);
    },

    async getById(companyId: string, sourceId: string) {
      const [row] = await db
        .select()
        .from(roleSources)
        .where(and(eq(roleSources.companyId, companyId), eq(roleSources.id, sourceId)));
      return row ?? null;
    },

    async create(companyId: string, data: { name: string; url: string; ref: string }) {
      const [row] = await db
        .insert(roleSources)
        .values({ companyId, ...data })
        .returning();
      return row;
    },

    async delete(companyId: string, sourceId: string) {
      await db
        .delete(roleSources)
        .where(and(eq(roleSources.companyId, companyId), eq(roleSources.id, sourceId)));
      try {
        await rm(sourceCloneDir(sourceId), { recursive: true, force: true });
      } catch {}
    },

    async browse(companyId: string, sourceId: string) {
      const source = await this.getById(companyId, sourceId);
      if (!source) throw new Error("Source not found");

      const cloneDir = sourceCloneDir(sourceId);

      try {
        await mkdir(cloneDir, { recursive: true });
        await execFile("git", ["rev-parse", "--is-inside-work-tree"], { cwd: cloneDir });
        await execFile("git", ["fetch", "origin"], { cwd: cloneDir });
        await execFile("git", ["checkout", source.ref], { cwd: cloneDir });
        await execFile("git", ["pull", "origin", source.ref], { cwd: cloneDir });
      } catch {
        await rm(cloneDir, { recursive: true, force: true });
        await mkdir(cloneDir, { recursive: true });
        try {
          await execFile("git", ["clone", "--branch", source.ref, "--depth", "1", source.url, cloneDir]);
        } catch {
          await rm(cloneDir, { recursive: true, force: true });
          await execFile("git", ["clone", "--depth", "1", source.url, cloneDir]);
          await execFile("git", ["checkout", source.ref], { cwd: cloneDir });
        }
      }

      const categories: { name: string; entries: { path: string; name: string; description: string | null; category: string }[] }[] = [];
      const topDirs = (await readdir(cloneDir)).filter((d) => !d.startsWith(".") && d !== "node_modules");

      for (const dir of topDirs) {
        const fullDir = join(cloneDir, dir);
        const dirStat = await stat(fullDir);
        if (!dirStat.isDirectory()) continue;

        const entries: { path: string; name: string; description: string | null; category: string }[] = [];
        const files = (await readdir(fullDir)).filter((f) => f.endsWith(".md"));

        for (const file of files) {
          const filePath = join(fullDir, file);
          const content = await readFile(filePath, "utf8");
          const parsed = parseFrontmatter(content);
          const relativePath = `${dir}/${file}`;
          entries.push({
            path: relativePath,
            name: parsed.name || file.replace(/\.md$/, ""),
            description: parsed.description || null,
            category: dir,
          });
        }

        if (entries.length > 0) {
          categories.push({ name: dir, entries });
        }
      }

      return { sourceId, categories };
    },

    async readFileFromSource(sourceId: string, relativePath: string) {
      const cloneDir = sourceCloneDir(sourceId);
      const filePath = join(cloneDir, relativePath);
      return readFile(filePath, "utf8");
    },
  };
}
