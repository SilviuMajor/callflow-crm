import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Contact } from '@/types/contact';

interface ResearchResult {
  content: string;
  citations: string[];
  model: string;
  timestamp: string;
}

export function useAIResearch() {
  const [isResearching, setIsResearching] = useState<Record<string, boolean>>({});

  const setResearchingState = (key: string, value: boolean) => {
    setIsResearching(prev => ({ ...prev, [key]: value }));
  };

  const callResearchFunction = async (
    type: 'company_search' | 'company_custom' | 'persona',
    context: Record<string, string | undefined>
  ): Promise<ResearchResult> => {
    const { data, error } = await supabase.functions.invoke('ai-research', {
      body: { type, context }
    });

    if (error) throw error;
    if (data.error) throw new Error(data.error);
    
    return data;
  };

  const researchCompany = useCallback(async (
    companyName: string, 
    website?: string
  ): Promise<string | null> => {
    const key = `company_${companyName}`;
    setResearchingState(key, true);
    
    try {
      const result = await callResearchFunction('company_search', {
        company_name: companyName,
        website: website || undefined,
      });

      // Update company_data with the research
      const { data: existingData } = await supabase
        .from('company_data')
        .select('id')
        .eq('company_name', companyName)
        .single();

      if (existingData) {
        await supabase
          .from('company_data')
          .update({ 
            ai_summary: result.content,
            ai_summary_updated_at: new Date().toISOString()
          })
          .eq('company_name', companyName);
      } else {
        await supabase
          .from('company_data')
          .insert({ 
            company_name: companyName,
            field_values: {},
            ai_summary: result.content,
            ai_summary_updated_at: new Date().toISOString()
          });
      }

      toast.success('Company research complete');
      return result.content;
    } catch (error) {
      console.error('Company research error:', error);
      toast.error('Failed to research company');
      return null;
    } finally {
      setResearchingState(key, false);
    }
  }, []);

  const researchCompanyCustom = useCallback(async (
    companyName: string,
    website?: string
  ): Promise<string | null> => {
    const key = `custom_${companyName}`;
    setResearchingState(key, true);
    
    try {
      const result = await callResearchFunction('company_custom', {
        company_name: companyName,
        website: website || undefined,
      });

      // Update company_data with the custom research
      const { data: existingData } = await supabase
        .from('company_data')
        .select('id')
        .eq('company_name', companyName)
        .single();

      if (existingData) {
        await supabase
          .from('company_data')
          .update({ 
            ai_custom_research: result.content,
            ai_custom_updated_at: new Date().toISOString()
          })
          .eq('company_name', companyName);
      } else {
        await supabase
          .from('company_data')
          .insert({ 
            company_name: companyName,
            field_values: {},
            ai_custom_research: result.content,
            ai_custom_updated_at: new Date().toISOString()
          });
      }

      toast.success('Custom research complete');
      return result.content;
    } catch (error) {
      console.error('Custom research error:', error);
      toast.error('Failed to run custom research');
      return null;
    } finally {
      setResearchingState(key, false);
    }
  }, []);

  const researchPersona = useCallback(async (
    contact: Contact
  ): Promise<string | null> => {
    const key = `persona_${contact.id}`;
    setResearchingState(key, true);
    
    try {
      const result = await callResearchFunction('persona', {
        first_name: contact.firstName,
        last_name: contact.lastName,
        job_title: contact.jobTitle || undefined,
        company_name: contact.company,
      });

      // Update contact with the persona research
      await supabase
        .from('contacts')
        .update({ 
          ai_persona: result.content,
          ai_persona_updated_at: new Date().toISOString()
        })
        .eq('id', contact.id);

      toast.success('Persona research complete');
      return result.content;
    } catch (error) {
      console.error('Persona research error:', error);
      toast.error('Failed to research persona');
      return null;
    } finally {
      setResearchingState(key, false);
    }
  }, []);

  return {
    isResearching,
    researchCompany,
    researchCompanyCustom,
    researchPersona,
  };
}
