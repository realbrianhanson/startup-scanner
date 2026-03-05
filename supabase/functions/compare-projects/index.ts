import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { project_ids } = await req.json();

    if (!project_ids || !Array.isArray(project_ids) || project_ids.length < 2 || project_ids.length > 3) {
      return new Response(
        JSON.stringify({ error: 'Provide 2-3 project_ids to compare' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Invalid user token');

    // Fetch projects + reports
    const { data: projects, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .in('id', project_ids)
      .eq('user_id', user.id);

    if (projErr || !projects || projects.length < 2) {
      throw new Error('Could not find the requested projects');
    }

    const { data: reports, error: repErr } = await supabase
      .from('reports')
      .select('*')
      .in('project_id', project_ids);

    if (repErr) throw repErr;

    // Build comparison context
    const projectSummaries = projects.map(p => {
      const report = reports?.find(r => r.project_id === p.id);
      const rd = report?.report_data as Record<string, any> | null;
      return {
        name: p.name,
        industry: p.industry,
        score: p.validation_score || 0,
        tam: rd?.market_analysis?.tam || 'N/A',
        competitors: rd?.competitive_landscape?.direct_competitors?.length || 0,
        strengths: rd?.strategic_frameworks?.swot?.strengths?.length || rd?.strategic_frameworks?.strengths?.length || 0,
        weaknesses: rd?.strategic_frameworks?.swot?.weaknesses?.length || rd?.strategic_frameworks?.weaknesses?.length || 0,
        startup_cost: rd?.financial_basics?.startup_costs?.total || rd?.financial_basics?.startup_cost_estimate || 'N/A',
        business_model: rd?.financial_basics?.recommended_business_model || rd?.financial_basics?.business_model || 'N/A',
        recommendation: rd?.executive_summary?.recommendation || 'N/A',
      };
    });

    // Generate AI comparison
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const prompt = `Compare these ${projectSummaries.length} business ideas concisely in 2-3 sentences. Identify which idea is strongest and why. Be direct and actionable.

${projectSummaries.map((p, i) => `Idea ${i + 1}: "${p.name}" (${p.industry}) — Score: ${p.score}/100, TAM: ${p.tam}, ${p.competitors} competitors, ${p.strengths} strengths vs ${p.weaknesses} weaknesses, Startup cost: ${p.startup_cost}, Model: ${p.business_model}`).join('\n')}

Return ONLY the comparison text, no JSON, no markdown formatting.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const comparisonSummary = aiData.choices[0].message.content;

    // Log usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      operation_type: 'project_comparison',
      model_used: 'google/gemini-3-flash-preview',
      tokens_used: aiData.usage?.total_tokens || 0,
      cost_cents: Math.ceil((aiData.usage?.total_tokens || 0) * 0.0001),
    });

    return new Response(
      JSON.stringify({
        success: true,
        projects: projectSummaries,
        comparison_summary: comparisonSummary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in compare-projects:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
