import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { prompt, availablePlaceholders } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('Improving prompt with', availablePlaceholders?.length || 0, 'available placeholders');

    const systemPrompt = `You are an expert at writing clear, well-structured AI prompts for sales and research purposes.

Your task is to improve the given prompt template while:
1. PRESERVING all existing placeholders exactly as they are (e.g., {company_name}, {seller_usps}) - do not remove, rename, or modify any placeholder
2. Improving clarity, organization, and logical structure of instructions
3. Breaking down complex requests into clear numbered sections when appropriate
4. Making output requests more specific and actionable
5. Removing redundancy and improving conciseness
6. Ensuring the prompt flows logically from context to request to expected output

Available placeholders that can be used (but don't add new ones unless they improve the prompt significantly): ${availablePlaceholders?.join(', ') || 'None specified'}

Return ONLY the improved prompt text. Do not add any explanations, comments, or metadata.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Improve this prompt template:\n\n${prompt}` }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedPrompt = data.choices[0]?.message?.content;

    if (!improvedPrompt) {
      throw new Error('No response from OpenAI');
    }

    console.log('Successfully improved prompt');

    return new Response(JSON.stringify({ improvedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in improve-prompt function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
