# Email lifecycle

Staging copy only — no email in this document is live-scheduled. The owner
decides when to enable each one. All copy is plain text. All senders should
be a properly authenticated domain (SPF/DKIM/DMARC — see
[`LEGAL_BUSINESS_CHECKLIST.md`](./LEGAL_BUSINESS_CHECKLIST.md)).

Every email in this document follows the same rules:

- One clear CTA. Never two.
- Include an unsubscribe link if the audience is not strictly transactional.
- Suppression: never send to a user whose account is deleted, whose email is
  hard-bounced, or who has unsubscribed from that category.
- Idempotency: gate on a per-user, per-event key (e.g.
  `email:report-ready:{report_id}`) so a retry or duplicate trigger cannot
  double-send.

---

## 1. Verification reminder

- **Trigger**: user signed up 30 minutes ago and has not verified email.
- **Audience**: any user with unverified `auth.users.email_confirmed_at`.
- **Exclusions**: users who verified in the interim.
- **CTA**: Resend/complete verification.
- **Suppression key**: `verification-reminder:{user_id}` — send once.
- **Success metric**: verification completion within 24 hours of signup.

```
Subject: Confirm your Validifier email

Hi,

You started signing up for Validifier but haven't confirmed your email
yet. Click the link in the verification email we sent to activate your
account.

Didn't get it? Request another verification link:
https://validifier.com/auth?mode=signup

If this wasn't you, ignore this note and no account will be created.

— Validifier
```

---

## 2. Welcome

- **Trigger**: email verified for the first time.
- **Audience**: new verified users.
- **CTA**: Create your first report.
- **Suppression key**: `welcome:{user_id}` — send once.
- **Success metric**: first project created within 24 hours.

```
Subject: Welcome to Validifier — your first report is on us

Hi,

Your Validifier account is live. The Free plan includes 15 credits per
month — enough for one full 15-section report plus 10 follow-up chats
with Cora.

Start your first report:
https://validifier.com/projects/new

Not ready? Take the sample report for a spin first:
https://validifier.com/sample-report

— Validifier
```

---

## 3. Project-start nudge

- **Trigger**: user created a project 15 minutes ago but has not started
  report generation.
- **Audience**: users with a saved draft project and no active report.
- **Exclusions**: users currently generating.
- **CTA**: Continue your report.
- **Suppression key**: `project-nudge:{project_id}` — send once.
- **Success metric**: report started within 24 hours.

```
Subject: You left a project open on Validifier

Hi,

Your draft project is saved. When you're ready, generating the report
takes about 2–3 minutes.

Continue: https://validifier.com/dashboard

— Validifier
```

---

## 4. Report ready

- **Trigger**: report finalization event (server-authoritative
  `report_completed`).
- **Audience**: owner of the completed report.
- **CTA**: Open the report.
- **Suppression key**: `report-ready:{report_id}` — matches existing
  server behavior; do not send twice on retry.
- **Success metric**: report opened within 24 hours.

> This email is already wired. Confirm the copy matches the production
> template before enabling any changes here.

```
Subject: Your Validifier report is ready

Hi,

Your report on "{project_name}" is done — 15 sections, generated in
about {elapsed_minutes} minutes.

Open the report:
https://validifier.com/projects/{project_id}/report

You have {credits_remaining} credits left this month.

— Validifier
```

---

## 5. Day-3 insight prompt

- **Trigger**: 3 calendar days after `report_completed`, if user has not
  opened the report a second time or asked Cora anything.
- **Audience**: report owners who read the report at least once.
- **Exclusions**: users with active Cora threads on this report.
- **CTA**: Ask Cora a follow-up.
- **Suppression key**: `day3-insight:{report_id}` — send once.
- **Success metric**: Cora chat started within 48 hours.

```
Subject: A follow-up question about {project_name}?

Hi,

If your report on "{project_name}" left you wanting more detail on a
specific section, Cora can dig in — 1 credit per question.

Ask a follow-up:
https://validifier.com/projects/{project_id}/chat

— Validifier
```

---

## 6. Day-6 trial reminder

- **Trigger**: 6 days into a Pro 7-day trial.
- **Audience**: users on `trialing` status.
- **Exclusions**: users who already cancelled the trial.
- **CTA**: Manage subscription.
- **Suppression key**: `trial-reminder:{stripe_subscription_id}` — send
  once.
- **Success metric**: proportion of trials that renew or explicitly cancel
  (not silent lapse).

```
Subject: Your Validifier trial ends tomorrow

Hi,

Your 7-day Pro trial ends tomorrow. Pro is $29/month with 100 credits
and Premium reports.

Manage subscription:
https://validifier.com/settings

No action needed to cancel — the trial simply ends and you keep the
Free plan.

— Validifier
```

---

## 7. Credit-low

- **Trigger**: user drops below 25% of their monthly credit allowance for
  the first time this cycle.
- **Audience**: any user on Free or Pro.
- **Exclusions**: users who already received this in the current cycle.
- **CTA**: For Free — upgrade to Pro; for Pro — see settings.
- **Suppression key**: `credit-low:{user_id}:{cycle_start}` — send once
  per cycle.
- **Success metric**: reduced surprise-out-of-credits errors.

```
Subject: You're running low on Validifier credits

Hi,

You have {credits_remaining} credits left this month. A Standard report
is 5 credits, Premium is 12, and each Cora question is 1 credit.

See your plan and usage:
https://validifier.com/settings

— Validifier
```

---

## 8. Dormant-user reactivation

- **Trigger**: user has not opened Validifier in 30 days, has at least one
  completed report, and has not received a reactivation email in the last
  90 days.
- **Audience**: dormant free and paid users.
- **Exclusions**: unsubscribed, deleted, or hard-bounced.
- **CTA**: Open your last report.
- **Suppression key**: `reactivation:{user_id}:{quarter}` — send at most
  once per 90 days.
- **Success metric**: return session within 7 days.

```
Subject: Still deciding on {project_name}?

Hi,

You haven't been back to Validifier in a while. Your last report on
"{project_name}" is still here, and the 30-day action plan is still valid
for {days_remaining_in_plan} more days.

Open it:
https://validifier.com/projects/{project_id}/report

— Validifier
```

---

## 9. Cancellation confirmation

- **Trigger**: subscription cancelled (Stripe webhook
  `customer.subscription.deleted` or scheduled cancellation).
- **Audience**: cancelling user.
- **CTA**: (Optional) tell us why — non-required, mailto.
- **Suppression key**: `cancel-confirm:{stripe_subscription_id}` — send
  once.
- **Success metric**: acknowledged cancellation; qualitative feedback.

```
Subject: Your Validifier Pro plan is cancelled

Hi,

Your Pro subscription is cancelled. You'll keep Pro access until
{period_end_date}, after which your account returns to the Free plan
with 15 credits per month.

Your reports and chats stay in your account.

If you have a minute, we'd love to know why:
support@validifier.com

— Validifier
```

---

## Deliverability notes

- Send from a real, human-looking address (e.g. `hello@validifier.com`).
- Reply-to should hit a monitored inbox — see
  [`OPERATIONS_RUNBOOK.md`](./OPERATIONS_RUNBOOK.md).
- Never include tracking pixels in transactional messages without disclosing
  it in the Privacy Policy.