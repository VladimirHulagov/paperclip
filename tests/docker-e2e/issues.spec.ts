import { expect, test } from "@playwright/test";
import {
  signIn,
  apiGet,
  createTestIssue,
  getCompanyId,
} from "./fixtures";

test.describe("Issues", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("issues list renders", async ({ page }) => {
    await page.goto("/issues");
    await expect(page).toHaveURL(/\/issues/, { timeout: 15_000 });
  });

  test("issues list shows existing issues", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const issueId = await createTestIssue(page, companyId, {
      title: `Test Issue ${Date.now()}`,
    });

    await page.goto("/issues");
    await expect(
      page.locator(`text=Test Issue`).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("issue detail page renders", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const title = `Detail Test ${Date.now()}`;
    const issueId = await createTestIssue(page, companyId, { title });

    await page.goto(`/issues/${issueId}`);
    await expect(page).toHaveURL(new RegExp(issueId), { timeout: 15_000 });
    await expect(page.locator("text=" + title)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("issue detail has comments tab", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const issueId = await createTestIssue(page, companyId, {
      title: `Comment Test ${Date.now()}`,
    });

    await page.goto(`/issues/${issueId}`);
    await expect(
      page.getByRole("tab", { name: /comment/i })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("issue detail has activity tab", async ({ page }) => {
    const companyId = await getCompanyId(page);
    const issueId = await createTestIssue(page, companyId, {
      title: `Activity Test ${Date.now()}`,
    });

    await page.goto(`/issues/${issueId}`);
    await expect(
      page.getByRole("tab", { name: /activity/i })
    ).toBeVisible({ timeout: 10_000 });
  });
});
