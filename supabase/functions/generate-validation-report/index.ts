import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    console.log("Generating report for project:", project.name);

    // Check user credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", project.user_id)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    const creditsNeeded = 5;
    if (profile.ai_credits_used + creditsNeeded > profile.ai_credits_monthly) {
      throw new Error("Insufficient AI credits");
    }

    // Create report entry
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        project_id: project_id,
        report_data: {},
        generation_status: {
          executive_summary: "pending",
          market_analysis: "pending",
          competitive_landscape: "pending",
          strategic_frameworks: "pending",
          financial_basics: "pending",
        },
      })
      .select()
      .single();

    if (reportError) {
      throw new Error("Failed to create report");
    }

    console.log("Report entry created, starting AI generation...");

    // Update project status
    await supabase
      .from("projects")
      .update({ status: "analyzing" })
      .eq("id", project_id);

    // Generate sections in parallel
    const sections = [
      generateExecutiveSummary(project, LOVABLE_API_KEY),
      generateMarketAnalysis(project, LOVABLE_API_KEY),
      generateCompetitiveLandscape(project, LOVABLE_API_KEY),
      generateStrategicFrameworks(project, LOVABLE_API_KEY),
      generateFinancialBasics(project, LOVABLE_API_KEY),
    ];

    const [
      executiveSummary,
      marketAnalysis,
      competitiveLandscape,
      strategicFrameworks,
      financialBasics,
    ] = await Promise.all(sections);

    // Calculate validation score
    const validationScore = calculateValidationScore({
      executiveSummary,
      marketAnalysis,
      competitiveLandscape,
      strategicFrameworks,
      financialBasics,
    });

    // Update report with all sections
    const reportData = {
      executive_summary: executiveSummary,
      market_analysis: marketAnalysis,
      competitive_landscape: competitiveLandscape,
      strategic_frameworks: strategicFrameworks,
      financial_basics: financialBasics,
      validation_score: validationScore,
    };

    await supabase
      .from("reports")
      .update({
        report_data: reportData,
        generation_status: {
          executive_summary: "complete",
          market_analysis: "complete",
          competitive_landscape: "complete",
          strategic_frameworks: "complete",
          financial_basics: "complete",
        },
      })
      .eq("id", report.id);

    // Update project with validation score
    await supabase
      .from("projects")
      .update({
        validation_score: validationScore,
        status: "complete",
      })
      .eq("id", project_id);

    // Update user credits
    await supabase
      .from("profiles")
      .update({
        ai_credits_used: profile.ai_credits_used + creditsNeeded,
      })
      .eq("id", project.user_id);

    // Log AI usage
    await supabase.from("ai_usage_logs").insert({
      user_id: project.user_id,
      project_id: project_id,
      operation_type: "report_generation",
      model_used: "google/gemini-2.5-flash",
      tokens_used: 15000, // Estimated
      cost_cents: 50, // Estimated
    });

    console.log("Report generation complete");

    return new Response(
      JSON.stringify({ success: true, report_id: report.id, validation_score: validationScore }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate report";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: "You are a McKinsey-style business analyst providing structured, data-driven insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI call failed:", errorText);
    throw new Error("AI generation failed");
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function generateExecutiveSummary(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Create a brief executive summary with:
1. Overall validation score (0-100) with justification
2. Top 3 strengths
3. Top 3 concerns
4. Clear Go/No-Go recommendation

Format as JSON with keys: score, strengths (array), concerns (array), recommendation, reasoning`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { score: 65, strengths: ["Extracted from AI"], concerns: ["Parse error"], recommendation: "Review", reasoning: result };
  }
}

async function generateMarketAnalysis(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Provide detailed market analysis:
1. TAM (Total Addressable Market) estimation with methodology
2. SAM (Serviceable Addressable Market)
3. SOM (Serviceable Obtainable Market)
4. Market growth rate and trends
5. Entry barriers assessment
6. Market timing evaluation

Format as JSON with keys: tam, sam, som, growth_rate, trends (array), barriers (array), timing_assessment`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { tam: "Analysis pending", sam: "Analysis pending", som: "Analysis pending", growth_rate: "TBD", trends: [result], barriers: [], timing_assessment: "Review analysis" };
  }
}

async function generateCompetitiveLandscape(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Analyze competitive landscape:
1. Direct competitors (3-5 with descriptions)
2. Indirect competitors (2-3)
3. Your competitive advantages
4. Market positioning recommendation

Format as JSON with keys: direct_competitors (array of {name, description}), indirect_competitors (array), competitive_advantages (array), positioning`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { direct_competitors: [], indirect_competitors: [], competitive_advantages: ["Analysis pending"], positioning: result };
  }
}

async function generateStrategicFrameworks(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Provide strategic analysis:
1. SWOT Analysis (5 items per quadrant)
2. Porter's Five Forces (with High/Medium/Low ratings)
3. Go-to-market strategy recommendations

Format as JSON with keys: swot {strengths, weaknesses, opportunities, threats}, porters_five_forces {supplier_power, buyer_power, competitive_rivalry, threat_of_substitution, threat_of_new_entry}, gtm_strategy (array)`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      porters_five_forces: { supplier_power: "Medium", buyer_power: "Medium", competitive_rivalry: "High", threat_of_substitution: "Medium", threat_of_new_entry: "Medium" },
      gtm_strategy: [result]
    };
  }
}

async function generateFinancialBasics(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Provide financial basics:
1. Estimated startup costs (conservative, moderate, aggressive scenarios)
2. Revenue model analysis
3. Customer acquisition cost (CAC) estimates
4. Basic 3-year revenue projections

Format as JSON with keys: startup_costs {conservative, moderate, aggressive}, revenue_model, cac_estimate, projections {year1, year2, year3}`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      startup_costs: { conservative: "$10K", moderate: "$25K", aggressive: "$50K" },
      revenue_model: result,
      cac_estimate: "Analysis pending",
      projections: { year1: "TBD", year2: "TBD", year3: "TBD" }
    };
  }
}

function calculateValidationScore(sections: any): number {
  // Simple scoring algorithm - can be enhanced
  const executiveScore = sections.executiveSummary?.score || 50;
  
  // Adjust based on other factors
  let finalScore = executiveScore;
  
  // Market analysis impact
  if (sections.marketAnalysis?.growth_rate?.includes("high")) {
    finalScore += 5;
  }
  
  // Competitive advantages
  const advantages = sections.competitiveLandscape?.competitive_advantages?.length || 0;
  finalScore += Math.min(advantages * 2, 10);
  
  // Strategic clarity
  const gtmStrategies = sections.strategicFrameworks?.gtm_strategy?.length || 0;
  finalScore += Math.min(gtmStrategies * 2, 10);
  
  return Math.min(Math.max(Math.round(finalScore), 0), 100);
}
