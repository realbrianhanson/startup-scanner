import { test, expect } from "@playwright/test";

test.describe("@smoke pricing", () => {
  test("shows truthful price, trial, credits, and enabled Pro CTA", async ({ page }) => {
    const response = await page.goto("/pricing");
    expect(response?.ok()).toBeTruthy();
    await expect(page).toHaveTitle(/pricing|validifier/i);

    // Truthful copy
    await expect(page.getByText(/\$29/).first()).toBeVisible();
    await expect(page.getByText(/7-?day/i).first()).toBeVisible();
    await expect(page.getByText(/15 credits/i).first()).toBeVisible();
    await expect(page.getByText(/100 credits/i).first()).toBeVisible();

    // Pro CTA is present and not disabled.
    const proCta = page.getByRole("button", { name: /start.*free trial|start 7-?day/i }).first();
    await expect(proCta).toBeVisible();
    await expect(proCta).toBeEnabled();
  });
});