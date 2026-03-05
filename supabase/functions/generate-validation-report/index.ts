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

    const creditsNeeded = 13;
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

    const executiveSummary = await generateExecutiveSummary(project, LOVABLE_API_KEY);
    ctx.executiveSummary = executiveSummary;
    currentStatus = await updateSectionStatus("executive_summary", executiveSummary, currentStatus);

    const marketAnalysis = await generateMarketAnalysis(project, LOVABLE_API_KEY, buildContext(ctx));
    ctx.marketAnalysis = marketAnalysis;
    currentStatus = await updateSectionStatus("market_analysis", marketAnalysis, currentStatus);

    const customerPersonas = await generateCustomerPersonas(project, LOVABLE_API_KEY, buildContext(ctx));
    ctx.customerPersonas = customerPersonas;
    currentStatus = await updateSectionStatus("customer_personas", customerPersonas, currentStatus);

    const competitiveLandscape = await generateCompetitiveLandscape(project, LOVABLE_API_KEY, buildContext(ctx));
    ctx.competitiveLandscape = competitiveLandscape;
    currentStatus = await updateSectionStatus("competitive_landscape", competitiveLandscape, currentStatus);

    const strategicFrameworks = await generateStrategicFrameworks(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("strategic_frameworks", strategicFrameworks, currentStatus);

    const porterFiveForces = await generatePorterFiveForces(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("porter_five_forces", porterFiveForces, currentStatus);

    const pestelAnalysis = await generatePestelAnalysis(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("pestel_analysis", pestelAnalysis, currentStatus);

    const catwoeAnalysis = await generateCatwoeAnalysis(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("catwoe_analysis", catwoeAnalysis, currentStatus);

    const pathToMvp = await generatePathToMvp(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("path_to_mvp", pathToMvp, currentStatus);

    const goToMarketStrategy = await generateGoToMarketStrategy(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("go_to_market_strategy", goToMarketStrategy, currentStatus);

    const uspAnalysis = await generateUSPAnalysis(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("usp_analysis", uspAnalysis, currentStatus);

    const gameChangingIdea = await generateGameChangingIdea(project, LOVABLE_API_KEY, {
      executiveSummary, marketAnalysis, customerPersonas, competitiveLandscape,
      strategicFrameworks, porterFiveForces, goToMarketStrategy
    });
    currentStatus = await updateSectionStatus("game_changing_idea", gameChangingIdea, currentStatus);

    const financialBasics = await generateFinancialBasics(project, LOVABLE_API_KEY, buildContext(ctx));
    currentStatus = await updateSectionStatus("financial_basics", financialBasics, currentStatus);

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

    // Log AI usage
    await supabase.from("ai_usage_logs").insert({
      user_id: project.user_id,
      project_id: project_id,
      operation_type: "report_generation",
      model_used: "google/gemini-2.5-flash",
      tokens_used: 15000,
      cost_cents: 50,
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
  
  // Try to find JSON object boundaries if there's extra text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
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

function buildContext(previousSections: Record<string, any>): string {
  const parts: string[] = [];

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

const SYSTEM_PROMPT = `You are a world-class business strategist combining McKinsey analytical rigor with Y Combinator startup pragmatism. Your analysis must be:

1. SPECIFIC — Never give generic advice. Every insight must be tailored to THIS exact business, THIS exact industry, THIS exact market. If analyzing a dog-walking app in Austin, mention Austin's pet ownership rates, local competitors by name, and neighborhood-specific strategies.

2. BRUTALLY HONEST — If an idea has fatal flaws, say so clearly. Founders need truth, not encouragement. A score of 30 with clear reasoning is more valuable than an inflated 70.

3. ACTIONABLE — Every section must answer 'so what should I do about this?' Don't just identify trends — explain how to exploit them. Don't just list risks — explain how to mitigate them.

4. DATA-GROUNDED — Use real market data, real competitor names, real pricing benchmarks, and realistic financial estimates. When you don't have exact data, give calibrated ranges with your confidence level.

5. CONTRARIAN — Challenge assumptions. If everyone is doing X, ask whether Y would be a better approach. The best business advice often goes against conventional wisdom.

Return ONLY valid JSON without any markdown formatting, code blocks, or extra text. Ensure all JSON is complete and properly formatted.`;

async function callAI(prompt: string, apiKey: string, maxTokens?: number): Promise<string> {
  const body: any = {
    model: "google/gemini-2.5-flash",
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
    
    throw new Error("AI generation failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";
  return cleanJsonFromMarkdown(content);
}

async function generateExecutiveSummary(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${project.website_url ? `Website: ${project.website_url}` : ''}

Create a rigorous executive summary as if you were a senior partner at McKinsey presenting to a client who is about to invest their life savings into this idea. Be honest — their financial future depends on your accuracy.

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
}`;

  const result = await callAI(prompt, apiKey, 4000);
  try {
    return JSON.parse(result);
  } catch {
    return { score: 65, strengths: ["Extracted from AI"], concerns: ["Parse error"], recommendation: "Review", reasoning: result };
  }
}

async function generateMarketAnalysis(project: any, apiKey: string, context: string = '') {
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
}`;

  const result = await callAI(prompt, apiKey, 4000);
  try {
    const parsed = JSON.parse(result);
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
  } catch (error) {
    console.error("Market analysis parse error:", error, "Raw:", result.substring(0, 500));
    return { 
      tam: "Market size analysis pending", 
      sam: "Serviceable market pending", 
      som: "Obtainable market pending", 
      growth_rate: "Growth analysis pending", 
      market_maturity: "Analysis pending",
      trends: ["Market trend analysis in progress"], 
      barriers: [{ barrier: "Entry barrier analysis in progress", difficulty: "Medium", how_to_overcome: "TBD" }], 
      timing_assessment: "Market timing assessment in progress",
      market_risks: ["Risk analysis pending"],
      adjacent_opportunities: "Adjacent opportunity analysis pending"
    };
  }
}

async function generateCompetitiveLandscape(project: any, apiKey: string, context: string = '') {
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
}`;

  const result = await callAI(prompt, apiKey, 4000);
  try {
    const parsed = JSON.parse(result);
    // Normalize direct_competitors for backward compat
    if (parsed.direct_competitors && Array.isArray(parsed.direct_competitors)) {
      parsed.direct_competitors = parsed.direct_competitors.map((c: any) =>
        typeof c === 'string' ? { name: c, description: '' } : c
      );
    }
    // Normalize indirect_competitors
    if (parsed.indirect_competitors && Array.isArray(parsed.indirect_competitors)) {
      parsed.indirect_competitors = parsed.indirect_competitors.map((c: any) =>
        typeof c === 'string' ? { name: c, description: c, why_customers_choose_them: '' } : c
      );
    }
    // Normalize competitive_advantages
    if (parsed.competitive_advantages && Array.isArray(parsed.competitive_advantages)) {
      parsed.competitive_advantages = parsed.competitive_advantages.map((a: any) =>
        typeof a === 'string' ? { advantage: a, why_defensible: '', duration: '' } : a
      );
    }
    // Normalize positioning
    if (typeof parsed.positioning === 'string') {
      parsed.positioning = { recommended_position: parsed.positioning, tagline_suggestion: '', positioning_against: '' };
    }
    return parsed;
  } catch {
    return { direct_competitors: [], indirect_competitors: [], competitive_advantages: [{ advantage: "Analysis pending", why_defensible: "", duration: "" }], positioning: { recommended_position: result, tagline_suggestion: "", positioning_against: "" } };
  }
}

async function generateStrategicFrameworks(project: any, apiKey: string, context: string = '') {
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
- gtm_strategy (array of plain strings - no bold formatting)`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      gtm_strategy: [result]
    };
  }
}

async function generatePorterFiveForces(project: any, apiKey: string, context: string = '') {
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

IMPORTANT: Return ONLY valid JSON. No markdown, no extra text.`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    const cleanedResult = cleanJsonFromMarkdown(result);
    const parsed = JSON.parse(cleanedResult);
    return parsed;
  } catch (error) {
    console.error("Porter's Five Forces parse error:", error, "Raw result:", result?.substring(0, 500));
    // Try to extract with regex as last resort
    const extractedJson = validateAndFixJson(result, ['supplier_power', 'buyer_power', 'competitive_rivalry', 'threat_of_substitution', 'threat_of_new_entry']);
    if (extractedJson) {
      try {
        const parsed = JSON.parse(extractedJson);
        return parsed;
      } catch (e) {
        console.error("Recovery also failed");
      }
    }
    return { 
      supplier_power: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." },
      buyer_power: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." },
      competitive_rivalry: { rating: "High", analysis: "Unable to generate analysis. Please try regenerating the report." },
      threat_of_substitution: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." },
      threat_of_new_entry: { rating: "Medium", analysis: "Unable to generate analysis. Please try regenerating the report." }
    };
  }
}

async function generateCustomerPersonas(project: any, apiKey: string, context: string = '') {
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

CRITICAL: Return ONLY a valid JSON array. No markdown, no extra text.`;

  const result = await callAI(prompt, apiKey, 6000);
  try {
    const cleanedResult = cleanJsonFromMarkdown(result);
    const parsed = JSON.parse(cleanedResult);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error("Customer personas initial parse error, trying to fix JSON...");
    console.error("Raw result preview:", result?.substring(0, 500));
    
    // Try to fix the JSON
    const fixedJson = validateAndFixJson(result, ['priority', 'name', 'pain_points', 'objections']);
    if (fixedJson && Array.isArray(fixedJson)) {
      return fixedJson;
    }
    if (fixedJson && typeof fixedJson === 'object') {
      return [fixedJson];
    }
    
    // Try one more extraction method - find array in the result
    try {
      const arrayMatch = result?.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        const extracted = JSON.parse(arrayMatch[0]);
        return Array.isArray(extracted) ? extracted : [extracted];
      }
    } catch (e) {
      console.error("Regex extraction also failed");
    }
    
    console.error("Customer personas parse error:", error);
    return [
      {
        priority: "1st",
        priority_reason: "Analysis failed - please regenerate report",
        name: "Target Customer",
        age: "25-45",
        job: "Professional in target industry",
        income: "Varies by market",
        location: "Primary market areas",
        values: ["Value proposition alignment", "Problem resolution", "Efficiency"],
        personality: ["Decision-maker", "Solution-oriented"],
        pain_points: [{ pain: "Core problem your product solves", impact: "Significant time/money loss" }],
        current_solution: "Existing alternatives that fall short",
        dream_outcome: "The ideal state your product enables",
        objections: [{ objection: "Common concern", root_cause: "Underlying uncertainty" }],
        closing_angles: [{ angle: "Address with proof and guarantees", addresses: "Main objections" }],
        proof_needed: "Case studies, testimonials, demos",
        urgency_trigger: "Limited time offer or growing pain point"
      }
    ];
  }
}

async function generateFinancialBasics(project: any, apiKey: string, context: string = '') {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
${context}

Provide financial basics:
1. Estimated startup costs (conservative, moderate, aggressive scenarios)
2. Revenue model analysis with revenue streams
3. Customer acquisition cost (CAC) estimates
4. Basic 3-year revenue projections

CRITICAL: Return ONLY valid JSON. The revenue_model and cac_estimate must be PLAIN TEXT STRINGS, not nested JSON objects.

Format as JSON with keys: 
- startup_costs {conservative, moderate, aggressive} (all strings like "$10K-15K")
- revenue_model (single plain text string with newlines describing the model and revenue streams - NOT a nested object)
- cac_estimate (single plain text string with newlines describing CAC - NOT a nested object)
- projections {year1, year2, year3} (all strings)

Example revenue_model format: "Primarily a freemium model. The free workshop acts as a lead magnet.\n\nRevenue streams include:\n- Premium training programs\n- Consulting services\n- Membership subscriptions"`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    const parsed = JSON.parse(result);
    
    // Convert nested objects to plain strings if AI returned them
    if (typeof parsed.revenue_model === 'object') {
      const rm = parsed.revenue_model;
      let text = rm.description || '';
      if (rm.revenue_streams && Array.isArray(rm.revenue_streams)) {
        text += '\n\nRevenue streams:\n' + rm.revenue_streams.map((s: string) => `- ${s}`).join('\n');
      }
      parsed.revenue_model = text || JSON.stringify(rm);
    }
    
    if (typeof parsed.cac_estimate === 'object') {
      const cac = parsed.cac_estimate;
      const parts = [];
      if (cac.cac_per_paying_customer) parts.push(`CAC per paying customer: ${cac.cac_per_paying_customer}`);
      if (cac.free_workshop_registration) parts.push(`Free workshop registration: ${cac.free_workshop_registration}`);
      if (cac.paid_program_conversion_rate) parts.push(`Conversion rate: ${cac.paid_program_conversion_rate}`);
      parsed.cac_estimate = parts.join('\n\n') || JSON.stringify(cac);
    }
    
    return parsed;
  } catch {
    return { 
      startup_costs: { conservative: "$10K", moderate: "$25K", aggressive: "$50K" },
      revenue_model: result,
      cac_estimate: "Analysis pending",
      projections: { year1: "TBD", year2: "TBD", year3: "TBD" }
    };
  }
}

async function generatePestelAnalysis(project: any, apiKey: string, context: string = '') {
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
}`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    const parsed = JSON.parse(result);
    // Validate that we have all required keys with content
    const requiredKeys = ['political', 'economic', 'social', 'technological', 'environmental', 'legal'];
    const hasAllKeys = requiredKeys.every(key => parsed[key] && typeof parsed[key] === 'string' && parsed[key].length > 20);
    if (hasAllKeys) {
      return parsed;
    }
    console.error("PESTEL missing keys, raw result:", result.substring(0, 500));
    throw new Error("Missing PESTEL keys");
  } catch (error) {
    console.error("PESTEL parse error:", error, "Raw result:", result.substring(0, 500));
    // Try to extract with regex as fallback
    try {
      const politicalMatch = result.match(/"political"\s*:\s*"([^"]+)"/);
      const economicMatch = result.match(/"economic"\s*:\s*"([^"]+)"/);
      const socialMatch = result.match(/"social"\s*:\s*"([^"]+)"/);
      const technologicalMatch = result.match(/"technological"\s*:\s*"([^"]+)"/);
      const environmentalMatch = result.match(/"environmental"\s*:\s*"([^"]+)"/);
      const legalMatch = result.match(/"legal"\s*:\s*"([^"]+)"/);
      
      if (politicalMatch && economicMatch && socialMatch) {
        return {
          political: politicalMatch[1] || "Political factors impact this business through regulatory oversight and policy changes.",
          economic: economicMatch[1] || "Economic conditions affect consumer spending and operational costs.",
          social: socialMatch[1] || "Social trends influence customer preferences and market demand.",
          technological: technologicalMatch?.[1] || "Technology advancements create opportunities for innovation and efficiency.",
          environmental: environmentalMatch?.[1] || "Environmental considerations affect sustainability practices and regulations.",
          legal: legalMatch?.[1] || "Legal requirements govern compliance, contracts, and business operations."
        };
      }
    } catch (regexError) {
      console.error("PESTEL regex extraction failed:", regexError);
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
}

async function generateCatwoeAnalysis(project: any, apiKey: string, context: string = '') {
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
- environmental_constraints { description (string), constraints (array) }`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      customers: { description: "Analysis pending", key_points: ["TBD"] },
      actors: { description: "Analysis pending", key_points: ["TBD"] },
      transformation: { description: "Analysis pending", inputs: ["TBD"], outputs: ["TBD"] },
      world_view: { description: "Analysis pending", assumptions: ["TBD"] },
      owners: { description: "Analysis pending", stakeholders: ["TBD"] },
      environmental_constraints: { description: "Analysis pending", constraints: ["TBD"] }
    };
  }
}

async function generatePathToMvp(project: any, apiKey: string, context: string = '') {
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
- iteration_plan { feedback_channels (array), review_frequency (string), improvement_process (string) }`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    const cleanedResult = cleanJsonFromMarkdown(result);
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error("Path to MVP parse error:", error, "Raw result:", result);
    return {
      mvp_definition: { description: "Analysis pending", core_value: "TBD" },
      core_features: [
        { feature: "Feature analysis pending", priority: "High", effort: "TBD", value: "TBD" }
      ],
      development_phases: [
        { phase: "Phase 1", duration: "TBD", deliverables: ["TBD"], milestones: ["TBD"] }
      ],
      resource_requirements: {
        team: ["TBD"],
        tools: ["TBD"],
        estimated_budget: "TBD",
        timeline: "TBD"
      },
      launch_strategy: {
        target_audience: "TBD",
        channels: ["TBD"],
        approach: "TBD",
        timeline: "TBD"
      },
      success_metrics: [
        { metric: "TBD", target: "TBD", measurement: "TBD" }
      ],
      iteration_plan: {
        feedback_channels: ["TBD"],
        review_frequency: "TBD",
        improvement_process: "TBD"
      }
    };
  }
}

async function generateUSPAnalysis(project: any, apiKey: string, context: string = '') {
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
}`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    const cleanedResult = cleanJsonFromMarkdown(result);
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error("USP analysis parse error:", error, "Raw result:", result);
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
}

async function generateGoToMarketStrategy(project: any, apiKey: string, context: string = '') {
  const prompt = `Business: ${project.name} (${project.industry})
Description: ${project.description}
${context}

Create a concise GTM strategy. Return JSON with:
- target_segments: array of 2 objects with {segment, description, size, characteristics: [3 items]}
- value_proposition: {primary: string, differentiators: [3 items]}
- marketing_channels: array of 3 objects with {channel, strategy, budget_allocation, expected_roi}
- sales_strategy: {process: string, team_structure: [3 roles], conversion_tactics: [3 items]}
- pricing_strategy: {model: string, tiers: [{name, price, features: [3 items]}], competitive_position: string}
- launch_phases: array of 2 objects with {phase, duration, activities: [3 items], goals: [2 items]}
- growth_tactics: array of 2 objects with {tactic, description, expected_impact}
- key_metrics: array of 3 objects with {metric, target, measurement_frequency}

Keep descriptions brief (1-2 sentences max). Return valid JSON only.`;

  const result = await callAI(prompt, apiKey, 3000);
  try {
    const parsed = JSON.parse(result);
    return parsed;
  } catch (error) {
    console.error("Go to market parse error:", error, "Raw result:", result.substring(0, 1000));
    return {
      target_segments: [
        { segment: "Primary Market Segment", description: "Core target customers for this business", size: "Analysis in progress", characteristics: ["Key characteristic 1", "Key characteristic 2", "Key characteristic 3"] }
      ],
      value_proposition: {
        primary: "Unique value this business provides to customers",
        differentiators: ["Key differentiator 1", "Key differentiator 2", "Key differentiator 3"]
      },
      marketing_channels: [
        { channel: "Digital Marketing", strategy: "Online presence and advertising", budget_allocation: "40%", expected_roi: "3x" }
      ],
      sales_strategy: {
        process: "Consultative sales approach focused on customer needs",
        team_structure: ["Sales Lead", "Account Executive", "Customer Success"],
        conversion_tactics: ["Discovery calls", "Product demos", "Trial offers"]
      },
      pricing_strategy: {
        model: "Value-based pricing",
        tiers: [{ name: "Starter", price: "Entry level", features: ["Core features", "Email support", "Basic analytics"] }],
        competitive_position: "Competitive with market leaders while offering unique value"
      },
      launch_phases: [
        { phase: "Pre-Launch", duration: "4-6 weeks", activities: ["Market research", "Brand setup", "Content creation"], goals: ["Build awareness", "Generate leads"] }
      ],
      growth_tactics: [
        { tactic: "Content Marketing", description: "Build authority through valuable content", expected_impact: "Organic traffic growth" }
      ],
      key_metrics: [
        { metric: "Customer Acquisition Cost", target: "Industry benchmark", measurement_frequency: "Monthly" }
      ]
    };
  }
}
async function generateGameChangingIdea(project: any, apiKey: string, previousSections: Record<string, any>) {
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
}`;

  const result = await callAI(prompt, apiKey, 4000);
  try {
    const cleanedResult = cleanJsonFromMarkdown(result);
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error("Game-changing idea parse error:", error);
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
}

function calculateValidationScore(sections: any): number {
  // Simple scoring algorithm - can be enhanced
  const executiveScore = sections.executiveSummary?.score || 50;
  
  // Adjust based on other factors
  let finalScore = executiveScore;
  
  // Market analysis impact
  const growthRate = sections.marketAnalysis?.growth_rate;
  if (growthRate && typeof growthRate === 'string' && growthRate.toLowerCase().includes("high")) {
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
