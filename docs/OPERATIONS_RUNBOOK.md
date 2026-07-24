# Operations runbook

Day-to-day operating instructions for the launch owner and on-call
engineer. This document is procedural — it never asks you to insert fake
production data.

## Daily routine

Open the Admin **Launch** tab and review:

- Cohort funnel: accounts created → verified signup → created project →
  completed report → used chat → trialing → active subscription. Investigate
  any single-day drop >30% vs the prior 7-day median.
- Report health: started / completed / failed / stuck counts.
- Billing health: Stripe webhook failed count and stale processing count.
- Unresolved incidents: counts by severity (`critical`, `warning`, `info`).
- 14-day trend: accounts created, projects and completed reports per day.

## Weekly routine

- Reconcile active subscriptions (`profiles.subscription_status = 'active'`)
  and trials (`subscription_status = 'trialing'`) against Stripe. Investigate
  any discrepancy.
- Skim the analytics view (legacy tab) for unusual funnel divergence
  between signup aliases.
- Confirm backup/PITR is still enabled and no failure alerts fired.
- Review the unresolved operational events list; the launch owner triages
  anything older than 7 days (no automated escalation is configured).

## Metric definitions

- **Landing session**: `page_viewed` with `page_url = '/'`, unique per
  session id. Legacy `landing_page_view` events are counted regardless of
  URL for historical parity.
- **Accounts created**: `profiles.created_at` in period.
- **Verified signup**: account whose `auth.users.email_confirmed_at` is set.
  This is the denominator for every post-verification funnel step in Admin
  Launch.
- **Report completed**: server-authoritative `report_completed` event
  emitted at finalization.
- **Trialing**: `subscription_status = 'trialing'`.
- **Active subscription**: `subscription_status = 'active'`. Only this
  counts as "paid" in Launch.
- **Past due**: `subscription_status = 'past_due'`.
- **Pro-tier user**: `subscription_tier <> 'free'`. Includes trialing,
  active, past_due and unknown — this is an entitlement view, not revenue.
- **Billing profile**: `stripe_customer_id IS NOT NULL`. A checkout lead
  only; never counted as paid.

## Triage: report events

- `report_generation_failed`: check if a specific section is disproportionate;
  if so, isolate the section prompt.
- Repeated failures for the same `project_id` within an hour: mark the
  project stuck, offer a manual regenerate.
- Widespread failures (>5% of the last hour): treat as P0 incident.

## Triage: email events

- Sending failures from `send-email`: check provider status page; if
  provider healthy, verify SPF/DKIM/DMARC.
- Hard bounces: mark the address as suppressed. Do not re-send.

## Triage: chat events

- Chat 5xx surges: verify the AI provider status, then the
  `chat-with-cora` edge function logs.
- Credit release failures: confirm `release_ai_credits` succeeded; if not,
  manually reconcile from the ai_usage_logs and open a fix ticket.

## Triage: billing events

- `payment_failed`: never retry silently. Rely on Stripe's dunning flow.
  Send a support email only if the user opens a ticket.
- `subscription_cancelled`: no action; email lifecycle handles the
  confirmation.
- Any webhook signature failure: treat as P0. Investigate before
  processing further events.

## Severity policy

| Severity | Definition | Response |
|---|---|---|
| P0 (critical) | User data at risk, service down, billing wrong at scale. | Page on-call. Freeze deploys. Public status update. |
| P1 (warning) | Elevated failure rate, degraded flow, single-user billing issue. | Address inside 1 business day. Fix forward. |
| P2 (info) | Anomaly worth noting; no user impact. | Log and revisit weekly. |

## Resolve criteria

An operational event may be resolved only when:

1. The underlying trigger is fixed OR determined to be benign, AND
2. Any user-visible remediation (regenerate, refund, credit) is completed.

Resolution is recorded via the admin UI — the migration limits authenticated
users to updating `resolved_at` and `resolved_by` only. Do not attempt to
edit `metadata` after the fact. Because `operational_events` has no note
column, keep incident context in a private internal ticket and reference
that ticket from the postmortem — do not embed user or project UUIDs in
public issues.

## Evidence collection (no PII)

When capturing evidence for a bug or incident:

- Do not paste raw email addresses, project titles, or idea descriptions
  into public issues or chat.
- Refer to users and projects by an internal ticket reference, not by
  raw UUIDs (the operational_events UI does not surface project ids).
- Screenshot only the affected UI region.
- Redact Stripe IDs, session tokens, and API keys.

## Escalation

1. Support triages first.
2. Engineering picks up anything Support cannot resolve inside 4 hours.
3. Launch owner is paged for anything meeting P0 criteria or any billing
   dispute over $500.

## Rollback

- Prefer rollback over hotfix during the launch window.
- Use the platform's version history OR revert the last commit through
  the connected Git repo.
- After rollback: post a status update, then investigate and fix forward.

## External alerting checklist (owner to complete)

These items are not implemented in the repo — they are owner-configurable
integrations. Do not claim they are active until the owner personally
enables and tests them.

- [ ] Uptime monitor pointed at `https://validifier.com/`, `/sample-report`,
      and `/pricing` (public routes only).
- [ ] Error tracking (e.g. Sentry) wired to the frontend and edge functions.
- [ ] On-call destination (email, SMS, or PagerDuty) reachable outside
      business hours.
- [ ] Weekly summary email delivered to launch owner.

## Backup / PITR verification

- Confirm point-in-time recovery is enabled on the production database.
- Every quarter, run a **restore drill** in a non-production environment:
  1. Restore the latest snapshot into a scratch project.
  2. Verify a random report row exists and renders in a local build.
  3. Delete the scratch project.
- Record the drill date in this runbook — do NOT insert synthetic
  incidents into production.