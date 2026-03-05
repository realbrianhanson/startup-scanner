import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Branded HTML email template
function buildEmailHtml(body: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Validifier</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .wrapper{width:100%;background:#f4f4f5;padding:40px 0}
  .container{max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)}
  .header{background:linear-gradient(135deg,hsl(221,83%,53%),hsl(250,95%,64%));padding:32px 40px;text-align:center}
  .header h1{margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px}
  .body{padding:32px 40px}
  .body p{margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.6}
  .body h2{margin:0 0 12px;color:#18181b;font-size:18px;font-weight:600}
  .cta{display:inline-block;background:linear-gradient(135deg,hsl(221,83%,53%),hsl(250,95%,64%));color:#ffffff!important;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;margin:8px 0 16px}
  .footer{padding:24px 40px;text-align:center;border-top:1px solid #e4e4e7}
  .footer p{margin:0;color:#a1a1aa;font-size:12px;line-height:1.5}
  .footer a{color:#a1a1aa;text-decoration:underline}
  .highlight-box{background:#f0f4ff;border-radius:8px;padding:16px 20px;margin:16px 0}
  .highlight-box p{margin:4px 0;font-size:14px}
  @media(max-width:600px){
    .body,.header,.footer{padding-left:24px!important;padding-right:24px!important}
  }
</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>` : ''}
<div class="wrapper">
<div class="container">
  <div class="header">
    <h1>Validifier</h1>
  </div>
  <div class="body">
    ${body}
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Validifier. All rights reserved.</p>
    <p>Don't want these emails? <a href="mailto:support@validifier.com?subject=Unsubscribe">Unsubscribe</a></p>
  </div>
</div>
</div>
</body>
</html>`;
}

// Plain text fallback
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Email templates
export function welcomeEmail(name: string): { subject: string; html: string; text: string } {
  const firstName = name?.split(' ')[0] || 'there';
  const body = `
    <h2>Welcome to Validifier, ${firstName}! 🎉</h2>
    <p>You've just joined thousands of founders who validate their business ideas before investing time and money.</p>
    <div class="highlight-box">
      <p>✅ <strong>AI-powered validation</strong> in 60 seconds</p>
      <p>✅ <strong>12 strategic frameworks</strong> including SWOT, Porter's 5 Forces & more</p>
      <p>✅ <strong>Actionable insights</strong> to help you decide whether to pursue your idea</p>
    </div>
    <p>Ready to validate your first idea?</p>
    <a href="https://startup-scanner.lovable.app/projects/new" class="cta">Validate Your Idea →</a>
    <p style="color:#71717a;font-size:13px">Need help getting started? Just reply to this email — we're here to help.</p>
  `;
  return {
    subject: "Welcome to Validifier — Let's validate your first idea",
    html: buildEmailHtml(body, "Welcome! Let's validate your first business idea."),
    text: `Welcome to Validifier, ${firstName}!\n\nYou've joined thousands of founders who validate their business ideas before investing time and money.\n\n- AI-powered validation in 60 seconds\n- 12 strategic frameworks\n- Actionable insights\n\nReady? Visit https://startup-scanner.lovable.app/projects/new to validate your first idea.\n\n— The Validifier Team`,
  };
}

export function reportCompleteEmail(
  name: string,
  projectName: string,
  validationScore: number,
  topInsights: string[],
  reportUrl: string
): { subject: string; html: string; text: string } {
  const firstName = name?.split(' ')[0] || 'there';
  const scoreColor = validationScore >= 70 ? '#16a34a' : validationScore >= 40 ? '#ca8a04' : '#dc2626';
  const insightsHtml = topInsights.map(i => `<p>• ${i}</p>`).join('');
  
  const body = `
    <h2>Your report for "${projectName}" is ready! 📊</h2>
    <p>Hey ${firstName}, your validation report has been generated. Here's a quick look:</p>
    <div class="highlight-box" style="text-align:center">
      <p style="font-size:13px;color:#71717a;margin-bottom:8px">VALIDATION SCORE</p>
      <p style="font-size:42px;font-weight:700;color:${scoreColor};margin:0">${validationScore}/100</p>
    </div>
    <h2>Top Insights</h2>
    <div class="highlight-box">
      ${insightsHtml}
    </div>
    <a href="${reportUrl}" class="cta">View Full Report →</a>
    <p style="color:#71717a;font-size:13px">Your report includes market analysis, competitive landscape, strategic frameworks, and more.</p>
  `;
  return {
    subject: `Your validation report for "${projectName}" is ready!`,
    html: buildEmailHtml(body, `Score: ${validationScore}/100 — View your full report.`),
    text: `Your report for "${projectName}" is ready!\n\nValidation Score: ${validationScore}/100\n\nTop Insights:\n${topInsights.map(i => `- ${i}`).join('\n')}\n\nView full report: ${reportUrl}\n\n— The Validifier Team`,
  };
}

export function creditsLowEmail(
  name: string,
  creditsUsed: number,
  creditsTotal: number
): { subject: string; html: string; text: string } {
  const firstName = name?.split(' ')[0] || 'there';
  const remaining = creditsTotal - creditsUsed;
  
  const body = `
    <h2>You're running low on AI credits ⚡</h2>
    <p>Hey ${firstName}, you've used ${creditsUsed} of your ${creditsTotal} monthly AI credits. You have <strong>${remaining} credits</strong> remaining.</p>
    <div class="highlight-box" style="text-align:center">
      <p style="font-size:13px;color:#71717a;margin-bottom:8px">CREDITS REMAINING</p>
      <p style="font-size:42px;font-weight:700;color:#ca8a04;margin:0">${remaining} / ${creditsTotal}</p>
    </div>
    <p>Upgrade your plan to get more credits and keep validating ideas without interruption.</p>
    <a href="https://startup-scanner.lovable.app/pricing" class="cta">Upgrade Plan →</a>
    <p style="color:#71717a;font-size:13px">Credits reset on the 1st of each month.</p>
  `;
  return {
    subject: "You're running low on AI credits",
    html: buildEmailHtml(body, `${remaining} credits remaining — upgrade to keep validating.`),
    text: `You're running low on AI credits.\n\nYou've used ${creditsUsed} of ${creditsTotal} credits. ${remaining} remaining.\n\nUpgrade at https://startup-scanner.lovable.app/pricing\n\nCredits reset on the 1st of each month.\n\n— The Validifier Team`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text, template, template_data } = await req.json();

    // If using a template, generate email content
    let emailSubject = subject;
    let emailHtml = html;
    let emailText = text;

    if (template) {
      let emailContent;
      switch (template) {
        case 'welcome':
          emailContent = welcomeEmail(template_data?.name);
          break;
        case 'report_complete':
          emailContent = reportCompleteEmail(
            template_data?.name,
            template_data?.project_name,
            template_data?.validation_score,
            template_data?.top_insights || [],
            template_data?.report_url
          );
          break;
        case 'credits_low':
          emailContent = creditsLowEmail(
            template_data?.name,
            template_data?.credits_used,
            template_data?.credits_total
          );
          break;
        default:
          throw new Error(`Unknown template: ${template}`);
      }
      emailSubject = emailContent.subject;
      emailHtml = emailContent.html;
      emailText = emailContent.text;
    }

    if (!to || !emailSubject || !emailHtml) {
      throw new Error('Missing required fields: to, subject, html (or template)');
    }

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured — email not sent');
      return new Response(
        JSON.stringify({ success: false, warning: 'Email service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Validifier <noreply@validifier.com>',
        to: [to],
        subject: emailSubject,
        html: emailHtml,
        text: emailText || stripHtml(emailHtml),
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      console.error('Resend API error:', resendResponse.status, errorBody);
      throw new Error(`Email send failed: ${resendResponse.status}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-email:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
