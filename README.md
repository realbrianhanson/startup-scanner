# Validifier

Validifier turns a business idea into a go / no-go decision. Each report is a 15-section evidence-backed brief covering market sizing, competitive landscape, financial projections, risks, and a 30-day action plan — generated in about 2–3 minutes.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router v6
- Supabase (Postgres, Auth, RLS, Realtime, Edge Functions on Deno)
- Google Gemini via the Lovable AI Gateway
- Stripe (subscriptions + webhooks)
- Resend (transactional email)

## Local development

```bash
bun install          # or: npm install
bun run dev          # start Vite on http://localhost:8080
bunx tsgo --noEmit   # typecheck
bun run build        # production build
```

## Required environment variables

Frontend (`.env`, auto-managed by Lovable Cloud — do not edit):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Edge function runtime values (provided automatically by Lovable Cloud / Supabase, no action needed):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Edge function secrets (set manually in Project Settings → Secrets):

- `LOVABLE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `RESEND_API_KEY`
- `CRON_SECRET`
- `FIRECRAWL_API_KEY`

Optional edge function overrides (defaults apply when unset):

- `APP_BASE_URL` — public site URL used in transactional email links (defaults to `https://validifier.com`).
- `PREMIUM_MODEL` — Lovable AI Gateway model for premium reports (defaults to `google/gemini-3.1-pro-preview`).
- `FAST_MODEL` — Lovable AI Gateway model for standard reports and chat (defaults to `google/gemini-3-flash-preview`).

## Supabase

- Migrations live under `supabase/migrations/` and apply in file order.
- Edge functions live under `supabase/functions/*` and deploy from that folder.

## Deploy

Publish through the Lovable Publish action. Hosting handles SPA fallback, HTTPS, and the `og:image` served at request time.

## Routes

Public (indexable): `/`, `/pricing`, `/sample-report`, `/privacy`, `/terms`.
Private (noindex): `/auth`, `/dashboard`, `/projects/new`, `/projects/:id/report`, `/projects/:id/chat`, `/settings`, `/admin`.

## End-to-end tests (Playwright)

Public smoke suite in `tests/e2e`. Every test is read-only and safe to run
against production.

```bash
# Local: builds and previews on 127.0.0.1:4173 automatically.
bun run test:e2e

# Local headed (debug).
bun run test:e2e:headed

# Production smoke against https://validifier.com (chromium only).
bun run test:e2e:prod

# One-off: point at any URL without spawning a server.
BASE_URL=https://staging.example.com bunx playwright test
```

Artifacts on failure:

- HTML report: `playwright-report/index.html`
- Traces / screenshots / videos: `test-results/`

### What the suite covers

- Homepage title, single H1, primary signup CTA, sample entry, footer legal
  links, no horizontal overflow, no unexpected console errors.
- Pricing truthful copy (`$29`, 7-day trial, 15/100 credits) and enabled Pro CTA.
- Auth signup UI surface + native validation (never submits).
- `/sample-report` resolves to the canonical sample, renders navigation and
  score, indexable canonical.
- Protected routes redirect signed-out users to `/auth?next=<encoded>`.
- Ordinary shared report route is `noindex`.
- `robots.txt`, `sitemap.xml`, `manifest.json`, `og-image.png` served.
- Public routes render and unknown routes hit the SPA 404.

### Forbidden in the public production smoke run

- Creating accounts, signing in, or verifying real inboxes.
- Any Stripe checkout, purchase, refund, or subscription mutation.
- Generating reports, sending emails, or writing to user-owned tables.
- Chat/regenerate/download/feedback mutations on the sample or any report.
- Anything that writes to production data or spends AI credits.

See `docs/PRODUCTION_CERTIFICATION.md` for the launch gate and the
owner-only real-flow checks that must be performed by hand.
