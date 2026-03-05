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
    const { conversation_id, user_message, project_id } = await req.json();
    

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get user profile and check credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Rate limit: max 10 messages per minute per user
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentMsgCount } = await supabase
      .from('ai_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('operation_type', 'chat')
      .gte('created_at', oneMinuteAgo);

    if (recentMsgCount !== null && recentMsgCount >= 10) {
      return new Response(
        JSON.stringify({ error: "You're sending messages too quickly. Please wait a moment." }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '10' } }
      );
    }

    // Check credits (estimate 1 credit per chat message)
    const creditsNeeded = 1;
    if (profile.ai_credits_used + creditsNeeded > profile.ai_credits_monthly) {
      return new Response(
        JSON.stringify({ error: 'Insufficient AI credits. Please upgrade your plan.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load conversation history (last 20 messages)
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (messagesError) throw messagesError;

    // Load project and report data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project_id)
      .single();

    if (projectError) throw projectError;

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('project_id', project_id)
      .single();

    if (reportError) {
      
    }

    // Build conversation history for context
    const conversationHistory = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Cora'}: ${msg.content}`)
      .join('\n\n');

    // Build the prompt
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

FORMATTING RULES (CRITICAL):
- Do NOT use markdown formatting like **bold**, *italic*, # headers, or - bullet points
- Write in natural paragraphs with line breaks between sections
- Use numbered lists (1. 2. 3.) when listing items, not bullet points
- For emphasis, use CAPS sparingly or rephrase to make points clear naturally
- Keep your writing clean and readable without any special formatting characters

USER QUESTION:
${user_message}

RESPONSE:`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: systemPrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message.content;

    // Save assistant message to database
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id,
        role: 'assistant',
        content: assistantMessage,
      });

    if (insertError) {
      console.error('Error saving assistant message:', insertError);
    }

    // Update credits used
    const newCreditsUsed = profile.ai_credits_used + creditsNeeded;
    const { error: creditsError } = await supabase
      .from('profiles')
      .update({ ai_credits_used: newCreditsUsed })
      .eq('id', user.id);

    if (creditsError) {
      console.error('Error updating credits:', creditsError);
    }

    // Log AI usage
    await supabase.from('ai_usage_logs').insert({
      user_id: user.id,
      project_id,
      operation_type: 'chat',
      model_used: 'google/gemini-2.5-flash',
      tokens_used: aiData.usage?.total_tokens || 0,
      cost_cents: Math.ceil((aiData.usage?.total_tokens || 0) * 0.0001),
    });

    // Check if credits crossed 75% threshold — send low-credit email
    try {
      const usagePercent = (newCreditsUsed / profile.ai_credits_monthly) * 100;
      const prevPercent = (profile.ai_credits_used / profile.ai_credits_monthly) * 100;

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
                credits_total: profile.ai_credits_monthly,
              },
            }),
          });
        }
      }
    } catch (emailErr) {
      console.error('Failed to send credits email:', emailErr);
    }

    

    return new Response(
      JSON.stringify({ 
        success: true,
        message: assistantMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in chat-with-cora:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});