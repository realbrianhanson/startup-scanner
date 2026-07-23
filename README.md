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

Frontend (`.env`, auto-managed by Lovable Cloud):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Edge function secrets (set in Project Settings → Secrets):

- `LOVABLE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID`
- `RESEND_API_KEY`
- `CRON_SECRET`

## Supabase

- Migrations live under `supabase/migrations/` and apply in file order.
- Edge functions live under `supabase/functions/*` and deploy from that folder.

## Deploy

Publish through the Lovable Publish action. Hosting handles SPA fallback, HTTPS, and the `og:image` served at request time.

## Routes

Public (indexable): `/`, `/pricing`, `/sample-report`, `/privacy`, `/terms`.
Private (noindex): `/auth`, `/dashboard`, `/projects/new`, `/projects/:id/report`, `/projects/:id/chat`, `/settings`, `/admin`.
