import { useState, useEffect } from 'react';
import { QualifyingQuestion, QuestionType, QUESTION_TYPES } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, X, MoreVertical, Archive, RotateCcw, Webhook, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWebhookSettings } from '@/hooks/useWebhookSettings';
import { toast } from 'sonner';

interface QualifyingQuestionsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QualifyingQuestion[];
  onSave: (questions: QualifyingQuestion[], applyToBlank: boolean, deletedQuestionIds: string[]) => void;
}

interface SortableQuestionItemProps {
  question: QualifyingQuestion;
  updateQuestion: (id: string, updates: Partial<QualifyingQuestion>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  addOption: (questionId: string) => void;
  updateOption: (questionId: string, index: number, value: string) => void;
  removeOption: (questionId: string, index: number) => void;
}

function SortableQuestionItem({ 
  question, 
  updateQuestion, 
  onArchive, 
  onDelete,
  addOption,
  updateOption,
  removeOption 
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const needsOptions = (type: QuestionType) => 
    ['dropdown', 'radio', 'checkbox'].includes(type);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="p-3 border border-border rounded-lg space-y-3 bg-background"
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing mt-2"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onArchive(question.id)}>
              <Archive className="w-4 h-4 mr-2" />
              Archive (keep data)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(question.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function QualifyingQuestionsSettings({ 
  open, 
  onOpenChange, 
  questions: initialQuestions,
  onSave 
}: QualifyingQuestionsSettingsProps) {
  const [questions, setQuestions] = useState<QualifyingQuestion[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('questions');
  
  // Webhook settings
  const { settings: webhookSettings, updateSettings: updateWebhookSettings, testWebhook } = useWebhookSettings();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setQuestions(initialQuestions);
    setDeletedQuestionIds([]);
    setTestResult(null);
  }, [initialQuestions, open]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeQuestions = questions.filter(q => !q.isArchived).sort((a, b) => a.order - b.order);
  const archivedQuestions = questions.filter(q => q.isArchived);

  const addQuestion = () => {
    const newQuestion: QualifyingQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Question',
      type: 'short_text',
      order: activeQuestions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<QualifyingQuestion>) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const archiveQuestion = (id: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, isArchived: true } : q
    ));
  };

  const restoreQuestion = (id: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, isArchived: false, order: activeQuestions.length } : q
    ));
  };

  const confirmDeleteQuestion = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const deleteQuestion = () => {
    if (pendingDeleteId) {
      setDeletedQuestionIds(prev => [...prev, pendingDeleteId]);
      setQuestions(prev => prev.filter(q => q.id !== pendingDeleteId).map((q, i) => ({ ...q, order: i })));
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = activeQuestions.findIndex(q => q.id === active.id);
      const newIndex = activeQuestions.findIndex(q => q.id === over.id);
      
      const reordered = arrayMove(activeQuestions, oldIndex, newIndex);
      const updated = reordered.map((q, i) => ({ ...q, order: i }));
      
      setQuestions(prev => [
        ...prev.filter(q => q.isArchived),
        ...updated,
      ]);
    }
  };

  const handleSave = () => {
    setShowConfirmDialog(true);
  };

  const confirmSave = (applyToBlank: boolean) => {
    onSave(questions, applyToBlank, deletedQuestionIds);
    setShowConfirmDialog(false);
    onOpenChange(false);
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    const result = await testWebhook();
    
    setIsTesting(false);
    if (result.success) {
      setTestResult({ success: true, message: 'Test payload sent successfully!' });
      toast.success('Webhook test successful');
    } else {
      setTestResult({ success: false, message: result.error || 'Failed to send test' });
      toast.error(`Webhook test failed: ${result.error}`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="questions">Qualifying Questions</TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <Webhook className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions" className="space-y-4 py-4">
              {activeQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No questions configured. Add your first question below.
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeQuestions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {activeQuestions.map((question) => (
                        <SortableQuestionItem
                          key={question.id}
                          question={question}
                          updateQuestion={updateQuestion}
                          onArchive={archiveQuestion}
                          onDelete={confirmDeleteQuestion}
                          addOption={addOption}
                          updateOption={updateOption}
                          removeOption={removeOption}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              
              <Button
                variant="outline"
                className="w-full"
                onClick={addQuestion}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>

              {/* Archived Questions */}
              {archivedQuestions.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Archived Questions</h4>
                  <div className="space-y-2">
                    {archivedQuestions.map(question => (
                      <div 
                        key={question.id}
                        className="p-2 border border-border rounded bg-muted/30 flex items-center justify-between"
                      >
                        <span className="text-sm">{question.label}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => restoreQuestion(question.id)}
                          >
                            <RotateCcw className="w-3 h-3 mr-1" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive hover:text-destructive"
                            onClick={() => confirmDeleteQuestion(question.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="webhooks" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Webhook on Completion</Label>
                      <p className="text-xs text-muted-foreground">
                        Send contact data to an external service when marked as "Completed"
                      </p>
                    </div>
                    <Switch 
                      checked={webhookSettings.enabled} 
                      onCheckedChange={(checked) => updateWebhookSettings({ enabled: checked })}
                    />
                  </div>
                  
                  {webhookSettings.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="webhook-url" className="text-sm">Webhook URL</Label>
                        <Input
                          id="webhook-url"
                          placeholder="https://n8n.example.com/webhook/..."
                          value={webhookSettings.url}
                          onChange={(e) => updateWebhookSettings({ url: e.target.value })}
                          className="font-mono text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleTestWebhook}
                          disabled={!webhookSettings.url || isTesting}
                          className="gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {isTesting ? 'Sending...' : 'Test Webhook'}
                        </Button>
                        
                        {testResult && (
                          <span className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-success' : 'text-destructive'}`}>
                            {testResult.success ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            {testResult.message}
                          </span>
                        )}
                      </div>
                      
                      <div className="p-3 bg-muted/50 rounded text-xs space-y-2">
                        <p className="font-medium">Payload sent on completion:</p>
                        <pre className="text-muted-foreground whitespace-pre-wrap">
{`{
  "event": "contact_completed",
  "timestamp": "ISO date string",
  "contact": {
    "id", "firstName", "lastName",
    "company", "jobTitle", "phone",
    "email", "website", "notes",
    "status", "completedReason",
    "appointmentDate",
    "qualifyingAnswers": { ... }
  }
}`}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Question Permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete this question AND clear all related data from all contacts. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteQuestion}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
