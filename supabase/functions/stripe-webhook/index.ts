import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─────────────────────────────────────────────────────────────
// 💳 PLAN CONFIG — REMIXER: KEEP IN SYNC WITH src/pages/Pricing.tsx
//
// credits math (change these together with the pricing copy):
//   standard report = 5 credits, premium report = 12 credits, chat msg = 1 credit
//   Free  → 15 credits  (1 standard report + 10 chat msgs)
//   Pro   → 100 credits (5 premium reports + 40 chat msgs)
// ─────────────────────────────────────────────────────────────
const FREE_MONTHLY_CREDITS = 15;
const PLAN_CONFIG: Record<string, { tier: string; credits: number }> = {
  pro: { tier: "pro", credits: 100 },
};

const SIGNATURE_TOLERANCE_SECONDS = 60 * 5;
const STALE_PROCESSING_MS = 5 * 60 * 1000;

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
  proPriceId: string | undefined,
): { tier: string; credits: number } | null {
  const plan = metaPlan?.toLowerCase();
  if (plan && PLAN_CONFIG[plan]) return PLAN_CONFIG[plan];
  if (priceId && proPriceId && priceId === proPriceId) return PLAN_CONFIG.pro;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) return new Response("Webhook secret not configured", { status: 500 });
    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID") || undefined;

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

    // Claim the event: insert as processing. If it already exists, decide what to do.
    const { error: insertErr } = await supabase
      .from("stripe_webhook_events")
      .insert({ event_id: eventId, event_type: eventType, status: "processing" });

    if (insertErr) {
      const { data: existing } = await supabase
        .from("stripe_webhook_events")
        .select("status, created_at, attempts")
        .eq("event_id", eventId)
        .single();

      if (!existing) {
        console.error("Failed to claim event", { eventId });
        return new Response("Could not claim event", { status: 500 });
      }

      if (existing.status === "processed") {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const createdAt = new Date(existing.created_at as string).getTime();
      const stale = existing.status === "failed" ||
        (existing.status === "processing" && Date.now() - createdAt > STALE_PROCESSING_MS);

      if (!stale) {
        return new Response(JSON.stringify({ received: true, in_progress: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await supabase
        .from("stripe_webhook_events")
        .update({
          status: "processing",
          attempts: (existing.attempts ?? 1) + 1,
          last_error: null,
        })
        .eq("event_id", eventId);
    }

    try {
      switch (eventType) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata?.supabase_user_id;
          const planName = session.metadata?.plan_name?.toLowerCase();
          if (!userId) break;

          const config = resolvePlanFromEvent(planName, undefined, proPriceId);
          if (!config) break;

          await supabase
            .from("profiles")
            .update({
              subscription_tier: config.tier,
              ai_credits_monthly: config.credits,
              ai_credits_used: 0,
              stripe_customer_id: session.customer,
            })
            .eq("id", userId);
          break;
        }

        case "customer.subscription.updated": {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();
          if (!profile) break;

          if (subscription.status === "active" || subscription.status === "trialing") {
            const planName = subscription.metadata?.plan_name?.toLowerCase();
            const priceId = subscription.items?.data?.[0]?.price?.id;
            const config = resolvePlanFromEvent(planName, priceId, proPriceId);
            if (config) {
              await supabase
                .from("profiles")
                .update({
                  subscription_tier: config.tier,
                  ai_credits_monthly: config.credits,
                })
                .eq("id", profile.id);
            }
          }
          break;
        }

        case "customer.subscription.deleted": {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single();
          if (!profile) break;

          await supabase
            .from("profiles")
            .update({
              subscription_tier: "free",
              ai_credits_monthly: FREE_MONTHLY_CREDITS,
              ai_credits_used: 0,
            })
            .eq("id", profile.id);
          break;
        }
      }

      await supabase
        .from("stripe_webhook_events")
        .update({ status: "processed", processed_at: new Date().toISOString(), last_error: null })
        .eq("event_id", eventId);

      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (handlerErr) {
      const message = (handlerErr as Error).message || "handler error";
      await supabase
        .from("stripe_webhook_events")
        .update({ status: "failed", last_error: message })
        .eq("event_id", eventId);
      console.error("Webhook handler error:", message);
      return new Response(JSON.stringify({ error: "handler_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Webhook error:", (error as Error).message);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});