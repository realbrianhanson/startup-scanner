# Legal & business checklist

> **This document is not legal advice.** It is a checklist to help the
> owner get to a launchable state and to identify items that require a
> qualified professional. Every unchecked item stays unchecked until the
> owner personally completes it.

## Entity & ownership

- [ ] Legal entity formed in the intended jurisdiction.
- [ ] Business address of record (may be a registered agent).
- [ ] Ownership of the domain `validifier.com` documented and secured
      with 2FA on the registrar.
- [ ] DNS records under owner control; recovery plan for lost registrar
      access.
- [ ] Trademark search performed for the name "Validifier" in intended
      markets; formal filings considered.

## Terms, privacy, and consumer protection

- [ ] Terms of Service reviewed by counsel in owner's jurisdiction.
- [ ] Privacy Policy reviewed by counsel; aligned with actual data flows.
- [ ] Refund and cancellation policy explicit and matches Stripe behavior.
- [ ] Statement descriptor set in Stripe (what users see on their card
      statement).
- [ ] Tax handling reviewed (VAT/GST/sales tax as applicable) — often
      via Stripe Tax.
- [ ] Cookie consent behavior matches jurisdictional requirements.

## Data protection

- [ ] Data Processing Agreement in place with each subprocessor (AI
      providers, payments, email, hosting).
- [ ] Subprocessor list published or made available on request.
- [ ] Retention windows in the Privacy Policy match production behavior.
- [ ] DPO / privacy contact address (`privacy@validifier.com`) monitored.
- [ ] Data-subject request workflow documented (access, export, deletion).

## Email & communications

- [ ] Sending domain has SPF, DKIM, and DMARC records.
- [ ] DMARC policy at least `p=quarantine` after a warm-up period.
- [ ] Unsubscribe links present on all non-transactional email.
- [ ] Contact-page inboxes (`support@`, `privacy@`, `legal@`, `security@`)
      all deliver to a monitored destination.

## Payments

- [ ] Stripe account fully verified (business details, bank).
- [ ] Live-mode product and price IDs match `create-checkout-session`.
- [ ] Webhook signing secret set in production environment.
- [ ] Chargeback response plan documented.

## Insurance

- [ ] General liability / professional liability insurance evaluated.
- [ ] Cyber liability insurance evaluated.

## Accessibility

- [ ] Public pages meet WCAG 2.1 AA color contrast.
- [ ] Keyboard navigation verified on `/`, `/pricing`, `/auth`,
      `/sample-report`, `/contact`, `/security`.
- [ ] Screen reader spot-check on primary CTAs.

## Records & retention

- [ ] Financial records retained per jurisdiction requirements.
- [ ] Consent records (cookie, marketing) retained.
- [ ] Data deletion evidence retained for the statutory window.

## Support inbox ownership

- [ ] Each support alias routes to a real named human.
- [ ] Backup owner named for each alias in case the primary is unavailable.
- [ ] Escalation ladder documented.

## Do not check without evidence

The following are commonly assumed but **must not** be checked without
concrete evidence:

- SOC 2, ISO 27001, HIPAA, or PCI compliance claims.
- "Encrypted at rest" claims beyond what the hosting provider guarantees.
- "GDPR compliant" as a marketing claim.
- Named pen-test firm or bug-bounty program.

If asked publicly about any of the above and the evidence isn't in place,
the honest answer is: "We describe our current controls in
[/security](https://validifier.com/security); this is an overview, not a
certification."