import type { Page, ConsoleMessage } from "@playwright/test";

/**
 * Documented benign noise that must NOT trigger a failure.
 * Everything else counts as an unexpected error.
 */
const BENIGN_PATTERNS: RegExp[] = [
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /Download the React DevTools/i,
  // Third-party analytics/consent blockers on public site
  /gtag is not defined/i,
  // Non-fatal favicon 404s vary per environment
  /Failed to load resource:.*favicon/i,
];

export function collectConsoleErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  const onMsg = (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (BENIGN_PATTERNS.some((r) => r.test(text))) return;
    errors.push(text);
  };
  const onErr = (err: Error) => {
    const text = err.message || String(err);
    if (BENIGN_PATTERNS.some((r) => r.test(text))) return;
    errors.push(`pageerror: ${text}`);
  };
  page.on("console", onMsg);
  page.on("pageerror", onErr);
  return { errors };
}