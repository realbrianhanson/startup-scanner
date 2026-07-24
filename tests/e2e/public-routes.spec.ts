import { test, expect } from "@playwright/test";

const OK_ROUTES = ["/privacy", "/terms", "/contact", "/security"];
const NOT_FOUND_ROUTES = ["/this-route-does-not-exist-xyz"];

test.describe("@smoke public routes", () => {
  for (const path of OK_ROUTES) {
    test(`${path} renders`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });
  }

  for (const path of NOT_FOUND_ROUTES) {
    test(`${path} renders SPA not-found view`, async ({ page }) => {
      await page.goto(path);
      // NotFound page shows a 404 marker.
      await expect(page.getByText(/404|not.*found|page.*doesn.?t exist/i).first()).toBeVisible();
    });
  }

  test("/contact exposes support and security mailtos", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { level: 1, name: /contact/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /support@validifier\.com/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /security@validifier\.com/ }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /privacy@validifier\.com/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /legal@validifier\.com/ })).toBeVisible();
  });

  test("/security is truthful and does not claim certifications", async ({ page }) => {
    await page.goto("/security");
    await expect(page.getByRole("heading", { level: 1, name: /security/i })).toBeVisible();
    await expect(page.getByText(/not a certification/i)).toBeVisible();
    const body = (await page.locator("main").innerText()).toLowerCase();
    for (const forbidden of [
      "soc 2 certified",
      "iso 27001 certified",
      "hipaa compliant",
      "pci compliant",
      "gdpr certified",
      "penetration tested",
      "bug bounty reward",
    ]) {
      expect(body, `security page must not claim: ${forbidden}`).not.toContain(forbidden);
    }
  });
});