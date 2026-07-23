import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import FirecrawlApp from "https://esm.sh/@mendable/firecrawl-js@1.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rawUrl = (body as { url?: unknown } | null)?.url;
    if (typeof rawUrl !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const trimmed = rawUrl.trim();
    if (trimmed.length === 0 || trimmed.length > 2048) {
      return new Response(
        JSON.stringify({ error: "URL must be between 1 and 2048 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate URL — block SSRF-prone targets.
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return new Response(
        JSON.stringify({ error: "Only http and https URLs are allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (parsed.username || parsed.password) {
      return new Response(
        JSON.stringify({ error: "URLs with credentials are not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (isBlockedHost(parsed.hostname)) {
      return new Response(
        JSON.stringify({ error: "URL host is not allowed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const url = parsed.toString();

    // Authenticate user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 5 website analyses per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: rateErr } = await supabase
      .from("ai_usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("operation_type", "website_analysis")
      .gte("created_at", oneHourAgo);

    if (rateErr) {
      console.error("Rate-limit query failed:", rateErr);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (recentCount !== null && recentCount >= 5) {
      return new Response(
        JSON.stringify({ error: "Too many website analyses. Please wait before trying again.", retry_after: 3600 }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "3600" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Scrape website using Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
    
    const scrapeResult = await firecrawl.scrapeUrl(url, {
      formats: ["markdown"],
    });

    if (!scrapeResult.success) {
      throw new Error("Failed to scrape website");
    }

    // Use AI to extract key business information
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a business analyst extracting key information from websites. Extract the value proposition, target market, and business model. Be concise and specific."
          },
          {
            role: "user",
            content: `Analyze this website content and extract:\n1. Value proposition (what problem it solves)\n2. Target market\n3. Business model hints\n4. Pricing information if available\n\nWebsite content:\n${scrapeResult.markdown?.substring(0, 5000)}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI analysis failed:", errorText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0]?.message?.content || "Analysis not available";

    // Log usage for rate limiting
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      operation_type: "website_analysis",
      model_used: "google/gemini-3-flash-preview",
      tokens_used: aiData.usage?.total_tokens || 0,
      cost_cents: Math.ceil((aiData.usage?.total_tokens || 0) * 0.0001),
    });

    return new Response(
      JSON.stringify({
        description: analysis,
        rawContent: scrapeResult.markdown?.substring(0, 2000),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-website:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze website";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
