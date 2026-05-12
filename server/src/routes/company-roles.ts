import { Router } from "express";
import type { Db } from "@paperclipai/db";
import { companyRoleCreateSchema, companyRoleImportSchema, companyRoleVisibilitySchema } from "@paperclipai/shared";
import { validate } from "../middleware/validate.js";
import { companyRoleService } from "../services/company-roles.js";
import { assertCompanyAccess, getActorInfo } from "./authz.js";
import { logActivity } from "../services/activity-log.js";

export function companyRoleRoutes(db: Db) {
  const router = Router();
  const svc = companyRoleService(db);

  router.get("/companies/:companyId/roles", async (req, res) => {
    const companyId = req.params.companyId as string;
    assertCompanyAccess(req, companyId);
    const includeHidden = req.query.includeHidden === "true";
    const roles = await svc.list(companyId, { includeHidden });
    res.json(roles);
  });

  router.get("/companies/:companyId/roles/:roleId", async (req, res) => {
    const companyId = req.params.companyId as string;
    const roleId = req.params.roleId as string;
    assertCompanyAccess(req, companyId);
    const role = await svc.detail(companyId, roleId);
    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }
    res.json(role);
  });

  router.post(
    "/companies/:companyId/roles",
    validate(companyRoleCreateSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const role = await svc.create(companyId, req.body);
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.role_created",
        entityType: "company_role",
        entityId: role.id,
        details: { name: role.name, key: role.key },
      });
      res.status(201).json(role);
    },
  );

  router.delete("/companies/:companyId/roles/:roleId", async (req, res) => {
    const companyId = req.params.companyId as string;
    const roleId = req.params.roleId as string;
    assertCompanyAccess(req, companyId);
    await svc.deleteRole(companyId, roleId);
    const actor = getActorInfo(req);
    await logActivity(db, {
      companyId,
      actorType: actor.actorType,
      actorId: actor.actorId,
      agentId: actor.agentId,
      runId: actor.runId,
      action: "company.role_deleted",
      entityType: "company_role",
      entityId: roleId,
    });
    res.status(204).end();
  });

  router.patch(
    "/companies/:companyId/roles/:roleId",
    validate(companyRoleVisibilitySchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      const roleId = req.params.roleId as string;
      assertCompanyAccess(req, companyId);
      const result = await svc.setVisibility(companyId, roleId, req.body.hidden, req.body.force);
      if ("error" in result) {
        res.status(409).json({ error: result.error, assignedAgentCount: result.assignedAgentCount });
        return;
      }

      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: req.body.hidden ? "company.role_hidden" : "company.role_restored",
        entityType: "company_role",
        entityId: roleId,
        details: { hidden: req.body.hidden },
      });

      res.json({ hidden: req.body.hidden });
    },
  );

  router.post(
    "/companies/:companyId/roles/import",
    validate(companyRoleImportSchema),
    async (req, res) => {
      const companyId = req.params.companyId as string;
      assertCompanyAccess(req, companyId);
      const result = await svc.importFromSource(companyId, req.body.sourceId, req.body.paths);
      const actor = getActorInfo(req);
      await logActivity(db, {
        companyId,
        actorType: actor.actorType,
        actorId: actor.actorId,
        agentId: actor.agentId,
        runId: actor.runId,
        action: "company.roles_imported",
        entityType: "company",
        entityId: companyId,
        details: { count: result.imported.length, warnings: result.warnings },
      });
      res.status(201).json(result);
    },
  );

  return router;
}
