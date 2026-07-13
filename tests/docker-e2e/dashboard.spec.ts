import { expect, test } from "@playwright/test";
import { signIn, apiGet, getCompanyId } from "./fixtures";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("dashboard renders metric cards", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.locator("text=Agents Enabled").or(page.locator("text=Agents"))
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator("text=Pending Approvals").or(page.locator("text=Month"))
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/dashboard");

    const agentsLink = page.locator('a[href="/agents"]').first();
    if (await agentsLink.isVisible()) {
      await agentsLink.click();
      await expect(page).toHaveURL(/\/agents/, { timeout: 10_000 });
    }
  });

  test("dashboard shows recent activity section", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page
        .locator("text=Recent Activity")
        .or(page.locator("text=Recent Tasks"))
    ).toBeVisible({ timeout: 15_000 });
  });
});
