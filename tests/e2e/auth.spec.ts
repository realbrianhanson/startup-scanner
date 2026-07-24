import { test, expect } from "@playwright/test";

/**
 * READ-ONLY: never submits a valid signup. We only assert the form surface
 * and native validation. We intentionally never call page.route or intercept
 * Supabase calls so a real account is never created against production.
 */
test.describe("@smoke auth signup UI", () => {
  test("signup mode exposes email + password fields and blocks empty submit", async ({ page }) => {
    await page.goto("/auth?mode=signup");

    // Required fields
    const email = page.getByLabel(/^email$/i).first();
    const password = page.getByLabel(/^password$/i).first();
    await expect(email).toBeVisible();
    await expect(email).toHaveAttribute("type", "email");
    await expect(email).toHaveAttribute("required", "");
    await expect(password).toBeVisible();
    await expect(password).toHaveAttribute("required", "");

    // Submit button visible
    const submit = page.getByRole("button", { name: /create free account|sign up/i }).first();
    await expect(submit).toBeVisible();

    // Attempting to submit empty must NOT navigate away from /auth
    // (native form validation blocks submission).
    await submit.click({ trial: false });
    await expect(page).toHaveURL(/\/auth(\?|$)/);

    // Confirm native validity — email is invalid when empty.
    const emailValid = await email.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(emailValid).toBe(false);
  });
});