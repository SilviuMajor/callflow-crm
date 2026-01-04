import { useState, useEffect } from 'react';
import { QualifyingQuestion, QuestionType, QUESTION_TYPES, CustomContactField, CompanyField } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, X, MoreVertical, Archive, RotateCcw, Webhook, Send, CheckCircle2, AlertCircle, Database, Building2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWebhookSettings } from '@/hooks/useWebhookSettings';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { toast } from 'sonner';

interface QualifyingQuestionsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: QualifyingQuestion[];
  onSave: (questions: QualifyingQuestion[], applyToBlank: boolean, deletedQuestionIds: string[]) => void;
}

interface SortableItemProps {
  item: QualifyingQuestion | CustomContactField | CompanyField;
  updateItem: (id: string, updates: Partial<QualifyingQuestion | CustomContactField | CompanyField>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  addOption: (itemId: string) => void;
  updateOption: (itemId: string, index: number, value: string) => void;
  removeOption: (itemId: string, index: number) => void;
  isCustomField?: boolean;
  fieldLabel?: string;
}

function SortableItem({ 
  item, 
  updateItem, 
  onArchive, 
  onDelete,
  addOption,
  updateOption,
  removeOption,
  isCustomField = false,
  fieldLabel = 'Label',
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
              <Label className="text-xs">{fieldLabel}</Label>
              <Input
                value={item.label}
                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select 
                value={item.type} 
                onValueChange={(v) => updateItem(item.id, { type: v as QuestionType })}
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

          {isCustomField && (
            <div className="space-y-1">
              <Label className="text-xs">Field Key (internal)</Label>
              <Input
                value={(item as CustomContactField).key || ''}
                onChange={(e) => updateItem(item.id, { key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                className="h-8 text-sm font-mono"
                placeholder="e.g., linkedin_url"
              />
            </div>
          )}
          
          {needsOptions(item.type) && (
            <div className="space-y-1">
              <Label className="text-xs">Options</Label>
              <div className="space-y-1">
                {(item.options || []).map((option, optIndex) => (
                  <div key={optIndex} className="flex gap-1">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(item.id, optIndex, e.target.value)}
                      className="h-7 text-sm flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => removeOption(item.id, optIndex)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addOption(item.id)}
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
            <DropdownMenuItem onClick={() => onArchive(item.id)}>
              <Archive className="w-4 h-4 mr-2" />
              Archive (keep data)
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(item.id)}
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
  const [pendingDeleteType, setPendingDeleteType] = useState<'question' | 'field' | 'company'>('question');
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('questions');
  
  // Custom fields
  const { 
    fields: customFields, 
    addField, 
    updateField, 
    archiveField, 
    restoreField, 
    deleteField,
  } = useCustomFields();
  const [localCustomFields, setLocalCustomFields] = useState<CustomContactField[]>([]);

  // Company fields
  const {
    fields: companyFields,
    addField: addCompanyField,
    updateField: updateCompanyFieldDef,
    archiveField: archiveCompanyField,
    restoreField: restoreCompanyField,
    deleteField: deleteCompanyField,
  } = useCompanyFields();
  const [localCompanyFields, setLocalCompanyFields] = useState<CompanyField[]>([]);
  
  // Webhook settings
  const { settings: webhookSettings, updateSettings: updateWebhookSettings, testWebhook } = useWebhookSettings();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setQuestions(initialQuestions);
    setLocalCustomFields(customFields);
    setLocalCompanyFields(companyFields);
    setDeletedQuestionIds([]);
    setTestResult(null);
  }, [initialQuestions, customFields, companyFields, open]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeQuestions = questions.filter(q => !q.isArchived).sort((a, b) => a.order - b.order);
  const archivedQuestions = questions.filter(q => q.isArchived);

  const activeCustomFields = localCustomFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const archivedCustomFields = localCustomFields.filter(f => f.isArchived);

  const activeCompanyFields = localCompanyFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const archivedCompanyFields = localCompanyFields.filter(f => f.isArchived);

  // Question handlers
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

  const confirmDeleteItem = (id: string, type: 'question' | 'field' | 'company') => {
    setPendingDeleteId(id);
    setPendingDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    if (pendingDeleteId) {
      if (pendingDeleteType === 'question') {
        setDeletedQuestionIds(prev => [...prev, pendingDeleteId]);
        setQuestions(prev => prev.filter(q => q.id !== pendingDeleteId).map((q, i) => ({ ...q, order: i })));
      } else if (pendingDeleteType === 'field') {
        setLocalCustomFields(prev => prev.filter(f => f.id !== pendingDeleteId).map((f, i) => ({ ...f, order: i })));
      } else if (pendingDeleteType === 'company') {
        setLocalCompanyFields(prev => prev.filter(f => f.id !== pendingDeleteId).map((f, i) => ({ ...f, order: i })));
      }
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  };

  // Custom field handlers
  const addNewCustomField = () => {
    const newField: CustomContactField = {
      id: Math.random().toString(36).substr(2, 9),
      key: 'new_field',
      label: 'New Field',
      type: 'short_text',
      order: activeCustomFields.length,
    };
    setLocalCustomFields([...localCustomFields, newField]);
  };

  const updateCustomField = (id: string, updates: Partial<CustomContactField>) => {
    setLocalCustomFields(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const archiveCustomFieldLocal = (id: string) => {
    setLocalCustomFields(prev => prev.map(f => 
      f.id === id ? { ...f, isArchived: true } : f
    ));
  };

  const restoreCustomFieldLocal = (id: string) => {
    setLocalCustomFields(prev => prev.map(f => 
      f.id === id ? { ...f, isArchived: false, order: activeCustomFields.length } : f
    ));
  };

  // Company field handlers
  const addNewCompanyField = () => {
    const newField: CompanyField = {
      id: Math.random().toString(36).substr(2, 9),
      key: 'new_company_field',
      label: 'New Company Field',
      type: 'short_text',
      order: activeCompanyFields.length,
    };
    setLocalCompanyFields([...localCompanyFields, newField]);
  };

  const updateLocalCompanyField = (id: string, updates: Partial<CompanyField>) => {
    setLocalCompanyFields(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ));
  };

  const archiveCompanyFieldLocal = (id: string) => {
    setLocalCompanyFields(prev => prev.map(f => 
      f.id === id ? { ...f, isArchived: true } : f
    ));
  };

  const restoreCompanyFieldLocal = (id: string) => {
    setLocalCompanyFields(prev => prev.map(f => 
      f.id === id ? { ...f, isArchived: false, order: activeCompanyFields.length } : f
    ));
  };

  // Option handlers (shared)
  const addOptionToItem = (itemId: string, listType: 'question' | 'field' | 'company') => {
    const updateFn = (item: any) => 
      item.id === itemId ? { ...item, options: [...(item.options || []), 'New Option'] } : item;
    
    if (listType === 'question') setQuestions(prev => prev.map(updateFn));
    else if (listType === 'field') setLocalCustomFields(prev => prev.map(updateFn));
    else if (listType === 'company') setLocalCompanyFields(prev => prev.map(updateFn));
  };

  const updateOptionInItem = (itemId: string, index: number, value: string, listType: 'question' | 'field' | 'company') => {
    const updateFn = (item: any) => {
      if (item.id !== itemId) return item;
      const options = [...(item.options || [])];
      options[index] = value;
      return { ...item, options };
    };
    
    if (listType === 'question') setQuestions(prev => prev.map(updateFn));
    else if (listType === 'field') setLocalCustomFields(prev => prev.map(updateFn));
    else if (listType === 'company') setLocalCompanyFields(prev => prev.map(updateFn));
  };

  const removeOptionFromItem = (itemId: string, index: number, listType: 'question' | 'field' | 'company') => {
    const updateFn = (item: any) => {
      if (item.id !== itemId) return item;
      const options = [...(item.options || [])];
      options.splice(index, 1);
      return { ...item, options };
    };
    
    if (listType === 'question') setQuestions(prev => prev.map(updateFn));
    else if (listType === 'field') setLocalCustomFields(prev => prev.map(updateFn));
    else if (listType === 'company') setLocalCompanyFields(prev => prev.map(updateFn));
  };

  const handleDragEndQuestions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeQuestions.findIndex(q => q.id === active.id);
      const newIndex = activeQuestions.findIndex(q => q.id === over.id);
      const reordered = arrayMove(activeQuestions, oldIndex, newIndex).map((q, i) => ({ ...q, order: i }));
      setQuestions(prev => [...prev.filter(q => q.isArchived), ...reordered]);
    }
  };

  const handleDragEndFields = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeCustomFields.findIndex(f => f.id === active.id);
      const newIndex = activeCustomFields.findIndex(f => f.id === over.id);
      const reordered = arrayMove(activeCustomFields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
      setLocalCustomFields(prev => [...prev.filter(f => f.isArchived), ...reordered]);
    }
  };

  const handleDragEndCompanyFields = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeCompanyFields.findIndex(f => f.id === active.id);
      const newIndex = activeCompanyFields.findIndex(f => f.id === over.id);
      const reordered = arrayMove(activeCompanyFields, oldIndex, newIndex).map((f, i) => ({ ...f, order: i }));
      setLocalCompanyFields(prev => [...prev.filter(f => f.isArchived), ...reordered]);
    }
  };

  const handleSave = () => {
    // Save custom fields
    localCustomFields.forEach(field => {
      const existing = customFields.find(f => f.id === field.id);
      if (!existing) {
        addField({ key: field.key, label: field.label, type: field.type, options: field.options, isArchived: field.isArchived });
      } else {
        updateField(field.id, field);
      }
    });
    customFields.forEach(field => {
      if (!localCustomFields.find(f => f.id === field.id)) {
        deleteField(field.id);
      }
    });

    // Save company fields
    localCompanyFields.forEach(field => {
      const existing = companyFields.find(f => f.id === field.id);
      if (!existing) {
        addCompanyField({ key: field.key, label: field.label, type: field.type, options: field.options, isArchived: field.isArchived });
      } else {
        updateCompanyFieldDef(field.id, field);
      }
    });
    companyFields.forEach(field => {
      if (!localCompanyFields.find(f => f.id === field.id)) {
        deleteCompanyField(field.id);
      }
    });

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

  const getDeleteTypeLabel = () => {
    if (pendingDeleteType === 'question') return 'Question';
    if (pendingDeleteType === 'field') return 'Contact Field';
    return 'Company Field';
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="questions" className="text-xs">Questions</TabsTrigger>
              <TabsTrigger value="fields" className="flex items-center gap-1 text-xs">
                <Database className="w-3 h-3" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="company" className="flex items-center gap-1 text-xs">
                <Building2 className="w-3 h-3" />
                Company
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-1 text-xs">
                <Webhook className="w-3 h-3" />
                Webhooks
              </TabsTrigger>
            </TabsList>
            
            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4 py-4">
              {activeQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No questions configured. Add your first question below.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndQuestions}>
                  <SortableContext items={activeQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {activeQuestions.map((question) => (
                        <SortableItem
                          key={question.id}
                          item={question}
                          updateItem={updateQuestion}
                          onArchive={archiveQuestion}
                          onDelete={(id) => confirmDeleteItem(id, 'question')}
                          addOption={(id) => addOptionToItem(id, 'question')}
                          updateOption={(id, idx, val) => updateOptionInItem(id, idx, val, 'question')}
                          removeOption={(id, idx) => removeOptionFromItem(id, idx, 'question')}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              <Button variant="outline" className="w-full" onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
              {archivedQuestions.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Archived Questions</h4>
                  <div className="space-y-2">
                    {archivedQuestions.map(question => (
                      <div key={question.id} className="p-2 border border-border rounded bg-muted/30 flex items-center justify-between">
                        <span className="text-sm">{question.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => restoreQuestion(question.id)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => confirmDeleteItem(question.id, 'question')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Contact Fields Tab */}
            <TabsContent value="fields" className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Contact fields are per-contact data (like LinkedIn URL, Account ID).
              </p>
              {activeCustomFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom fields configured.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFields}>
                  <SortableContext items={activeCustomFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {activeCustomFields.map((field) => (
                        <SortableItem
                          key={field.id}
                          item={field}
                          updateItem={updateCustomField}
                          onArchive={archiveCustomFieldLocal}
                          onDelete={(id) => confirmDeleteItem(id, 'field')}
                          addOption={(id) => addOptionToItem(id, 'field')}
                          updateOption={(id, idx, val) => updateOptionInItem(id, idx, val, 'field')}
                          removeOption={(id, idx) => removeOptionFromItem(id, idx, 'field')}
                          isCustomField
                          fieldLabel="Field Label"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              <Button variant="outline" className="w-full" onClick={addNewCustomField}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact Field
              </Button>
              {archivedCustomFields.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Archived Fields</h4>
                  <div className="space-y-2">
                    {archivedCustomFields.map(field => (
                      <div key={field.id} className="p-2 border border-border rounded bg-muted/30 flex items-center justify-between">
                        <span className="text-sm">{field.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => restoreCustomFieldLocal(field.id)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => confirmDeleteItem(field.id, 'field')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Company Fields Tab */}
            <TabsContent value="company" className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Company fields are shared across all contacts at the same company. When you update a company field for one contact, it updates for all contacts at that company.
              </p>
              {activeCompanyFields.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No company fields configured.
                </p>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCompanyFields}>
                  <SortableContext items={activeCompanyFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {activeCompanyFields.map((field) => (
                        <SortableItem
                          key={field.id}
                          item={field}
                          updateItem={updateLocalCompanyField}
                          onArchive={archiveCompanyFieldLocal}
                          onDelete={(id) => confirmDeleteItem(id, 'company')}
                          addOption={(id) => addOptionToItem(id, 'company')}
                          updateOption={(id, idx, val) => updateOptionInItem(id, idx, val, 'company')}
                          removeOption={(id, idx) => removeOptionFromItem(id, idx, 'company')}
                          isCustomField
                          fieldLabel="Company Field Label"
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              <Button variant="outline" className="w-full" onClick={addNewCompanyField}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company Field
              </Button>
              {archivedCompanyFields.length > 0 && (
                <div className="border-t border-border pt-4 mt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Archived Fields</h4>
                  <div className="space-y-2">
                    {archivedCompanyFields.map(field => (
                      <div key={field.id} className="p-2 border border-border rounded bg-muted/30 flex items-center justify-between">
                        <span className="text-sm">{field.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => restoreCompanyFieldLocal(field.id)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive hover:text-destructive" onClick={() => confirmDeleteItem(field.id, 'company')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-4 py-4">
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
                      <Button variant="outline" size="sm" onClick={handleTestWebhook} disabled={!webhookSettings.url || isTesting} className="gap-2">
                        <Send className="w-4 h-4" />
                        {isTesting ? 'Sending...' : 'Test Webhook'}
                      </Button>
                      {testResult && (
                        <span className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-success' : 'text-destructive'}`}>
                          {testResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {testResult.message}
                        </span>
                      )}
                    </div>
                    <div className="p-3 bg-muted/50 rounded text-xs space-y-2">
                      <p className="font-medium">Payload sent on completion:</p>
                      <pre className="text-muted-foreground whitespace-pre-wrap">
{`{
  "event": "contact_completed",
  "contact": { ... },
  "companyData": { ... }
}`}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
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
            <Button variant="outline" onClick={() => confirmSave(false)}>No, just save</Button>
            <Button onClick={() => confirmSave(true)}>Yes, apply to blank</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {getDeleteTypeLabel()} Permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete this {getDeleteTypeLabel().toLowerCase()} AND clear all related data. 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
