import { expect, test } from "@playwright/test";
import { signIn, apiGet, apiPost } from "./fixtures";

test.describe("Instance Settings", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("settings page renders", async ({ page }) => {
    await page.goto("/settings/general");
    await expect(
      page.locator("text=General").first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("timezone selector visible", async ({ page }) => {
    await page.goto("/settings/general");
    await expect(
      page.locator("select").filter({ hasText: /UTC|Europe|America/ }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("time format toggle visible", async ({ page }) => {
    await page.goto("/settings/general");
    await expect(
      page.locator("text=24-hour").or(page.locator("text=12-hour"))
    ).toBeVisible({ timeout: 15_000 });
  });

  test("sign out button visible", async ({ page }) => {
    await page.goto("/settings/general");
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible({ timeout: 15_000 });
  });
});
