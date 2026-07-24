import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logOpsEvent, logAnalyticsEvent } from "../_shared/ops.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_ORIGIN_HOSTS = ["validifier.com", "www.validifier.com"];
const FALLBACK_ORIGIN = "https://validifier.com";

function resolveOrigin(req: Request): string {
  const origin = req.headers.get("origin");
  if (!origin) return FALLBACK_ORIGIN;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return FALLBACK_ORIGIN;
    if (ALLOWED_ORIGIN_HOSTS.includes(url.hostname)) return origin;
    if (url.hostname.endsWith(".lovable.app")) return origin;
    return FALLBACK_ORIGIN;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// 10-minute UTC bucket — same bucket dedupes rapid double-clicks,
// while later legitimate retries land in a new bucket.
function tenMinuteBucket(): string {
  return String(Math.floor(Date.now() / (10 * 60 * 1000)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return jsonError(503, "Billing is not configured");

    const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
    if (!proPriceId) return jsonError(503, "Billing is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError(401, "Invalid token");

    let body: { plan_name?: unknown };
    try {
      body = await req.json();
    } catch {
      return jsonError(400, "Invalid JSON body");
    }

    const rawPlan = typeof body.plan_name === "string" ? body.plan_name.trim().toLowerCase() : "";
    if (rawPlan !== "pro") return jsonError(400, "Invalid plan");
    const planName = "pro";
    const priceId = proPriceId;

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      console.error("profile read failed", { code: profileErr.code });
      return jsonError(500, "Could not load billing profile");
    }

    let customerId = profile?.stripe_customer_id as string | null | undefined;

    if (!customerId) {
      const customerRes = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": `customer:${user.id}`,
        },
        body: new URLSearchParams({
          email: profile?.email || user.email || "",
          "metadata[supabase_user_id]": user.id,
        }),
      });
      const customer = await customerRes.json().catch(() => ({}));
      if (
        !customerRes.ok || !customer?.id ||
        typeof customer.id !== "string" || !customer.id.startsWith("cus_")
      ) {
        console.error("Stripe customer creation failed", { status: customerRes.status });
        return jsonError(502, "Could not create billing customer");
      }
      customerId = customer.id;

      const { error: updateErr } = await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (updateErr) {
        console.error("profile update failed", { code: updateErr.code });
        return jsonError(500, "Could not save billing profile");
      }
    }

    const origin = resolveOrigin(req);
    const params = new URLSearchParams({
      "mode": "subscription",
      "customer": customerId!,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "subscription_data[trial_period_days]": "7",
      "subscription_data[metadata][supabase_user_id]": user.id,
      "subscription_data[metadata][plan_name]": planName,
      "success_url": `${origin}/dashboard?checkout=success`,
      "cancel_url": `${origin}/pricing?checkout=cancelled`,
      "metadata[supabase_user_id]": user.id,
      "metadata[plan_name]": planName,
    });

    const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": `checkout:${user.id}:${planName}:${priceId}:${tenMinuteBucket()}`,
      },
      body: params,
    });

    const session = await sessionRes.json().catch(() => ({}));

    if (!sessionRes.ok || session.error || !session.url) {
      console.error("Stripe checkout creation failed", { status: sessionRes.status });
      await logOpsEvent(adminSupabase, {
        severity: "warning",
        category: "billing",
        event_name: "checkout_create_failed",
        function_name: "create-checkout-session",
        error_code: `stripe_${sessionRes.status}`,
        user_id: user.id,
        metadata: { plan: planName },
      });
      return jsonError(502, "Could not start checkout");
    }

    await logAnalyticsEvent(adminSupabase, {
      event_name: "checkout_created",
      user_id: user.id,
      properties: { plan: planName },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-checkout-session error:", (error as Error).message);
    return jsonError(500, "Internal error");
  }
});