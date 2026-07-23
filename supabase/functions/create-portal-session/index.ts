import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return jsonError(503, "Billing is not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError(401, "Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return jsonError(401, "Invalid token");

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profileErr } = await adminSupabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileErr) {
      console.error("portal profile read failed", { code: profileErr.code });
      return jsonError(500, "Could not load billing profile");
    }

    if (!profile?.stripe_customer_id) return jsonError(400, "No billing account found");

    const origin = resolveOrigin(req);
    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: profile.stripe_customer_id,
        return_url: `${origin}/settings`,
      }),
    });

    const portal = await portalRes.json().catch(() => ({}));

    if (!portalRes.ok || portal.error || !portal.url) {
      console.error("Stripe portal creation failed", { status: portalRes.status });
      return jsonError(502, "Could not open billing portal");
    }

    return new Response(JSON.stringify({ url: portal.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-portal-session error:", (error as Error).message);
    return jsonError(500, "Internal error");
  }
});