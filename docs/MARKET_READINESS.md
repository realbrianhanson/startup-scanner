# Market readiness index

This is the operating kit for taking Validifier from "code complete" to a controlled
launch. Every document here is copy-paste ready but assumes an owner will fill in
company-, jurisdiction-, and person-specific details.

## Shipped and automated

- Product: 15-section validation reports, Cora chat, Free (15 credits/mo) and Pro
  ($29/mo, 7-day trial, 100 credits/mo). See [`src/lib/productFacts.ts`](../src/lib/productFacts.ts).
- Security & data integrity migrations, atomic credit RPCs, verified idempotent
  Stripe webhooks, resumable report generation. See [`SECURITY memory`](../SECURITY_MEMORY.md) if present and repo migrations.
- Analytics: normalized paths, sanitized event props, launch dashboard RPC. See
  [`TRACKING_PLAN.md`](./TRACKING_PLAN.md).
- Public trust pages: `/privacy`, `/terms`, `/contact`, `/security`.
- Public E2E smoke suite (Playwright) + CI. See root [`README.md`](../README.md).

## Ready for owner execution

- [Beta program plan](./BETA_PROGRAM.md)
- [Demo script](./DEMO_SCRIPT.md)
- [Go-to-market kit](./GO_TO_MARKET_KIT.md)
- [Email lifecycle copy](./EMAIL_LIFECYCLE.md)
- [Launch runbook](./LAUNCH_RUNBOOK.md)
- [Operations runbook](./OPERATIONS_RUNBOOK.md)
- [Legal & business checklist](./LEGAL_BUSINESS_CHECKLIST.md)
- [Production certification](./PRODUCTION_CERTIFICATION.md)

## Blocked on owner or external credentials

- Legal entity, registered address, and jurisdiction on public pages.
- Custom email sending domain (SPF/DKIM/DMARC) and support inbox routing.
- Stripe live-mode price IDs, product descriptions, and statement descriptor.
- External monitoring destinations (uptime, error tracking, on-call).
- Backup restore drill against a non-production project.
- Founder story, real user quotes, and any case studies (all templated, none fabricated).

> None of these should be marked "done" in the checklists until the owner
> personally completes them. Do not fabricate values as placeholders in production.