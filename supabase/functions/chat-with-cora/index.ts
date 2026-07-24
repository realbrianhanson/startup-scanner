import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { logOpsEvent } from "../_shared/ops.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json', ...extraHeaders },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: any;
    try { body = await req.json(); } catch { return jsonResponse({ error: 'Invalid JSON body' }, 400); }
    const { conversation_id, user_message, project_id } = body ?? {};

    // Input validation
    if (typeof user_message !== 'string') return jsonResponse({ error: 'user_message required' }, 400);
    const trimmed = user_message.trim();
    if (!trimmed) return jsonResponse({ error: 'user_message cannot be empty' }, 400);
    if (trimmed.length > 2000) return jsonResponse({ error: 'user_message exceeds 2000 characters' }, 400);
    if (typeof conversation_id !== 'string' || !UUID_RE.test(conversation_id)) {
      return jsonResponse({ error: 'conversation_id must be a valid UUID' }, 400);
    }
    if (typeof project_id !== 'string' || !UUID_RE.test(project_id)) {
      return jsonResponse({ error: 'project_id must be a valid UUID' }, 400);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization header' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonResponse({ error: 'Invalid user token' }, 401);

    // Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError || !profile) return jsonResponse({ error: 'Profile not found' }, 403);

    // Rate limit: max 10 messages per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentMsgCount } = await supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('operation_type', 'chat')
      .gte('created_at', oneMinuteAgo);
    if (recentMsgCount !== null && recentMsgCount >= 10) {
      return jsonResponse(
        { error: "You're sending messages too quickly. Please wait a moment." },
        429,
        { 'Retry-After': '10' },
      );
    }

    // Ownership: project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single();
    if (projectError || !project) {
      return jsonResponse({ error: 'Project not found or access denied' }, 403);
    }

    // Ownership: conversation belongs to project
    const { data: conv } = await supabase
      .from('chat_conversations')
      .select('id, project_id')
      .eq('id', conversation_id)
      .eq('project_id', project_id)
      .single();
    if (!conv) {
      return jsonResponse({ error: 'Conversation not found or access denied' }, 403);
    }

    // Atomically reserve credits (PRODUCT_FACTS.credits.chatMessage = 1)
    const creditsNeeded = 1;
    const { data: consumed, error: consumeErr } = await supabase.rpc('consume_ai_credits', {
      p_user_id: user.id,
      p_amount: creditsNeeded,
    });
    if (consumeErr) {
      console.error('consume_ai_credits error:', consumeErr);
      return jsonResponse({ error: 'Unable to reserve credits' }, 500);
    }
    const consumedRow = Array.isArray(consumed) ? consumed[0] : consumed;
    if (!consumedRow) {
      return jsonResponse({ error: 'Insufficient AI credits. Please upgrade your plan.' }, 402);
    }
    const newCreditsUsed: number = consumedRow.ai_credits_used;
    const monthlyCredits: number = consumedRow.ai_credits_monthly;

    const releaseCredits = async () => {
      try {
        const { error: releaseErr } = await supabase.rpc('release_ai_credits', {
          p_user_id: user.id,
          p_amount: creditsNeeded,
        });
        if (releaseErr) {
          console.error('release_ai_credits refund failed:', releaseErr);
        }
      } catch (e) {
        console.error('release_ai_credits failed:', e);
      }
    };

    // Load conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);
    if (messagesError) {
      await releaseCredits();
      return jsonResponse({ error: 'Unable to load conversation' }, 500);
    }

    // Load report data (ownership already verified above)
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', project_id)
      .single();

    const conversationHistory = (messages || [])
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Cora'}: ${msg.content}`)
      .join('\n\n');

    const rd = report?.report_data as Record<string, any> | null;
    const reportContext = rd
      ? `VALIDATION REPORT DATA:
Project: ${project.name}
Industry: ${project.industry}
Validation Score: ${project.validation_score || 'Pending'}

Executive Summary:
- Recommendation: ${rd.executive_summary?.recommendation || 'N/A'}
- Strengths: ${rd.executive_summary?.strengths?.join(', ') || 'N/A'}
- Concerns: ${rd.executive_summary?.concerns?.join(', ') || 'N/A'}

Market Analysis:
${JSON.stringify(rd.market_analysis || {}, null, 2)}

Competitive Landscape:
${JSON.stringify(rd.competitive_landscape || {}, null, 2)}

Strategic Frameworks (SWOT):
${JSON.stringify(rd.strategic_frameworks || {}, null, 2)}

Porter's Five Forces:
${JSON.stringify(rd.porter_five_forces || {}, null, 2)}

PESTEL Analysis:
${JSON.stringify(rd.pestel_analysis || {}, null, 2)}

CATWOE Analysis:
${JSON.stringify(rd.catwoe_analysis || {}, null, 2)}

Customer Personas:
${JSON.stringify(rd.customer_personas || {}, null, 2)}

Unique Selling Proposition (USP):
${JSON.stringify(rd.usp_analysis || {}, null, 2)}

Path to MVP:
${JSON.stringify(rd.path_to_mvp || {}, null, 2)}

Go-to-Market Strategy:
${JSON.stringify(rd.go_to_market_strategy || {}, null, 2)}

Financial Basics:
${JSON.stringify(rd.financial_basics || {}, null, 2)}
`
      : `PROJECT INFORMATION:
Project: ${project.name}
Industry: ${project.industry}
Description: ${project.description}
Note: Validation report is still being generated.`;

    const systemPrompt = `You are Cora, an expert business advisor helping first-time entrepreneurs validate their business ideas.

${reportContext}

${conversationHistory ? `CONVERSATION HISTORY:\n${conversationHistory}\n\n` : ''}

INSTRUCTIONS:
- Answer based on the validation report data above when available
- Be conversational, encouraging, and supportive - first-time entrepreneurs need confidence
- Cite specific sections of the report when relevant: "Based on your Market Analysis..."
- If the question requires new analysis not in the report, use your knowledge but be clear about speculation
- Keep responses concise (200-300 words max) unless the user asks for more detail
- Ask follow-up questions to help them think deeper
- Focus on actionable advice, not just theory
- Use occasional emojis for warmth (but not too many - 1-2 per response max)
- Be specific with numbers and data from the report when available
- If the report is still generating, acknowledge that and provide general guidance
- If the user seems stuck, overwhelmed, or is asking questions that would benefit from a live conversation (funding strategy, hiring, detailed implementation planning, legal/compliance questions), naturally mention that they can book a free strategy call for personalized help. Don't be pushy — mention it once, casually, like a helpful friend would. Only suggest this ONCE per conversation.

FORMATTING RULES (CRITICAL):
- Do NOT use markdown formatting like **bold**, *italic*, # headers, or - bullet points
- Write in natural paragraphs with line breaks between sections
- Use numbered lists (1. 2. 3.) when listing items, not bullet points
- For emphasis, use CAPS sparingly or rephrase to make points clear naturally
- Keep your writing clean and readable without any special formatting characters

USER QUESTION:
${trimmed}

RESPONSE:`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      await releaseCredits();
      return jsonResponse({ error: 'AI service not configured' }, 500);
    }

    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content: systemPrompt }],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });
    } catch (fetchErr) {
      console.error('AI fetch failed:', fetchErr);
      await releaseCredits();
      return jsonResponse({ error: 'AI service is unreachable. Please try again.' }, 502);
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text().catch(() => '');
      console.error('AI API error:', aiResponse.status, errorText);
      await releaseCredits();
      if (aiResponse.status === 429) {
        return jsonResponse({ error: 'AI service is busy. Please try again in a moment.' }, 429);
      }
      if (aiResponse.status === 402) {
        return jsonResponse({ error: 'AI credits exhausted upstream.' }, 402);
      }
      return jsonResponse({ error: 'AI service error. Please try again.' }, 502);
    }

    let aiData: any;
    try {
      aiData = await aiResponse.json();
    } catch (parseErr) {
      console.error('AI response JSON parse failed:', parseErr);
      await releaseCredits();
      return jsonResponse({ error: 'AI service error. Please try again.' }, 502);
    }
    const assistantMessage: string = aiData?.choices?.[0]?.message?.content ?? '';
    if (!assistantMessage || !assistantMessage.trim()) {
      await releaseCredits();
      return jsonResponse({ error: 'AI service returned an empty response. Please try again.' }, 502);
    }

    // Persist assistant message; if it fails, still return a stable object
    const { data: savedRow, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: assistantMessage,
      })
      .select('id, role, content, created_at')
      .single();

    let assistantRecord: { id: string; role: string; content: string; created_at: string };
    if (insertError || !savedRow) {
      console.error('Error saving assistant message:', insertError);
      assistantRecord = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantMessage,
        created_at: new Date().toISOString(),
      };
    } else {
      assistantRecord = savedRow as typeof assistantRecord;
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      project_id,
      operation_type: 'chat',
      model_used: 'google/gemini-3-flash-preview',
      tokens_used: aiData.usage?.total_tokens || 0,
      cost_cents: Math.ceil((aiData.usage?.total_tokens || 0) * 0.0001),
    });

    // 75% credit-threshold email
    try {
      const usagePercent = (newCreditsUsed / monthlyCredits) * 100;
      const prevPercent = ((newCreditsUsed - creditsNeeded) / monthlyCredits) * 100;
      if (usagePercent >= 75 && prevPercent < 75 && profile.email_notifications_enabled !== false) {
        const notifPrefs = profile.notification_preferences as Record<string, boolean> | null;
        if (!notifPrefs || notifPrefs.credit_alerts !== false) {
          const sendEmailUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`;
          await fetch(sendEmailUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
            body: JSON.stringify({
              to: profile.email,
              template: 'credits_low',
              template_data: {
                name: profile.full_name || profile.email,
                credits_used: newCreditsUsed,
                credits_total: monthlyCredits,
              },
            }),
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send credits email:', emailErr);
    }

    return jsonResponse({
      success: true,
      message: assistantMessage,
      assistant_message: assistantRecord,
    }, 200);

  } catch (error) {
    console.error('Error in chat-with-cora:', error);
    try {
      const url = Deno.env.get('SUPABASE_URL');
      const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (url && key) {
        const s = createClient(url, key);
        await logOpsEvent(s, {
          severity: "warning",
          category: "chat",
          event_name: "chat_failed",
          function_name: "chat-with-cora",
          error_code: "unhandled_exception",
        });
      }
    } catch { /* ignore */ }
    return jsonResponse({ error: 'Something went wrong. Please try again.' }, 500);
  }
});