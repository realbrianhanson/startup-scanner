import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logOpsEvent, logAnalyticsEvent } from "../_shared/ops.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────
// 💳 PLAN CONFIG — REMIXER: KEEP IN SYNC WITH src/pages/Pricing.tsx
//   standard report = 5 credits, premium report = 12 credits, chat msg = 1 credit
//   Free  → 15 credits
//   Pro   → 100 credits
// ─────────────────────────────────────────────────────────────
const FREE_MONTHLY_CREDITS = 15;
const PLAN_CONFIG: Record<string, { tier: string; credits: number }> = {
  pro: { tier: "pro", credits: 100 },
};

const SIGNATURE_TOLERANCE_SECONDS = 60 * 5;
const STALE_PROCESSING_MS = 5 * 60 * 1000;
const ALLOWED_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_failed",
]);
const GENERIC_HANDLER_ERROR = "handler_failed";

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const parts = signature.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
    const v1Sig = parts.find((p) => p.startsWith("v1="))?.split("=")[1];
    if (!timestamp || !v1Sig) return false;

    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - ts) > SIGNATURE_TOLERANCE_SECONDS) return false;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
    const expectedSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return timingSafeEqual(expectedSig, v1Sig);
  } catch {
    return false;
  }
}

function resolvePlanFromEvent(
  metaPlan: string | undefined,
  priceId: string | undefined,
  proPriceId: string,
): { tier: string; credits: number } | null {
  const plan = metaPlan?.toLowerCase();
  if (plan && PLAN_CONFIG[plan]) return PLAN_CONFIG[plan];
  if (priceId && priceId === proPriceId) return PLAN_CONFIG.pro;
  return null;
}

function isUniqueViolation(err: { code?: string | null } | null | undefined): boolean {
  return err?.code === "23505";
}

const ALLOWED_STATUSES = new Set([
  "free","trialing","active","past_due","unpaid","incomplete","canceled","unknown",
]);

function normalizeStatus(raw: unknown): string {
  if (typeof raw !== "string") return "unknown";
  return ALLOWED_STATUSES.has(raw) ? raw : "unknown";
}

function epochToIso(v: unknown): string | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
  const ms = v * 1000;
  const d = new Date(ms);
  const t = d.getTime();
  if (!Number.isFinite(t)) return null;
  return d.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let eventIdForFailure: string | null = null;
  let supabaseForFailure: ReturnType<typeof createClient> | null = null;
  let ownedLeaseAt: string | null = null;

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) return new Response("Webhook secret not configured", { status: 500 });

    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    if (!proPriceId) return new Response("Billing not configured", { status: 503 });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) return new Response("No signature", { status: 400 });

    const valid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!valid) return new Response("Invalid signature", { status: 400 });

    let event: any;
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid payload", { status: 400 });
    }

    const eventId: string | undefined = event?.id;
    const eventType: string | undefined = event?.type;
    if (!eventId || !eventType) return new Response("Missing event id/type", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    supabaseForFailure = supabase;
    eventIdForFailure = eventId;

    // Ignore events outside the allowlist without recording them.
    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const nowIso = new Date().toISOString();

    // Claim the event: insert as processing.
    const { error: insertErr } = await supabase
      .from("stripe_webhook_events")
      .insert({
        event_id: eventId,
        event_type: eventType,
        status: "processing",
        last_attempt_at: nowIso,
      });

    if (insertErr) {
      // Only a unique-violation means the event already existed; any other
      // insert failure is a hard error.
      if (!isUniqueViolation(insertErr)) {
        console.error("Failed to claim event", { eventId, code: insertErr.code });
        return new Response("Could not claim event", { status: 500 });
      }

      const { data: existing, error: existingErr } = await supabase
        .from("stripe_webhook_events")
        .select("status, last_attempt_at, attempts")
        .eq("event_id", eventId)
        .single();

      if (existingErr || !existing) {
        console.error("Failed to load claimed event", { eventId });
        return new Response("Could not claim event", { status: 500 });
      }

      if (existing.status === "processed") {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const lastAttemptMs = existing.last_attempt_at
        ? new Date(existing.last_attempt_at as string).getTime()
        : 0;
      const isProcessing = existing.status === "processing";
      const isFailed = existing.status === "failed";
      const stale = Date.now() - lastAttemptMs > STALE_PROCESSING_MS;

      if (isProcessing && !stale) {
        return new Response(JSON.stringify({ received: true, in_progress: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!isFailed && !(isProcessing && stale)) {
        // Unknown status — refuse to reprocess.
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Claim a retry lease atomically: only proceed if the row still matches
      // the last_attempt_at we observed. Concurrent racers will see 0 rows.
      const { data: leased, error: leaseErr } = await supabase
        .from("stripe_webhook_events")
        .update({
          status: "processing",
          attempts: (existing.attempts ?? 1) + 1,
          last_error: null,
          last_attempt_at: nowIso,
        })
        .eq("event_id", eventId)
        .eq("status", existing.status)
        .eq("last_attempt_at", existing.last_attempt_at as string)
        .select("event_id");

      if (leaseErr) {
        console.error("Failed to lease retry", { eventId, code: leaseErr.code });
        return new Response("Could not claim event", { status: 500 });
      }
      if (!leased || leased.length === 0) {
        // Another worker already claimed the retry.
        return new Response(JSON.stringify({ received: true, in_progress: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      ownedLeaseAt = nowIso;
    } else {
      ownedLeaseAt = nowIso;
    }

    // Handle the event. Any thrown error aborts processed-marking.
    // Emitted after successful case; keyed on webhook idempotency so retries
    // don't duplicate. Populated inside the switch on the happy path.
    let postAnalytics: null | { event: string; user_id?: string | null; props?: Record<string, unknown> } = null;
    switch (eventType) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session?.metadata?.supabase_user_id;
        const planName = session?.metadata?.plan_name?.toLowerCase();
        if (!userId) throw new Error("missing user id in session metadata");

        const config = resolvePlanFromEvent(planName, undefined, proPriceId);
        if (!config) throw new Error("unknown plan in session metadata");
        if (typeof session.customer !== "string") throw new Error("missing customer");

        const { data: updatedRows, error: updateErr } = await supabase
          .from("profiles")
          .update({
            subscription_tier: config.tier,
            ai_credits_monthly: config.credits,
            ai_credits_used: 0,
            stripe_customer_id: session.customer,
            subscription_status: "trialing",
            cancel_at_period_end: false,
          })
          .eq("id", userId)
          .select("id");
        if (updateErr) throw new Error(`profile update failed: ${updateErr.code ?? "unknown"}`);
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("profile update affected zero rows");
        }
        // 7-day trial checkout → trial_started. Activation is emitted when
        // customer.subscription.updated arrives with status=active.
        postAnalytics = { event: "trial_started", user_id: userId, props: { plan: config.tier } };
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription?.customer;
        if (typeof customerId !== "string") throw new Error("missing customer");

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (profileErr) throw new Error(`profile lookup failed: ${profileErr.code ?? "unknown"}`);
        if (!profile) break; // No local profile — nothing to entitle.

        const status = normalizeStatus(subscription?.status);
        const cancelAtPeriodEnd = subscription?.cancel_at_period_end === true;
        const trialEnd = epochToIso(subscription?.trial_end);
        const periodEnd = epochToIso(subscription?.current_period_end);

        // Always record the truthful subscription state.
        const baseUpdate: Record<string, unknown> = {
          subscription_status: status,
          cancel_at_period_end: cancelAtPeriodEnd,
          trial_ends_at: trialEnd,
          current_period_ends_at: periodEnd,
        };

        if (status === "active" || status === "trialing") {
          const planName = subscription.metadata?.plan_name?.toLowerCase();
          const priceId = subscription.items?.data?.[0]?.price?.id;
          const config = resolvePlanFromEvent(planName, priceId, proPriceId);
          if (!config) throw new Error("unknown plan on subscription");
          baseUpdate.subscription_tier = config.tier;
          baseUpdate.ai_credits_monthly = config.credits;
          postAnalytics = status === "trialing"
            ? { event: "trial_started", user_id: profile.id as string, props: { plan: config.tier } }
            : { event: "subscription_activated", user_id: profile.id as string, props: { plan: config.tier } };
        }

        const { data: updatedRows, error: updateErr } = await supabase
          .from("profiles")
          .update(baseUpdate)
          .eq("id", profile.id)
          .select("id");
        if (updateErr) throw new Error(`profile update failed: ${updateErr.code ?? "unknown"}`);
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("profile update affected zero rows");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription?.customer;
        if (typeof customerId !== "string") throw new Error("missing customer");

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        if (profileErr) throw new Error(`profile lookup failed: ${profileErr.code ?? "unknown"}`);
        if (!profile) break;

        const { data: updatedRows, error: updateErr } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            ai_credits_monthly: FREE_MONTHLY_CREDITS,
            ai_credits_used: 0,
            subscription_status: "canceled",
            cancel_at_period_end: false,
            trial_ends_at: null,
            current_period_ends_at: null,
          })
          .eq("id", profile.id)
          .select("id");
        if (updateErr) throw new Error(`profile update failed: ${updateErr.code ?? "unknown"}`);
        if (!updatedRows || updatedRows.length === 0) {
          throw new Error("profile update affected zero rows");
        }
        postAnalytics = { event: "subscription_cancelled", user_id: profile.id as string };
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice?.customer;
        let userId: string | null = null;
        if (typeof customerId === "string") {
          const { data: profile } = await supabase
            .from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
          userId = (profile?.id as string) ?? null;
          if (userId) {
            await supabase
              .from("profiles")
              .update({ subscription_status: "past_due" })
              .eq("id", userId);
          }
        }
        await logOpsEvent(supabase, {
          severity: "warning",
          category: "billing",
          event_name: "payment_failed",
          function_name: "stripe-webhook",
          error_code: "invoice_payment_failed",
          user_id: userId,
        });
        postAnalytics = { event: "payment_failed", user_id: userId };
        break;
      }
    }

    const { data: markedRows, error: markErr } = await supabase
      .from("stripe_webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("event_id", eventId)
      .eq("status", "processing")
      .eq("last_attempt_at", ownedLeaseAt as string)
      .select("event_id");
    if (markErr) throw new Error(`mark processed failed: ${markErr.code ?? "unknown"}`);
    if (!markedRows || markedRows.length === 0) {
      // Our lease was superseded by a newer worker; don't overwrite its state.
      return new Response(JSON.stringify({ received: true, superseded: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (postAnalytics) {
      await logAnalyticsEvent(supabase, {
        event_name: postAnalytics.event,
        user_id: postAnalytics.user_id ?? null,
        properties: postAnalytics.props ?? {},
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const originalMessage = (error as Error).message || "unknown";
    console.error("Webhook error:", originalMessage);

    if (supabaseForFailure && eventIdForFailure && ownedLeaseAt) {
      try {
        await supabaseForFailure
          .from("stripe_webhook_events")
          .update({ status: "failed", last_error: GENERIC_HANDLER_ERROR })
          .eq("event_id", eventIdForFailure)
          .eq("status", "processing")
          .eq("last_attempt_at", ownedLeaseAt)
          .select("event_id");
        await logOpsEvent(supabaseForFailure, {
          severity: "critical",
          category: "billing",
          event_name: "stripe_webhook_failed",
          function_name: "stripe-webhook",
          error_code: "handler_failed",
        });
      } catch {
        // best-effort
      }
    }

    return new Response(JSON.stringify({ error: GENERIC_HANDLER_ERROR }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});