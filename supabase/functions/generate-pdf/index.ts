import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { project_id } = await req.json();

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (!report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = generateReportHTML(project, report);

    return new Response(
      JSON.stringify({ html }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// --- Helpers ---
function safe(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.total) return String(val.total);
    // Try to extract meaningful text from common object shapes
    const text = val.description || val.text || val.summary || val.detail || val.name || val.title || val.feature || val.task || val.action || val.item || val.channel || val.strategy || val.value || '';
    if (text) return String(text);
    // Format key-value pairs instead of raw JSON
    const entries = Object.entries(val).filter(([_, v]) => v !== null && v !== undefined && v !== '');
    if (entries.length) {
      return entries.map(([k, v]) => `<strong>${k.replace(/_/g, ' ')}:</strong> ${typeof v === 'object' ? safe(v) : String(v)}`).join(' · ');
    }
    return fallback;
  }
  return String(val);
}

function safeArr(val: any): any[] {
  return Array.isArray(val) ? val : [];
}

function formatItem(item: any): string {
  if (typeof item === 'string') return item;
  if (typeof item !== 'object' || item === null) return String(item ?? '');
  // Smart object rendering: look for common patterns
  const name = item.name || item.title || item.feature || item.task || item.action || item.channel || item.risk || item.item || '';
  const desc = item.description || item.detail || item.details || item.strategy || item.analysis || item.rationale || item.mitigation || item.mitigation_strategy || '';
  const extra: string[] = [];
  if (item.value && item.value !== name) extra.push(item.value);
  if (item.effort) extra.push(`Effort: ${item.effort}`);
  if (item.priority) extra.push(`Priority: ${item.priority}`);
  if (item.probability || item.likelihood) extra.push(`Probability: ${item.probability || item.likelihood}`);
  if (item.impact && item.impact !== desc) extra.push(`Impact: ${item.impact}`);
  if (item.rating) extra.push(`Rating: ${item.rating}`);
  
  let result = '';
  if (name) result += `<strong>${name}</strong>`;
  if (desc) result += (result ? ': ' : '') + desc;
  if (!result && item.value) result = String(item.value);
  if (extra.length) result += (result ? ' — ' : '') + extra.join(' · ');
  return result || safe(item);
}

function bulletList(items: any[], render?: (item: any) => string): string {
  if (!items.length) return '<p class="muted">No data available</p>';
  return '<ul>' + items.map(i => `<li>${render ? render(i) : formatItem(i)}</li>`).join('') + '</ul>';
}

function section(title: string, content: string): string {
  return `<div class="page"><h1>${title}</h1>${content}</div>`;
}

function subsection(title: string, content: string): string {
  return `<div class="section"><h2>${title}</h2>${content}</div>`;
}

// --- Main HTML generator ---
function generateReportHTML(project: any, report: any): string {
  const rd = report.report_data || {};
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const score = project.validation_score || rd.validation_score || 0;

  const pages: string[] = [];

  // 1. Executive Summary
  if (rd.executive_summary) {
    const es = rd.executive_summary;
    pages.push(section('Executive Summary', `
      <div class="score-box"><div class="score">${score}/100</div><p>Validation Score</p></div>
      ${subsection('Strengths', bulletList(safeArr(es.strengths)))}
      ${subsection('Concerns', bulletList(safeArr(es.concerns)))}
      ${subsection('Recommendation', `<p>${safe(es.recommendation, 'N/A')}</p>`)}
      ${es.reasoning ? subsection('Reasoning', `<p>${safe(es.reasoning)}</p>`) : ''}
    `));
  }

  // 2. Market Analysis
  if (rd.market_analysis) {
    const ma = rd.market_analysis;
    pages.push(section('Market Analysis', `
      <table class="data-table">
        <tr><td><strong>TAM</strong></td><td>${safe(ma.tam, 'N/A')}</td></tr>
        <tr><td><strong>SAM</strong></td><td>${safe(ma.sam, 'N/A')}</td></tr>
        <tr><td><strong>SOM</strong></td><td>${safe(ma.som, 'N/A')}</td></tr>
        <tr><td><strong>Growth Rate</strong></td><td>${safe(ma.growth_rate, 'N/A')}</td></tr>
      </table>
      ${safeArr(ma.trends || ma.key_trends).length ? subsection('Market Trends', bulletList(safeArr(ma.trends || ma.key_trends))) : ''}
      ${safeArr(ma.barriers).length ? subsection('Entry Barriers', bulletList(safeArr(ma.barriers))) : ''}
      ${ma.timing_assessment ? subsection('Timing Assessment', `<p>${safe(ma.timing_assessment)}</p>`) : ''}
      ${ma.target_audience ? subsection('Target Audience', `<p>${safe(ma.target_audience)}</p>`) : ''}
    `));
  }

  // 3. Customer Personas
  const personas = safeArr(rd.customer_personas?.personas || rd.customer_personas);
  if (personas.length) {
    pages.push(section('Target Customers', personas.map((p: any, i: number) => `
      <div class="card">
        <h2>${safe(p.name, `Persona ${i + 1}`)}</h2>
        <table class="data-table">
          ${p.age_range ? `<tr><td><strong>Age Range</strong></td><td>${p.age_range}</td></tr>` : ''}
          ${p.occupation ? `<tr><td><strong>Occupation</strong></td><td>${p.occupation}</td></tr>` : ''}
          ${p.income_level ? `<tr><td><strong>Income Level</strong></td><td>${p.income_level}</td></tr>` : ''}
          ${p.tech_savviness ? `<tr><td><strong>Tech Savviness</strong></td><td>${p.tech_savviness}</td></tr>` : ''}
        </table>
        ${safeArr(p.pain_points).length ? `<h3>Pain Points</h3>${bulletList(safeArr(p.pain_points))}` : ''}
        ${safeArr(p.goals).length ? `<h3>Goals</h3>${bulletList(safeArr(p.goals))}` : ''}
        ${p.buying_behavior ? `<h3>Buying Behavior</h3><p>${safe(p.buying_behavior)}</p>` : ''}
        ${p.priority_reason ? `<h3>Why They're a Priority</h3><p>${safe(p.priority_reason)}</p>` : ''}
      </div>
    `).join('')));
  }

  // 4. Competitive Landscape
  if (rd.competitive_landscape) {
    const cl = rd.competitive_landscape;
    let content = '';
    const dc = safeArr(cl.direct_competitors);
    if (dc.length) {
      content += subsection('Direct Competitors', bulletList(dc, (c: any) =>
        typeof c === 'object' ? `<strong>${safe(c.name, 'Competitor')}</strong>: ${safe(c.description || c.weakness || '')}` : safe(c)
      ));
    }
    const ic = safeArr(cl.indirect_competitors);
    if (ic.length) {
      content += subsection('Indirect Competitors', bulletList(ic, (c: any) =>
        typeof c === 'object' ? `<strong>${safe(c.name)}</strong>: ${safe(c.description || '')}` : safe(c)
      ));
    }
    const adv = safeArr(cl.competitive_advantages);
    if (adv.length) content += subsection('Competitive Advantages', bulletList(adv));
    if (cl.positioning) content += subsection('Positioning', `<p>${safe(cl.positioning)}</p>`);
    pages.push(section('Competitive Landscape', content || '<p>No data available</p>'));
  }

  // 5. SWOT (Strategic Frameworks)
  if (rd.strategic_frameworks) {
    const swot = rd.strategic_frameworks.swot || rd.strategic_frameworks;
    const quads = [
      { key: 'strengths', label: 'Strengths', color: '#10b981' },
      { key: 'weaknesses', label: 'Weaknesses', color: '#ef4444' },
      { key: 'opportunities', label: 'Opportunities', color: '#3b82f6' },
      { key: 'threats', label: 'Threats', color: '#f59e0b' },
    ];
    const grid = quads.map(q => `
      <div class="swot-quad" style="border-left: 4px solid ${q.color};">
        <h3>${q.label}</h3>
        ${bulletList(safeArr(swot[q.key]))}
      </div>
    `).join('');
    let extra = '';
    if (safeArr(rd.strategic_frameworks.gtm_strategy).length) {
      extra = subsection('Go-to-Market Strategy', bulletList(safeArr(rd.strategic_frameworks.gtm_strategy)));
    }
    pages.push(section('SWOT Analysis', `<div class="swot-grid">${grid}</div>${extra}`));
  }

  // 6. Porter's Five Forces
  if (rd.porter_five_forces) {
    const pf = rd.porter_five_forces;
    const forces = [
      ['supplier_power', 'Supplier Power'],
      ['buyer_power', 'Buyer Power'],
      ['competitive_rivalry', 'Competitive Rivalry'],
      ['threat_of_substitution', 'Threat of Substitution'],
      ['threat_of_new_entry', 'Threat of New Entry'],
    ];
    const content = forces.map(([key, label]) => {
      const f = pf[key];
      if (!f) return '';
      return `<div class="card">
        <h3>${label}</h3>
        <p><strong>Rating:</strong> ${safe(f.rating, 'N/A')}</p>
        <p>${safe(f.analysis, '')}</p>
      </div>`;
    }).join('');
    pages.push(section("Porter's Five Forces", content));
  }

  // 7. PESTEL Analysis
  if (rd.pestel_analysis) {
    const factors = ['political', 'economic', 'social', 'technological', 'environmental', 'legal'];
    const content = factors.map(f => {
      const data = rd.pestel_analysis[f];
      if (!data) return '';
      const text = typeof data === 'string' ? data : safe(data.analysis || data.impact || data);
      return `<div class="section"><h3>${f.charAt(0).toUpperCase() + f.slice(1)}</h3><p>${text}</p></div>`;
    }).join('');
    pages.push(section('PESTEL Analysis', content));
  }

  // 8. CATWOE Analysis
  if (rd.catwoe_analysis) {
    const items = [
      ['customers', 'Customers'], ['actors', 'Actors'], ['transformation', 'Transformation'],
      ['worldview', 'Worldview'], ['owners', 'Owners'], ['environment', 'Environment'],
    ];
    const content = items.map(([key, label]) => {
      const val = rd.catwoe_analysis[key];
      return val ? `<div class="section"><h3>${label}</h3><p>${safe(val)}</p></div>` : '';
    }).join('');
    pages.push(section('CATWOE Analysis', content));
  }

  // 9. USP Analysis
  if (rd.usp_analysis) {
    const u = rd.usp_analysis;
    let content = '';
    if (u.primary_usp) content += `<p><strong>Primary USP:</strong> ${safe(u.primary_usp)}</p>`;
    if (u.positioning_statement) content += `<p><strong>Positioning:</strong> ${safe(u.positioning_statement)}</p>`;
    if (safeArr(u.supporting_points).length) content += subsection('Supporting Points', bulletList(safeArr(u.supporting_points)));
    if (u.elevator_pitch) content += subsection('Elevator Pitch', `<p class="highlight">${safe(u.elevator_pitch)}</p>`);
    pages.push(section('Unique Selling Proposition', content || '<p>No data available</p>'));
  }

  // 10. Path to MVP
  if (rd.path_to_mvp) {
    const mvp = rd.path_to_mvp;
    let content = '';
    const features = safeArr(mvp.core_features || mvp.mvp_features);
    if (features.length) content += subsection('Core Features', bulletList(features));
    if (mvp.timeline) content += subsection('Timeline', `<p>${safe(mvp.timeline)}</p>`);
    if (mvp.estimated_cost) content += subsection('Estimated Cost', `<p>${safe(mvp.estimated_cost)}</p>`);
    const techStack = safeArr(mvp.tech_stack || mvp.recommended_stack);
    if (techStack.length) content += subsection('Tech Stack', bulletList(techStack));
    const milestones = safeArr(mvp.milestones);
    if (milestones.length) content += subsection('Milestones', bulletList(milestones, (m: any) =>
      typeof m === 'object' ? `<strong>${safe(m.name || m.title)}</strong>: ${safe(m.description || m.details || '')}` : safe(m)
    ));
    pages.push(section('Path to MVP', content || '<p>No data available</p>'));
  }

  // 11. Go-to-Market Strategy
  if (rd.go_to_market_strategy) {
    const gtm = rd.go_to_market_strategy;
    let content = '';
    const channels = safeArr(gtm.marketing_channels);
    if (channels.length) content += subsection('Marketing Channels', bulletList(channels, (c: any) =>
      typeof c === 'object' ? `<strong>${safe(c.name || c.channel)}</strong>: ${safe(c.description || c.strategy || '')}` : safe(c)
    ));
    const phases = safeArr(gtm.launch_phases || gtm.phases);
    if (phases.length) content += subsection('Launch Phases', bulletList(phases, (p: any) =>
      typeof p === 'object' ? `<strong>${safe(p.name || p.phase)}</strong>: ${safe(p.description || p.details || '')}` : safe(p)
    ));
    if (gtm.pricing_strategy) content += subsection('Pricing Strategy', `<p>${safe(gtm.pricing_strategy)}</p>`);
    if (gtm.customer_acquisition) content += subsection('Customer Acquisition', `<p>${safe(gtm.customer_acquisition)}</p>`);
    pages.push(section('Go-to-Market Strategy', content || '<p>No data available</p>'));
  }

  // 12. Financial Basics
  if (rd.financial_basics) {
    const fb = rd.financial_basics;
    let content = '<table class="data-table">';
    if (fb.startup_costs) content += `<tr><td><strong>Startup Costs</strong></td><td>${safe(fb.startup_costs?.total || fb.startup_costs)}</td></tr>`;
    if (fb.monthly_costs) content += `<tr><td><strong>Monthly Costs</strong></td><td>${safe(fb.monthly_costs?.total || fb.monthly_costs)}</td></tr>`;
    if (fb.break_even) content += `<tr><td><strong>Break-Even</strong></td><td>${safe(fb.break_even)}</td></tr>`;
    if (fb.revenue_model) content += `<tr><td><strong>Revenue Model</strong></td><td>${safe(fb.revenue_model)}</td></tr>`;
    if (fb.recommended_business_model || fb.business_model) content += `<tr><td><strong>Business Model</strong></td><td>${safe(fb.recommended_business_model || fb.business_model)}</td></tr>`;
    if (fb.cac_estimate) content += `<tr><td><strong>CAC Estimate</strong></td><td>${safe(fb.cac_estimate)}</td></tr>`;
    if (fb.ltv_estimate) content += `<tr><td><strong>LTV Estimate</strong></td><td>${safe(fb.ltv_estimate)}</td></tr>`;
    content += '</table>';
    const breakdown = safeArr(fb.startup_costs?.breakdown || fb.cost_breakdown);
    if (breakdown.length) content += subsection('Cost Breakdown', bulletList(breakdown, (b: any) =>
      typeof b === 'object' ? `<strong>${safe(b.item || b.category)}</strong>: ${safe(b.cost || b.amount || '')}` : safe(b)
    ));
    pages.push(section('Financial Overview', content));
  }

  // 13. Risk Matrix
  if (rd.risk_matrix) {
    const risks = safeArr(rd.risk_matrix.risks || rd.risk_matrix);
    if (risks.length) {
      const rows = risks.map((r: any) => `
        <tr>
          <td>${safe(r.risk || r.name)}</td>
          <td>${safe(r.probability || r.likelihood, 'N/A')}</td>
          <td>${safe(r.impact, 'N/A')}</td>
          <td>${safe(r.mitigation || r.mitigation_strategy, '')}</td>
        </tr>
      `).join('');
      pages.push(section('Risk Mitigation Matrix', `
        <table class="data-table full-width">
          <thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      `));
    }
  }

  // 14. Game-Changing Idea
  if (rd.game_changing_idea) {
    const gc = rd.game_changing_idea;
    let content = '';
    if (gc.idea || gc.title) content += `<p class="highlight"><strong>${safe(gc.idea || gc.title)}</strong></p>`;
    if (gc.description) content += `<p>${safe(gc.description)}</p>`;
    if (gc.rationale) content += subsection('Rationale', `<p>${safe(gc.rationale)}</p>`);
    if (gc.implementation) content += subsection('Implementation', `<p>${safe(gc.implementation)}</p>`);
    if (gc.expected_impact) content += subsection('Expected Impact', `<p>${safe(gc.expected_impact)}</p>`);
    pages.push(section('Game-Changing Idea', content || '<p>No data available</p>'));
  }

  // 15. Action Plan
  if (rd.action_plan) {
    const ap = rd.action_plan;
    const weeks = safeArr(ap.weeks || ap.phases || ap.steps);
    let content = '';
    if (weeks.length) {
      content = weeks.map((w: any, i: number) => {
        const title = safe(w.title || w.week || w.phase || `Week ${i + 1}`);
        const tasks = safeArr(w.tasks || w.actions || w.items);
        return `<div class="card">
          <h3>${title}</h3>
          ${tasks.length ? bulletList(tasks, (t: any) => typeof t === 'object' ? safe(t.task || t.action || t.description) : safe(t)) : `<p>${safe(w.description || '')}</p>`}
        </div>`;
      }).join('');
    } else if (typeof ap === 'string') {
      content = `<p>${ap}</p>`;
    }
    pages.push(section('30-Day Action Plan', content || '<p>No data available</p>'));
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; line-height: 1.7; color: #1a1a2e; font-size: 11pt; }
    .cover {
      height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; text-align: center; page-break-after: always;
    }
    .cover h1 { font-size: 42pt; margin-bottom: 12px; font-weight: 700; }
    .cover h2 { font-size: 20pt; font-weight: 400; opacity: 0.9; }
    .cover .meta { font-size: 12pt; margin-top: 40px; opacity: 0.8; }
    .page { padding: 50px 70px; page-break-after: always; }
    h1 { font-size: 24pt; margin-bottom: 20px; color: #667eea; border-bottom: 2px solid #667eea22; padding-bottom: 8px; }
    h2 { font-size: 15pt; margin: 24px 0 12px; color: #333; }
    h3 { font-size: 12pt; margin: 16px 0 8px; color: #555; font-weight: 600; }
    p { margin-bottom: 10px; }
    .muted { color: #888; font-style: italic; }
    ul { margin-left: 18px; margin-bottom: 14px; }
    li { margin-bottom: 6px; }
    .score-box {
      background: #f0f4ff; border: 2px solid #667eea; border-radius: 10px;
      padding: 24px; margin: 20px 0; text-align: center;
    }
    .score { font-size: 48pt; font-weight: 700; color: #667eea; }
    .section { margin-bottom: 20px; }
    .card {
      background: #f8f9fc; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 16px; margin-bottom: 12px;
    }
    .highlight {
      background: #f0f4ff; border-left: 4px solid #667eea; padding: 12px 16px;
      border-radius: 0 8px 8px 0; margin: 12px 0;
    }
    .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    .data-table td, .data-table th {
      padding: 10px 14px; border-bottom: 1px solid #e2e8f0; text-align: left;
    }
    .data-table th { background: #f0f4ff; font-weight: 600; font-size: 10pt; }
    .data-table tr:last-child td { border-bottom: none; }
    .full-width { width: 100%; }
    .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 16px 0; }
    .swot-quad { background: #f8f9fc; padding: 16px; border-radius: 8px; }
    .swot-quad h3 { margin-top: 0; }
    .footer {
      position: fixed; bottom: 20px; left: 70px; right: 70px;
      text-align: center; font-size: 9pt; color: #999;
      border-top: 1px solid #eee; padding-top: 8px;
    }
    @media print {
      .page { padding: 40px 50px; }
      .cover { height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1>${project.name}</h1>
    <h2>Business Validation Report</h2>
    <div class="meta">
      <p>${project.industry || ''}</p>
      <p>Generated on ${date}</p>
    </div>
  </div>
  ${pages.join('\n')}
  <div class="footer">Generated by Validifier.com | &copy; 2025-2026 All Rights Reserved</div>
</body>
</html>`;
}
