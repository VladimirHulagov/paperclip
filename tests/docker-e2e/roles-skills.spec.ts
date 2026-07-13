import { expect, test } from "@playwright/test";
import { signIn, apiGet, getCompanyId } from "./fixtures";

test.describe("Company Skills", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("skills page renders", async ({ page }) => {
    await page.goto("/skills");
    await expect(
      page.locator("text=Skills").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("skills page shows available count", async ({ page }) => {
    await page.goto("/skills");
    await expect(
      page.locator("text=/available/").or(page.locator("text=available"))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("skills list loads from API", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const { body } = await apiGet(
      page,
      `/api/companies/${companyId}/skills`
    );
    const skills = body as Array<{ id: string; name: string }>;

    await page.goto("/skills");
    if (skills.length > 0) {
      await expect(
        page.locator("text=" + skills[0].name).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe("Company Roles", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("roles page renders", async ({ page }) => {
    await page.goto("/roles");
    await expect(
      page.locator("text=Roles").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("roles list loads from API", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const { body } = await apiGet(
      page,
      `/api/companies/${companyId}/roles`
    );
    const roles = body as Array<{ id: string; name: string }>;

    await page.goto("/roles");
    if (roles.length > 0) {
      await expect(
        page.locator("text=" + roles[0].name).first()
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
