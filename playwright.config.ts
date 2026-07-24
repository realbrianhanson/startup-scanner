import { defineConfig, devices } from "@playwright/test";

/**
 * Public smoke suite. Defaults to a local `vite preview` on 127.0.0.1:4173.
 * When BASE_URL is set (e.g. production run), no local server is spawned and
 * every test targets that URL read-only.
 */
const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const isExternal = Boolean(process.env.BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  webServer: isExternal
    ? undefined
    : {
        command: "bun run build && bun run preview -- --host 127.0.0.1 --port 4173 --strictPort",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});