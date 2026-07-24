import { test, expect } from "@playwright/test";

test.describe("@smoke SEO + static assets", () => {
  test("robots.txt served", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/User-agent:\s*\*/i);
    expect(body).toMatch(/Sitemap:\s*https?:\/\//i);
  });

  test("sitemap.xml served with core URLs", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toMatch(/xml/i);
    const body = await res.text();
    expect(body).toContain("<urlset");
    expect(body).toMatch(/\/pricing/);
    expect(body).toMatch(/\/sample-report/);
  });

  test("manifest.json served as JSON", async ({ request }) => {
    const res = await request.get("/manifest.json");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.name).toBe("string");
    expect(Array.isArray(body.icons)).toBe(true);
  });

  test("og-image.png served as image", async ({ request }) => {
    const res = await request.get("/og-image.png");
    expect(res.status()).toBe(200);
    const ct = res.headers()["content-type"] ?? "";
    expect(ct).toMatch(/image\/(png|webp|jpeg)/i);
  });

  test("ordinary shared report route is noindex", async ({ page, request }) => {
    // Use a well-formed but non-existent UUID; SPA still renders and RouteSEO
    // sets noindex for non-sample /projects/:id/report.
    const url = "/projects/00000000-0000-0000-0000-000000000000/report";
    const res = await page.goto(url);
    expect(res?.ok()).toBeTruthy();
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toMatch(/noindex/i);
    // Suppress unused import lint if any.
    void request;
  });
});