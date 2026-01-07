import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateScriptRequest {
  contact_id: string;
  script_id?: string;
}

// Helper function to log credit usage
async function logCreditUsage(
  supabase: any,
  featureType: string,
  contactId?: string | null,
  companyId?: string | null,
  metadata?: Record<string, any>
) {
  try {
    await supabase.from('ai_credits_usage').insert({
      feature_type: featureType,
      credits_used: 1,
      contact_id: contactId || null,
      company_id: companyId || null,
      metadata: metadata || {},
    });
    console.log(`Credit logged for ${featureType}`);
  } catch (e) {
    console.error('Failed to log credit:', e);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const { contact_id, script_id }: GenerateScriptRequest = await req.json();
    console.log(`Generate script for contact: ${contact_id}, script_id: ${script_id || 'default'}`);

    // Fetch contact data
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      throw new Error('Contact not found');
    }

    // Fetch script template - use provided script_id or get default
    let scriptTemplate;
    if (script_id) {
      const { data, error } = await supabase
        .from('ai_scripts')
        .select('*')
        .eq('id', script_id)
        .single();
      if (error || !data) {
        throw new Error('Script template not found');
      }
      scriptTemplate = data;
    } else {
      // Get default script or first script
      const { data: defaultScript } = await supabase
        .from('ai_scripts')
        .select('*')
        .eq('is_default', true)
        .limit(1)
        .single();
      
      if (defaultScript) {
        scriptTemplate = defaultScript;
      } else {
        const { data: firstScript, error } = await supabase
          .from('ai_scripts')
          .select('*')
          .limit(1)
          .single();
        if (error || !firstScript) {
          throw new Error('No script template found');
        }
        scriptTemplate = firstScript;
      }
    }

    if (!scriptTemplate.enabled) {
      return new Response(JSON.stringify({ error: 'Script generation is disabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch company data
    let companyData = null;
    if (contact.company) {
      const { data } = await supabase
        .from('company_data')
        .select('*')
        .eq('company_name', contact.company)
        .single();
      companyData = data;
    }

    // Fetch seller company data
    const { data: sellerData } = await supabase
      .from('seller_company')
      .select('*')
      .limit(1)
      .single();

    // Check if we need to auto-generate dependencies
    const template = scriptTemplate.template;
    const needsCompanyResearch = template.includes('{company_research}');
    const needsPersona = template.includes('{contact_persona}');

    let companyResearch = companyData?.ai_summary || null;
    let contactPersona = contact.ai_persona || null;

    // Auto-generate company research if needed and missing
    if (needsCompanyResearch && !companyResearch && contact.company && LOVABLE_API_KEY) {
      console.log('Auto-generating company research...');
      try {
        const researchPrompt = `Research the company ${contact.company}. ${contact.website ? `Their website is ${contact.website}.` : ''}
Provide a comprehensive overview including:
1. What the company does and their main products/services
2. Their target market and customers
3. Company size and notable information
4. Recent news or developments
Keep the response concise but informative.`;

        const researchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a professional business research assistant. Provide accurate, concise information.' },
              { role: 'user', content: researchPrompt }
            ],
          }),
        });

        if (researchResponse.ok) {
          const researchData = await researchResponse.json();
          companyResearch = researchData.choices?.[0]?.message?.content || null;
          
          // Save to database
          if (companyResearch) {
            if (companyData) {
              await supabase
                .from('company_data')
                .update({ ai_summary: companyResearch, ai_summary_updated_at: new Date().toISOString() })
                .eq('company_name', contact.company);
            } else {
              await supabase
                .from('company_data')
                .insert({ company_name: contact.company, field_values: {}, ai_summary: companyResearch, ai_summary_updated_at: new Date().toISOString() });
            }
          }
        }
      } catch (e) {
        console.error('Failed to auto-generate company research:', e);
      }
    }

    // Auto-generate persona if needed and missing
    if (needsPersona && !contactPersona && LOVABLE_API_KEY) {
      console.log('Auto-generating contact persona...');
      try {
        const personaPrompt = `Research ${contact.first_name} ${contact.last_name}, ${contact.job_title || 'professional'} at ${contact.company}.
Provide insights on:
1. Their likely responsibilities and priorities
2. Common challenges for someone in their role
3. How to build rapport with them
4. Suggested approach for the conversation
Keep the response focused and actionable.`;

        const personaResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a professional business research assistant. Provide accurate, concise information.' },
              { role: 'user', content: personaPrompt }
            ],
          }),
        });

        if (personaResponse.ok) {
          const personaData = await personaResponse.json();
          contactPersona = personaData.choices?.[0]?.message?.content || null;
          
          // Save to database
          if (contactPersona) {
            await supabase
              .from('contacts')
              .update({ ai_persona: contactPersona, ai_persona_updated_at: new Date().toISOString() })
              .eq('id', contact_id);
          }
        }
      } catch (e) {
        console.error('Failed to auto-generate persona:', e);
      }
    }

    // Now replace all placeholders
    let processedTemplate = template;

    // Contact fields
    processedTemplate = processedTemplate.replace(/\{first_name\}/g, contact.first_name || '');
    processedTemplate = processedTemplate.replace(/\{last_name\}/g, contact.last_name || '');
    processedTemplate = processedTemplate.replace(/\{job_title\}/g, contact.job_title || '');
    processedTemplate = processedTemplate.replace(/\{company\}/g, contact.company || '');
    processedTemplate = processedTemplate.replace(/\{company_name\}/g, contact.company || '');
    processedTemplate = processedTemplate.replace(/\{website\}/g, contact.website || '');
    processedTemplate = processedTemplate.replace(/\{email\}/g, contact.email || '');
    processedTemplate = processedTemplate.replace(/\{phone\}/g, contact.phone || '');

    // Custom contact fields
    const customFields = contact.custom_fields || {};
    for (const [key, value] of Object.entries(customFields)) {
      processedTemplate = processedTemplate.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value || ''));
    }

    // AI Research results
    processedTemplate = processedTemplate.replace(/\{company_research\}/g, companyResearch || '[No company research available]');
    processedTemplate = processedTemplate.replace(/\{contact_persona\}/g, contactPersona || '[No persona available]');

    // Seller fields
    if (sellerData) {
      processedTemplate = processedTemplate.replace(/\{seller_company_name\}/g, sellerData.company_name || '');
      processedTemplate = processedTemplate.replace(/\{seller_website\}/g, sellerData.website || '');
      processedTemplate = processedTemplate.replace(/\{seller_product_offering\}/g, sellerData.product_offering || '');
      processedTemplate = processedTemplate.replace(/\{seller_usps\}/g, sellerData.usps || '');
      processedTemplate = processedTemplate.replace(/\{seller_industry\}/g, sellerData.industry || '');
      processedTemplate = processedTemplate.replace(/\{seller_target_audience\}/g, sellerData.target_audience || '');
      processedTemplate = processedTemplate.replace(/\{seller_tone_style\}/g, sellerData.tone_style || '');
      processedTemplate = processedTemplate.replace(/\{seller_pain_points_solved\}/g, sellerData.pain_points_solved || '');
      
      // Custom seller fields
      const sellerCustomFields = sellerData.custom_fields || {};
      for (const [key, value] of Object.entries(sellerCustomFields)) {
        processedTemplate = processedTemplate.replace(new RegExp(`\\{seller_${key}\\}`, 'g'), String(value || ''));
      }
    }

    // Extract AI blocks and prepare for single AI call
    const aiBlockRegex = /\{\{AI_BLOCK:([^}]+)\}\}/g;
    const aiBlocks: { match: string; instruction: string }[] = [];
    let match;
    while ((match = aiBlockRegex.exec(processedTemplate)) !== null) {
      aiBlocks.push({ match: match[0], instruction: match[1] });
    }

    // If there are AI blocks, process them with a single AI call
    if (aiBlocks.length > 0 && LOVABLE_API_KEY) {
      console.log(`Processing ${aiBlocks.length} AI blocks...`);

      const contextInfo = `
Contact: ${contact.first_name} ${contact.last_name}
Job Title: ${contact.job_title || 'Unknown'}
Company: ${contact.company}
${contact.website ? `Website: ${contact.website}` : ''}

${companyResearch ? `Company Research:\n${companyResearch}\n` : ''}
${contactPersona ? `Contact Persona:\n${contactPersona}\n` : ''}
${sellerData ? `
Our Company: ${sellerData.company_name}
Our Product: ${sellerData.product_offering || 'Not specified'}
Our USPs: ${sellerData.usps || 'Not specified'}
Pain Points We Solve: ${sellerData.pain_points_solved || 'Not specified'}
Target Audience: ${sellerData.target_audience || 'Not specified'}
Communication Style: ${sellerData.tone_style || 'Professional'}
` : ''}`;

      const blockInstructions = aiBlocks.map((block, i) => 
        `BLOCK ${i + 1}: ${block.instruction}`
      ).join('\n\n');

      const aiPrompt = `You are generating content for a sales call script. Generate personalized content for each block below.

CONTEXT:
${contextInfo}

INSTRUCTIONS FOR EACH BLOCK:
${blockInstructions}

IMPORTANT:
- Generate content for each block that fits naturally in a phone conversation
- Keep each response concise and conversational
- Number your responses as "BLOCK 1:", "BLOCK 2:", etc.
- Do not include any preamble or explanation, just the content for each block`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a professional sales script writer. Generate natural, conversational content.' },
              { role: 'user', content: aiPrompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const generatedContent = aiData.choices?.[0]?.message?.content || '';
          
          // Parse the response to extract each block's content
          for (let i = 0; i < aiBlocks.length; i++) {
            const blockPattern = new RegExp(`BLOCK ${i + 1}:([\\s\\S]*?)(?=BLOCK ${i + 2}:|$)`, 'i');
            const blockMatch = generatedContent.match(blockPattern);
            const blockContent = blockMatch ? blockMatch[1].trim() : '[AI generation failed]';
            processedTemplate = processedTemplate.replace(aiBlocks[i].match, blockContent);
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('AI response error:', aiResponse.status, errorText);
          // Replace blocks with error message
          for (const block of aiBlocks) {
            processedTemplate = processedTemplate.replace(block.match, '[AI generation failed - please try again]');
          }
        }
      } catch (e) {
        console.error('Failed to generate AI blocks:', e);
        for (const block of aiBlocks) {
          processedTemplate = processedTemplate.replace(block.match, '[AI generation failed - please try again]');
        }
      }
    } else if (aiBlocks.length > 0) {
      // No API key, replace with placeholder
      for (const block of aiBlocks) {
        processedTemplate = processedTemplate.replace(block.match, '[AI block - API key required]');
      }
    }

    // Save generated script to contact
    await supabase
      .from('contacts')
      .update({
        ai_script: processedTemplate,
        ai_script_updated_at: new Date().toISOString(),
        ai_script_id: scriptTemplate.id,
      })
      .eq('id', contact_id);

    // Log credit usage for script generation
    await logCreditUsage(supabase, 'script_generation', contact_id, null, {
      script_id: scriptTemplate.id,
      script_name: scriptTemplate.name,
    });

    console.log('Script generated successfully');

    return new Response(JSON.stringify({
      script: processedTemplate,
      timestamp: new Date().toISOString(),
      scriptId: scriptTemplate.id,
      autoGenerated: {
        companyResearch: needsCompanyResearch && !companyData?.ai_summary,
        persona: needsPersona && !contact.ai_persona,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Generate script error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
