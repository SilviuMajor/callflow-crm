import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface PromptRefinement {
  id: string;
  prompt_type: string;
  original_prompt: string;
  refined_prompt: string;
  feedback: string;
  refinement_summary: string[];
  sample_contact_id: string | null;
  example_output: string | null;
  created_at: string;
}

interface RefinementResult {
  refinedPrompt: string;
  refinementSummary: string[];
  diffHighlights: { before: string; after: string }[];
}

export function usePromptRefinements(promptType: string) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [refinements, setRefinements] = useState<PromptRefinement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  const fetchRefinements = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('prompt_refinements')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('prompt_type', promptType)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Parse refinement_summary from JSON if needed
      const parsed: PromptRefinement[] = (data || []).map(r => ({
        id: r.id,
        prompt_type: r.prompt_type,
        original_prompt: r.original_prompt,
        refined_prompt: r.refined_prompt,
        feedback: r.feedback,
        refinement_summary: Array.isArray(r.refinement_summary) 
          ? (r.refinement_summary as unknown as string[])
          : [],
        sample_contact_id: r.sample_contact_id,
        example_output: r.example_output,
        created_at: r.created_at
      }));

      setRefinements(parsed);
    } catch (error) {
      console.error('Error fetching refinements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [promptType, organizationId]);

  const refinePrompt = useCallback(async (
    originalPrompt: string,
    exampleOutput: string | null,
    userFeedback: string,
    availablePlaceholders: string[]
  ): Promise<RefinementResult | null> => {
    setIsRefining(true);
    try {
      const { data, error } = await supabase.functions.invoke('refine-prompt', {
        body: {
          originalPrompt,
          exampleOutput,
          userFeedback,
          availablePlaceholders
        }
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      return {
        refinedPrompt: data.refinedPrompt,
        refinementSummary: data.refinementSummary || [],
        diffHighlights: data.diffHighlights || []
      };
    } catch (error) {
      console.error('Error refining prompt:', error);
      toast.error('Failed to refine prompt. Please try again.');
      return null;
    } finally {
      setIsRefining(false);
    }
  }, []);

  const saveRefinement = useCallback(async (
    originalPrompt: string,
    refinedPrompt: string,
    feedback: string,
    refinementSummary: string[],
    sampleContactId: string | null,
    exampleOutput: string | null
  ) => {
    if (!organizationId) return null;
    
    try {
      const { data, error } = await supabase
        .from('prompt_refinements')
        .insert({
          prompt_type: promptType,
          original_prompt: originalPrompt,
          refined_prompt: refinedPrompt,
          feedback,
          refinement_summary: refinementSummary,
          sample_contact_id: sampleContactId,
          example_output: exampleOutput,
          organization_id: organizationId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setRefinements(prev => [{
        ...data,
        refinement_summary: refinementSummary
      }, ...prev]);

      return data;
    } catch (error) {
      console.error('Error saving refinement:', error);
      toast.error('Failed to save refinement history');
      return null;
    }
  }, [promptType, organizationId]);

  const deleteRefinement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompt_refinements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRefinements(prev => prev.filter(r => r.id !== id));
      toast.success('Refinement deleted');
    } catch (error) {
      console.error('Error deleting refinement:', error);
      toast.error('Failed to delete refinement');
    }
  }, []);

  return {
    refinements,
    isLoading,
    isRefining,
    fetchRefinements,
    refinePrompt,
    saveRefinement,
    deleteRefinement
  };
}
