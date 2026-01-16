import { useState, useCallback, useEffect } from 'react';
import { QualifyingQuestion } from '@/types/contact';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useQualifyingQuestions() {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  
  const [questions, setQuestions] = useState<QualifyingQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load questions from database
  useEffect(() => {
    const loadQuestions = async () => {
      if (!organizationId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const { data, error } = await supabase
        .from('qualifying_questions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('Error loading qualifying questions:', error);
        toast.error('Failed to load qualifying questions');
      } else if (data) {
        const mappedQuestions: QualifyingQuestion[] = data.map(row => ({
          id: row.id,
          label: row.question,
          type: row.type as QualifyingQuestion['type'],
          options: row.options || undefined,
          order: row.question_order,
          isArchived: false, // Database doesn't have archive for questions
        }));
        setQuestions(mappedQuestions);
      }
      setIsLoading(false);
    };

    loadQuestions();
  }, [organizationId]);

  const addQuestion = useCallback(async (question: Omit<QualifyingQuestion, 'id' | 'order'>) => {
    if (!organizationId) return '';
    
    const newOrder = questions.length;
    
    const { data, error } = await supabase
      .from('qualifying_questions')
      .insert({
        question: question.label,
        type: question.type,
        options: question.options || null,
        question_order: newOrder,
        organization_id: organizationId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding qualifying question:', error);
      toast.error('Failed to add question');
      return '';
    }

    if (data) {
      const newQuestion: QualifyingQuestion = {
        id: data.id,
        label: data.question,
        type: data.type as QualifyingQuestion['type'],
        options: data.options || undefined,
        order: data.question_order,
        isArchived: false,
      };
      setQuestions(prev => [...prev, newQuestion]);
      return data.id;
    }
    return '';
  }, [questions.length, organizationId]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<Omit<QualifyingQuestion, 'id'>>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));

    const dbUpdates: Record<string, any> = {};
    if (updates.label !== undefined) dbUpdates.question = updates.label;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.options !== undefined) dbUpdates.options = updates.options || null;
    if (updates.order !== undefined) dbUpdates.question_order = updates.order;

    const { error } = await supabase
      .from('qualifying_questions')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating qualifying question:', error);
      toast.error('Failed to update question');
    }
  }, []);

  const deleteQuestion = useCallback(async (id: string) => {
    const filtered = questions.filter(q => q.id !== id);
    const reordered = filtered.map((q, index) => ({ ...q, order: index }));
    setQuestions(reordered);

    const { error } = await supabase
      .from('qualifying_questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting qualifying question:', error);
      toast.error('Failed to delete question');
    }

    // Update orders for remaining questions
    for (const question of reordered) {
      await supabase
        .from('qualifying_questions')
        .update({ question_order: question.order })
        .eq('id', question.id);
    }
  }, [questions]);

  const reorderQuestions = useCallback(async (newOrder: string[]) => {
    const questionMap = new Map(questions.map(q => [q.id, q]));
    const reordered = newOrder.map((id, index) => ({
      ...questionMap.get(id)!,
      order: index,
    }));
    setQuestions(reordered);

    // Update orders in database
    for (let i = 0; i < newOrder.length; i++) {
      await supabase
        .from('qualifying_questions')
        .update({ question_order: i })
        .eq('id', newOrder[i]);
    }
  }, [questions]);

  return {
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    setQuestions,
    isLoading,
  };
}
