import { expect, type Page } from "@playwright/test";

const ADMIN_EMAIL =
  process.env.PAPERCLIP_DOCKER_E2E_EMAIL ?? "admin@test.local";
const ADMIN_PASSWORD =
  process.env.PAPERCLIP_DOCKER_E2E_PASSWORD ?? "password";

export async function signIn(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });

  await page.locator('input[type="email"]').fill(ADMIN_EMAIL);
  await page.locator('input[type="password"]').fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });
}

export async function apiGet(
  page: Page,
  path: string
): Promise<{ status: number; body: unknown }> {
  const baseUrl = new URL(page.url()).origin;
  const res = await page.request.get(`${baseUrl}${path}`);
  return { status: res.status(), body: await res.json() };
}

export async function apiPost(
  page: Page,
  path: string,
  data: Record<string, unknown>
): Promise<{ status: number; body: unknown }> {
  const baseUrl = new URL(page.url()).origin;
  const res = await page.request.post(`${baseUrl}${path}`, { data });
  return { status: res.status(), body: await res.json() };
}

export async function getCompanyId(page: Page): Promise<string> {
  const { body } = await apiGet(page, "/api/companies");
  const companies = body as Array<{ id: string; name: string }>;
  if (companies.length === 0) throw new Error("No companies found");
  return companies[0].id;
}

export async function createTestAgent(
  page: Page,
  companyId: string,
  name: string
): Promise<string> {
  const { body } = await apiPost(page, `/api/companies/${companyId}/agents`, {
    name,
    assignedRole: "worker",
    adapterType: "hermes_local",
  });
  const agent = body as { id: string };
  return agent.id;
}

export async function createTestIssue(
  page: Page,
  companyId: string,
  opts: { title: string; description?: string; assigneeAgentId?: string }
): Promise<string> {
  const payload: Record<string, unknown> = { title: opts.title };
  if (opts.description) payload.description = opts.description;
  if (opts.assigneeAgentId) payload.assigneeAgentId = opts.assigneeAgentId;
  const { body } = await apiPost(
    page,
    `/api/companies/${companyId}/issues`,
    payload
  );
  const issue = body as { id: string };
  return issue.id;
}
