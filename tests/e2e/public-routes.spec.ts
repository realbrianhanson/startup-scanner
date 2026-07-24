import { test, expect } from "@playwright/test";

const OK_ROUTES = ["/privacy", "/terms"];
// /contact and /security are not defined in the router; they must resolve to
// the SPA 404 view without throwing.
const NOT_FOUND_ROUTES = ["/contact", "/security", "/this-route-does-not-exist-xyz"];

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
});