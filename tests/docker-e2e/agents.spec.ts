import { expect, test } from "@playwright/test";
import {
  signIn,
  apiGet,
  apiPost,
  getCompanyId,
  createTestAgent,
} from "./fixtures";

test.describe("Agents", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("agents list renders", async ({ page }) => {
    await page.goto("/agents");
    await expect(page.getByText(/agent/i)).toBeVisible({ timeout: 15_000 });
  });

  test("agents list shows agent rows", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const agentsRes = await apiGet(
      page,
      `/api/companies/${companyId}/agents`
    );
    const agents = agentsRes.body as Array<{ id: string; name: string }>;
    if (agents.length === 0) return;

    await page.goto("/agents");
    await expect(
      page.locator("text=" + agents[0].name).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("navigate to agent detail", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const agentId = await createTestAgent(
      page,
      companyId,
      `Test Agent ${Date.now()}`
    );

    await page.goto("/agents");
    await page.goto(`/agents/${agentId}/dashboard`);
    await expect(page).toHaveURL(new RegExp(agentId), { timeout: 15_000 });
    await expect(page.locator("h2")).toBeVisible({ timeout: 10_000 });
  });

  test("agent detail has tabs", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const agentId = await createTestAgent(
      page,
      companyId,
      `Tab Test ${Date.now()}`
    );

    await page.goto(`/agents/${agentId}/dashboard`);

    for (const tab of ["Instructions", "Skills", "Configuration"]) {
      await expect(
        page.getByRole("tab", { name: tab })
      ).toBeVisible({ timeout: 10_000 });
    }
  });

  test("agent instructions tab loads", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const agentId = await createTestAgent(
      page,
      companyId,
      `Instr Test ${Date.now()}`
    );

    await page.goto(`/agents/${agentId}/instructions`);
    await expect(
      page.locator("text=AGENTS.md").or(page.locator("text=SOUL.md"))
    ).toBeVisible({ timeout: 10_000 });
  });
});
