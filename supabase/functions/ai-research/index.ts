import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

interface AIResponse {
  content: string;
  citations?: string[];
}

// Parse model string to extract provider and model name
function parseModel(modelString: string): { provider: 'perplexity' | 'openai'; model: string } {
  if (modelString.startsWith('openai:')) {
    return { provider: 'openai', model: modelString.replace('openai:', '') };
  }
  if (modelString.startsWith('perplexity:')) {
    return { provider: 'perplexity', model: modelString.replace('perplexity:', '') };
  }
  // Default to perplexity for legacy models without prefix
  return { provider: 'perplexity', model: modelString };
}

// Call Perplexity API
async function callPerplexity(prompt: string, model: string, apiKey: string): Promise<AIResponse> {
  console.log(`Calling Perplexity API with model: ${model}`);
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
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
  return {
    content: data.choices?.[0]?.message?.content || 'No research results available.',
    citations: data.citations || [],
  };
}

// Call OpenAI API
async function callOpenAI(prompt: string, model: string, apiKey: string): Promise<AIResponse> {
  console.log(`Calling OpenAI API with model: ${model}`);
  
  // Determine if this is a newer model that uses different parameters
  const isNewerModel = model.includes('gpt-5') || model.includes('gpt-4.1') || model.includes('o3') || model.includes('o4');
  
  const requestBody: Record<string, unknown> = {
    model: model,
    messages: [
      { 
        role: 'system', 
        content: 'You are a professional business research assistant. Provide accurate, concise, and actionable information. Format your responses clearly with bullet points where appropriate. Since you do not have real-time web access, focus on providing relevant insights based on your knowledge.' 
      },
      { role: 'user', content: prompt }
    ],
  };

  // Newer models use max_completion_tokens and don't support temperature
  if (isNewerModel) {
    requestBody.max_completion_tokens = 1500;
  } else {
    requestBody.max_tokens = 1500;
    requestBody.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || 'No research results available.',
    // OpenAI doesn't provide citations
  };
}

// Get seller company context
async function getSellerContext(supabase: any): Promise<string> {
  try {
    const { data } = await supabase
      .from('seller_company')
      .select('*')
      .limit(1)
      .single();

    if (!data) return '';

    const parts = [];
    if (data.company_name) parts.push(`Our company: ${data.company_name}`);
    if (data.website) parts.push(`Website: ${data.website}`);
    if (data.product_offering) parts.push(`Product/Service: ${data.product_offering}`);
    if (data.usps) parts.push(`USPs: ${data.usps}`);
    if (data.industry) parts.push(`Industry: ${data.industry}`);
    if (data.target_audience) parts.push(`Target audience: ${data.target_audience}`);
    if (data.pain_points_solved) parts.push(`Pain points we solve: ${data.pain_points_solved}`);
    if (data.product_sets) parts.push(`Product sets: ${data.product_sets}`);
    if (data.tone_style) parts.push(`Communication style: ${data.tone_style}`);

    return parts.length > 0 ? `About our company (the seller):\n${parts.join('\n')}` : '';
  } catch {
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

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

    // Parse the model to determine provider
    const { provider, model } = parseModel(promptConfig.model || 'perplexity:sonar');
    console.log(`Using provider: ${provider}, model: ${model}`);

    // Check for required API key
    if (provider === 'perplexity' && !PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not configured');
    }
    if (provider === 'openai' && !OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Get seller context for injection
    const sellerContext = await getSellerContext(supabase);

    // Replace placeholders in the prompt
    let prompt = promptConfig.prompt;
    prompt = prompt.replace('{company_name}', context.company_name || 'Unknown');
    prompt = prompt.replace('{website}', context.website || 'Not provided');
    prompt = prompt.replace('{first_name}', context.first_name || '');
    prompt = prompt.replace('{last_name}', context.last_name || '');
    prompt = prompt.replace('{job_title}', context.job_title || 'Unknown role');
    prompt = prompt.replace('{company}', context.company_name || 'Unknown company');
    prompt = prompt.replace('{seller_context}', sellerContext);

    console.log(`Prompt length: ${prompt.length}`);

    // Call the appropriate AI provider
    let result: AIResponse;
    if (provider === 'openai') {
      result = await callOpenAI(prompt, model, OPENAI_API_KEY!);
    } else {
      result = await callPerplexity(prompt, model, PERPLEXITY_API_KEY!);
    }

    console.log(`Research complete. Content length: ${result.content.length}, Citations: ${result.citations?.length || 0}`);

    return new Response(JSON.stringify({ 
      content: result.content,
      citations: result.citations || [],
      model: promptConfig.model,
      provider: provider,
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
