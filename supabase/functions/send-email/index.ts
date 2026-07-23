import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const BASE_URL = Deno.env.get("APP_BASE_URL") || "https://validifier.com";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ---------- Safety helpers ----------

function escapeHtml(input: unknown): string {
  const s = input == null ? "" : String(input);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clampInt(input: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(n)) return fallback;
  const clamped = Math.max(min, Math.min(max, Math.trunc(n)));
  return clamped;
}

function safeReportUrl(input: unknown): string {
  const fallback = `${BASE_URL}/dashboard`;
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 2048) return fallback;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fallback;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return fallback;
  if (parsed.username || parsed.password) return fallback;
  return parsed.toString();
}

function sanitizeSubject(input: unknown): string {
  const raw = typeof input === "string" ? input : "";
  const cleaned = raw
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 200 ? cleaned.slice(0, 200) : cleaned;
}

function firstNameOf(name: unknown): string {
  const raw = typeof name === "string" ? name.trim() : "";
  return raw.split(/\s+/)[0] || "there";
}

// Branded HTML email template
function buildEmailHtml(body: string, preheader?: string): string {
  const safePreheader = preheader ? escapeHtml(preheader) : "";
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
${safePreheader ? `<div style="display:none;max-height:0;overflow:hidden">${safePreheader}</div>` : ''}
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
  const firstName = escapeHtml(firstNameOf(name));
  const startUrl = escapeHtml(`${BASE_URL}/projects/new`);
  const body = `
    <h2>Welcome to Validifier, ${firstName}! 🎉</h2>
    <p>Validifier turns a business idea into a complete 15-section decision brief — typically in about 2–3 minutes.</p>
    <div class="highlight-box">
      <p>✅ <strong>Market and competitive analysis</strong> grounded in specific reasoning</p>
      <p>✅ <strong>Financial basics</strong> — startup costs, unit economics, business model</p>
      <p>✅ <strong>A 30-day action plan</strong> so you know what to do next</p>
    </div>
    <p>Ready to run your first report?</p>
    <a href="${startUrl}" class="cta">Start your first report →</a>
    <p style="color:#71717a;font-size:13px">Need help getting started? Just reply to this email — we're here to help.</p>
  `;
  return {
    subject: "Welcome to Validifier — Let's turn your idea into a decision",
    html: buildEmailHtml(body, "Welcome! Turn your first idea into a decision brief."),
    text: `Welcome to Validifier, ${firstNameOf(name)}!\n\nValidifier turns a business idea into a complete 15-section decision brief, typically in about 2–3 minutes.\n\n- Market and competitive analysis with specific reasoning\n- Financial basics: startup costs, unit economics, business model\n- A 30-day action plan for what to do next\n\nReady? Visit ${BASE_URL}/projects/new to start your first report.\n\n— The Validifier Team`,
  };
}

export function reportCompleteEmail(
  name: string,
  projectName: string,
  validationScore: number,
  topInsights: string[],
  reportUrl: string
): { subject: string; html: string; text: string } {
  const firstNameRaw = firstNameOf(name);
  const firstName = escapeHtml(firstNameRaw);
  const projectNameRaw = typeof projectName === "string" && projectName.trim().length > 0 ? projectName.trim().slice(0, 200) : "your idea";
  const projectNameSafe = escapeHtml(projectNameRaw);
  const scoreNum = clampInt(validationScore, 0, 100, 0);
  const scoreColor = scoreNum >= 70 ? '#16a34a' : scoreNum >= 40 ? '#ca8a04' : '#dc2626';
  const insightsList = Array.isArray(topInsights) ? topInsights.slice(0, 5) : [];
  const insightsHtml = insightsList
    .map((i) => `<p>• ${escapeHtml(typeof i === "string" ? i.slice(0, 500) : "")}</p>`)
    .join('');
  const safeUrl = escapeHtml(safeReportUrl(reportUrl));

  const body = `
    <h2>Your report for "${projectNameSafe}" is ready! 📊</h2>
    <p>Hey ${firstName}, your 15-section decision brief is generated. Here's a quick look:</p>
    <div class="highlight-box" style="text-align:center">
      <p style="font-size:13px;color:#71717a;margin-bottom:8px">VALIDATION SCORE</p>
      <p style="font-size:42px;font-weight:700;color:${scoreColor};margin:0">${scoreNum}/100</p>
    </div>
    ${insightsHtml ? `<h2>Top Insights</h2><div class="highlight-box">${insightsHtml}</div>` : ""}
    <a href="${safeUrl}" class="cta">View full report →</a>
    <p style="color:#71717a;font-size:13px">Your report includes market analysis, competitive landscape, financial basics, and a 30-day action plan.</p>
  `;
  return {
    subject: `Your report for "${projectNameRaw}" is ready`,
    html: buildEmailHtml(body, `Score: ${scoreNum}/100 — view your full report.`),
    text: `Your report for "${projectNameRaw}" is ready.\n\nValidation Score: ${scoreNum}/100\n\n${insightsList.length ? `Top Insights:\n${insightsList.map((i) => `- ${typeof i === "string" ? i : ""}`).join('\n')}\n\n` : ""}View full report: ${safeReportUrl(reportUrl)}\n\n— The Validifier Team`,
  };
}

export function creditsLowEmail(
  name: string,
  creditsUsed: number,
  creditsTotal: number
): { subject: string; html: string; text: string } {
  const firstNameRaw = firstNameOf(name);
  const firstName = escapeHtml(firstNameRaw);
  const total = clampInt(creditsTotal, 0, 1_000_000, 0);
  const used = clampInt(creditsUsed, 0, total, 0);
  const remaining = Math.max(0, total - used);
  const upgradeUrl = escapeHtml(`${BASE_URL}/pricing`);

  const body = `
    <h2>You're running low on credits ⚡</h2>
    <p>Hey ${firstName}, you've used ${used} of your ${total} monthly credits. You have <strong>${remaining} credits</strong> remaining.</p>
    <div class="highlight-box" style="text-align:center">
      <p style="font-size:13px;color:#71717a;margin-bottom:8px">CREDITS REMAINING</p>
      <p style="font-size:42px;font-weight:700;color:#ca8a04;margin:0">${remaining} / ${total}</p>
    </div>
    <p>Upgrade your plan to keep running full 15-section reports without interruption.</p>
    <a href="${upgradeUrl}" class="cta">Upgrade plan →</a>
    <p style="color:#71717a;font-size:13px">Credits reset on the 1st of each month.</p>
  `;
  return {
    subject: "You're running low on credits",
    html: buildEmailHtml(body, `${remaining} credits remaining — upgrade to keep running reports.`),
    text: `You're running low on credits.\n\nYou've used ${used} of ${total} credits. ${remaining} remaining.\n\nUpgrade at ${BASE_URL}/pricing\n\nCredits reset on the 1st of each month.\n\n— The Validifier Team`,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bearerToken = authHeader.replace('Bearer ', '');
    const isServiceRole = !!serviceKey && bearerToken === serviceKey;

    // If not service role, must be a valid user JWT
    let authedUserEmail: string | null = null;
    if (!isServiceRole) {
      const supabase = createClient(
        supabaseUrl,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data, error } = await supabase.auth.getUser(bearerToken);
      if (error || !data?.user?.email) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      authedUserEmail = data.user.email.toLowerCase();
    }

    const { to, subject, html, text, template, template_data } = await req.json();

    // Non-service callers can only email themselves (prevents phishing/spam abuse)
    if (!isServiceRole) {
      if (typeof to !== 'string' || to.toLowerCase() !== authedUserEmail) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: can only send email to your own address' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      // Restrict raw HTML sends — templates only for non-service callers
      if (!template) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: template required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

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

    // Sanitize final subject regardless of source (template or service-role raw).
    const finalSubject = sanitizeSubject(emailSubject);
    if (!finalSubject) {
      throw new Error('Invalid subject after sanitization');
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
        reply_to: 'support@validifier.com',
        subject: finalSubject,
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
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
