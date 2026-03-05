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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { project_id } = await req.json();

    const { data: project, error: projectError } = await supabase
      .from('projects').select('*').eq('id', project_id).eq('user_id', user.id).single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: report } = await supabase
      .from('reports').select('*').eq('project_id', project_id).single();

    if (!report) {
      return new Response(JSON.stringify({ error: 'Report not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const html = generateReportHTML(project, report);
    return new Response(JSON.stringify({ html }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// --- Helpers ---
function s(val: any, fb = ''): string {
  if (val == null) return fb;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    const t = val.description || val.text || val.summary || val.name || val.title || val.action || val.value || val.total || '';
    if (t) return String(t);
    const entries = Object.entries(val).filter(([_, v]) => v != null && v !== '');
    if (entries.length) return entries.map(([k, v]) => `<strong>${k.replace(/_/g, ' ')}:</strong> ${typeof v === 'object' ? s(v) : v}`).join(' · ');
    return fb;
  }
  return String(val);
}

function arr(val: any): any[] { return Array.isArray(val) ? val : []; }

function fmt(item: any): string {
  if (typeof item === 'string') return item;
  if (typeof item !== 'object' || !item) return String(item ?? '');
  const name = item.name || item.title || item.feature || item.task || item.action || item.channel || item.risk || '';
  const desc = item.description || item.detail || item.details || item.strategy || item.analysis || item.mitigation || item.mitigation_strategy || '';
  const extras: string[] = [];
  if (item.value && item.value !== name) extras.push(item.value);
  if (item.effort) extras.push(`Effort: ${item.effort}`);
  if (item.priority) extras.push(`Priority: ${item.priority}`);
  if (item.probability || item.likelihood) extras.push(`Prob: ${item.probability || item.likelihood}`);
  if (item.impact && item.impact !== desc) extras.push(`Impact: ${item.impact}`);
  if (item.rating) extras.push(`Rating: ${item.rating}`);
  let r = name ? `<strong>${name}</strong>` : '';
  if (desc) r += (r ? ': ' : '') + desc;
  if (!r && item.value) r = String(item.value);
  if (extras.length) r += (r ? ' — ' : '') + extras.join(' · ');
  return r || s(item);
}

function ul(items: any[]): string {
  if (!items.length) return '<p class="muted">No data available</p>';
  return '<ul>' + items.map(i => `<li>${fmt(i)}</li>`).join('') + '</ul>';
}

function pg(title: string, content: string): string {
  return `<div class="page"><h1>${title}</h1>${content}</div>`;
}

function sub(title: string, content: string): string {
  return `<div class="section"><h2>${title}</h2>${content}</div>`;
}

// --- Main ---
function generateReportHTML(project: any, report: any): string {
  const rd = report.report_data || {};
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const score = project.validation_score || rd.validation_score || 0;
  const pages: string[] = [];

  // 1. Executive Summary
  if (rd.executive_summary) {
    const es = rd.executive_summary;
    pages.push(pg('Executive Summary', `
      <div class="score-box"><div class="score">${score}/100</div><p>Validation Score</p></div>
      ${sub('Strengths', ul(arr(es.strengths)))}
      ${sub('Concerns', ul(arr(es.concerns)))}
      ${sub('Recommendation', `<p>${s(es.recommendation, 'N/A')}</p>`)}
      ${es.reasoning ? sub('Reasoning', `<p>${s(es.reasoning)}</p>`) : ''}
    `));
  }

  // 2. Game-Changing Idea
  if (rd.game_changing_idea) {
    const gc = rd.game_changing_idea;
    let c = '';
    if (gc.headline || gc.idea || gc.title) c += `<p class="highlight"><strong>${s(gc.headline || gc.idea || gc.title)}</strong></p>`;
    if (gc.description) c += `<p>${s(gc.description)}</p>`;
    if (gc.why_it_works) c += sub('Why It Works', `<p>${s(gc.why_it_works)}</p>`);
    if (gc.rationale) c += sub('Rationale', `<p>${s(gc.rationale)}</p>`);
    if (gc.potential_impact || gc.expected_impact) c += sub('Potential Impact', `<p>${s(gc.potential_impact || gc.expected_impact)}</p>`);
    if (gc.example_precedent) c += sub('Example Precedent', `<p>${s(gc.example_precedent)}</p>`);
    const steps = arr(gc.implementation_steps);
    if (steps.length) c += sub('Implementation Steps', ul(steps));
    if (gc.risk) c += sub('Risk', `<p>${s(gc.risk)}</p>`);
    pages.push(pg('Game-Changing Idea', c || '<p>No data available</p>'));
  }

  // 3. Market Analysis
  if (rd.market_analysis) {
    const ma = rd.market_analysis;
    pages.push(pg('Market Analysis', `
      <table class="data-table">
        <tr><td><strong>TAM</strong></td><td>${s(ma.tam, 'N/A')}</td></tr>
        <tr><td><strong>SAM</strong></td><td>${s(ma.sam, 'N/A')}</td></tr>
        <tr><td><strong>SOM</strong></td><td>${s(ma.som, 'N/A')}</td></tr>
        <tr><td><strong>Growth Rate</strong></td><td>${s(ma.growth_rate, 'N/A')}</td></tr>
        ${ma.market_maturity ? `<tr><td><strong>Market Maturity</strong></td><td>${s(ma.market_maturity)}</td></tr>` : ''}
      </table>
      ${arr(ma.trends || ma.key_trends).length ? sub('Market Trends', ul(arr(ma.trends || ma.key_trends))) : ''}
      ${arr(ma.barriers).length ? sub('Entry Barriers', ul(arr(ma.barriers))) : ''}
      ${ma.timing_assessment ? sub('Timing Assessment', `<p>${s(ma.timing_assessment)}</p>`) : ''}
      ${ma.target_audience ? sub('Target Audience', `<p>${s(ma.target_audience)}</p>`) : ''}
    `));
  }

  // 4. Customer Personas
  const personas = arr(rd.customer_personas?.personas || rd.customer_personas);
  if (personas.length) {
    pages.push(pg('Target Customers', personas.map((p: any, i: number) => {
      let c = `<div class="card"><h2>${s(p.name, `Persona ${i + 1}`)}</h2>`;
      c += '<table class="data-table">';
      if (p.age_range) c += `<tr><td><strong>Age</strong></td><td>${p.age_range}</td></tr>`;
      if (p.occupation) c += `<tr><td><strong>Occupation</strong></td><td>${p.occupation}</td></tr>`;
      if (p.income_level) c += `<tr><td><strong>Income</strong></td><td>${p.income_level}</td></tr>`;
      if (p.location) c += `<tr><td><strong>Location</strong></td><td>${p.location}</td></tr>`;
      if (p.tech_savviness) c += `<tr><td><strong>Tech Savviness</strong></td><td>${p.tech_savviness}</td></tr>`;
      c += '</table>';
      const pains = arr(p.pain_points);
      if (pains.length) c += `<h3>Pain Points</h3>${ul(pains)}`;
      const goals = arr(p.goals);
      if (goals.length) c += `<h3>Goals</h3>${ul(goals)}`;
      const values = arr(p.values || p.personality_traits);
      if (values.length) c += `<h3>Values & Traits</h3>${ul(values)}`;
      const objections = arr(p.objections);
      if (objections.length) c += `<h3>Objections</h3>${ul(objections)}`;
      const closing = arr(p.closing_angles);
      if (closing.length) c += `<h3>Closing Angles</h3>${ul(closing)}`;
      if (p.buying_behavior) c += `<h3>Buying Behavior</h3><p>${s(p.buying_behavior)}</p>`;
      if (p.priority_reason) c += `<h3>Why They're a Priority</h3><p>${s(p.priority_reason)}</p>`;
      if (p.dream_outcome) c += `<h3>Dream Outcome</h3><p>${s(p.dream_outcome)}</p>`;
      if (p.current_solution) c += `<h3>Current Solution</h3><p>${s(p.current_solution)}</p>`;
      c += '</div>';
      return c;
    }).join('')));
  }

  // 5. Competitive Landscape
  if (rd.competitive_landscape) {
    const cl = rd.competitive_landscape;
    let c = '';
    for (const [key, label] of [['direct_competitors', 'Direct Competitors'], ['indirect_competitors', 'Indirect Competitors']]) {
      const items = arr(cl[key]);
      if (items.length) c += sub(label, ul(items));
    }
    const adv = arr(cl.competitive_advantages);
    if (adv.length) c += sub('Competitive Advantages', ul(adv));
    if (cl.positioning) c += sub('Positioning', `<p>${s(cl.positioning)}</p>`);
    pages.push(pg('Competitive Landscape', c || '<p>No data available</p>'));
  }

  // 6. SWOT Analysis
  if (rd.strategic_frameworks) {
    const sw = rd.strategic_frameworks.swot || rd.strategic_frameworks;
    const quads = [
      { key: 'strengths', label: 'Strengths', color: '#10b981' },
      { key: 'weaknesses', label: 'Weaknesses', color: '#ef4444' },
      { key: 'opportunities', label: 'Opportunities', color: '#3b82f6' },
      { key: 'threats', label: 'Threats', color: '#f59e0b' },
    ];
    const grid = quads.map(q => `<div class="swot-quad" style="border-left:4px solid ${q.color}"><h3>${q.label}</h3>${ul(arr(sw[q.key]))}</div>`).join('');
    pages.push(pg('SWOT Analysis', `<div class="swot-grid">${grid}</div>`));
  }

  // 7. Porter's Five Forces
  if (rd.porter_five_forces) {
    const pf = rd.porter_five_forces;
    const forces = [['supplier_power','Supplier Power'],['buyer_power','Buyer Power'],['competitive_rivalry','Competitive Rivalry'],['threat_of_substitution','Threat of Substitution'],['threat_of_new_entry','Threat of New Entry']];
    const c = forces.map(([k,l]) => {
      const f = pf[k]; if (!f) return '';
      return `<div class="card"><h3>${l}</h3><p><strong>Rating:</strong> ${s(f.rating,'N/A')}</p><p>${s(f.analysis,'')}</p></div>`;
    }).join('');
    pages.push(pg("Porter's Five Forces", c));
  }

  // 8. PESTEL Analysis
  if (rd.pestel_analysis) {
    const factors = ['political','economic','social','technological','environmental','legal'];
    const c = factors.map(f => {
      const d = rd.pestel_analysis[f]; if (!d) return '';
      const text = typeof d === 'string' ? d : s(d.analysis || d.impact || d);
      return `<div class="section"><h3>${f.charAt(0).toUpperCase()+f.slice(1)}</h3><p>${text}</p></div>`;
    }).join('');
    pages.push(pg('PESTEL Analysis', c));
  }

  // 9. CATWOE Analysis
  if (rd.catwoe_analysis) {
    const items = [['customers','Customers'],['actors','Actors'],['transformation','Transformation'],['worldview','Worldview'],['owners','Owners'],['environment','Environment']];
    const c = items.map(([k,l]) => { const v = rd.catwoe_analysis[k]; return v ? `<div class="section"><h3>${l}</h3><p>${s(v)}</p></div>` : ''; }).join('');
    pages.push(pg('CATWOE Analysis', c));
  }

  // 10. USP Analysis
  if (rd.usp_analysis) {
    const u = rd.usp_analysis;
    let c = '';
    if (u.recommended_usp || u.primary_usp) c += `<p class="highlight"><strong>${s(u.recommended_usp || u.primary_usp)}</strong></p>`;
    if (u.value_proposition) c += sub('Value Proposition', `<p>${s(u.value_proposition)}</p>`);
    if (u.current_positioning) c += sub('Current Positioning', `<p>${s(u.current_positioning)}</p>`);
    if (u.positioning_statement) c += sub('Positioning Statement', `<p>${s(u.positioning_statement)}</p>`);
    const diffs = arr(u.key_differentiators);
    if (diffs.length) c += sub('Key Differentiators', ul(diffs));
    const advs = arr(u.competitive_advantages);
    if (advs.length) c += sub('Competitive Advantages', ul(advs));
    const proofs = arr(u.proof_points);
    if (proofs.length) c += sub('Proof Points', ul(proofs));
    if (u.target_alignment) c += sub('Target Alignment', `<p>${s(u.target_alignment)}</p>`);
    if (u.communication_guidelines) c += sub('Communication Guidelines', `<p>${s(u.communication_guidelines)}</p>`);
    if (u.elevator_pitch) c += sub('Elevator Pitch', `<p class="highlight">${s(u.elevator_pitch)}</p>`);
    pages.push(pg('Unique Selling Proposition', c || '<p>No data available</p>'));
  }

  // 11. Path to MVP
  if (rd.path_to_mvp) {
    const mvp = rd.path_to_mvp;
    let c = '';
    if (mvp.mvp_definition) c += sub('MVP Definition', `<p>${s(mvp.mvp_definition)}</p>`);
    const features = arr(mvp.core_features || mvp.mvp_features);
    if (features.length) c += sub('Core Features', ul(features));
    const phases = arr(mvp.development_phases);
    if (phases.length) c += sub('Development Phases', ul(phases));
    if (mvp.resource_requirements) c += sub('Resource Requirements', `<p>${s(mvp.resource_requirements)}</p>`);
    const metrics = arr(mvp.success_metrics);
    if (metrics.length) c += sub('Success Metrics', ul(metrics));
    if (mvp.launch_strategy) c += sub('Launch Strategy', `<p>${s(mvp.launch_strategy)}</p>`);
    if (mvp.iteration_plan) c += sub('Iteration Plan', `<p>${s(mvp.iteration_plan)}</p>`);
    if (mvp.timeline) c += sub('Timeline', `<p>${s(mvp.timeline)}</p>`);
    if (mvp.estimated_cost) c += sub('Estimated Cost', `<p>${s(mvp.estimated_cost)}</p>`);
    const stack = arr(mvp.tech_stack || mvp.recommended_stack);
    if (stack.length) c += sub('Tech Stack', ul(stack));
    pages.push(pg('Path to MVP', c || '<p>No data available</p>'));
  }

  // 12. Go-to-Market Strategy
  if (rd.go_to_market_strategy) {
    const gtm = rd.go_to_market_strategy;
    let c = '';
    if (gtm.value_proposition) c += sub('Value Proposition', `<p>${s(gtm.value_proposition)}</p>`);
    const segments = arr(gtm.target_segments);
    if (segments.length) c += sub('Target Segments', ul(segments));
    const channels = arr(gtm.marketing_channels);
    if (channels.length) c += sub('Marketing Channels', ul(channels));
    const phases = arr(gtm.launch_phases);
    if (phases.length) c += sub('Launch Phases', ul(phases));
    if (gtm.first_10_customers) c += sub('First 10 Customers', `<p>${s(gtm.first_10_customers)}</p>`);
    if (gtm.pricing_strategy) c += sub('Pricing Strategy', `<p>${s(gtm.pricing_strategy)}</p>`);
    if (gtm.unconventional_tactic) c += sub('Unconventional Tactic', `<p>${s(gtm.unconventional_tactic)}</p>`);
    const metrics = arr(gtm.key_metrics);
    if (metrics.length) c += sub('Key Metrics', ul(metrics));
    if (gtm.customer_acquisition) c += sub('Customer Acquisition', `<p>${s(gtm.customer_acquisition)}</p>`);
    pages.push(pg('Go-to-Market Strategy', c || '<p>No data available</p>'));
  }

  // 13. Financial Basics
  if (rd.financial_basics) {
    const fb = rd.financial_basics;
    let c = '<table class="data-table">';
    if (fb.revenue_model) c += `<tr><td><strong>Revenue Model</strong></td><td>${s(fb.revenue_model)}</td></tr>`;
    if (fb.startup_costs) c += `<tr><td><strong>Startup Costs</strong></td><td>${s(fb.startup_costs)}</td></tr>`;
    if (fb.break_even_estimate || fb.break_even) c += `<tr><td><strong>Break-Even</strong></td><td>${s(fb.break_even_estimate || fb.break_even)}</td></tr>`;
    if (fb.funding_recommendation) c += `<tr><td><strong>Funding Recommendation</strong></td><td>${s(fb.funding_recommendation)}</td></tr>`;
    c += '</table>';
    if (fb.unit_economics) c += sub('Unit Economics', `<p>${s(fb.unit_economics)}</p>`);
    if (fb.projections) c += sub('Projections', `<p>${s(fb.projections)}</p>`);
    if (fb.monthly_costs) c += sub('Monthly Costs', `<p>${s(fb.monthly_costs)}</p>`);
    const breakdown = arr(fb.startup_costs?.breakdown || fb.cost_breakdown);
    if (breakdown.length) c += sub('Cost Breakdown', ul(breakdown));
    pages.push(pg('Financial Overview', c));
  }

  // 14. Risk Matrix
  if (rd.risk_matrix) {
    let c = '';
    for (const [key, label] of [['critical_risks','Critical Risks'],['moderate_risks','Moderate Risks'],['low_risks','Low Risks']]) {
      const risks = arr(rd.risk_matrix[key]);
      if (risks.length) {
        const rows = risks.map((r: any) => `<tr>
          <td>${s(r.risk || r.name)}</td>
          <td>${s(r.probability || r.likelihood, 'N/A')}</td>
          <td>${s(r.impact, 'N/A')}</td>
          <td>${s(r.mitigation_strategy || r.mitigation, '')}</td>
        </tr>`).join('');
        c += sub(label, `<table class="data-table full-width">
          <thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>`);
      }
    }
    // Also handle flat array format
    const flatRisks = arr(rd.risk_matrix.risks || (Array.isArray(rd.risk_matrix) ? rd.risk_matrix : []));
    if (flatRisks.length && !c) {
      const rows = flatRisks.map((r: any) => `<tr><td>${s(r.risk||r.name)}</td><td>${s(r.probability||r.likelihood,'N/A')}</td><td>${s(r.impact,'N/A')}</td><td>${s(r.mitigation||r.mitigation_strategy,'')}</td></tr>`).join('');
      c = `<table class="data-table full-width"><thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    if (rd.risk_matrix.overall_risk_assessment) c += sub('Overall Assessment', `<p>${s(rd.risk_matrix.overall_risk_assessment)}</p>`);
    if (rd.risk_matrix.biggest_unknown) c += sub('Biggest Unknown', `<p>${s(rd.risk_matrix.biggest_unknown)}</p>`);
    pages.push(pg('Risk Mitigation Matrix', c || '<p>No data available</p>'));
  }

  // 15. Action Plan (uses week_1..week_4 structure)
  if (rd.action_plan) {
    const ap = rd.action_plan;
    let c = '';

    // Quick Wins
    const qw = arr(ap.quick_wins);
    if (qw.length) {
      c += `<div class="card" style="border-left:4px solid #667eea"><h3>⚡ Quick Wins — Do These Today</h3>${ul(qw)}</div>`;
    }

    // Weekly cards (week_1, week_2, week_3, week_4)
    for (let i = 1; i <= 4; i++) {
      const week = ap[`week_${i}`];
      if (!week) continue;
      const theme = s(week.theme, `Week ${i}`);
      const actions = arr(week.actions);
      let wc = `<div class="card"><h3>Week ${i}: ${theme}</h3>`;
      if (actions.length) {
        wc += '<ul>';
        actions.forEach((a: any) => {
          const day = typeof a === 'object' ? s(a.day || a.timeline, '') : '';
          const action = typeof a === 'string' ? a : s(a.action || a.task || a.description, '');
          const deliverable = typeof a === 'object' ? a.deliverable : '';
          const why = typeof a === 'object' ? a.why : '';
          wc += '<li>';
          if (day) wc += `<strong>${day}:</strong> `;
          wc += action;
          if (deliverable) wc += `<br/><em>📦 Deliverable: ${deliverable}</em>`;
          if (why) wc += `<br/><span class="muted">Why: ${why}</span>`;
          wc += '</li>';
        });
        wc += '</ul>';
      }
      wc += '</div>';
      c += wc;
    }

    // Also handle weeks array format
    const weeksArr = arr(ap.weeks || ap.phases || ap.steps);
    if (weeksArr.length) {
      weeksArr.forEach((w: any, i: number) => {
        const title = s(w.title || w.week || w.phase || `Week ${i + 1}`);
        const tasks = arr(w.tasks || w.actions || w.items);
        c += `<div class="card"><h3>${title}</h3>${tasks.length ? ul(tasks) : `<p>${s(w.description, '')}</p>`}</div>`;
      });
    }

    // Critical Milestones
    const ms = arr(ap.critical_milestones);
    if (ms.length) {
      c += sub('Critical Milestones', ul(ms));
    }

    // Resources Needed
    if (ap.resources_needed) {
      const rn = ap.resources_needed;
      let rc = '<table class="data-table">';
      if (rn.budget_estimate) rc += `<tr><td><strong>Budget</strong></td><td>${s(rn.budget_estimate)}</td></tr>`;
      if (rn.people) rc += `<tr><td><strong>People</strong></td><td>${s(rn.people)}</td></tr>`;
      const tools = arr(rn.tools);
      if (tools.length) rc += `<tr><td><strong>Tools</strong></td><td>${tools.join(', ')}</td></tr>`;
      rc += '</table>';
      c += sub('Resources Needed', rc);
    }

    pages.push(pg('30-Day Action Plan', c || '<p>No data available</p>'));
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;line-height:1.7;color:#1a1a2e;font-size:11pt}
.cover{height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;text-align:center;page-break-after:always}
.cover h1{font-size:42pt;margin-bottom:12px;font-weight:700}
.cover h2{font-size:20pt;font-weight:400;opacity:.9}
.cover .meta{font-size:12pt;margin-top:40px;opacity:.8}
.page{padding:50px 70px;page-break-after:always}
h1{font-size:24pt;margin-bottom:20px;color:#667eea;border-bottom:2px solid #667eea22;padding-bottom:8px}
h2{font-size:15pt;margin:24px 0 12px;color:#333}
h3{font-size:12pt;margin:16px 0 8px;color:#555;font-weight:600}
p{margin-bottom:10px}
.muted{color:#888;font-style:italic}
ul{margin-left:18px;margin-bottom:14px}
li{margin-bottom:6px}
.score-box{background:#f0f4ff;border:2px solid #667eea;border-radius:10px;padding:24px;margin:20px 0;text-align:center}
.score{font-size:48pt;font-weight:700;color:#667eea}
.section{margin-bottom:20px}
.card{background:#f8f9fc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px}
.highlight{background:#f0f4ff;border-left:4px solid #667eea;padding:12px 16px;border-radius:0 8px 8px 0;margin:12px 0}
.data-table{width:100%;border-collapse:collapse;margin:12px 0}
.data-table td,.data-table th{padding:10px 14px;border-bottom:1px solid #e2e8f0;text-align:left}
.data-table th{background:#f0f4ff;font-weight:600;font-size:10pt}
.data-table tr:last-child td{border-bottom:none}
.swot-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:16px 0}
.swot-quad{background:#f8f9fc;padding:16px;border-radius:8px}
.swot-quad h3{margin-top:0}
.footer{position:fixed;bottom:20px;left:70px;right:70px;text-align:center;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:8px}
@media print{.page{padding:40px 50px}.cover{height:100vh}}
</style>
</head>
<body>
<div class="cover">
<h1>${project.name}</h1>
<h2>Business Validation Report</h2>
<div class="meta"><p>${project.industry||''}</p><p>Generated on ${date}</p></div>
</div>
${pages.join('\n')}
<div class="footer">Generated by Validifier.com | &copy; 2025-2026 All Rights Reserved</div>
</body>
</html>`;
}
