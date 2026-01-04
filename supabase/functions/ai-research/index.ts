import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchRequest {
  type: 'company_search' | 'company_custom' | 'persona';
  context: {
    company_name?: string;
    website?: string;
    first_name?: string;
    last_name?: string;
    job_title?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, context }: ResearchRequest = await req.json();
    console.log(`AI Research request: type=${type}, context=`, context);

    // Fetch the prompt configuration
    const { data: promptConfig, error: promptError } = await supabase
      .from('ai_prompts')
      .select('*')
      .eq('prompt_type', type)
      .single();

    if (promptError || !promptConfig) {
      console.error('Error fetching prompt config:', promptError);
      throw new Error(`Prompt configuration not found for type: ${type}`);
    }

    if (!promptConfig.enabled) {
      return new Response(JSON.stringify({ 
        error: 'This research type is currently disabled',
        disabled: true 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Replace placeholders in the prompt
    let prompt = promptConfig.prompt;
    prompt = prompt.replace('{company_name}', context.company_name || 'Unknown');
    prompt = prompt.replace('{website}', context.website || 'Not provided');
    prompt = prompt.replace('{first_name}', context.first_name || '');
    prompt = prompt.replace('{last_name}', context.last_name || '');
    prompt = prompt.replace('{job_title}', context.job_title || 'Unknown role');
    prompt = prompt.replace('{company}', context.company_name || 'Unknown company');

    console.log(`Using model: ${promptConfig.model}, prompt length: ${prompt.length}`);

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: promptConfig.model || 'sonar',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional business research assistant. Provide accurate, concise, and actionable information. Format your responses clearly with bullet points where appropriate.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No research results available.';
    const citations = data.citations || [];

    console.log(`Research complete. Content length: ${content.length}, Citations: ${citations.length}`);

    return new Response(JSON.stringify({ 
      content,
      citations,
      model: promptConfig.model,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Research error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
