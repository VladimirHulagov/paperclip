import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { roleSourceCreateSchema } from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { roleSourceService } from "../services/role-sources.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { logActivity } from "../services/activity-log.js";

export function roleSourceRoutes(db: Db) {
  const router = Router();
  const svc = roleSourceService(db);

  router.get("/companies/:companyId/role-sources", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const sources = await svc.list(companyId);
    res.json(sources);
  });

  router.post(
    "/companies/:companyId/role-sources",
    validate(roleSourceCreateSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const ref = req.body.ref || "main";
      const source = await svc.create(companyId, { name: req.body.name, url: req.body.url, ref });
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.role_source_added",
        entityType: "company",
        entityId: companyId,
        details: { sourceId: source.id, url: source.url },
      });
      res.status(201).json(source);
    },
  );

  router.delete("/companies/:companyId/role-sources/:sourceId", async (req, res) => {
    const companyId = req.params.companyId as string;
    const sourceId = req.params.sourceId as string;
    assertCompanyAccess(req, companyId);
    await svc.delete(companyId, sourceId);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.role_source_removed",
      entityType: "company",
      entityId: companyId,
      details: { sourceId },
    });
    res.status(204).end();
  });

  router.get("/companies/:companyId/role-sources/:sourceId/browse", async (req, res) => {
    const companyId = req.params.companyId as string;
    const sourceId = req.params.sourceId as string;
    assertCompanyAccess(req, companyId);
    const result = await svc.browse(companyId, sourceId);
    res.json(result);
  });

  return router;
}
