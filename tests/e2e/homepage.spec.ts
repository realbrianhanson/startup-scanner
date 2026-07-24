import { test, expect } from "@playwright/test";
import { collectConsoleErrors } from "./helpers/console";

test.describe("@smoke homepage", () => {
  test("loads with title, H1, primary CTA, sample entry, footer legal links", async ({ page }) => {
    const { errors } = collectConsoleErrors(page);
    const response = await page.goto("/");
    expect(response?.ok(), "homepage should return 2xx").toBeTruthy();

    await expect(page).toHaveTitle(/Validifier/i);

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
    await expect(h1s.first()).toBeVisible();

    // Primary signup / start-free CTA — accept any of the truthful labels.
    const signupCta = page.getByRole("link", { name: /start (free|for free)|create free account|get started/i }).first();
    await expect(signupCta).toBeVisible();

    // Sample report entry point (link or button)
    const sample = page
      .getByRole("link", { name: /sample|see (a )?report|view sample/i })
      .or(page.getByRole("button", { name: /sample|see (a )?report|view sample/i }))
      .first();
    await expect(sample).toBeVisible();

    // Footer legal links
    const footer = page.locator("footer").first();
    await expect(footer).toBeVisible();
    await expect(footer.getByRole("button", { name: /privacy/i }).or(footer.getByRole("link", { name: /privacy/i })).first()).toBeVisible();
    await expect(footer.getByRole("button", { name: /terms/i }).or(footer.getByRole("link", { name: /terms/i })).first()).toBeVisible();

    expect(errors, `unexpected console errors:\n${errors.join("\n")}`).toEqual([]);
  });

  test("no horizontal overflow at the active viewport", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => {
      const de = document.documentElement;
      return { sw: de.scrollWidth, cw: de.clientWidth };
    });
    // Allow tiny sub-pixel rounding differences.
    expect(overflow.sw - overflow.cw).toBeLessThanOrEqual(2);
  });
});