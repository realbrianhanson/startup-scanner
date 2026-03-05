import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        model: "google/gemini-2.5-flash",
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
