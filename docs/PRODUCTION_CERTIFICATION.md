# Production Certification — Launch Gate

This document is the launch gate for Validifier. It separates what the
automated Playwright smoke suite proves from what a human owner must verify
by hand before flipping a release live.

## 1. Automated public checks (green in CI)

Covered by `tests/e2e` and `.github/workflows/e2e.yml`. All read-only, safe
to run against production.

- Homepage loads, single H1, primary CTA, sample entry, footer legal links,
  no horizontal overflow on mobile/desktop, no unexpected console errors.
- Pricing page shows current price, trial length, and credit facts; Pro CTA
  is enabled.
- Auth signup UI exposes required email/password and blocks empty submit
  (never creates an account).
- `/sample-report` resolves to the canonical sample, renders navigation and
  a score, exposes the sample conversion CTA, is indexable.
- Protected routes redirect signed-out users to `/auth?next=<encoded>`.
- Ordinary shared report route is `noindex`.
- `robots.txt`, `sitemap.xml`, `manifest.json`, `og-image.png` served.
- Public routes render (privacy/terms) and unknown routes hit the SPA 404.

**Sign-off:** the workflow must be green on the release commit.

## 2. Owner-only real-flow certification (manual)

These require real credentials, real inboxes, real billing, or physical
devices. They are **not** automated and **not** claimed as passing here.
The launch owner must tick each box on the release ticket.

- [ ] Real inbox: sign up with a fresh address, receive and click the
      verification email, land on the app authenticated.
- [ ] Password reset: request reset, receive email, complete reset flow.
- [ ] Stripe **test mode**: start Pro trial, verify webhook processed
      (`stripe_webhook_events.status = processed`), cancel before trial
      end, confirm no charge, then re-run purchase → refund cycle.
- [ ] Report generation end-to-end: create a project on a throwaway
      account, generate a Standard report, verify all 15 sections render,
      completion email received.
- [ ] Premium report generation on a Pro account.
- [ ] Chat with Cora: send 3 messages, verify credit decrement and no
      duplicate charges on retry.
- [ ] Transactional email delivery: welcome, completion, and credit
      warning emails all land in inbox (not spam) from the sending domain.
- [ ] Physical devices: latest iOS Safari and latest Android Chrome —
      complete a signup + sample-report view + pricing view without
      visual regressions.
- [ ] Database: verify point-in-time restore / backup is enabled and the
      most recent restore point is within RPO.
- [ ] Alerting: confirm the destinations for `operational_events` critical
      severity actually reach an on-call channel (test with a manual insert
      then resolve).
- [ ] `robots.txt` and `sitemap.xml` reflect the intended public surface;
      no staging URLs leaked.

## 3. Rollback / incident steps

If a release breaks production:

1. Revert the offending commit on `main` and let CI redeploy (fastest path
   when the change is code-only).
2. If the regression is in Edge Functions, redeploy the previous known-good
   function version from git history.
3. If the regression is in a migration, apply a corrective migration —
   never edit a shipped migration file. Use PITR only as a last resort and
   only after confirming the RTO/RPO impact with the owner.
4. Post a summary in the incident channel: what broke, blast radius,
   mitigation, follow-up owner. File a follow-up issue tagged `postmortem`.

## 4. Release sign-off template

Copy this into the release PR/issue and check each box.

```
Release: <commit SHA>
Date (UTC): <YYYY-MM-DD HH:MM>
Owner: <name>

Automated
- [ ] e2e workflow green on release commit
- [ ] Typecheck + build green

Owner-only real-flow
- [ ] Real inbox signup + verification
- [ ] Password reset
- [ ] Stripe test-mode trial + cancel + purchase + refund
- [ ] Standard report generation end-to-end
- [ ] Premium report generation
- [ ] Chat credit accounting
- [ ] Transactional email delivery
- [ ] iOS Safari + Android Chrome physical devices
- [ ] Backup / PITR verified
- [ ] Alert destinations verified

Sign-off: <owner name> — <YYYY-MM-DD>
```

No release goes live with an unchecked box in section 2 without an
explicit, dated waiver from the owner recorded on the release ticket.