import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller: must present either a strong CRON_SECRET via x-cron-secret header
    // OR the service_role key as a bearer token (used by pg_cron).
    // The anon key is PUBLIC and must never be accepted here.
    const cronSecret = Deno.env.get("CRON_SECRET");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const authHeader = req.headers.get("Authorization");
    const providedSecret = req.headers.get("x-cron-secret");
    const bearerToken = authHeader?.replace("Bearer ", "");

    const validCronSecret = !!cronSecret && providedSecret === cronSecret;
    const validServiceRole = !!serviceKey && bearerToken === serviceKey;

    if (!validCronSecret && !validServiceRole) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all profiles with credits used > 0
    const { data: profiles, error: fetchError } = await supabase
      .from("profiles")
      .select("id, ai_credits_used")
      .gt("ai_credits_used", 0);

    if (fetchError) {
      throw new Error(`Failed to fetch profiles: ${fetchError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No credits to reset", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log each reset to the audit table
    const resetLogs = profiles.map((p) => ({
      user_id: p.id,
      previous_credits_used: p.ai_credits_used,
    }));

    const { error: logError } = await supabase
      .from("credit_resets")
      .insert(resetLogs);

    if (logError) {
      console.error("Failed to log resets:", logError);
      // Continue with reset even if logging fails
    }

    // Reset all users' credits to 0
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ ai_credits_used: 0 })
      .gt("ai_credits_used", 0);

    if (updateError) {
      throw new Error(`Failed to reset credits: ${updateError.message}`);
    }

    console.log(`Successfully reset credits for ${profiles.length} users`);

    return new Response(
      JSON.stringify({
        message: "Monthly credit reset completed",
        users_reset: profiles.length,
        // Note: Mid-month plan upgrades are handled immediately by the
        // Stripe webhook (checkout.session.completed / customer.subscription.updated),
        // which sets ai_credits_used = 0 and updates ai_credits_monthly to the new
        // plan's allocation. This cron reset only handles the regular monthly cycle.
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Credit reset error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
