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

    const creditsNeeded = 12; // Updated to include customer personas, PESTEL, CATWOE, and Porter's 5 Forces
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

    // Helper function to update status after each section
    const updateSectionStatus = async (sectionName: string, sectionData: any, currentStatus: any) => {
      console.log(`Section ${sectionName} completed`);
      const newStatus = { ...currentStatus, [sectionName]: "complete" };
      const { error } = await supabase
        .from("reports")
        .update({
          generation_status: newStatus
        })
        .eq("id", report.id);
      
      if (error) {
        console.error(`Error updating ${sectionName}:`, error);
      }
      return newStatus;
    };

    let currentStatus = { ...report.generation_status };

    // Generate sections sequentially to show progress
    console.log("Generating executive summary...");
    const executiveSummary = await generateExecutiveSummary(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("executive_summary", executiveSummary, currentStatus);

    console.log("Generating market analysis...");
    const marketAnalysis = await generateMarketAnalysis(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("market_analysis", marketAnalysis, currentStatus);

    console.log("Generating customer personas...");
    const customerPersonas = await generateCustomerPersonas(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("customer_personas", customerPersonas, currentStatus);

    console.log("Generating competitive landscape...");
    const competitiveLandscape = await generateCompetitiveLandscape(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("competitive_landscape", competitiveLandscape, currentStatus);

    console.log("Generating strategic frameworks...");
    const strategicFrameworks = await generateStrategicFrameworks(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("strategic_frameworks", strategicFrameworks, currentStatus);

    console.log("Generating Porter's Five Forces...");
    const porterFiveForces = await generatePorterFiveForces(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("porter_five_forces", porterFiveForces, currentStatus);

    console.log("Generating PESTEL analysis...");
    const pestelAnalysis = await generatePestelAnalysis(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("pestel_analysis", pestelAnalysis, currentStatus);

    console.log("Generating CATWOE analysis...");
    const catwoeAnalysis = await generateCatwoeAnalysis(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("catwoe_analysis", catwoeAnalysis, currentStatus);

    console.log("Generating path to MVP...");
    const pathToMvp = await generatePathToMvp(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("path_to_mvp", pathToMvp, currentStatus);

    console.log("Generating go-to-market strategy...");
    const goToMarketStrategy = await generateGoToMarketStrategy(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("go_to_market_strategy", goToMarketStrategy, currentStatus);

    console.log("Generating USP analysis...");
    const uspAnalysis = await generateUSPAnalysis(project, LOVABLE_API_KEY);
    currentStatus = await updateSectionStatus("usp_analysis", uspAnalysis, currentStatus);

    console.log("Generating financial basics...");
    const financialBasics = await generateFinancialBasics(project, LOVABLE_API_KEY);
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

    // Final update with all data and validation score
    await supabase
      .from("reports")
      .update({
        report_data: {
          executive_summary: executiveSummary,
          market_analysis: marketAnalysis,
          customer_personas: customerPersonas,
          competitive_landscape: competitiveLandscape,
          strategic_frameworks: strategicFrameworks,
          porter_five_forces: porterFiveForces,
          pestel_analysis: pestelAnalysis,
          catwoe_analysis: catwoeAnalysis,
          path_to_mvp: pathToMvp,
          go_to_market_strategy: goToMarketStrategy,
          usp_analysis: uspAnalysis,
          financial_basics: financialBasics,
          validation_score: validationScore,
        },
        generation_status: {
          executive_summary: "complete",
          market_analysis: "complete",
          customer_personas: "complete",
          competitive_landscape: "complete",
          strategic_frameworks: "complete",
          porter_five_forces: "complete",
          pestel_analysis: "complete",
          catwoe_analysis: "complete",
          path_to_mvp: "complete",
          go_to_market_strategy: "complete",
          usp_analysis: "complete",
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
      tokens_used: 15000,
      cost_cents: 50,
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
4. Clear recommendation on whether to pursue this idea

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #) inside the string values.
Do NOT start the recommendation with "Go:" or "No-Go:" - just write the recommendation directly.

Format as JSON with keys: 
- score (number)
- strengths (array of plain strings)
- concerns (array of plain strings)
- recommendation (plain text string with newlines for paragraphs - no markdown syntax, no "Go:" prefix)
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
2. Go-to-market strategy recommendations

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- swot {strengths, weaknesses, opportunities, threats} (all arrays of plain strings)
- gtm_strategy (array of plain strings - no bold formatting)`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
      gtm_strategy: [result]
    };
  }
}

async function generatePorterFiveForces(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Provide a comprehensive Porter's Five Forces analysis:

1. Supplier Power: How much power do suppliers have? Can they raise prices or reduce quality?
2. Buyer Power: How much power do customers have? Can they drive prices down or demand more?
3. Competitive Rivalry: How intense is the competition? How many competitors? How differentiated?
4. Threat of Substitution: How easy is it for customers to find alternative solutions?
5. Threat of New Entry: How easy is it for new competitors to enter this market?

For each force, provide:
- Rating: High, Medium, or Low
- Analysis: 2-3 paragraphs explaining the rating, key factors, and strategic implications
- Key considerations and recommendations

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting (no **, no #, no bullet points) inside the string values.

Format as JSON with keys: 
- supplier_power {rating, analysis} (rating is "High", "Medium", or "Low"; analysis is plain text string with newlines)
- buyer_power {rating, analysis}
- competitive_rivalry {rating, analysis}
- threat_of_substitution {rating, analysis}
- threat_of_new_entry {rating, analysis}`;

  const result = await callAI(prompt, apiKey);
  try {
    return JSON.parse(result);
  } catch {
    return { 
      supplier_power: { rating: "Medium", analysis: "Analysis pending" },
      buyer_power: { rating: "Medium", analysis: "Analysis pending" },
      competitive_rivalry: { rating: "High", analysis: "Analysis pending" },
      threat_of_substitution: { rating: "Medium", analysis: "Analysis pending" },
      threat_of_new_entry: { rating: "Medium", analysis: "Analysis pending" }
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

async function generateCatwoeAnalysis(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

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

  const result = await callAI(prompt, apiKey);
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

async function generatePathToMvp(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

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

  const result = await callAI(prompt, apiKey);
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

async function generateUSPAnalysis(project: any, apiKey: string) {
  const prompt = `Based on the following business idea, create a comprehensive USP (Unique Selling Proposition) analysis:

Project: ${project.name}
Description: ${project.description}
Industry: ${project.industry}

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

  const result = await callAI(prompt, apiKey);
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

async function generateGoToMarketStrategy(project: any, apiKey: string) {
  const prompt = `Business Idea: ${project.name}
Industry: ${project.industry}
Description: ${project.description}

Create a comprehensive Go-To-Market (GTM) Strategy covering:

1. Target Market Segmentation - Define primary and secondary segments with detailed profiles
2. Value Proposition - Clear positioning and unique selling points for each segment
3. Marketing Channels - Specific channels with strategies and expected ROI
4. Sales Strategy - Sales process, team structure, and conversion tactics
5. Pricing Strategy - Pricing model, tiers, and competitive positioning
6. Launch Phases - Pre-launch, launch, and post-launch activities with timelines
7. Growth Tactics - Strategies for scaling and achieving market penetration
8. Key Metrics - Critical KPIs to track GTM success

Provide specific, actionable strategies with concrete examples.

CRITICAL: Return ONLY valid JSON. Do NOT use markdown formatting.

Format as JSON with keys:
- target_segments (array of { segment, description, size, characteristics (array) })
- value_proposition { primary (string), differentiators (array) }
- marketing_channels (array of { channel, strategy, budget_allocation, expected_roi })
- sales_strategy { process (string), team_structure (array), conversion_tactics (array) }
- pricing_strategy { model (string), tiers (array of { name, price, features (array) }), competitive_position (string) }
- launch_phases (array of { phase, duration, activities (array), goals (array) })
- growth_tactics (array of { tactic, description, implementation, expected_impact })
- key_metrics (array of { metric, target, measurement_frequency })`;

  const result = await callAI(prompt, apiKey);
  try {
    const cleanedResult = cleanJsonFromMarkdown(result);
    return JSON.parse(cleanedResult);
  } catch (error) {
    console.error("Go to market parse error:", error, "Raw result:", result);
    return {
      target_segments: [
        { segment: "Segment analysis pending", description: "TBD", size: "TBD", characteristics: ["TBD"] }
      ],
      value_proposition: {
        primary: "Value proposition pending",
        differentiators: ["TBD"]
      },
      marketing_channels: [
        { channel: "TBD", strategy: "TBD", budget_allocation: "TBD", expected_roi: "TBD" }
      ],
      sales_strategy: {
        process: "Sales strategy pending",
        team_structure: ["TBD"],
        conversion_tactics: ["TBD"]
      },
      pricing_strategy: {
        model: "Pricing model pending",
        tiers: [{ name: "TBD", price: "TBD", features: ["TBD"] }],
        competitive_position: "TBD"
      },
      launch_phases: [
        { phase: "Phase 1", duration: "TBD", activities: ["TBD"], goals: ["TBD"] }
      ],
      growth_tactics: [
        { tactic: "TBD", description: "TBD", implementation: "TBD", expected_impact: "TBD" }
      ],
      key_metrics: [
        { metric: "TBD", target: "TBD", measurement_frequency: "TBD" }
      ]
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
