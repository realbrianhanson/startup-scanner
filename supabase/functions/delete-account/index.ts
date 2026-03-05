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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the user with anon client
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role client for deletions
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get all project IDs for this user
    const { data: projects } = await adminClient
      .from("projects")
      .select("id")
      .eq("user_id", userId);

    const projectIds = (projects || []).map((p: any) => p.id);

    if (projectIds.length > 0) {
      // 2. Get all conversation IDs for user's projects
      const { data: conversations } = await adminClient
        .from("chat_conversations")
        .select("id")
        .in("project_id", projectIds);

      const conversationIds = (conversations || []).map((c: any) => c.id);

      // 3. Delete chat_messages
      if (conversationIds.length > 0) {
        await adminClient
          .from("chat_messages")
          .delete()
          .in("conversation_id", conversationIds);
      }

      // 4. Delete chat_conversations
      await adminClient
        .from("chat_conversations")
        .delete()
        .in("project_id", projectIds);

      // 5. Delete reports
      await adminClient
        .from("reports")
        .delete()
        .in("project_id", projectIds);
    }

    // 6. Delete ai_usage_logs
    await adminClient
      .from("ai_usage_logs")
      .delete()
      .eq("user_id", userId);

    // 7. Delete analytics_events
    await adminClient
      .from("analytics_events")
      .delete()
      .eq("user_id", userId);

    // 8. Delete credit_resets
    await adminClient
      .from("credit_resets")
      .delete()
      .eq("user_id", userId);

    // 9. Delete user_roles
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // 10. Delete projects
    if (projectIds.length > 0) {
      await adminClient
        .from("projects")
        .delete()
        .in("id", projectIds);
    }

    // 11. Delete profile
    await adminClient
      .from("profiles")
      .delete()
      .eq("id", userId);

    // 12. Delete auth user
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error("Error deleting auth user:", deleteAuthError);
      return new Response(
        JSON.stringify({ error: "Failed to delete auth user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
