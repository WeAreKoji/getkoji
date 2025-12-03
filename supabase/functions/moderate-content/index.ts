import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-moderation-secret",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MODERATE-CONTENT] ${step}${detailsStr}`);
};

// Validate the moderation secret for internal/cron calls
const validateModerationSecret = (req: Request): boolean => {
  const secret = req.headers.get("x-moderation-secret");
  const expectedSecret = Deno.env.get("MODERATION_SECRET");
  
  // If no secret is configured, reject all requests (fail secure)
  if (!expectedSecret) {
    logStep("WARNING: MODERATION_SECRET not configured - rejecting request");
    return false;
  }
  
  return secret === expectedSecret;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Validate the request has the correct secret
    if (!validateModerationSecret(req)) {
      logStep("Unauthorized request - invalid or missing moderation secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { content, contentType, contentId } = await req.json();
    
    // Basic input validation
    if (!content || typeof content !== 'string' || content.length > 50000) {
      return new Response(JSON.stringify({ error: "Invalid content" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    if (!contentType || !['post', 'message', 'profile', 'comment'].includes(contentType)) {
      return new Response(JSON.stringify({ error: "Invalid content type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    if (!contentId || typeof contentId !== 'string') {
      return new Response(JSON.stringify({ error: "Invalid content ID" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    logStep("Analyzing content", { contentType, contentId });

    // AI moderation prompt
    const systemPrompt = `You are a content moderation AI. Analyze the following content for:
- NSFW content (nudity, sexual content)
- Violence or gore
- Hate speech or discrimination
- Spam or scam attempts
- Toxicity or harassment

Respond with a JSON object containing:
{
  "flags": ["nsfw", "violence", "hate_speech", "spam", "toxicity"],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "severity": "low|medium|high|critical",
  "recommended_action": "none|require_review|auto_remove"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this content: ${content}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "flag_content",
            description: "Flag content with moderation results",
            parameters: {
              type: "object",
              properties: {
                flags: {
                  type: "array",
                  items: { type: "string" },
                  description: "Types of violations detected"
                },
                confidence: {
                  type: "number",
                  description: "Confidence score 0-1"
                },
                reasoning: {
                  type: "string",
                  description: "Brief explanation"
                },
                severity: {
                  type: "string",
                  enum: ["low", "medium", "high", "critical"]
                },
                recommended_action: {
                  type: "string",
                  enum: ["none", "require_review", "auto_remove"]
                }
              },
              required: ["flags", "confidence", "reasoning", "severity", "recommended_action"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "flag_content" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("AI API error", { status: response.status, error: errorText });
      throw new Error(`AI moderation failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      logStep("No tool call in response");
      return new Response(JSON.stringify({ safe: true, analysis: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    logStep("AI analysis complete", analysis);

    // Create flags if violations detected
    if (analysis.flags.length > 0 && analysis.confidence > 0.5) {
      for (const flagType of analysis.flags) {
        await supabaseClient.rpc("create_content_flag", {
          _content_type: contentType,
          _content_id: contentId,
          _flag_type: flagType,
          _confidence_score: analysis.confidence,
          _ai_analysis: analysis,
          _auto_action: analysis.recommended_action,
        });
      }
      logStep("Flags created");
    }

    return new Response(JSON.stringify({
      safe: analysis.flags.length === 0 || analysis.confidence < 0.7,
      analysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
