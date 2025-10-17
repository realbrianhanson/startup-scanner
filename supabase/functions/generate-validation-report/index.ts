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

    const creditsNeeded = 7; // Updated to include customer personas and PESTEL
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
          pestel_analysis: "pending",
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
      generateCustomerPersonas(project, LOVABLE_API_KEY),
      generateCompetitiveLandscape(project, LOVABLE_API_KEY),
      generateStrategicFrameworks(project, LOVABLE_API_KEY),
      generatePestelAnalysis(project, LOVABLE_API_KEY),
      generateFinancialBasics(project, LOVABLE_API_KEY),
    ];

    const [
      executiveSummary,
      marketAnalysis,
      customerPersonas,
      competitiveLandscape,
      strategicFrameworks,
      pestelAnalysis,
      financialBasics,
    ] = await Promise.all(sections);

    // Calculate validation score
    const validationScore = calculateValidationScore({
      executiveSummary,
      marketAnalysis,
      customerPersonas,
      competitiveLandscape,
      strategicFrameworks,
      pestelAnalysis,
      financialBasics,
    });

    // Update report with all sections
    const reportData = {
      executive_summary: executiveSummary,
      market_analysis: marketAnalysis,
      customer_personas: customerPersonas,
      competitive_landscape: competitiveLandscape,
      strategic_frameworks: strategicFrameworks,
      pestel_analysis: pestelAnalysis,
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
          customer_personas: "complete",
          competitive_landscape: "complete",
          strategic_frameworks: "complete",
          pestel_analysis: "complete",
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

function cleanJsonFromMarkdown(text: string): string {
  // Remove markdown code blocks (```json and ```)
  return text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}

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
          content: "You are a McKinsey-style business analyst providing structured, data-driven insights. Always return valid JSON without markdown formatting."
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
  const content = data.choices[0]?.message?.content || "";
  return cleanJsonFromMarkdown(content);
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

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside the string values.

Format as JSON with keys: 
- score (number)
- strengths (array of plain strings)
- concerns (array of plain strings)
- recommendation (plain text string with newlines for paragraphs - no markdown syntax)
- reasoning (plain text string with newlines for paragraphs - no markdown syntax)`;

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

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- tam (plain string, e.g. "$5B globally")
- sam (plain string, e.g. "$1.2B in North America")
- som (plain string, e.g. "$50M in first 3 years")
- growth_rate (plain string)
- trends (array of plain strings - no bold formatting)
- barriers (array of plain strings)
- timing_assessment (plain string with newlines for paragraphs, no markdown syntax)`;

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

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside the string values.

Format as JSON with keys: 
- direct_competitors (array of {name, description} - both plain strings)
- indirect_competitors (array of plain strings)
- competitive_advantages (array of plain strings)
- positioning (plain text string with newlines for paragraphs - no markdown syntax)`;

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

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- swot {strengths, weaknesses, opportunities, threats} (all arrays of plain strings)
- porters_five_forces {supplier_power, buyer_power, competitive_rivalry, threat_of_substitution, threat_of_new_entry}
- gtm_strategy (array of plain strings - no bold formatting)`;

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

async function generateCustomerPersonas(project: any, apiKey: string) {
  const prompt = `Generate 3-4 distinct customer personas for: ${project.name}

Industry: ${project.industry}
Description: ${project.description}

For each persona:

**TARGETING PRIORITY:**
- Which to target: [1st / 2nd / 3rd / 4th]
- Why: [1 sentence - ease of reach + conversion likelihood]

**WHO THEY ARE:**
- Name: [First name + role, e.g. "Sarah the Marketing Director"]
- Age: [Range, e.g. 32-38]
- Job/Role: [Specific]
- Income: [Range]
- Location: [Type + context]
- Values: [Top 3 things they care about]
- Personality: [2-3 traits affecting purchase decisions]

**3 BIG PAIN POINTS:**
1. [PRIMARY PAIN]: [Specific problem] → Impact: [How it affects their life/work/money]
2. [SECONDARY PAIN]: [Specific problem] → Impact: [Consequence]
3. [TERTIARY PAIN]: [Specific problem] → Impact: [Consequence]

Current broken solution: [What they're doing now and why it sucks]
Dream outcome: [What they actually want]

**OBJECTIONS (What stops them from buying):**
1. [OBJECTION]: [What they say/think] → Root cause: [Real reason]
2. [OBJECTION]: [What they say/think] → Root cause: [Real reason]
3. [OBJECTION]: [What they say/think] → Root cause: [Real reason]
4. [OBJECTION]: [What they say/think] → Root cause: [Real reason]

**CLOSING ANGLES (How to overcome objections and convert):**
- Angle 1: [Specific approach] → Addresses: [Which objection(s)]
- Angle 2: [Specific approach] → Addresses: [Which objection(s)]
- Angle 3: [Specific approach] → Addresses: [Which objection(s)]
- Angle 4: [Specific approach] → Addresses: [Which objection(s)]
- Proof they need: [Testimonials/data/guarantees/case studies]
- Urgency trigger: [What makes them buy NOW vs later]

**WHERE TO FIND THEM (Top 2-3 channels with SPECIFIC NAMES):**
- Primary channel: [LinkedIn/Reddit/Facebook/etc]
  * Specific communities: [Exact group/subreddit names - 2-3 real ones]
  * Influencers they follow: [2-3 actual names]
- Secondary channel: [Platform]
  * Specific communities: [Exact names - 2-3 real ones]
- How to reach out: [Best approach + opening line template]

**CONTENT THAT CONVERTS (3 ideas):**
1. [Blog/video title]: [Why it works for this persona]
2. [Social post angle]: [Why it resonates]
3. [Email subject]: [Why they'll open]

CRITICAL: 
- Return ONLY valid JSON with no markdown formatting
- Use REAL, SPECIFIC names (actual groups, real people, existing communities)
- No generic "join industry groups" - name the actual groups
- Format as array of persona objects with keys: priority, priority_reason, name, age, job, income, location, values, personality, pain_points (array of 3 objects with "pain" and "impact"), current_solution, dream_outcome, objections (array of 4 objects with "objection" and "root_cause"), closing_angles (array of 4 objects with "angle" and "addresses"), proof_needed, urgency_trigger, channels (array of objects with "platform", "communities", "influencers", "outreach_template"), content_ideas (array of 3 objects with "title" and "why_it_works")`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return [
      {
        priority: "1st",
        priority_reason: "Analysis pending",
        name: "Target Customer",
        age: "TBD",
        job: "TBD",
        income: "TBD",
        location: "TBD",
        values: ["TBD"],
        personality: ["TBD"],
        pain_points: [{ pain: "Analysis pending", impact: "TBD" }],
        current_solution: "TBD",
        dream_outcome: "TBD",
        objections: [{ objection: "TBD", root_cause: "TBD" }],
        closing_angles: [{ angle: "TBD", addresses: "TBD" }],
        proof_needed: "TBD",
        urgency_trigger: "TBD",
        channels: [{ platform: "TBD", communities: [], influencers: [], outreach_template: "TBD" }],
        content_ideas: [{ title: "TBD", why_it_works: "TBD" }]
      }
    ];
  }
}

async function generateFinancialBasics(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

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

  const result = await callAI(prompt, apiKey);
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

async function generatePestelAnalysis(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Provide a comprehensive PESTEL analysis covering all six factors that could impact this business:

1. Political factors: Government policies, regulations, trade restrictions, tax policy, political stability
2. Economic factors: Economic growth, interest rates, inflation, unemployment, consumer purchasing power
3. Social factors: Demographics, cultural trends, lifestyle changes, consumer attitudes, population dynamics
4. Technological factors: Innovation, automation, R&D activity, technology incentives, rate of tech change
5. Environmental factors: Climate change, sustainability, environmental regulations, carbon footprint, resource scarcity
6. Legal factors: Employment laws, consumer protection, health and safety regulations, antitrust laws, intellectual property

For each factor, provide 2-3 paragraphs analyzing:
- Current state and trends
- Potential impact on the business (positive and negative)
- Key considerations and recommendations

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- political (plain text string with newlines for paragraphs)
- economic (plain text string with newlines for paragraphs)
- social (plain text string with newlines for paragraphs)
- technological (plain text string with newlines for paragraphs)
- environmental (plain text string with newlines for paragraphs)
- legal (plain text string with newlines for paragraphs)`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      political: "Analysis pending",
      economic: "Analysis pending",
      social: "Analysis pending",
      technological: "Analysis pending",
      environmental: "Analysis pending",
      legal: "Analysis pending"
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
