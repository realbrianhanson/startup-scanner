# Launch runbook

A 14-day controlled launch. Roles below are placeholders — assign real
people before day 0.

- **Launch owner**: overall coordination, go/no-go call.
- **Engineering**: build, deploy, on-call.
- **Support**: triage inbox, respond to users.

See also: [`TRACKING_PLAN.md`](./TRACKING_PLAN.md),
[`PRODUCTION_CERTIFICATION.md`](./PRODUCTION_CERTIFICATION.md).

## Pre-launch (D-14 → D-1)

| Day | Owner | Task |
|---|---|---|
| D-14 | Launch owner | Confirm beta exit criteria met (see BETA_PROGRAM.md). |
| D-13 | Engineering | Full production certification pass. |
| D-12 | Support | Confirm every support inbox routes to a monitored destination. |
| D-10 | Launch owner | Freeze copy on `/`, `/pricing`, `/security`, `/privacy`, `/terms`, `/contact`. |
| D-9 | Engineering | Verify Stripe live-mode price IDs and webhook signing secret. |
| D-8 | Engineering | Verify email sending domain + DKIM/SPF/DMARC. |
| D-7 | Launch owner | Publish `/security` and `/contact` externally; run a real disclosure email dry-run. |
| D-6 | Support | Draft canned replies (see below). |
| D-5 | Engineering | Run Playwright suite against production (read-only). |
| D-4 | Engineering | Confirm backup/PITR is enabled and restore drill documented. |
| D-3 | Launch owner | Content calendar loaded: Product Hunt, LinkedIn, X, community post, launch email. |
| D-2 | Launch owner | Go/no-go review against thresholds below. |
| D-1 | Engineering | Freeze non-critical deploys. |

## Daily owner checklist (through day 14)

- Open the Admin **Launch** tab. Note funnel deltas from yesterday.
- Triage any unresolved operational events (see OPERATIONS_RUNBOOK).
- Reply to every support email in the target SLA (2 business days).
- Post one channel update (LinkedIn or X) that isn't a repost.
- Note one qualitative learning in the launch log.

## Channel cadence

| Day | Channel |
|---|---|
| D0 | Launch email to opt-in list |
| D0 | Product Hunt live |
| D0 | LinkedIn post #1, X thread |
| D1 | Community post |
| D2 | LinkedIn post #2 |
| D3 | X post + owner reply thread |
| D5 | LinkedIn post #3, partner intro requests |
| D7 | Weekly recap email |
| D10 | LinkedIn post #4 with early customer quote (only with permission) |
| D14 | LinkedIn post #5 + weekly recap |

## Go / no-go thresholds

Do **not** launch on D0 if any of the following is true:

- Report generation failure rate over the last 7 days is above 5%.
- Any unresolved P0 operational event exists.
- Stripe webhook success rate under 99% (Admin Launch → Billing) OR any
  authoritative subscription-status discrepancy vs Stripe.
- Any user-facing page fails the Playwright smoke suite.
- Sending domain is not DKIM/SPF/DMARC aligned.
- Support inbox is unmonitored.

## Launch day (D0) hour-by-hour

All times in Launch owner's local timezone.

| Time | Owner | Task |
|---|---|---|
| 06:00 | Engineering | Deploy freeze in effect. Warm cache with a signed-out session on `/` and `/sample-report`. |
| 07:30 | Launch owner | Publish Product Hunt post. |
| 07:35 | Launch owner | Post maker comment on Product Hunt. |
| 08:00 | Launch owner | Send launch email. |
| 08:15 | Launch owner | Publish LinkedIn post #1 and X thread. |
| 09:00 | Support | First inbox sweep. |
| 10:00 | Engineering | First Admin Launch-tab review. Note anomalies. |
| 12:00 | Support | Second inbox sweep. |
| 13:00 | Launch owner | Reply to every Product Hunt comment. |
| 15:00 | Engineering | Second Admin review. |
| 17:00 | Support | Third inbox sweep. |
| 18:00 | Launch owner | Community update post. |
| 20:00 | Launch owner | End-of-day recap in launch log. |
| 22:00 | Engineering | Final Admin review; hand off overnight monitoring. |

## Monitoring routine

- Admin **Launch** tab: cohort funnel, report/billing/system health, 14-day
  trend, unresolved events.
- External uptime (once configured — see OPERATIONS_RUNBOOK).
- Stripe dashboard: failed payments, chargebacks.
- Email deliverability: bounce rate, complaint rate.

## Support SLA target

- First response: within 2 business days.
- P0 (payment issue, locked-out account, security concern): same day.
- P1 (report failure, chat broken): within 1 business day.

Canned replies live in a private support doc; do not commit real user
correspondence templates to the repo.

## Incident / rollback decision tree

1. **Is user data at risk?**
   - Yes → declare incident, page on-call, freeze deploys, notify affected
     users under the Incident Response section of `/security`.
   - No → continue.
2. **Is the site down or reports failing >20% for 15 minutes?**
   - Yes → roll back last deploy (Lovable version history or Git revert),
     post a status update, then investigate.
   - No → continue.
3. **Is billing wrong?**
   - Yes → pause paid-plan promotion (remove/hide the pricing CTAs) and
     ship a reviewed change that disables `create-checkout-session` (return
     503) or roll back the last deploy. Do not silently mutate production
     state or entitlements. Refunds are handled manually via Stripe.
   - No → continue.
4. **Everything else** → open a triage ticket, communicate ETA to
   affected users, fix forward.

## Post-launch review (D+14)

- Compare cohort funnel to targets in BETA_PROGRAM.md.
- List every P0/P1 that surfaced and its resolution.
- Decide: expand marketing, hold, or pause.
- Update this runbook with anything that was wrong or missing.