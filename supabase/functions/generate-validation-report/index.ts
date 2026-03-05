import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================
// MODEL CONFIGURATION — Updated March 2026
// All models available via Lovable AI gateway, no extra setup
// Change via Supabase env vars to upgrade without redeploying
// ============================================================
const PREMIUM_MODEL = Deno.env.get("PREMIUM_MODEL") || "google/gemini-3.1-pro-preview";
const FAST_MODEL = Deno.env.get("FAST_MODEL") || "google/gemini-3-flash-preview";

// Cost estimation for margin tracking (per 1M output tokens, March 2026 pricing)
function estimateCost(model: string, outputTokens: number): number {
  const outputPricing: Record<string, number> = {
    "google/gemini-3.1-pro-preview": 12.00,
    "google/gemini-3-flash-preview": 3.00,
    "google/gemini-3.1-flash-lite-preview": 1.50,
    "google/gemini-2.5-flash": 0.30,
  };
  const pricePerMillion = outputPricing[model] || 3.00;
  return (outputTokens * pricePerMillion) / 1_000_000;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_id, quality = 'standard' } = await req.json();

    if (!project_id) {
      return new Response(
        JSON.stringify({ error: "project_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate the requesting user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user identity
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !authUser) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projectError || !project) {
      throw new Error("Project not found");
    }

    // Verify ownership
    if (project.user_id !== authUser.id) {
      return new Response(
        JSON.stringify({ error: "You don't have permission to generate a report for this project" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit: max 1 report per 60 seconds per user
    const { data: recentReports } = await supabase
      .from("reports")
      .select("created_at")
      .in("project_id", 
        (await supabase.from("projects").select("id").eq("user_id", authUser.id)).data?.map((p: any) => p.id) || []
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentReports && recentReports.length > 0) {
      const lastCreated = new Date(recentReports[0].created_at).getTime();
      const secondsSince = (Date.now() - lastCreated) / 1000;
      if (secondsSince < 60) {
        const retryAfter = Math.ceil(60 - secondsSince);
        return new Response(
          JSON.stringify({ error: "Please wait before generating another report", retry_after: retryAfter }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) } }
        );
      }
    }

    // Check user credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", project.user_id)
      .single();

    if (!profile) {
      throw new Error("User profile not found");
    }

    // Determine models based on quality level
    let sectionPremiumModel: string;
    let sectionFastModel: string;
    let creditsNeeded: number;

    if (quality === 'premium') {
      sectionPremiumModel = PREMIUM_MODEL;
      sectionFastModel = FAST_MODEL;
      creditsNeeded = 12;
    } else {
      // Standard: use Gemini 3 Flash for everything
      sectionPremiumModel = FAST_MODEL;
      sectionFastModel = FAST_MODEL;
      creditsNeeded = 5;
    }

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
          customer_personas: "pending",
          competitive_landscape: "pending",
          strategic_frameworks: "pending",
          porter_five_forces: "pending",
          pestel_analysis: "pending",
          catwoe_analysis: "pending",
          path_to_mvp: "pending",
          go_to_market_strategy: "pending",
          usp_analysis: "pending",
          game_changing_idea: "pending",
          financial_basics: "pending",
          action_plan: "pending",
        },
      })
      .select()
      .single();

    if (reportError) {
      throw new Error("Failed to create report");
    }


    // Update project status
    await supabase
      .from("projects")
      .update({ status: "analyzing" })
      .eq("id", project_id);

    // Helper function to update status after each section
    const updateSectionStatus = async (sectionName: string, sectionData: any, currentStatus: any) => {
      
      const newStatus = { ...currentStatus, [sectionName]: "complete" };

      // Fetch current report_data to merge incrementally
      const { data: currentReport } = await supabase
        .from("reports")
        .select("report_data")
        .eq("id", report.id)
        .single();

      const updatedReportData = {
        ...(currentReport?.report_data as Record<string, any> || {}),
        [sectionName]: sectionData,
      };

      const { error } = await supabase
        .from("reports")
        .update({
          report_data: updatedReportData,
          generation_status: newStatus,
        })
        .eq("id", report.id);

      if (error) {
        console.error(`Error updating ${sectionName}:`, error);
      }
      return newStatus;
    };

    let currentStatus = { ...report.generation_status };

    // Generate sections sequentially with context chaining
    const ctx: Record<string, any> = {};
    const industryCtx = getIndustryContext(project.industry);

    // Use quality-appropriate models for each section
    const executiveSummary = await generateExecutiveSummary(project, LOVABLE_API_KEY, industryCtx, sectionPremiumModel);
    ctx.executiveSummary = executiveSummary;
    currentStatus = await updateSectionStatus("executive_summary", executiveSummary, currentStatus);

    const marketAnalysis = await generateMarketAnalysis(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionPremiumModel);
    ctx.marketAnalysis = marketAnalysis;
    currentStatus = await updateSectionStatus("market_analysis", marketAnalysis, currentStatus);

    const customerPersonas = await generateCustomerPersonas(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionPremiumModel);
    ctx.customerPersonas = customerPersonas;
    currentStatus = await updateSectionStatus("customer_personas", customerPersonas, currentStatus);

    const competitiveLandscape = await generateCompetitiveLandscape(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionPremiumModel);
    ctx.competitiveLandscape = competitiveLandscape;
    currentStatus = await updateSectionStatus("competitive_landscape", competitiveLandscape, currentStatus);

    // Structured framework sections
    const strategicFrameworks = await generateStrategicFrameworks(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionFastModel);
    currentStatus = await updateSectionStatus("strategic_frameworks", strategicFrameworks, currentStatus);

    const porterFiveForces = await generatePorterFiveForces(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionFastModel);
    currentStatus = await updateSectionStatus("porter_five_forces", porterFiveForces, currentStatus);

    const pestelAnalysis = await generatePestelAnalysis(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionFastModel);
    currentStatus = await updateSectionStatus("pestel_analysis", pestelAnalysis, currentStatus);

    const catwoeAnalysis = await generateCatwoeAnalysis(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionFastModel);
    currentStatus = await updateSectionStatus("catwoe_analysis", catwoeAnalysis, currentStatus);

    const pathToMvp = await generatePathToMvp(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionFastModel);
    currentStatus = await updateSectionStatus("path_to_mvp", pathToMvp, currentStatus);

    const goToMarketStrategy = await generateGoToMarketStrategy(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionPremiumModel);
    currentStatus = await updateSectionStatus("go_to_market_strategy", goToMarketStrategy, currentStatus);

    const uspAnalysis = await generateUSPAnalysis(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionFastModel);
    currentStatus = await updateSectionStatus("usp_analysis", uspAnalysis, currentStatus);

    const gameChangingIdea = await generateGameChangingIdea(project, LOVABLE_API_KEY, {
      executiveSummary, marketAnalysis, customerPersonas, competitiveLandscape,
      strategicFrameworks, porterFiveForces, goToMarketStrategy
    }, sectionPremiumModel);
    currentStatus = await updateSectionStatus("game_changing_idea", gameChangingIdea, currentStatus);

    const financialBasics = await generateFinancialBasics(project, LOVABLE_API_KEY, buildContext(ctx, industryCtx), sectionPremiumModel);
    currentStatus = await updateSectionStatus("financial_basics", financialBasics, currentStatus);

    const riskMatrix = await generateRiskMatrix(project, LOVABLE_API_KEY, {
      executiveSummary, marketAnalysis, customerPersonas, competitiveLandscape,
      strategicFrameworks, porterFiveForces, pestelAnalysis, catwoeAnalysis,
      pathToMvp, goToMarketStrategy, uspAnalysis, gameChangingIdea, financialBasics
    }, sectionPremiumModel);
    currentStatus = await updateSectionStatus("risk_matrix", riskMatrix, currentStatus);

    const actionPlan = await generateActionPlan(project, LOVABLE_API_KEY, {
      executiveSummary, marketAnalysis, customerPersonas, competitiveLandscape,
      strategicFrameworks, porterFiveForces, pestelAnalysis, catwoeAnalysis,
      pathToMvp, goToMarketStrategy, uspAnalysis, gameChangingIdea, financialBasics, riskMatrix
    }, sectionPremiumModel);
    currentStatus = await updateSectionStatus("action_plan", actionPlan, currentStatus);

    // Calculate validation score
    const validationScore = calculateValidationScore({
      executiveSummary,
      marketAnalysis,
      customerPersonas,
      competitiveLandscape,
      strategicFrameworks,
      porterFiveForces,
      pestelAnalysis,
      catwoeAnalysis,
      pathToMvp,
      goToMarketStrategy,
      uspAnalysis,
      financialBasics,
    });

    // Final update: add validation_score to report_data
    const { data: finalReport } = await supabase
      .from("reports")
      .select("report_data")
      .eq("id", report.id)
      .single();

    await supabase
      .from("reports")
      .update({
        report_data: {
          ...(finalReport?.report_data as Record<string, any> || {}),
          validation_score: validationScore,
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

    // Log AI usage with cost tracking
    const estimatedPremiumTokens = quality === 'premium' ? 25000 : 0;
    const estimatedFastTokens = quality === 'premium' ? 15000 : 40000;
    const estimatedTotalCost = estimateCost(sectionPremiumModel, estimatedPremiumTokens) + estimateCost(sectionFastModel, estimatedFastTokens);

    await supabase.from("ai_usage_logs").insert({
      user_id: project.user_id,
      project_id: project_id,
      operation_type: "report_generation",
      model_used: quality === 'premium' ? "gemini-3.1-pro + gemini-3-flash (hybrid)" : "gemini-3-flash (standard)",
      model_name: `Premium: ${sectionPremiumModel}, Fast: ${sectionFastModel}`,
      tokens_used: estimatedPremiumTokens + estimatedFastTokens,
      cost_cents: Math.ceil(estimatedTotalCost * 100),
      estimated_cost_usd: estimatedTotalCost,
    });

    // Send report-complete email
    try {
      if (profile.email_notifications_enabled !== false) {
        const notifPrefs = profile.notification_preferences as Record<string, boolean> | null;
        if (!notifPrefs || notifPrefs.report_completion !== false) {
          const topInsights: string[] = [];
          if (executiveSummary?.strengths) topInsights.push(...executiveSummary.strengths.slice(0, 3));

          const sendEmailUrl = `${SUPABASE_URL}/functions/v1/send-email`;
          await fetch(sendEmailUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({
              to: profile.email,
              template: 'report_complete',
              template_data: {
                name: profile.full_name || profile.email,
                project_name: project.name,
                validation_score: validationScore,
                top_insights: topInsights,
                report_url: `https://startup-scanner.lovable.app/report/${project_id}`,
              },
            }),
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send report email:', emailErr);
    }

    // Check if credits are running low (75%+) and send alert
    try {
      const newCreditsUsed = profile.ai_credits_used + creditsNeeded;
      const usagePercent = (newCreditsUsed / profile.ai_credits_monthly) * 100;
      const prevPercent = (profile.ai_credits_used / profile.ai_credits_monthly) * 100;

      if (usagePercent >= 75 && prevPercent < 75 && profile.email_notifications_enabled !== false) {
        const notifPrefs = profile.notification_preferences as Record<string, boolean> | null;
        if (!notifPrefs || notifPrefs.credit_alerts !== false) {
          const sendEmailUrl = `${SUPABASE_URL}/functions/v1/send-email`;
          await fetch(sendEmailUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({
              to: profile.email,
              template: 'credits_low',
              template_data: {
                name: profile.full_name || profile.email,
                credits_used: newCreditsUsed,
                credits_total: profile.ai_credits_monthly,
              },
            }),
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send credits email:', emailErr);
    }

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

function cleanJsonFromMarkdown(text: string): string {
  let cleaned = text
    // Remove markdown code blocks with language specifier
    .replace(/```json\s*/gi, '')
    .replace(/```javascript\s*/gi, '')
    .replace(/```\s*/g, '')
    // Remove any leading/trailing whitespace
    .trim();
  
  // Try to find JSON boundaries - support both objects and arrays
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  // Determine if it's an array or object based on which delimiter comes first
  const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
  
  if (isArray && firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

function validateAndFixJson(jsonStr: string, expectedKeys: string[]): any {
  try {
    const parsed = JSON.parse(jsonStr);
    // Check if at least some expected keys exist
    const hasKeys = expectedKeys.some(key => key in parsed);
    if (hasKeys) return parsed;
    return null;
  } catch (error) {
    // Try to fix common JSON issues
    let fixed = jsonStr
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix unescaped quotes in strings (basic)
      .replace(/([^\\])"([^"]*)"([^,}\]])/g, '$1\\"$2\\"$3');
    
    try {
      return JSON.parse(fixed);
    } catch {
      // Try more aggressive fixes - balance brackets
      fixed = balanceBrackets(fixed);
      try {
        return JSON.parse(fixed);
      } catch {
        return null;
      }
    }
  }
}

function balanceBrackets(jsonStr: string): string {
  let result = jsonStr;
  
  // Fix common AI mistake: using } instead of ] to close arrays
  // Look for patterns like: ["item", "item2" } -> ["item", "item2" ]
  result = result.replace(/(\[[^\[\]]*)\s*\}/g, (match, before) => {
    // Only fix if this doesn't have a matching ]
    return before + ']';
  });
  
  // Count brackets and braces
  let braceCount = 0;
  let bracketCount = 0;
  
  for (const char of result) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '[') bracketCount++;
    if (char === ']') bracketCount--;
  }
  
  // Add missing closing brackets/braces
  while (bracketCount > 0) {
    result += ']';
    bracketCount--;
  }
  while (braceCount > 0) {
    result += '}';
    braceCount--;
  }
  
  // Fix trailing commas again after bracket balancing
  result = result.replace(/,(\s*[}\]])/g, '$1');
  
  return result;
}

function safeParseJSON(text: string, sectionName: string): any {
  // Step 1: Direct parse (should work most of the time with response_mime_type)
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error(`[${sectionName}] Direct parse failed, trying cleanup...`);
  }

  // Step 2: Clean markdown artifacts (fallback for edge cases)
  try {
    const cleaned = cleanJsonFromMarkdown(text);
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(`[${sectionName}] Cleaned parse failed, trying bracket balancing...`);
  }

  // Step 3: Balance brackets (last resort)
  try {
    const cleaned = cleanJsonFromMarkdown(text);
    const balanced = balanceBrackets(cleaned);
    return JSON.parse(balanced);
  } catch (e) {
    console.error(`[${sectionName}] All parse attempts failed. Raw (first 300 chars):`, text.substring(0, 300));
    return null;
  }
}

function getIndustryContext(industry: string): string {
  const contexts: Record<string, string> = {
    "B2B SaaS": `Industry context: B2B SaaS businesses should target net revenue retention above 110%, aim for CAC payback under 18 months, and achieve LTV:CAC ratios above 3:1. Key success factors include product-led growth, low churn, and land-and-expand strategies. The median B2B SaaS startup takes 7-10 years to reach $100M ARR. Current trends include AI-augmented features, usage-based pricing, and vertical SaaS specialization.`,
    "E-commerce": `Industry context: E-commerce businesses should target gross margins above 40%, aim for repeat purchase rates above 30%, and achieve customer acquisition costs under $30 for direct-to-consumer. Key success factors include supply chain efficiency, brand differentiation, and retention marketing. Average e-commerce conversion rates are 2-3%. Current trends include social commerce, sustainability positioning, and personalization at scale.`,
    "Local Services": `Industry context: Local service businesses should target 60%+ gross margins, build for recurring revenue through maintenance contracts, and focus on referral-driven growth. Key success factors include online reputation (Google Reviews above 4.5 stars), geographic density, and reliable workforce management. Current trends include online booking, on-demand service models, and subscription-based service packages.`,
    "Healthcare": `Industry context: Healthcare businesses face long sales cycles (6-18 months), require compliance with HIPAA and other regulations, and need clinical validation for adoption. Key success factors include regulatory navigation, provider partnerships, and evidence-based outcomes. Current trends include telehealth normalization, AI-assisted diagnostics, and remote patient monitoring. Expect 2-3x longer time to revenue than other verticals.`,
    "Fintech": `Industry context: Fintech businesses face heavy regulation (state money transmitter licenses, PCI compliance, SEC/FINRA oversight), require significant trust-building, and often need banking partners. Key success factors include regulatory compliance, security infrastructure, and partnership ecosystems. Current trends include embedded finance, open banking APIs, and AI-powered underwriting. CAC tends to be high ($100-500) but LTV can be substantial.`,
    "Education": `Industry context: EdTech businesses face long sales cycles in B2B (school districts buy annually), high seasonality, and need to demonstrate measurable learning outcomes. Key success factors include curriculum alignment, teacher adoption, and engagement metrics. Current trends include AI tutoring, micro-credentials, and cohort-based learning. Freemium models dominate consumer; per-seat licensing dominates institutional.`,
    "Food & Beverage": `Industry context: F&B businesses typically operate on thin margins (3-9% net), require significant working capital for inventory, and face high competition. Key success factors include location strategy, unit economics per order, and brand loyalty programs. Current trends include ghost kitchens, subscription meal services, and health-conscious positioning. Expect high failure rates (60% in first year) without strong unit economics.`,
    "Real Estate": `Industry context: Real estate businesses face cyclical markets, high capital requirements, and complex regulatory environments. Key success factors include market timing, deal flow, and relationship networks. Current trends include proptech platforms, fractional ownership, and AI-powered valuations. Transaction-based models require volume; property management provides recurring revenue.`,
    "Media & Entertainment": `Industry context: Media businesses face attention economy dynamics, require content differentiation, and need scalable distribution. Key success factors include audience retention, content creation costs vs. revenue, and platform strategy. Current trends include creator economy, short-form video, and AI-generated content. Advertising models need massive scale; subscription models need high-value content.`,
    "Manufacturing": `Industry context: Manufacturing businesses require significant upfront capital, face supply chain complexity, and operate on volume-dependent margins. Key success factors include production efficiency, quality control, and supplier relationships. Current trends include additive manufacturing, IoT-enabled smart factories, and reshoring. Margins improve dramatically with scale.`,
  };

  return contexts[industry] || `Industry context: Analyze this business on its own merits. Focus on the specific market dynamics described in the business description rather than industry generalizations. Research the specific industry benchmarks, typical margins, success metrics, and current trends relevant to this space.`;
}

function buildContext(previousSections: Record<string, any>, industryCtx?: string): string {
  const parts: string[] = [];

  if (industryCtx) {
    parts.push(industryCtx);
  }

  if (previousSections.executiveSummary) {
    parts.push(`PREVIOUS ANALYSIS - Executive Summary: Score ${previousSections.executiveSummary.score}/100. Key strengths: ${previousSections.executiveSummary.strengths?.slice(0, 3).join(', ')}. Key concerns: ${previousSections.executiveSummary.concerns?.slice(0, 3).join(', ')}.`);
  }
  if (previousSections.marketAnalysis) {
    parts.push(`PREVIOUS ANALYSIS - Market: TAM ${previousSections.marketAnalysis.tam}. Growth: ${previousSections.marketAnalysis.growth_rate}. Key trends: ${previousSections.marketAnalysis.trends?.slice(0, 3).join(', ')}.`);
  }
  if (previousSections.customerPersonas) {
    const persona1 = previousSections.customerPersonas[0];
    if (persona1) {
      parts.push(`PREVIOUS ANALYSIS - Primary Customer: ${persona1.name}. Pain: ${persona1.pain_points?.[0]?.pain || 'identified'}. Dream outcome: ${persona1.dream_outcome || 'identified'}.`);
    }
  }
  if (previousSections.competitiveLandscape) {
    const comps = previousSections.competitiveLandscape.direct_competitors;
    if (comps?.length) {
      parts.push(`PREVIOUS ANALYSIS - Competitors: ${comps.slice(0, 3).map((c: any) => c.name || c).join(', ')}. Advantages: ${previousSections.competitiveLandscape.competitive_advantages?.slice(0, 2).join(', ')}.`);
    }
  }

  return parts.length > 0 ? '\n\nCONTEXT FROM PRIOR ANALYSIS:\n' + parts.join('\n') : '';
}

const SYSTEM_PROMPT = `You are a world-class business strategist combining deep analytical rigor with Y Combinator startup pragmatism. Your analysis must be:

1. SPECIFIC — Never give generic advice. Every insight must be tailored to THIS exact business, THIS exact industry, THIS exact market. If analyzing a dog-walking app in Austin, mention Austin's pet ownership rates, local competitors by name, and neighborhood-specific strategies.

2. BRUTALLY HONEST — If an idea has fatal flaws, say so clearly. Founders need truth, not encouragement. A score of 30 with clear reasoning is more valuable than an inflated 70.

3. ACTIONABLE — Every section must answer 'so what should I do about this?' Don't just identify trends — explain how to exploit them. Don't just list risks — explain how to mitigate them.

4. DATA-GROUNDED — Use real market data, real competitor names, real pricing benchmarks, and realistic financial estimates. When you don't have exact data, give calibrated ranges with your confidence level.

5. CONTRARIAN — Challenge assumptions. If everyone is doing X, ask whether Y would be a better approach. The best business advice often goes against conventional wisdom.

Return ONLY valid JSON without any markdown formatting, code blocks, or extra text. Ensure all JSON is complete and properly formatted.`;

async function callAI(prompt: string, apiKey: string, maxTokens?: number, model?: string): Promise<string> {
  const selectedModel = model || FAST_MODEL;
  const body: any = {
    model: selectedModel,
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT
      },
      {
        role: "user",
        content: prompt
      }
    ],
  };
  
  if (maxTokens) {
    body.max_tokens = maxTokens;
  }

  // Force JSON output mode for Gemini models — dramatically improves reliability
  if (selectedModel.includes('gemini')) {
    body.response_mime_type = "application/json";
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`AI call failed (${selectedModel}):`, errorText);

    // Automatic fallback: if premium model fails, retry with fast model
    if (selectedModel !== FAST_MODEL) {
      console.log(`Premium model failed, falling back to ${FAST_MODEL}`);
      return callAI(prompt, apiKey, maxTokens, FAST_MODEL);
    }

    throw new Error("AI generation failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";
  return content;
}

async function generateExecutiveSummary(project: any, apiKey: string, industryContext: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${project.website_url ? `Website: ${project.website_url}` : ''}
${industryContext}

Create a rigorous executive summary as if you were a senior partner at a top strategy firm presenting to a client who is about to invest their life savings into this idea. Be honest — their financial future depends on your accuracy.

SCORING CRITERIA (be strict):
- 80-100: Exceptional opportunity with clear market demand, defensible advantages, and realistic path to profitability. Very rare.
- 60-79: Solid opportunity with some notable advantages but significant challenges to address. Most good ideas land here.
- 40-59: Viable but risky. The idea needs substantial pivoting, differentiation, or market validation before investing serious resources.
- 20-39: Significant concerns outweigh the potential. Would recommend major pivots or exploring alternative ideas.
- 0-19: Fundamental viability issues. The market, timing, or approach has critical flaws.

For the strengths and concerns:
- Be SPECIFIC to this exact business, not generic. Bad: "Growing market opportunity." Good: "The pet services market in mid-size cities is growing 12% annually, driven by millennials spending 2x more on pets than previous generations."
- Each strength/concern should be 2-3 sentences with specific reasoning, not just a phrase.
- Include at least one contrarian insight — something that's not obvious.

For the recommendation:
- Write 3-4 paragraphs of genuine strategic advice, not a generic "this has potential."
- If the score is below 50, clearly explain what would need to change to make this viable.
- If the score is above 70, explain the specific risks that could derail it.
- Include the single most important thing the founder should do in the next 7 days.

Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside string values.
{
  "score": number,
  "score_justification": "2-3 sentences explaining exactly why you gave this specific score",
  "strengths": ["detailed strength 1 (2-3 sentences)", "detailed strength 2", "detailed strength 3"],
  "concerns": ["detailed concern 1 (2-3 sentences)", "detailed concern 2", "detailed concern 3"],
  "recommendation": "3-4 paragraphs of strategic advice with specific action items",
  "contrarian_insight": "One non-obvious observation about this business that most people would miss",
  "seven_day_action": "The single most important thing to do in the next 7 days"
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 4000, model);
  const parsed = safeParseJSON(result, "executive_summary");
  if (parsed) return parsed;
  return { score: 65, strengths: ["Analysis failed — please regenerate"], concerns: ["Parse error"], recommendation: "Please regenerate this report", reasoning: result?.substring(0, 200) };
}

async function generateMarketAnalysis(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business: ${project.name} (${project.industry})
Description: ${project.description}
${context}

Provide a rigorous market analysis as if you were a market research analyst preparing a report for a venture capital investment committee. Use real data where possible, and clearly label estimates.

CRITICAL REQUIREMENTS:
- TAM/SAM/SOM must include HOW you calculated the numbers (cite your methodology, not just a number)
- Trends must be specific to this industry/vertical, not generic tech trends
- Include at least one "against the grain" insight — a trend everyone else is ignoring
- Barriers should include realistic difficulty ratings and how other companies overcame them
- The timing assessment should reference specific market signals (funding rounds, regulatory changes, technology maturity, consumer behavior shifts)

Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside string values.
{
  "tam": "Dollar amount with calculation methodology (e.g., '$12B — calculated from 50M US households x $240/year average spend on home services')",
  "sam": "Dollar amount with geographic/segment scoping methodology",
  "som": "Dollar amount with realistic year-1 through year-3 capture rate and reasoning",
  "growth_rate": "Percentage with source or reasoning (e.g., '14% CAGR based on historical growth in adjacent markets and current adoption curves')",
  "market_maturity": "Early/Growing/Mature/Declining with explanation of where this market sits in the adoption lifecycle",
  "trends": [
    "Specific trend 1 with data point or evidence (2 sentences)",
    "Specific trend 2 with data point or evidence",
    "Specific trend 3 with data point or evidence",
    "Contrarian trend — something most people in this space are ignoring"
  ],
  "barriers": [
    {"barrier": "Specific barrier", "difficulty": "Low/Medium/High", "how_to_overcome": "Specific strategy used by X company or recommended approach"},
    {"barrier": "Second barrier", "difficulty": "rating", "how_to_overcome": "Strategy"}
  ],
  "timing_assessment": "3-4 sentences on whether NOW is the right time, referencing specific market signals",
  "market_risks": ["Specific risk 1 that could shrink this market", "Specific risk 2"],
  "adjacent_opportunities": "One adjacent market or pivot opportunity the founder should keep in mind"
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 4000, model);
  const parsed = safeParseJSON(result, "market_analysis");
  if (parsed) {
    // Ensure trends is an array of strings
    if (parsed.trends && Array.isArray(parsed.trends)) {
      parsed.trends = parsed.trends.map((t: any) => 
        typeof t === 'string' ? t : (t.trend || t.name || t.description || JSON.stringify(t))
      );
    }
    // Ensure barriers is normalized
    if (parsed.barriers && Array.isArray(parsed.barriers)) {
      parsed.barriers = parsed.barriers.map((b: any) =>
        typeof b === 'string' ? { barrier: b, difficulty: 'Medium', how_to_overcome: 'Research needed' } : b
      );
    }
    return parsed;
  }
  return { 
    tam: "Market size analysis pending", sam: "Serviceable market pending", som: "Obtainable market pending", 
    growth_rate: "Growth analysis pending", market_maturity: "Analysis pending",
    trends: ["Market trend analysis in progress"], 
    barriers: [{ barrier: "Entry barrier analysis in progress", difficulty: "Medium", how_to_overcome: "TBD" }], 
    timing_assessment: "Market timing assessment in progress",
    market_risks: ["Risk analysis pending"], adjacent_opportunities: "Adjacent opportunity analysis pending"
  };
}

async function generateCompetitiveLandscape(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Analyze the competitive landscape as if you were preparing a war room briefing for a startup about to enter this market. Name REAL companies where possible.

REQUIREMENTS:
- Name actual real-world competitors, not made-up ones. Include their approximate size, funding, and what they do well/poorly.
- For each competitor, identify the specific vulnerability you would exploit.
- The positioning recommendation should be concrete enough to become a tagline.
- Include competitive advantages that are DEFENSIBLE (not just "better UX" — explain WHY it's defensible).

Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside string values.
{
  "direct_competitors": [
    {
      "name": "Real company name",
      "description": "What they do and their market position",
      "estimated_size": "Revenue/users/funding if known",
      "what_they_do_well": "Their genuine strength",
      "vulnerability": "The specific weakness you would exploit to win their customers",
      "threat_level": "Low/Medium/High"
    }
  ],
  "indirect_competitors": [
    {
      "name": "Company or alternative approach",
      "description": "How they indirectly compete",
      "why_customers_choose_them": "What draws customers to this alternative"
    }
  ],
  "competitive_advantages": [
    {
      "advantage": "Specific advantage",
      "why_defensible": "What makes this hard for competitors to copy",
      "duration": "How long this advantage will last before competitors catch up"
    }
  ],
  "positioning": {
    "recommended_position": "The specific market position to own (2-3 sentences)",
    "tagline_suggestion": "A concrete tagline that captures this positioning",
    "positioning_against": "Specifically, how to position AGAINST the strongest competitor"
  },
  "competitive_moat_strategy": "The #1 thing to build early that will create a lasting competitive moat (2-3 sentences)"
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 4000, model);
  const parsed = safeParseJSON(result, "competitive_landscape");
  if (parsed) {
    if (parsed.direct_competitors && Array.isArray(parsed.direct_competitors)) {
      parsed.direct_competitors = parsed.direct_competitors.map((c: any) =>
        typeof c === 'string' ? { name: c, description: '' } : c
      );
    }
    if (parsed.indirect_competitors && Array.isArray(parsed.indirect_competitors)) {
      parsed.indirect_competitors = parsed.indirect_competitors.map((c: any) =>
        typeof c === 'string' ? { name: c, description: c, why_customers_choose_them: '' } : c
      );
    }
    if (parsed.competitive_advantages && Array.isArray(parsed.competitive_advantages)) {
      parsed.competitive_advantages = parsed.competitive_advantages.map((a: any) =>
        typeof a === 'string' ? { advantage: a, why_defensible: '', duration: '' } : a
      );
    }
    if (typeof parsed.positioning === 'string') {
      parsed.positioning = { recommended_position: parsed.positioning, tagline_suggestion: '', positioning_against: '' };
    }
    return parsed;
  }
  return { direct_competitors: [], indirect_competitors: [], competitive_advantages: [{ advantage: "Analysis pending", why_defensible: "", duration: "" }], positioning: { recommended_position: "Analysis pending", tagline_suggestion: "", positioning_against: "" } };
}

async function generateStrategicFrameworks(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Provide strategic analysis:
1. SWOT Analysis (5 items per quadrant)
2. Go-to-market strategy recommendations

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- swot {strengths, weaknesses, opportunities, threats} (all arrays of plain strings)
- gtm_strategy (array of plain strings - no bold formatting)

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 3000, model);
  const parsed = safeParseJSON(result, "strategic_frameworks");
  if (parsed) return parsed;
  return { swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] }, gtm_strategy: ["Analysis pending"] };
}

async function generatePorterFiveForces(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Analyze "${project.name}" (${project.industry}) using Porter's Five Forces.
${context}

For each force, give a rating (High/Medium/Low) and 2-3 sentence analysis.

Return JSON:
{
  "supplier_power": {"rating": "Low/Medium/High", "analysis": "plain text"},
  "buyer_power": {"rating": "Low/Medium/High", "analysis": "plain text"},
  "competitive_rivalry": {"rating": "Low/Medium/High", "analysis": "plain text"},
  "threat_of_substitution": {"rating": "Low/Medium/High", "analysis": "plain text"},
  "threat_of_new_entry": {"rating": "Low/Medium/High", "analysis": "plain text"}
}

Business: ${project.description?.substring(0, 500)}

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text.

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 3000, model);
  const parsed = safeParseJSON(result, "porter_five_forces");
  if (parsed) return parsed;
  return { 
    supplier_power: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." },
    buyer_power: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." },
    competitive_rivalry: { rating: "High", analysis: "Unable to generate analysis. Please try regenerating the report." },
    threat_of_substitution: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." },
    threat_of_new_entry: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." }
  };
}

async function generateCustomerPersonas(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Generate 3 distinct customer personas for: ${project.name}

Industry: ${project.industry}
Description: ${project.description?.substring(0, 800)}
${context}

For each persona, provide:
1. Targeting priority (1st, 2nd, or 3rd) and why
2. Name (first name + role like "Sarah the Marketing Director")
3. Demographics: age range, job/role, income range, location type
4. Values (3 things they care about) and personality traits (2-3)
5. Three pain points with their impact
6. Current broken solution and dream outcome
7. Four objections with root causes
8. Four closing angles that address the objections
9. Proof they need and urgency trigger

Return JSON array with this structure:
[
  {
    "priority": "1st",
    "priority_reason": "Easiest to reach and highest conversion likelihood",
    "name": "Sarah the Marketing Director",
    "age": "32-38",
    "job": "Marketing Director at mid-size SaaS",
    "income": "$90K-$120K",
    "location": "Urban, tech hub cities",
    "values": ["Efficiency", "Data-driven decisions", "Career growth"],
    "personality": ["Analytical", "Results-oriented"],
    "pain_points": [
      {"pain": "Specific problem", "impact": "How it affects them"},
      {"pain": "Another problem", "impact": "The consequence"},
      {"pain": "Third problem", "impact": "The result"}
    ],
    "current_solution": "What they do now and why it fails",
    "dream_outcome": "What they really want to achieve",
    "objections": [
      {"objection": "What they say", "root_cause": "Real reason behind it"},
      {"objection": "Second concern", "root_cause": "Underlying issue"},
      {"objection": "Third hesitation", "root_cause": "True cause"},
      {"objection": "Fourth doubt", "root_cause": "Real barrier"}
    ],
    "closing_angles": [
      {"angle": "How to overcome", "addresses": "Which objection"},
      {"angle": "Approach two", "addresses": "Objection it solves"},
      {"angle": "Third method", "addresses": "Related objection"},
      {"angle": "Fourth tactic", "addresses": "Final objection"}
    ],
    "proof_needed": "What evidence convinces them",
    "urgency_trigger": "What makes them act now"
  }
]

CRITICAL: Return ONLY a valid JSON array. No markdown, no extra text. Start your response with [ and end with ].`;

  const result = await callAI(prompt, apiKey, 6000, model);
  const parsed = safeParseJSON(result, "customer_personas");
  if (parsed) return Array.isArray(parsed) ? parsed : [parsed];
  return [{
    priority: "1st", priority_reason: "Analysis failed - please regenerate report",
    name: "Target Customer", age: "25-45", job: "Professional in target industry",
    income: "Varies by market", location: "Primary market areas",
    values: ["Value proposition alignment", "Problem resolution", "Efficiency"],
    personality: ["Decision-maker", "Solution-oriented"],
    pain_points: [{ pain: "Core problem your product solves", impact: "Significant time/money loss" }],
    current_solution: "Existing alternatives that fall short",
    dream_outcome: "The ideal state your product enables",
    objections: [{ objection: "Common concern", root_cause: "Underlying uncertainty" }],
    closing_angles: [{ angle: "Address with proof and guarantees", addresses: "Main objections" }],
    proof_needed: "Case studies, testimonials, demos",
    urgency_trigger: "Limited time offer or growing pain point"
  }];
}

async function generateFinancialBasics(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Create detailed financial projections as if you were a startup financial advisor helping a first-time founder build their first financial model. All numbers should be realistic and specific to this business.

REQUIREMENTS:
- Startup costs must list specific line items, not just a total
- Revenue projections must show the math (price × customers × frequency)
- CAC must reference specific acquisition channels with per-channel estimates
- Unit economics must make sense (LTV must exceed CAC by at least 3x for a viable business)

CRITICAL: Return ONLY valid JSON. No markdown, no comments. Start your response with { and end with }.

{
  "startup_costs": {
    "conservative": {
      "total": "$X",
      "breakdown": [
        {"item": "Specific cost item", "amount": "$X", "notes": "Why this is needed"}
      ]
    },
    "moderate": {
      "total": "$X",
      "breakdown": [{"item": "Item", "amount": "$X", "notes": "Notes"}]
    },
    "aggressive": {
      "total": "$X",
      "breakdown": [{"item": "Item", "amount": "$X", "notes": "Notes"}]
    }
  },
  "revenue_model": {
    "primary_model": "Subscription/One-time/Marketplace/etc",
    "pricing_recommendation": "Specific price point(s) with reasoning",
    "revenue_streams": [
      {"stream": "Primary revenue stream", "percentage": "70%", "description": "How this generates revenue"}
    ]
  },
  "unit_economics": {
    "average_revenue_per_customer": "$X/month or /year",
    "estimated_cac": "$X",
    "cac_breakdown": [
      {"channel": "Specific channel", "cost_per_acquisition": "$X", "expected_volume": "X customers/month"}
    ],
    "estimated_ltv": "$X",
    "ltv_to_cac_ratio": "X:1",
    "payback_period": "X months",
    "viability_assessment": "Whether unit economics are sustainable and what needs to improve"
  },
  "projections": {
    "year1": {
      "revenue": "$X",
      "customers": "X",
      "expenses": "$X",
      "net": "$X (profit/loss)",
      "assumptions": "Key assumption behind this projection"
    },
    "year2": {
      "revenue": "$X",
      "customers": "X",
      "expenses": "$X",
      "net": "$X (profit/loss)",
      "assumptions": "Key assumption"
    },
    "year3": {
      "revenue": "$X",
      "customers": "X",
      "expenses": "$X",
      "net": "$X (profit/loss)",
      "assumptions": "Key assumption"
    }
  },
  "funding_recommendation": "Whether the founder should bootstrap, seek angel funding, or VC funding — and why (2-3 sentences)",
  "break_even_estimate": "When the business is projected to become profitable and what needs to happen to get there"
CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 5000, model);
  const parsed = safeParseJSON(result, "financial_basics");
  if (parsed) {
    // Backwards compat normalizations
    for (const tier of ['conservative', 'moderate', 'aggressive']) {
      if (typeof parsed.startup_costs?.[tier] === 'string') {
        parsed.startup_costs[tier] = { total: parsed.startup_costs[tier], breakdown: [] };
      }
    }
    if (typeof parsed.revenue_model === 'string') {
      parsed.revenue_model = { primary_model: 'See details', pricing_recommendation: parsed.revenue_model, revenue_streams: [] };
    }
    return parsed;
  }
  return {
    startup_costs: { conservative: { total: "$10K", breakdown: [] }, moderate: { total: "$25K", breakdown: [] }, aggressive: { total: "$50K", breakdown: [] } },
    revenue_model: { primary_model: "Analysis pending", pricing_recommendation: "", revenue_streams: [] },
    unit_economics: null,
    projections: { year1: { revenue: "TBD", customers: "TBD", expenses: "TBD", net: "TBD", assumptions: "" }, year2: { revenue: "TBD", customers: "TBD", expenses: "TBD", net: "TBD", assumptions: "" }, year3: { revenue: "TBD", customers: "TBD", expenses: "TBD", net: "TBD", assumptions: "" } },
    funding_recommendation: "Analysis pending", break_even_estimate: "Analysis pending"
  };
}

async function generateRiskMatrix(project: any, apiKey: string, allSections: Record<string, any>, model?: string) {
  const condensed = Object.entries(allSections)
    .map(([key, val]) => `${key}: ${JSON.stringify(val).slice(0, 600)}`)
    .join('\n\n');

  const prompt = `Based on all the analysis for ${project.name}:

${condensed}

Create a comprehensive risk matrix that consolidates ALL risks identified across the market analysis, competitive landscape, PESTEL analysis, and strategic frameworks. For each risk, provide a specific mitigation strategy.

CRITICAL: Return ONLY valid JSON. No markdown, no comments. Start your response with { and end with }.

{
  "critical_risks": [
    {
      "risk": "Specific risk description",
      "category": "Market/Competition/Financial/Operational/Regulatory",
      "probability": "High/Medium/Low",
      "impact": "High/Medium/Low",
      "source_section": "Which analysis section identified this",
      "mitigation_strategy": "Specific, actionable mitigation steps (2-3 sentences)",
      "early_warning_sign": "What to watch for that signals this risk is materializing",
      "contingency_plan": "What to do if this risk becomes reality"
    }
  ],
  "moderate_risks": [same structure as above],
  "low_risks": [same structure as above],
  "overall_risk_assessment": "2-3 sentences on the overall risk profile of this business — is it high-risk/high-reward, or low-risk/steady-growth?",
  "biggest_unknown": "The single biggest uncertainty that the founder should resolve ASAP through research or experimentation"
}

Include 2-4 risks in each category (critical, moderate, low). Be specific to THIS business.

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 4000, model);
  const parsed = safeParseJSON(result, "risk_matrix");
  if (parsed) return parsed;
  return { critical_risks: [], moderate_risks: [], low_risks: [], overall_risk_assessment: "Risk analysis pending", biggest_unknown: "Analysis pending" };
}

async function generatePestelAnalysis(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Provide a PESTEL analysis covering all six factors. For each factor, write 2-3 sentences about the impact on this business.

CRITICAL: Return ONLY valid JSON with these exact 6 keys. Each value must be a plain text string (no markdown, no special characters).

{
  "political": "Your analysis of political factors here",
  "economic": "Your analysis of economic factors here",
  "social": "Your analysis of social factors here",
  "technological": "Your analysis of technological factors here",
  "environmental": "Your analysis of environmental factors here",
  "legal": "Your analysis of legal factors here"
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 3000, model);
  const parsed = safeParseJSON(result, "pestel_analysis");
  if (parsed) {
    const requiredKeys = ['political', 'economic', 'social', 'technological', 'environmental', 'legal'];
    const hasAllKeys = requiredKeys.every(key => parsed[key] && typeof parsed[key] === 'string' && parsed[key].length > 20);
    if (hasAllKeys) return parsed;
  }
  return { 
    political: "Political factors impact this business through regulatory oversight and government policy changes that may affect operations and market access.",
    economic: "Economic conditions including inflation, interest rates, and consumer purchasing power directly influence market demand and operational costs.",
    social: "Social and demographic trends shape customer preferences, workforce availability, and market opportunities for this business.",
    technological: "Technological advancements create opportunities for innovation, automation, and competitive differentiation in this industry.",
    environmental: "Environmental considerations including sustainability requirements and climate-related regulations increasingly affect business operations.",
    legal: "Legal frameworks governing employment, consumer protection, and industry-specific regulations establish compliance requirements."
  };
}

async function generateCatwoeAnalysis(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Provide a comprehensive CATWOE analysis for this business idea:

1. Customers: Who are the beneficiaries? Who will gain from this system/business?
2. Actors: Who will implement and operate the system? Who are the key team members needed?
3. Transformation: What is the core transformation? What input becomes what output?
4. World View: What is the bigger picture? What beliefs/values make this transformation meaningful?
5. Owners: Who has the authority? Who can stop this initiative? Who controls resources?
6. Environmental Constraints: What external constraints exist? What limits must be considered (legal, ethical, resource, technological)?

For each element, provide analysis with description and key points.

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- customers { description (string), key_points (array) }
- actors { description (string), key_points (array) }
- transformation { description (string), inputs (array), outputs (array) }
- world_view { description (string), assumptions (array) }
- owners { description (string), stakeholders (array) }
- environmental_constraints { description (string), constraints (array) }

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 3000, model);
  const parsed = safeParseJSON(result, "catwoe_analysis");
  if (parsed) return parsed;
  return { 
    customers: { description: "Analysis pending", key_points: ["TBD"] },
    actors: { description: "Analysis pending", key_points: ["TBD"] },
    transformation: { description: "Analysis pending", inputs: ["TBD"], outputs: ["TBD"] },
    world_view: { description: "Analysis pending", assumptions: ["TBD"] },
    owners: { description: "Analysis pending", stakeholders: ["TBD"] },
    environmental_constraints: { description: "Analysis pending", constraints: ["TBD"] }
  };
}

async function generatePathToMvp(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Create a comprehensive Path to MVP (Minimum Viable Product) roadmap covering:

1. MVP Definition with description and core value
2. Core Features: List 5-7 features with priority, effort, and value
3. Development Phases with deliverables and milestones
4. Resource Requirements
5. Launch Strategy
6. Success Metrics
7. Iteration Plan

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting.

Format as JSON with keys:
- mvp_definition { description (string), core_value (string) }
- core_features (array of { feature, priority, effort, value })
- development_phases (array of { phase, duration, deliverables (array), milestones (array) })
- resource_requirements { team (array), tools (array), estimated_budget (string), timeline (string) }
- launch_strategy { target_audience (string), channels (array), approach (string), timeline (string) }
- success_metrics (array of { metric, target, measurement })
- iteration_plan { feedback_channels (array), review_frequency (string), improvement_process (string) }

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 3000, model);
  const parsed = safeParseJSON(result, "path_to_mvp");
  if (parsed) return parsed;
  return {
    mvp_definition: { description: "Analysis pending", core_value: "TBD" },
    core_features: [{ feature: "Feature analysis pending", priority: "High", effort: "TBD", value: "TBD" }],
    development_phases: [{ phase: "Phase 1", duration: "TBD", deliverables: ["TBD"], milestones: ["TBD"] }],
    resource_requirements: { team: ["TBD"], tools: ["TBD"], estimated_budget: "TBD", timeline: "TBD" },
    launch_strategy: { target_audience: "TBD", channels: ["TBD"], approach: "TBD", timeline: "TBD" },
    success_metrics: [{ metric: "TBD", target: "TBD", measurement: "TBD" }],
    iteration_plan: { feedback_channels: ["TBD"], review_frequency: "TBD", improvement_process: "TBD" }
  };
}

async function generateUSPAnalysis(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Based on the following business idea, create a comprehensive USP (Unique Selling Proposition) analysis:

Project: ${project.name}
Description: ${project.description}
Industry: ${project.industry}
${context}

Provide a detailed USP analysis with:
1. Current positioning analysis (what makes them unique now)
2. Recommended USP statement (clear, compelling, single sentence)
3. Key differentiators (3-5 specific points that set them apart)
4. Competitive advantages (tangible benefits over competitors)
5. Value proposition components (what they deliver, how, and why it matters)
6. Target audience alignment (how USP speaks to ideal customers)
7. Proof points (evidence/credentials that support the USP)
8. Communication guidelines (how to articulate the USP across channels)

Return ONLY a JSON object (no markdown) in this exact structure:
{
  "current_positioning": {
    "summary": "brief analysis",
    "strengths": ["strength1", "strength2"],
    "gaps": ["gap1", "gap2"]
  },
  "recommended_usp": "single compelling sentence",
  "key_differentiators": [
    {
      "differentiator": "name",
      "description": "details",
      "impact": "why it matters"
    }
  ],
  "competitive_advantages": [
    {
      "advantage": "name",
      "description": "details",
      "quantifiable_benefit": "measurable impact"
    }
  ],
  "value_proposition": {
    "what": "what you deliver",
    "how": "how you deliver it differently",
    "why": "why it matters to customers"
  },
  "target_alignment": {
    "primary_audience": "who this appeals to most",
    "emotional_triggers": ["trigger1", "trigger2"],
    "rational_benefits": ["benefit1", "benefit2"]
  },
  "proof_points": [
    {
      "claim": "what you claim",
      "evidence": "supporting evidence",
      "credibility": "why it's believable"
    }
  ],
  "communication_guidelines": {
    "elevator_pitch": "30-second version",
    "tagline_options": ["option1", "option2", "option3"],
    "key_messages": ["message1", "message2", "message3"],
    "tone": "how to communicate it"
  }
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 3000, model);
  const parsed = safeParseJSON(result, "usp_analysis");
  if (parsed) return parsed;
  return {
    current_positioning: { summary: "Analysis pending", strengths: ["TBD"], gaps: ["TBD"] },
    recommended_usp: "Analysis pending",
    key_differentiators: [{ differentiator: "TBD", description: "TBD", impact: "TBD" }],
    competitive_advantages: [{ advantage: "TBD", description: "TBD", quantifiable_benefit: "TBD" }],
    value_proposition: { what: "TBD", how: "TBD", why: "TBD" },
    target_alignment: { primary_audience: "TBD", emotional_triggers: ["TBD"], rational_benefits: ["TBD"] },
    proof_points: [{ claim: "TBD", evidence: "TBD", credibility: "TBD" }],
    communication_guidelines: { elevator_pitch: "TBD", tagline_options: ["TBD"], key_messages: ["TBD"], tone: "TBD" }
  };
}

async function generateGoToMarketStrategy(project: any, apiKey: string, context: string = '', model?: string) {
  const prompt = `Business: ${project.name} (${project.industry})
Description: ${project.description}
${context}

Create a go-to-market strategy so specific that the founder could hand it to a marketing team and they'd know exactly what to do. No generic advice — every recommendation must be actionable for THIS specific business.

REQUIREMENTS:
- Channel recommendations must include specific platforms, tactics, and budget allocations
- Pricing must reference real competitor pricing in this market
- Launch phases must have specific timelines and measurable goals
- Include at least one unconventional growth tactic that competitors aren't using

CRITICAL: Return ONLY valid JSON. No markdown, no comments. Start your response with { and end with }.

{
  "target_segments": [
    {
      "segment": "Specific segment name",
...
      "messaging_angle": "The specific message that would resonate with this segment"
    }
  ],
  "value_proposition": {
    "primary": "The core value prop in one clear sentence",
    "for_segment_1": "How to frame it for the first segment specifically",
    "for_segment_2": "How to frame it for the second segment"
  },
  "marketing_channels": [
    {
      "channel": "Specific channel (e.g., 'LinkedIn organic + LinkedIn Ads targeting Series A startup founders')",
      "strategy": "Exact tactics to use on this channel (2-3 sentences)",
      "budget_allocation": "Specific monthly budget",
      "expected_roi": "Expected return with reasoning",
      "timeline_to_results": "How long before this channel produces meaningful results"
    }
  ],
  "pricing_strategy": {
    "model": "Pricing model recommendation",
    "tiers": [
      {"name": "Tier name", "price": "Specific price", "target": "Who this tier is for", "features": ["feature1", "feature2"]}
    ],
    "competitive_position": "How this pricing compares to specific named competitors",
    "psychological_reasoning": "Why this pricing strategy works for the target market"
  },
  "launch_phases": [
    {
      "phase": "Pre-Launch (specific dates relative to launch)",
      "duration": "X weeks",
      "activities": ["Very specific activity 1", "Specific activity 2"],
      "goals": ["Measurable goal with specific number"],
      "budget": "Estimated budget for this phase"
    }
  ],
  "unconventional_tactic": {
    "tactic": "A creative growth hack specific to this business",
    "why_it_works": "The strategic reasoning",
    "how_to_execute": "Step-by-step implementation",
    "example": "A company that used a similar approach successfully"
  },
  "key_metrics": [
    {"metric": "Specific metric", "target": "Specific target number", "measurement": "How to track it", "tool": "Recommended tool"}
  ],
  "first_10_customers": "A specific step-by-step strategy for getting the first 10 paying customers (3-4 sentences). This is the most important thing in the entire GTM strategy."
}

Include 2-3 target segments, 3-4 marketing channels, 2-3 pricing tiers, 3-4 launch phases, and 4-5 key metrics.`;

  const result = await callAI(prompt, apiKey, 4000, model);
  const parsed = safeParseJSON(result, "go_to_market_strategy");
  if (parsed) return parsed;
  return {
    target_segments: [{ segment: "Primary Segment", description: "Analysis pending", size: "TBD", where_to_find_them: "TBD", messaging_angle: "TBD" }],
    value_proposition: { primary: "Analysis pending", for_segment_1: "", for_segment_2: "" },
    marketing_channels: [{ channel: "Digital Marketing", strategy: "Analysis pending", budget_allocation: "TBD", expected_roi: "TBD", timeline_to_results: "TBD" }],
    pricing_strategy: { model: "TBD", tiers: [], competitive_position: "Analysis pending", psychological_reasoning: "" },
    launch_phases: [{ phase: "Pre-Launch", duration: "4 weeks", activities: ["Market research"], goals: ["Build awareness"], budget: "TBD" }],
    unconventional_tactic: { tactic: "Analysis pending", why_it_works: "", how_to_execute: "", example: "" },
    key_metrics: [{ metric: "CAC", target: "TBD", measurement: "Monthly", tool: "Analytics" }],
    first_10_customers: "Analysis pending"
  };
}
function buildFullContext(sections: Record<string, any>): string {
  const parts: string[] = [];
  if (sections.executiveSummary) {
    parts.push(`Executive Summary: Score ${sections.executiveSummary.score}/100. Strengths: ${sections.executiveSummary.strengths?.slice(0, 3).join('; ')}. Concerns: ${sections.executiveSummary.concerns?.slice(0, 3).join('; ')}.`);
  }
  if (sections.marketAnalysis) {
    parts.push(`Market: TAM ${sections.marketAnalysis.tam}. Growth: ${sections.marketAnalysis.growth_rate}. Timing: ${sections.marketAnalysis.timing_assessment?.substring(0, 150)}.`);
  }
  if (sections.customerPersonas?.[0]) {
    const p = sections.customerPersonas[0];
    parts.push(`Primary Customer: ${p.name}. Pain: ${p.pain_points?.[0]?.pain || 'identified'}.`);
  }
  if (sections.competitiveLandscape) {
    const comps = sections.competitiveLandscape.direct_competitors;
    if (comps?.length) parts.push(`Key Competitors: ${comps.slice(0, 3).map((c: any) => c.name || c).join(', ')}.`);
    if (sections.competitiveLandscape.competitive_moat_strategy) parts.push(`Moat: ${sections.competitiveLandscape.competitive_moat_strategy.substring(0, 150)}.`);
  }
  if (sections.pathToMvp?.mvp_definition) {
    parts.push(`MVP: ${sections.pathToMvp.mvp_definition.description?.substring(0, 150)}.`);
  }
  if (sections.goToMarketStrategy?.value_proposition) {
    parts.push(`GTM Value Prop: ${sections.goToMarketStrategy.value_proposition.primary?.substring(0, 100)}.`);
  }
  if (sections.gameChangingIdea?.headline) {
    parts.push(`Game-Changing Idea: ${sections.gameChangingIdea.headline}.`);
  }
  if (sections.financialBasics?.startup_costs) {
    parts.push(`Budget: Conservative ${sections.financialBasics.startup_costs.conservative}, Moderate ${sections.financialBasics.startup_costs.moderate}.`);
  }
  return parts.length > 0 ? '\n\nFULL ANALYSIS CONTEXT:\n' + parts.join('\n') : '';
}

async function generateActionPlan(project: any, apiKey: string, allSections: Record<string, any>, model?: string) {
  const fullContext = buildFullContext(allSections);

  const prompt = `Based on ALL the analysis completed for this business:
Business: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${fullContext}

Create a specific, day-by-day 30-day action plan for the founder. This is not generic advice — every action should be specific to THIS business based on what the analysis revealed.

Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside string values.
{
  "week_1": {
    "theme": "Validation & Research",
    "actions": [
      {
        "day": "Day 1-2",
        "action": "Specific action tied to a finding from the report",
        "why": "Which report section this addresses",
        "deliverable": "What you should have completed by end of day"
      }
    ]
  },
  "week_2": {
    "theme": "Customer Discovery",
    "actions": [{"day": "Day 8-9", "action": "...", "why": "...", "deliverable": "..."}]
  },
  "week_3": {
    "theme": "MVP Planning",
    "actions": [{"day": "Day 15-16", "action": "...", "why": "...", "deliverable": "..."}]
  },
  "week_4": {
    "theme": "Launch Preparation",
    "actions": [{"day": "Day 22-23", "action": "...", "why": "...", "deliverable": "..."}]
  },
  "quick_wins": [
    "Something they can do TODAY that takes less than 1 hour",
    "A second quick win",
    "A third quick win"
  ],
  "critical_milestones": [
    {"milestone": "First milestone", "target_date": "By Day X", "success_metric": "How to know you achieved it"},
    {"milestone": "Second milestone", "target_date": "By Day X", "success_metric": "Metric"}
  ],
  "resources_needed": {
    "budget_estimate": "Estimated budget for the 30-day plan",
    "tools": ["Specific tool 1 with why", "Tool 2"],
    "people": "Whether they need anyone else help and who"
  }
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 5000, model);
  const parsed = safeParseJSON(result, "action_plan");
  if (parsed) return parsed;
  return {
    week_1: { theme: "Getting Started", actions: [{ day: "Day 1-2", action: "Analysis pending — please regenerate", why: "N/A", deliverable: "N/A" }] },
    week_2: { theme: "Discovery", actions: [] },
    week_3: { theme: "Planning", actions: [] },
    week_4: { theme: "Execution", actions: [] },
    quick_wins: ["Regenerate the report to see this section"],
    critical_milestones: [],
    resources_needed: { budget_estimate: "TBD", tools: [], people: "TBD" }
  };
}

async function generateGameChangingIdea(project: any, apiKey: string, previousSections: Record<string, any>, model?: string) {
  const context = buildContext(previousSections);

  const prompt = `Original Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

You are a creative business strategist who has analyzed thousands of startups. Based on your analysis of this business idea and all the data from the previous sections, propose a GAME-CHANGING enhancement that would dramatically increase the likelihood of success.

This is NOT about small improvements — this is about a fundamental strategic insight that transforms the business from "another competitor" into "category creator."

Think about:
- What if they combined their idea with an adjacent industry or technology?
- What if they flipped their business model entirely (from B2C to B2B, or from one-time to subscription)?
- What if they targeted a completely different customer segment that's underserved?
- What if they added a network effect, data moat, or viral loop?
- What if they started with a different wedge/beachhead than what seems obvious?

The best game-changing ideas feel obvious in hindsight but aren't what 99% of founders in this space would think of.

Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside string values.
{
  "headline": "A bold, exciting one-sentence summary of the game-changing idea",
  "description": "3-4 paragraphs explaining the idea in detail. Be specific — include the exact customer segment, the exact feature/model change, the exact competitive dynamic it creates.",
  "why_it_works": "2-3 sentences on the strategic logic — what market force or customer behavior makes this work",
  "implementation_steps": [
    "Specific step 1 to start implementing this (actionable, concrete)",
    "Specific step 2",
    "Specific step 3"
  ],
  "risk": "The main risk of this approach and how to mitigate it (2 sentences)",
  "example_precedent": "A real-world example of a company that did something similar and succeeded",
  "potential_impact": "How much bigger/better the business could be with this change"
}

CRITICAL: Start your response with { and end with }. No markdown, no code blocks, no text before or after the JSON.`;

  const result = await callAI(prompt, apiKey, 4000, model);
  const parsed = safeParseJSON(result, "game_changing_idea");
  if (parsed) return parsed;
  return {
    headline: "Analysis pending",
    description: "Unable to generate game-changing idea. Please try regenerating the report.",
    why_it_works: "N/A",
    implementation_steps: ["Regenerate the report to see this section"],
    risk: "N/A",
    example_precedent: "N/A",
    potential_impact: "N/A"
  };
}

function calculateValidationScore(sections: any): number {
  let score = 0;

  // Factor 1: AI's initial assessment (weight: 30%)
  const aiScore = sections.executiveSummary?.score || 50;
  score += aiScore * 0.3;

  // Factor 2: Market attractiveness (weight: 20%)
  let marketScore = 50;
  const growth = String(sections.marketAnalysis?.growth_rate || '').toLowerCase();
  if (growth.includes('high') || growth.match(/\d{2,}%/)) marketScore = 75;
  if (growth.includes('declining') || growth.includes('shrinking')) marketScore = 20;
  const maturity = String(sections.marketAnalysis?.market_maturity || '').toLowerCase();
  if (maturity.includes('early') || maturity.includes('growing')) marketScore += 10;
  if (maturity.includes('declining')) marketScore -= 20;
  score += Math.min(Math.max(marketScore, 0), 100) * 0.2;

  // Factor 3: Competitive defensibility (weight: 15%)
  let compScore = 50;
  const advantages = sections.competitiveLandscape?.competitive_advantages?.length || 0;
  const competitors = sections.competitiveLandscape?.direct_competitors?.length || 0;
  compScore += advantages * 8;
  compScore -= competitors * 3;
  score += Math.min(Math.max(compScore, 0), 100) * 0.15;

  // Factor 4: Customer clarity (weight: 15%)
  let customerScore = 50;
  const personas = sections.customerPersonas?.length || 0;
  if (personas >= 3) customerScore = 70;
  const painPoints = sections.customerPersonas?.[0]?.pain_points?.length || 0;
  if (painPoints >= 3) customerScore += 10;
  score += Math.min(customerScore, 100) * 0.15;

  // Factor 5: Financial viability (weight: 10%)
  let finScore = 50;
  const startupCost = String(sections.financialBasics?.startup_costs?.conservative || '');
  if (startupCost.match(/\$\d{1,2}K/) || startupCost.toLowerCase().includes('under')) finScore = 70;
  score += Math.min(finScore, 100) * 0.1;

  // Factor 6: Strategic clarity (weight: 10%)
  let stratScore = 50;
  const swot = sections.strategicFrameworks?.swot;
  if (swot) {
    const strengthCount = swot.strengths?.length || 0;
    const weaknessCount = swot.weaknesses?.length || 0;
    if (strengthCount > weaknessCount) stratScore = 65;
    if (strengthCount > weaknessCount + 2) stratScore = 80;
  }
  score += Math.min(stratScore, 100) * 0.1;

  const finalScore = Math.round(score);
  return Math.min(Math.max(finalScore, 5), 98); // Never 0 or 100 — both are unrealistic
}
