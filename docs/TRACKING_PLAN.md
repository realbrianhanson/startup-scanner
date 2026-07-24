# Validifier Tracking Plan

All first-party analytics flows through `src/lib/analytics.ts` (browser) or
`supabase/functions/_shared/ops.ts` (server) into the `analytics_events` and
`operational_events` tables. This document is the contract.

## Privacy rules (never violate)

Never place any of the following into event names, properties, or operational
metadata:

- Emails, full names, or any other PII
- User-authored prose (project descriptions, chat messages, feedback text)
- URLs the user typed (websites they entered)
- Stripe customer, subscription, session, invoice, or price ids
- Raw error messages or stack traces
- Access tokens, secrets, JWTs
- `project_id` in browser events (server-side ownership already covers this)

Property values are capped to primitives, small string arrays, 200 char
strings, 25 keys, and 4KB total payload. Keys must match `[a-z0-9_]{1,40}`.

## Session context (auto-attached to every browser event)

- `session_id` — per-tab UUID stored in `sessionStorage`
- `viewport` — `mobile | tablet | desktop`
- `utm_source | utm_medium | utm_campaign | utm_content | utm_term` — first-touch, sanitized
- `referrer_host` — hostname only, stripped when same-origin
- `user_id` — from the cached auth session (null when signed out)
- `page_url` — `location.pathname` only (no query, no hash)

## Canonical events (`object_action` naming)

| Event | Where | Notes |
|---|---|---|
| `page_viewed` | `PageTracker` (once per pathname change) | `{ path }` |
| `landing_cta_clicked` | Landing hero + pricing teaser | `{ button, page }` |
| `user_signed_in` | Auth | `{ method }` |
| `signup_completed` | Auth (session established) | `{ method, has_referral }` |
| `signup_verification_required` | Auth (email confirm required) | `{ method, has_referral }` |
| `project_created` | Create project | `{ industry, input_method }` |
| `report_generation_started` | Report open/retry | `{ regenerate }` |
| `report_completed` | Server (`generate-validation-report`) | `{ quality, duration, resumed, sections }` |
| `report_generation_failed` | Server terminal catch | `{ reason }` |
| `chat_message_sent` | Chat | no properties |
| `checkout_started` | Pricing (client) | `{ plan }` |
| `checkout_created` | Server (`create-checkout-session`) | `{ plan }` |
| `trial_started` | Server (webhook) | `{ plan }` |
| `subscription_activated` | Server (webhook) | `{ plan }` |
| `subscription_cancelled` | Server (webhook) | — |
| `payment_failed` | Server (webhook, `invoice.payment_failed`) | — |
| `feedback_submitted` | Report feedback + testimonial | `{ rating?, kind }` |

## Legacy aliases (still readable — do NOT rewrite historical rows)

| Legacy | Current |
|---|---|
| `landing_page_view` | `page_viewed` (on `/`) |
| `cta_click` | `landing_cta_clicked` |
| `sign_up`, `auth_signup_complete` | `signup_completed` |
| `auth_verification_required` | `signup_verification_required` |
| `report_feedback_submitted`, `testimonial_submitted` | `feedback_submitted` |
| `pricing_page_view`, `sample_cta_click`, `sample_report_redirect` | ad-hoc; kept in raw stream |

The Admin → Analytics tab unions legacy signup aliases when counting signups.

## Conversion definitions (Launch cohort funnel)

Cohort: `profiles.created_at ≥ now() - period`.

1. **Signed up** — cohort size.
2. **Created a project** — cohort user with ≥1 row in `projects`.
3. **Completed a report** — cohort user with ≥1 `reports.generation_completed_at IS NOT NULL`.
4. **Used chat** — cohort user with ≥1 `chat_messages.role='user'`.
5. **Became paid** — cohort user whose `subscription_tier` is not `free`.
   A `stripe_customer_id` alone means a billing profile was created (checkout lead);
   it is reported separately as **Billing profiles** and never counted as paid.

Landing/CTA sessions use distinct `session_id` from browser events, unioning
legacy aliases.

## Operational events

`operational_events` is admin-only. Only edge functions (service role) insert.
Callers must use `logOpsEvent` and pass:

- `severity`: `info | warning | critical`
- `category`: e.g. `report_generation | billing | email | chat`
- `event_name`: `report_generation_failed | checkout_create_failed | payment_failed | email_send_failed | chat_failed | stripe_webhook_failed`
- Optional: `function_name`, `error_code`, `user_id`, `project_id`, small metadata

Health rollup (Admin → Launch):

- **Red** — any unresolved `critical` OR any Stripe webhook `failed` in the period.
- **Amber** — any unresolved `warning`, OR reports failed / stuck (>15 min heartbeat) in the period.
- **Green** — otherwise.

## QA checklist

- [ ] `page_viewed` fires exactly once per pathname change (spot-check via network tab)
- [ ] `session_id` is stable within a tab, changes on new tab
- [ ] UTM values captured on first entry and survive across pages
- [ ] Signed-out `page_viewed` has `user_id = null`; signed-in has the id
- [ ] Cookie-consent OFF: gtag not called, first-party still logs
- [ ] Admin → Launch loads with 7/30/90 selector and shows funnel
- [ ] Server report_completed appears after a successful report
- [ ] Force a report failure → `operational_events` row with severity `critical`
- [ ] `invoice.payment_failed` webhook → operational warning + `payment_failed` analytics
- [ ] No property in `analytics_events` or `operational_events` contains an email, name, project id in browser rows, URL text, or Stripe id