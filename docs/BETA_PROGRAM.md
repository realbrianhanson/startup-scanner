# Beta program

A controlled paid beta with **10–15 ideal users** on the current pricing
($29/mo Pro with a 7-day free trial — no coupons or discounts are implemented,
do not promise them). Goal: prove signup → completed report → willingness to
pay at real friction, before any wider launch.

## Ideal Customer Profile (ICP)

Primary: solo founders, indie hackers, product managers, and small-agency
strategists actively considering **a new product or business idea** within the
next 30 days.

Screening rubric (score 0–2 each; admit at ≥7):

| Criterion | 0 | 1 | 2 |
|---|---|---|---|
| Has a specific idea today | No | Vague | Written one-pager |
| Decision timeline | >90 days | 30–90 days | <30 days |
| Has run validation before | Never | Ad hoc | Structured |
| Willingness to pay $29 | No | Maybe | Confirmed |
| Comfortable on video call | No | Async only | Yes |

## Recruitment sources

- Founder's warm network (LinkedIn, personal email).
- Indie/founder communities the owner is already an active member of (do not
  cold-post in communities without established standing).
- 1:1 DMs to authors of recent "should I build X" posts.
- Targeted replies on X/LinkedIn threads about idea validation.

## Invitation email / DM template

```
Subject: 15 spots — try Validifier before public launch

Hi {first_name},

I'm running a small paid beta for Validifier — a tool that turns a business
idea into a 15-section go / no-go report in about 2–3 minutes. I'm looking
for 10–15 people actively considering a new idea in the next 30 days.

The beta is the real Pro plan ($29/mo, 7-day free trial, cancel anytime).
In exchange for early access I'll ask for one 25-minute call, one day-7
survey, and permission to email you two follow-ups.

Interested? Reply "in" and I'll send a signup link and calendar slot.

— {owner_name}
```

## 25-minute onboarding call agenda

- 0:00 Intro, confirm consent to record.
- 0:03 Their idea in 60 seconds and current stage.
- 0:06 Screen share: they sign up and create their first project.
- 0:15 Watch them read the report unaided. Note first click, first confusion.
- 0:22 Ask: what's one thing you'd change first?
- 0:24 Next steps, follow-up dates.

## In-product tasks

1. Sign up and complete email verification.
2. Create one project from their real idea (Standard, 5 credits).
3. Read the full report and rate it.
4. Ask Cora at least one follow-up.
5. Optional: generate one Premium report on a variant idea.

## Follow-ups

- **Day 1**: "Was the report useful? One-line reply is fine." + link to
  Cora chat.
- **Day 3**: "Anything confusing or missing?" + link to any incomplete report.
- **Day 7**: 5-question survey (below) + trial-ending reminder if applicable.

## Interview guide (day 7)

1. What did you use the report for, if anything?
2. Which section did you actually read end-to-end?
3. What did you skip and why?
4. Would you keep paying $29/mo? Why / why not?
5. Who else should try this?

## Scorecard (per participant)

| Field | Value |
|---|---|
| Signed up | Y/N |
| Verified email | Y/N |
| First project completed | Y/N |
| Time to first report | mm:ss |
| Sections read (self-report) | 0–15 |
| Rating | 1–5 |
| Willing to pay | Y/N/Maybe |
| Requested feature | free text |

## Feedback triage

- **P0 (blocks core value)**: report fails, wrong credits deducted, billing
  wrong, security concern → fix same week.
- **P1 (hurts activation)**: confusing section, missing context, mobile issue
  → schedule inside 2 weeks.
- **P2 (nice to have)**: new sections, integrations → backlog.

## Exit criteria (targets, not historical results)

Targets before ending beta and moving to broader launch:

- ≥ 80% of admitted users complete at least one report.
- Median time-to-first-report under 5 minutes wall-clock.
- Report generation failure rate under 5%.
- ≥ 40% ask Cora at least one follow-up.
- ≥ 50% of trials that reach day 7 convert to an **active subscription**
  (`profiles.subscription_status = 'active'`) **or** state a specific reason
  not to. Pro-tier entitlement alone (still trialing) does not count.
- Average report rating ≥ 4 / 5.
- 30-day retention of active subscriptions ≥ 60%.

## Participant tracker (template — do not prefill with PII)

| # | First name | Source | Screening score | Invited | Signed up | First report | Rating | Paid | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 |  |  |  |  |  |  |  |  |  |
| 2 |  |  |  |  |  |  |  |  |  |

Store this tracker outside the product database (e.g. a private spreadsheet).
Do not paste emails or idea details into public issues, chat rooms, or
screenshots.