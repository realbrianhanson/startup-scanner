import { test, expect } from "@playwright/test";
import { collectConsoleErrors } from "./helpers/console";

/**
 * READ-ONLY sample report: we visit and assert render. We never trigger
 * regenerate, download, chat, or feedback mutations.
 */
test.describe("@smoke sample report", () => {
  test("/sample-report renders navigation, score, and sample CTA", async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    await page.goto("/sample-report");
    // Resolves to /projects/:id/report?sample=1
    await page.waitForURL(/\/projects\/[0-9a-f-]{36}\/report\?sample=1/, { timeout: 20_000 });

    // Meaningful content: a heading (report title) and a numeric score.
    await expect(page.locator("h1, h2").first()).toBeVisible();
    await expect(page.getByText(/\b(\d{1,3})\s*\/\s*100\b|score/i).first()).toBeVisible();

    // Navigation (section jump list or sidebar) present.
    await expect(
      page
        .getByRole("navigation")
        .or(page.getByRole("combobox"))
        .or(page.locator('[data-testid="report-navigation"]'))
        .first()
    ).toBeVisible();

    // Public sample CTA: get your own / start free variants.
    await expect(
      page.getByRole("link", { name: /start (free|for free)|get (your|my) (own )?report|create.*account/i })
        .or(page.getByRole("button", { name: /start (free|for free)|get (your|my) (own )?report|create.*account/i }))
        .first()
    ).toBeVisible();

    // Canonical points to /sample-report and it is indexable.
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/sample-report$/);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").not.toMatch(/noindex/i);

    expect(errors, `unexpected console errors:\n${errors.join("\n")}`).toEqual([]);
  });
});