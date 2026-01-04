import { useState } from 'react';
import { QualifyingQuestion, QuestionType, QUESTION_TYPES } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';

interface QualifyingQuestionsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QualifyingQuestion[];
  onSave: (questions: QualifyingQuestion[], applyToBlank: boolean) => void;
}

export function QualifyingQuestionsSettings({ 
  open, 
  onOpenChange, 
  questions: initialQuestions,
  onSave 
}: QualifyingQuestionsSettingsProps) {
  const [questions, setQuestions] = useState<QualifyingQuestion[]>(initialQuestions);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const addQuestion = () => {
    const newQuestion: QualifyingQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Question',
      type: 'short_text',
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<QualifyingQuestion>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, i) => ({ ...q, order: i })));
  };

  const addOption = (questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, options: [...(q.options || []), 'New Option'] }
        : q
    ));
  };

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const options = [...(q.options || [])];
      options[index] = value;
      return { ...q, options };
    }));
  };

  const removeOption = (questionId: string, index: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const options = [...(q.options || [])];
      options.splice(index, 1);
      return { ...q, options };
    }));
  };

  const handleSave = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = (applyToBlank: boolean) => {
    onSave(questions, applyToBlank);
    setShowConfirmDialog(false);
    onOpenChange(false);
  };

  const needsOptions = (type: QuestionType) => 
    ['dropdown', 'radio', 'checkbox'].includes(type);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Qualifying Questions Settings</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No questions configured. Add your first question below.
              </p>
            ) : (
              questions.sort((a, b) => a.order - b.order).map((question, index) => (
                <div 
                  key={question.id} 
                  className="p-3 border border-border rounded-lg space-y-3 bg-background"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-2 cursor-move" />
                    
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Label</Label>
                          <Input
                            value={question.label}
                            onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select 
                            value={question.type} 
                            onValueChange={(v) => updateQuestion(question.id, { type: v as QuestionType })}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value} className="text-sm">
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {needsOptions(question.type) && (
                        <div className="space-y-1">
                          <Label className="text-xs">Options</Label>
                          <div className="space-y-1">
                            {(question.options || []).map((option, optIndex) => (
                              <div key={optIndex} className="flex gap-1">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(question.id, optIndex, e.target.value)}
                                  className="h-7 text-sm flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => removeOption(question.id, optIndex)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => addOption(question.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            
            <Button
              variant="outline"
              className="w-full"
              onClick={addQuestion}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Question
            </Button>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply to Existing Contacts?</DialogTitle>
            <DialogDescription>
              Would you like to apply new fields to contacts that have blank data for those fields? 
              This will not overwrite any existing answers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => confirmSave(false)}>
              No, just save
            </Button>
            <Button onClick={() => confirmSave(true)}>
              Yes, apply to blank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
