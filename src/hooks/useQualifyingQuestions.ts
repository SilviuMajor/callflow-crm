import { useState, useCallback } from 'react';
import { QualifyingQuestion } from '@/types/contact';

const generateId = () => Math.random().toString(36).substr(2, 9);

const defaultQuestions: QualifyingQuestion[] = [
  { id: generateId(), label: 'Budget Range', type: 'dropdown', options: ['< $10k', '$10k - $50k', '$50k - $100k', '$100k+'], order: 0 },
  { id: generateId(), label: 'Timeline', type: 'dropdown', options: ['Immediate', '1-3 months', '3-6 months', '6+ months'], order: 1 },
  { id: generateId(), label: 'Decision Maker?', type: 'radio', options: ['Yes', 'No', 'Part of committee'], order: 2 },
  { id: generateId(), label: 'Current Solution', type: 'short_text', order: 3 },
  { id: generateId(), label: 'Pain Points', type: 'long_text', order: 4 },
];

export function useQualifyingQuestions() {
  const [questions, setQuestions] = useState<QualifyingQuestion[]>(defaultQuestions);

  const addQuestion = useCallback((question: Omit<QualifyingQuestion, 'id' | 'order'>) => {
    const newQuestion: QualifyingQuestion = {
      ...question,
      id: generateId(),
      order: questions.length,
    };
    setQuestions(prev => [...prev, newQuestion]);
    return newQuestion.id;
  }, [questions.length]);

  const updateQuestion = useCallback((id: string, updates: Partial<Omit<QualifyingQuestion, 'id'>>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => {
      const filtered = prev.filter(q => q.id !== id);
      return filtered.map((q, index) => ({ ...q, order: index }));
    });
  }, []);

  const reorderQuestions = useCallback((newOrder: string[]) => {
    setQuestions(prev => {
      const questionMap = new Map(prev.map(q => [q.id, q]));
      return newOrder.map((id, index) => ({
        ...questionMap.get(id)!,
        order: index,
      }));
    });
  }, []);

  return {
    questions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    setQuestions,
  };
}
