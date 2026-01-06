import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    const { originalPrompt, exampleOutput, userFeedback, availablePlaceholders } = await req.json();

    console.log('Refine prompt request:', {
      originalPromptLength: originalPrompt?.length,
      exampleOutputLength: exampleOutput?.length,
      feedbackLength: userFeedback?.length,
      placeholderCount: availablePlaceholders?.length
    });

    if (!originalPrompt || !userFeedback) {
      throw new Error('originalPrompt and userFeedback are required');
    }

    const systemPrompt = `You are an expert prompt engineer. Your task is to refine and improve AI prompts based on user feedback.

You will be given:
1. An original prompt template (which may contain placeholders like {company_name}, {seller_usps}, etc.)
2. An example output that was generated using this prompt
3. User feedback on what they want to change about the output

Your job is to modify the PROMPT TEMPLATE (not the output) so that future outputs will match the user's desired changes.

CRITICAL RULES:
- You MUST preserve all existing placeholders exactly as they appear (e.g., {company_name}, {seller_context}, etc.)
- You can add new placeholders ONLY from the available list provided
- Do NOT remove or rename any placeholders
- Focus on restructuring, rewording, or adding/removing instructions in the prompt
- The prompt should still be a template, not filled-in content

Available placeholders that can be used:
${availablePlaceholders?.join(', ') || 'None provided'}

Respond with a JSON object in this exact format:
{
  "refinedPrompt": "The improved prompt template with all placeholders preserved",
  "refinementSummary": ["Change 1 description", "Change 2 description", "..."],
  "diffHighlights": [
    {"before": "original text snippet", "after": "new text snippet"},
    {"before": "another original snippet", "after": "another new snippet"}
  ]
}

Keep refinementSummary concise - each item should be one short sentence.
diffHighlights should show 2-4 key changes for the user to review.`;

    const userMessage = `## Original Prompt Template:
${originalPrompt}

${exampleOutput ? `## Example Output Generated:
${exampleOutput}` : '(No example output provided)'}

## User Feedback:
${userFeedback}

Please refine the prompt template based on this feedback. Remember to preserve all placeholders.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250514',
        max_tokens: 4096,
        messages: [
          { role: 'user', content: userMessage }
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        model: 'claude-sonnet-4-5-20250514'
      });
      return new Response(JSON.stringify({ 
        error: `API Error: ${response.status} - ${errorText.substring(0, 200)}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Anthropic response received');

    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error('No content in Anthropic response');
    }

    // Parse the JSON response
    let result;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Anthropic response:', parseError);
      console.error('Raw content:', content);
      throw new Error('Failed to parse refinement response');
    }

    // Validate the result structure
    if (!result.refinedPrompt) {
      throw new Error('Invalid response: missing refinedPrompt');
    }

    // Ensure arrays exist
    result.refinementSummary = result.refinementSummary || [];
    result.diffHighlights = result.diffHighlights || [];

    console.log('Refinement successful:', {
      promptLength: result.refinedPrompt.length,
      summaryCount: result.refinementSummary.length,
      diffCount: result.diffHighlights.length
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in refine-prompt function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
