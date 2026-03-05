import { safeString, safeArray, safeGet } from './reportHelpers';

/**
 * Generate a plain-text executive summary for clipboard copy
 */
export function formatExecutiveSummaryText(reportData: any, projectName: string, score: number): string {
  const es = reportData?.executive_summary;
  if (!es) return `${projectName} — Validation Score: ${score}/100\n\nExecutive summary not yet available.`;

  const strengths = safeArray(es.strengths, []).map((s: string, i: number) => `  ${i + 1}. ${s}`).join('\n');
  const concerns = safeArray(es.concerns, []).map((c: string, i: number) => `  ${i + 1}. ${c}`).join('\n');
  const recommendation = safeString(es.recommendation, 'No recommendation available');

  return [
    `${projectName} — Validation Report`,
    `Validation Score: ${score}/100`,
    '',
    'STRENGTHS',
    strengths || '  None identified',
    '',
    'CONCERNS',
    concerns || '  None identified',
    '',
    'RECOMMENDATION',
    recommendation,
    '',
    '—',
    'Generated with Validifier (https://validifier.com)',
  ].join('\n');
}

/**
 * Generate a full Markdown export of the entire report
 */
export function generateReportMarkdown(reportData: any, project: any): string {
  const score = project?.validation_score || reportData?.validation_score || 0;
  const lines: string[] = [];

  lines.push(`# ${project?.name} — Validation Report`);
  lines.push(`**Industry:** ${project?.industry || 'N/A'}  `);
  lines.push(`**Validation Score:** ${score}/100  `);
  lines.push(`**Generated:** ${new Date(project?.created_at).toLocaleDateString()}  `);
  lines.push('');

  // Executive Summary
  const es = reportData?.executive_summary;
  if (es) {
    lines.push('## Executive Summary');
    lines.push('');
    lines.push(`**Score:** ${safeString(es.score, String(score))}/100`);
    lines.push('');
    lines.push('### Strengths');
    safeArray(es.strengths).forEach(s => lines.push(`- ${s}`));
    lines.push('');
    lines.push('### Concerns');
    safeArray(es.concerns).forEach(c => lines.push(`- ${c}`));
    lines.push('');
    lines.push('### Recommendation');
    lines.push(safeString(es.recommendation, 'N/A'));
    if (es.reasoning) {
      lines.push('');
      lines.push('### Reasoning');
      lines.push(safeString(es.reasoning));
    }
    lines.push('');
  }

  // Market Analysis
  const ma = reportData?.market_analysis;
  if (ma) {
    lines.push('## Market Analysis');
    lines.push('');
    lines.push(`- **TAM:** ${safeString(ma.tam)}`);
    lines.push(`- **SAM:** ${safeString(ma.sam)}`);
    lines.push(`- **SOM:** ${safeString(ma.som)}`);
    lines.push(`- **Growth Rate:** ${safeString(ma.growth_rate)}`);
    lines.push('');
    const trends = safeArray(ma.trends);
    if (trends.length) {
      lines.push('### Market Trends');
      trends.forEach(t => lines.push(`- ${t}`));
      lines.push('');
    }
    const barriers = safeArray(ma.barriers);
    if (barriers.length) {
      lines.push('### Entry Barriers');
      barriers.forEach(b => lines.push(`- ${b}`));
      lines.push('');
    }
    if (ma.timing_assessment) {
      lines.push('### Timing Assessment');
      lines.push(safeString(ma.timing_assessment));
      lines.push('');
    }
  }

  // Customer Personas
  const cp = reportData?.customer_personas;
  if (cp && Array.isArray(cp.personas || cp)) {
    const personas = cp.personas || cp;
    lines.push('## Customer Personas');
    lines.push('');
    personas.forEach((p: any, i: number) => {
      lines.push(`### Persona ${i + 1}: ${safeString(p.name, `Persona ${i + 1}`)}`);
      if (p.age_range) lines.push(`- **Age Range:** ${p.age_range}`);
      if (p.occupation) lines.push(`- **Occupation:** ${p.occupation}`);
      if (p.income_level) lines.push(`- **Income Level:** ${p.income_level}`);
      const pains = safeArray(p.pain_points);
      if (pains.length) { lines.push('- **Pain Points:**'); pains.forEach(pp => lines.push(`  - ${pp}`)); }
      lines.push('');
    });
  }

  // Competitive Landscape
  const cl = reportData?.competitive_landscape;
  if (cl) {
    lines.push('## Competitive Landscape');
    lines.push('');
    const dc = safeArray(cl.direct_competitors);
    if (dc.length) {
      lines.push('### Direct Competitors');
      dc.forEach(c => {
        if (typeof c === 'object' && c !== null) {
          lines.push(`- **${(c as any).name || 'Competitor'}:** ${(c as any).description || ''}`);
        } else {
          lines.push(`- ${c}`);
        }
      });
      lines.push('');
    }
    const adv = safeArray(cl.competitive_advantages);
    if (adv.length) {
      lines.push('### Competitive Advantages');
      adv.forEach(a => lines.push(`- ${a}`));
      lines.push('');
    }
    if (cl.positioning) {
      lines.push('### Positioning');
      lines.push(safeString(cl.positioning));
      lines.push('');
    }
  }

  // Strategic Frameworks (SWOT)
  const sf = reportData?.strategic_frameworks;
  if (sf) {
    lines.push('## Strategic Frameworks (SWOT)');
    lines.push('');
    const swot = sf.swot || sf;
    for (const q of ['strengths', 'weaknesses', 'opportunities', 'threats']) {
      const items = safeArray(swot[q]);
      if (items.length) {
        lines.push(`### ${q.charAt(0).toUpperCase() + q.slice(1)}`);
        items.forEach(item => lines.push(`- ${item}`));
        lines.push('');
      }
    }
  }

  // Porter's Five Forces
  const pf = reportData?.porter_five_forces;
  if (pf) {
    lines.push("## Porter's Five Forces");
    lines.push('');
    for (const [key, label] of [
      ['supplier_power', 'Supplier Power'],
      ['buyer_power', 'Buyer Power'],
      ['competitive_rivalry', 'Competitive Rivalry'],
      ['threat_of_substitution', 'Threat of Substitution'],
      ['threat_of_new_entry', 'Threat of New Entry'],
    ]) {
      const force = pf[key];
      if (force) {
        lines.push(`### ${label}`);
        lines.push(`**Rating:** ${safeString(force.rating, 'N/A')}`);
        lines.push(safeString(force.analysis, ''));
        lines.push('');
      }
    }
  }

  // PESTEL
  const pestel = reportData?.pestel_analysis;
  if (pestel) {
    lines.push('## PESTEL Analysis');
    lines.push('');
    for (const factor of ['political', 'economic', 'social', 'technological', 'environmental', 'legal']) {
      const data = pestel[factor];
      if (data) {
        lines.push(`### ${factor.charAt(0).toUpperCase() + factor.slice(1)}`);
        if (typeof data === 'string') lines.push(data);
        else if (data.impact) lines.push(`**Impact:** ${data.impact}`);
        if (data.analysis) lines.push(safeString(data.analysis));
        lines.push('');
      }
    }
  }

  // CATWOE
  const catwoe = reportData?.catwoe_analysis;
  if (catwoe) {
    lines.push('## CATWOE Analysis');
    lines.push('');
    for (const [key, label] of [
      ['customers', 'Customers'], ['actors', 'Actors'], ['transformation', 'Transformation'],
      ['worldview', 'Worldview'], ['owners', 'Owners'], ['environment', 'Environment'],
    ]) {
      const val = catwoe[key];
      if (val) {
        lines.push(`### ${label}`);
        lines.push(safeString(val));
        lines.push('');
      }
    }
  }

  // USP
  const usp = reportData?.usp_analysis;
  if (usp) {
    lines.push('## Unique Selling Proposition');
    lines.push('');
    if (usp.primary_usp) lines.push(`**Primary USP:** ${safeString(usp.primary_usp)}`);
    if (usp.positioning_statement) { lines.push(''); lines.push(`**Positioning:** ${safeString(usp.positioning_statement)}`); }
    lines.push('');
  }

  // Path to MVP
  const mvp = reportData?.path_to_mvp;
  if (mvp) {
    lines.push('## Path to MVP');
    lines.push('');
    const features = safeArray(mvp.core_features || mvp.mvp_features);
    if (features.length) {
      lines.push('### Core Features');
      features.forEach(f => lines.push(`- ${f}`));
      lines.push('');
    }
    if (mvp.timeline) {
      lines.push(`**Timeline:** ${safeString(mvp.timeline)}`);
      lines.push('');
    }
  }

  // Go-to-Market
  const gtm = reportData?.go_to_market_strategy;
  if (gtm) {
    lines.push('## Go-to-Market Strategy');
    lines.push('');
    const channels = safeArray(gtm.marketing_channels);
    if (channels.length) {
      lines.push('### Marketing Channels');
      channels.forEach(c => {
        if (typeof c === 'object' && c !== null) lines.push(`- **${(c as any).name || (c as any).channel || 'Channel'}:** ${(c as any).description || (c as any).strategy || ''}`);
        else lines.push(`- ${c}`);
      });
      lines.push('');
    }
  }

  // Financial Basics
  const fb = reportData?.financial_basics;
  if (fb) {
    lines.push('## Financial Basics');
    lines.push('');
    if (fb.startup_costs) lines.push(`**Startup Costs:** ${safeString(fb.startup_costs?.total || fb.startup_costs)}`);
    if (fb.monthly_costs) lines.push(`**Monthly Costs:** ${safeString(fb.monthly_costs?.total || fb.monthly_costs)}`);
    if (fb.break_even) lines.push(`**Break-Even:** ${safeString(fb.break_even)}`);
    if (fb.recommended_business_model || fb.business_model) lines.push(`**Business Model:** ${safeString(fb.recommended_business_model || fb.business_model)}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Generated with [Validifier](https://validifier.com)*');

  return lines.join('\n');
}

/**
 * Generate social sharing text
 */
export function generateSocialShareText(projectName: string, score: number): string {
  return `Just validated my business idea "${projectName}" with @validifier — scored ${score}/100! 🚀\n\nValidate yours: https://validifier.com`;
}

/**
 * Download a string as a file
 */
export function downloadAsFile(content: string, filename: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
