import { test, expect } from "@playwright/test";

const PROTECTED = ["/dashboard", "/projects/new", "/settings", "/projects/00000000-0000-0000-0000-000000000000/chat"];

test.describe("@smoke protected routes redirect signed-out users", () => {
  for (const path of PROTECTED) {
    test(`redirects ${path} to /auth with encoded next`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(/\/auth\?.*next=/, { timeout: 15_000 });
      const url = new URL(page.url());
      expect(url.pathname).toBe("/auth");
      const next = url.searchParams.get("next");
      expect(next, "next param present").toBeTruthy();
      // Must be a relative same-site path.
      expect(next!.startsWith("/")).toBe(true);
      // Must not be an absolute URL to another origin.
      expect(next).not.toMatch(/^https?:/i);
    });
  }
});