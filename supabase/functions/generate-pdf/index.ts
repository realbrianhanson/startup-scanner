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

    // Fetch project and report
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

    // Generate HTML for PDF
    const html = generateReportHTML(project, report);

    // For now, return the HTML (PDF generation requires Puppeteer which needs different setup)
    // In production, you'd use a service like pdf.co or run Puppeteer in a container
    
    return new Response(
      JSON.stringify({ 
        html,
        message: 'PDF generation ready - integrate with your preferred PDF service'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateReportHTML(project: any, report: any): string {
  const reportData = report.report_data;
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Inter', sans-serif; 
      line-height: 1.6; 
      color: #1a1a1a;
      font-size: 11pt;
    }
    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      page-break-after: always;
    }
    .cover h1 { font-size: 48pt; margin-bottom: 20px; }
    .cover h2 { font-size: 24pt; font-weight: 400; margin-bottom: 40px; }
    .cover .date { font-size: 14pt; margin-top: 40px; }
    
    .page {
      padding: 60px 80px;
      page-break-after: always;
    }
    h1 { font-size: 28pt; margin-bottom: 20px; color: #667eea; }
    h2 { font-size: 18pt; margin: 30px 0 15px; color: #333; }
    h3 { font-size: 14pt; margin: 20px 0 10px; color: #555; }
    p { margin-bottom: 12px; }
    ul { margin-left: 20px; margin-bottom: 15px; }
    li { margin-bottom: 8px; }
    
    .score-box {
      background: #f0f4ff;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .score { font-size: 48pt; font-weight: bold; color: #667eea; }
    
    .section { margin-bottom: 30px; }
    .footer {
      position: fixed;
      bottom: 20px;
      left: 80px;
      right: 80px;
      text-align: center;
      font-size: 9pt;
      color: #999;
      border-top: 1px solid #eee;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="cover">
    <h1>${project.name}</h1>
    <h2>Business Validation Report</h2>
    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M3 3v18h18"/>
      <path d="m19 9-5 5-4-4-3 3"/>
    </svg>
    <div class="date">Generated on ${date}</div>
  </div>

  <!-- Executive Summary -->
  <div class="page">
    <h1>Executive Summary</h1>
    ${reportData.executive_summary ? `
      <div class="score-box">
        <div class="score">${project.validation_score || 'N/A'}/100</div>
        <p>Validation Score</p>
      </div>
      <div class="section">
        <h3>Key Insights</h3>
        <p>${reportData.executive_summary.key_insights || 'No insights available'}</p>
      </div>
      <div class="section">
        <h3>Recommendation</h3>
        <p>${reportData.executive_summary.recommendation || 'No recommendation available'}</p>
      </div>
    ` : '<p>Executive summary not available</p>'}
  </div>

  <!-- Market Analysis -->
  <div class="page">
    <h1>Market Analysis</h1>
    ${reportData.market_analysis ? `
      <div class="section">
        <h2>Market Size & Trends</h2>
        <p>${reportData.market_analysis.market_size || 'No data'}</p>
        ${reportData.market_analysis.key_trends ? `
          <h3>Key Trends</h3>
          <ul>
            ${reportData.market_analysis.key_trends.map((trend: string) => `<li>${trend}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
      <div class="section">
        <h2>Target Audience</h2>
        <p>${reportData.market_analysis.target_audience || 'Not specified'}</p>
      </div>
    ` : '<p>Market analysis not available</p>'}
  </div>

  <!-- Competitive Landscape -->
  <div class="page">
    <h1>Competitive Landscape</h1>
    ${reportData.competitive_landscape ? `
      <div class="section">
        <h2>Main Competitors</h2>
        ${reportData.competitive_landscape.competitors ? `
          <ul>
            ${reportData.competitive_landscape.competitors.map((comp: any) => `
              <li><strong>${comp.name}:</strong> ${comp.description}</li>
            `).join('')}
          </ul>
        ` : '<p>No competitor data available</p>'}
      </div>
    ` : '<p>Competitive analysis not available</p>'}
  </div>

  <!-- SWOT Analysis -->
  <div class="page">
    <h1>SWOT Analysis</h1>
    ${reportData.strategic_frameworks?.swot ? `
      <div class="section">
        <h2>Strengths</h2>
        <ul>
          ${reportData.strategic_frameworks.swot.strengths?.map((s: string) => `<li>${s}</li>`).join('') || '<li>None listed</li>'}
        </ul>
      </div>
      <div class="section">
        <h2>Weaknesses</h2>
        <ul>
          ${reportData.strategic_frameworks.swot.weaknesses?.map((w: string) => `<li>${w}</li>`).join('') || '<li>None listed</li>'}
        </ul>
      </div>
      <div class="section">
        <h2>Opportunities</h2>
        <ul>
          ${reportData.strategic_frameworks.swot.opportunities?.map((o: string) => `<li>${o}</li>`).join('') || '<li>None listed</li>'}
        </ul>
      </div>
      <div class="section">
        <h2>Threats</h2>
        <ul>
          ${reportData.strategic_frameworks.swot.threats?.map((t: string) => `<li>${t}</li>`).join('') || '<li>None listed</li>'}
        </ul>
      </div>
    ` : '<p>SWOT analysis not available</p>'}
  </div>

  <!-- Financial Basics -->
  <div class="page">
    <h1>Financial Overview</h1>
    ${reportData.financial_basics ? `
      <div class="section">
        <h2>Startup Costs</h2>
        <p>${reportData.financial_basics.startup_costs || 'Not estimated'}</p>
      </div>
      <div class="section">
        <h2>Revenue Model</h2>
        <p>${reportData.financial_basics.revenue_model || 'Not specified'}</p>
      </div>
      <div class="section">
        <h2>Customer Acquisition Cost</h2>
        <p>${reportData.financial_basics.cac_estimate || 'Not estimated'}</p>
      </div>
    ` : '<p>Financial data not available</p>'}
  </div>

  <div class="footer">
    Generated by Validifier.com | © 2025-2026 All Rights Reserved
  </div>
</body>
</html>
  `;
}
