import { useState, useEffect, useRef } from 'react';
import { TopNav } from '@/components/TopNav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  Database, Scroll, CheckCircle2, Webhook, Plug, Settings, 
  Plus, Trash2, GripVertical, X, MoreVertical, Archive, RotateCcw,
  Send, AlertCircle, Building2, HelpCircle, Calendar, ExternalLink, 
  Loader2, Check, Copy, Star, LayoutGrid, Users
} from 'lucide-react';
import { InviteCodeManager } from '@/components/InviteCodeManager';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// Hooks
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useWebhookSettings } from '@/hooks/useWebhookSettings';
import { useOutcomeOptions, OutcomeOption } from '@/hooks/useOutcomeOptions';
import { useCalendlySettings } from '@/hooks/useCalendlySettings';
import { useCalcomSettings } from '@/hooks/useCalcomSettings';
import { useStaticScripts } from '@/hooks/useStaticScripts';
import { useStaticScriptSettings } from '@/hooks/useStaticScriptSettings';
import { useContactCardSectionOrder, DEFAULT_SECTION_ORDER, SECTION_LABELS, SectionKey, EXPANDABLE_SECTIONS } from '@/hooks/useContactCardSectionOrder';

// Types
import { QualifyingQuestion, QuestionType, QUESTION_TYPES, CustomContactField, CompanyField } from '@/types/contact';

// Sortable Item Component
function SortableFieldItem({ 
  item, 
  updateItem, 
  onArchive, 
  onDelete,
  addOption,
  updateOption,
  removeOption,
  isCustomField = false,
  fieldLabel = 'Label',
}: {
  item: QualifyingQuestion | CustomContactField | CompanyField;
  updateItem: (id: string, updates: Partial<QualifyingQuestion | CustomContactField | CompanyField>) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  addOption: (itemId: string) => void;
  updateOption: (itemId: string, index: number, value: string) => void;
  removeOption: (itemId: string, index: number) => void;
  isCustomField?: boolean;
  fieldLabel?: string;
}) {
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
    <div ref={setNodeRef} style={style} className="p-3 border border-border rounded-lg space-y-3 bg-background">
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-2">
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
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeOption(item.id, optIndex)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => addOption(item.id)}>
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
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Sortable Outcome Item
function SortableOutcomeItem({ option, onDelete, onUpdate }: { 
  option: OutcomeOption; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, label: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(option.label);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: option.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const handleSave = () => {
    if (editLabel.trim() && editLabel !== option.label) {
      onUpdate(option.id, editLabel.trim());
    }
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-background border rounded-md">
      <button {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      
      {isEditing ? (
        <Input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          className="flex-1 h-8"
          autoFocus
        />
      ) : (
        <span className="flex-1 text-sm cursor-pointer hover:text-primary" onClick={() => setIsEditing(true)}>
          {option.label}
        </span>
      )}
      
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => onDelete(option.id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Sortable Script Item
function SortableScriptItem({ 
  script, 
  onUpdate, 
  onDelete, 
  onSetDefault 
}: {
  script: { id: string; name: string; content: string; enabled: boolean; is_default: boolean };
  onUpdate: (id: string, updates: Partial<typeof script>) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: script.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="p-3 border border-border rounded-lg space-y-3 bg-background">
      <div className="flex items-start gap-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              value={script.name}
              onChange={(e) => onUpdate(script.id, { name: e.target.value })}
              className="h-8 text-sm flex-1"
              placeholder="Script name"
            />
            <Switch
              checked={script.enabled}
              onCheckedChange={(checked) => onUpdate(script.id, { enabled: checked })}
            />
            <Button
              variant={script.is_default ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2"
              onClick={() => onSetDefault(script.id)}
              title={script.is_default ? "Default script" : "Set as default"}
            >
              <Star className={`w-4 h-4 ${script.is_default ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => onDelete(script.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            value={script.content}
            onChange={(e) => onUpdate(script.id, { content: e.target.value })}
            className="text-sm min-h-[80px]"
            placeholder="Script content with placeholders like {first_name}, {company}, etc."
          />
        </div>
      </div>
    </div>
  );
}

// Sortable Section Order Item
function SortableSectionItem({ 
  sectionKey, 
  isExpanded, 
  onExpandedChange,
  showExpandToggle 
}: { 
  sectionKey: SectionKey;
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  showExpandToggle?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sectionKey });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-3 bg-background border rounded-md">
      <button {...attributes} {...listeners} className="cursor-grab hover:bg-muted p-1 rounded">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm font-medium">{SECTION_LABELS[sectionKey]}</span>
      {showExpandToggle && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Expanded</Label>
          <Switch
            checked={isExpanded}
            onCheckedChange={onExpandedChange}
          />
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('custom-fields');
  
  // Custom fields state
  const { questions, addQuestion, updateQuestion, deleteQuestion, reorderQuestions, setQuestions } = useQualifyingQuestions();
  const { fields: customFields, addField, updateField, archiveField, deleteField } = useCustomFields();
  const { fields: companyFields, addField: addCompanyField, updateField: updateCompanyField, archiveField: archiveCompanyField, deleteField: deleteCompanyField } = useCompanyFields();
  
  const [localQuestions, setLocalQuestions] = useState<QualifyingQuestion[]>([]);
  const [localCustomFields, setLocalCustomFields] = useState<CustomContactField[]>([]);
  const [localCompanyFields, setLocalCompanyFields] = useState<CompanyField[]>([]);
  
  // Webhook state
  const { settings: webhookSettings, updateSettings: updateWebhookSettings, testWebhook } = useWebhookSettings();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Outcomes state
  const { completedOptions, notInterestedOptions, isLoading: outcomesLoading, addOption: addOutcomeOption, updateOption: updateOutcomeOption, deleteOption: deleteOutcomeOption, reorderOptions: reorderOutcomeOptions } = useOutcomeOptions();
  const [newCompletedLabel, setNewCompletedLabel] = useState('');
  const [newNotInterestedLabel, setNewNotInterestedLabel] = useState('');
  
  // Integrations state
  const { settings: calendlySettings, isLoading: isLoadingCalendly, updateSettings: updateCalendlySettings } = useCalendlySettings();
  const { settings: calcomSettings, isLoading: isLoadingCalcom, updateSettings: updateCalcomSettings, availableFields: calcomAvailableFields, isFetchingFields: isFetchingCalcomFields, fetchBookingFields: fetchCalcomBookingFields } = useCalcomSettings();
  const [calendlyEnabled, setCalendlyEnabled] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [calcomEnabled, setCalcomEnabled] = useState(false);
  const [calcomEventSlug, setCalcomEventSlug] = useState('');
  const [calcomApiKey, setCalcomApiKey] = useState('');
  const [calcomFieldMappings, setCalcomFieldMappings] = useState<{
    phone?: string;
    company?: string;
    jobTitle?: string;
  }>({});
  const [isSavingCalendly, setIsSavingCalendly] = useState(false);
  const [isSavingCalcom, setIsSavingCalcom] = useState(false);
  
  // Static scripts state
  const { scripts, addScript, updateScript, deleteScript, setDefaultScript, reorderScripts, isLoading: scriptsLoading } = useStaticScripts();
  const { settings: scriptSettings, updateSettings: updateScriptSettings, isLoading: scriptSettingsLoading } = useStaticScriptSettings();
  
  // Section order state
  const { sectionOrder, sectionExpandedDefaults, isLoading: sectionOrderLoading, updateOrder: updateSectionOrder, updateExpandedDefault, resetToDefault: resetSectionOrder } = useContactCardSectionOrder();
  const [pendingSectionOrder, setPendingSectionOrder] = useState<SectionKey[] | null>(null);
  const [isSavingSectionOrder, setIsSavingSectionOrder] = useState(false);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteType, setPendingDeleteType] = useState<'question' | 'field' | 'company' | 'script'>('question');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Sync state
  useEffect(() => {
    setLocalQuestions(questions);
    setLocalCustomFields(customFields);
    setLocalCompanyFields(companyFields);
  }, [questions, customFields, companyFields]);

  useEffect(() => {
    if (!isLoadingCalendly) {
      setCalendlyEnabled(calendlySettings.enabled);
      setCalendlyUrl(calendlySettings.calendly_url);
    }
  }, [isLoadingCalendly, calendlySettings]);

  useEffect(() => {
    if (!isLoadingCalcom) {
      setCalcomEnabled(calcomSettings.enabled);
      setCalcomEventSlug(calcomSettings.event_type_slug || '');
      setCalcomApiKey(calcomSettings.api_key || '');
      setCalcomFieldMappings(calcomSettings.field_mappings || {});
    }
  }, [isLoadingCalcom, calcomSettings]);

  const activeQuestions = localQuestions.filter(q => !q.isArchived).sort((a, b) => a.order - b.order);
  const archivedQuestions = localQuestions.filter(q => q.isArchived);
  const activeCustomFields = localCustomFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const archivedCustomFields = localCustomFields.filter(f => f.isArchived);
  const activeCompanyFields = localCompanyFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const archivedCompanyFields = localCompanyFields.filter(f => f.isArchived);

  // CRUD handlers
  const handleAddQuestion = () => {
    const newQ: QualifyingQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      label: 'New Question',
      type: 'short_text',
      order: activeQuestions.length,
    };
    setLocalQuestions(prev => [...prev, newQ]);
  };

  const handleUpdateQuestion = (id: string, updates: Partial<QualifyingQuestion>) => {
    setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const handleArchiveQuestion = (id: string) => {
    setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, isArchived: true } : q));
  };

  const handleRestoreQuestion = (id: string) => {
    setLocalQuestions(prev => prev.map(q => q.id === id ? { ...q, isArchived: false, order: activeQuestions.length } : q));
  };

  const handleAddCustomField = () => {
    const newF: CustomContactField = {
      id: Math.random().toString(36).substr(2, 9),
      key: 'new_field',
      label: 'New Field',
      type: 'short_text',
      order: activeCustomFields.length,
    };
    setLocalCustomFields(prev => [...prev, newF]);
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomContactField>) => {
    setLocalCustomFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleArchiveCustomField = (id: string) => {
    setLocalCustomFields(prev => prev.map(f => f.id === id ? { ...f, isArchived: true } : f));
  };

  const handleRestoreCustomField = (id: string) => {
    setLocalCustomFields(prev => prev.map(f => f.id === id ? { ...f, isArchived: false, order: activeCustomFields.length } : f));
  };

  const handleAddCompanyField = () => {
    const newF: CompanyField = {
      id: Math.random().toString(36).substr(2, 9),
      key: 'new_company_field',
      label: 'New Company Field',
      type: 'short_text',
      order: activeCompanyFields.length,
    };
    setLocalCompanyFields(prev => [...prev, newF]);
  };

  const handleUpdateCompanyField = (id: string, updates: Partial<CompanyField>) => {
    setLocalCompanyFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleArchiveCompanyField = (id: string) => {
    setLocalCompanyFields(prev => prev.map(f => f.id === id ? { ...f, isArchived: true } : f));
  };

  const handleRestoreCompanyField = (id: string) => {
    setLocalCompanyFields(prev => prev.map(f => f.id === id ? { ...f, isArchived: false, order: activeCompanyFields.length } : f));
  };

  // Option handlers
  const addOptionToItem = (itemId: string, listType: 'question' | 'field' | 'company') => {
    const updateFn = (item: any) => item.id === itemId ? { ...item, options: [...(item.options || []), 'New Option'] } : item;
    if (listType === 'question') setLocalQuestions(prev => prev.map(updateFn));
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
    if (listType === 'question') setLocalQuestions(prev => prev.map(updateFn));
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
    if (listType === 'question') setLocalQuestions(prev => prev.map(updateFn));
    else if (listType === 'field') setLocalCustomFields(prev => prev.map(updateFn));
    else if (listType === 'company') setLocalCompanyFields(prev => prev.map(updateFn));
  };

  // Drag handlers
  const handleDragEndQuestions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeQuestions.findIndex(q => q.id === active.id);
      const newIndex = activeQuestions.findIndex(q => q.id === over.id);
      const reordered = arrayMove(activeQuestions, oldIndex, newIndex).map((q, i) => ({ ...q, order: i }));
      setLocalQuestions(prev => [...prev.filter(q => q.isArchived), ...reordered]);
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

  const handleDragEndScripts = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = scripts.findIndex(s => s.id === active.id);
      const newIndex = scripts.findIndex(s => s.id === over.id);
      const reordered = arrayMove(scripts, oldIndex, newIndex);
      reorderScripts(reordered.map(s => s.id));
    }
  };

  const handleDragEndCompletedOptions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = completedOptions.findIndex(o => o.id === active.id);
      const newIndex = completedOptions.findIndex(o => o.id === over.id);
      const newOrder = arrayMove(completedOptions, oldIndex, newIndex);
      reorderOutcomeOptions('completed', newOrder.map(o => o.id));
    }
  };

  const handleDragEndNotInterestedOptions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = notInterestedOptions.findIndex(o => o.id === active.id);
      const newIndex = notInterestedOptions.findIndex(o => o.id === over.id);
      const newOrder = arrayMove(notInterestedOptions, oldIndex, newIndex);
      reorderOutcomeOptions('not_interested', newOrder.map(o => o.id));
    }
  };

  // Section order drag - uses pending state, requires explicit save
  const handleDragEndSectionOrder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const currentOrder = pendingSectionOrder || sectionOrder;
      const oldIndex = currentOrder.findIndex(s => s === active.id);
      const newIndex = currentOrder.findIndex(s => s === over.id);
      const newOrder = arrayMove(currentOrder, oldIndex, newIndex) as SectionKey[];
      setPendingSectionOrder(newOrder);
    }
  };

  const handleSaveSectionOrder = async () => {
    if (!pendingSectionOrder) return;
    setIsSavingSectionOrder(true);
    await updateSectionOrder(pendingSectionOrder);
    setPendingSectionOrder(null);
    setIsSavingSectionOrder(false);
    toast.success('Section order saved');
  };

  const handleResetSectionOrder = () => {
    resetSectionOrder();
    setPendingSectionOrder(null);
  };

  const displaySectionOrder = pendingSectionOrder || sectionOrder;
  const hasPendingSectionChanges = pendingSectionOrder !== null;

  // Delete confirmation
  const confirmDeleteItem = (id: string, type: 'question' | 'field' | 'company' | 'script') => {
    setPendingDeleteId(id);
    setPendingDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!pendingDeleteId) return;
    
    if (pendingDeleteType === 'question') {
      deleteQuestion(pendingDeleteId);
      setLocalQuestions(prev => prev.filter(q => q.id !== pendingDeleteId));
    } else if (pendingDeleteType === 'field') {
      deleteField(pendingDeleteId);
      setLocalCustomFields(prev => prev.filter(f => f.id !== pendingDeleteId));
    } else if (pendingDeleteType === 'company') {
      deleteCompanyField(pendingDeleteId);
      setLocalCompanyFields(prev => prev.filter(f => f.id !== pendingDeleteId));
    } else if (pendingDeleteType === 'script') {
      await deleteScript(pendingDeleteId);
    }
    
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
    toast.success(`${pendingDeleteType === 'question' ? 'Question' : pendingDeleteType === 'field' ? 'Contact field' : pendingDeleteType === 'company' ? 'Company field' : 'Script'} deleted`);
  };

  // Save custom fields
  const handleSaveCustomFields = async () => {
    // Save questions
    for (const q of localQuestions) {
      const existing = questions.find(eq => eq.id === q.id);
      if (!existing) {
        await addQuestion(q);
      } else {
        await updateQuestion(q.id, q);
      }
    }
    
    // Save custom fields
    for (const f of localCustomFields) {
      const existing = customFields.find(ef => ef.id === f.id);
      if (!existing) {
        addField({ key: f.key, label: f.label, type: f.type, options: f.options, isArchived: f.isArchived });
      } else {
        updateField(f.id, f);
      }
    }
    
    // Save company fields
    for (const f of localCompanyFields) {
      const existing = companyFields.find(ef => ef.id === f.id);
      if (!existing) {
        addCompanyField({ key: f.key, label: f.label, type: f.type, options: f.options, isArchived: f.isArchived });
      } else {
        updateCompanyField(f.id, f);
      }
    }
    
    toast.success('Custom fields saved');
  };

  // Webhook test
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

  // Calendly save
  const handleSaveCalendly = async () => {
    if (calendlyEnabled && !calendlyUrl) {
      toast.error('Please enter your Calendly URL');
      return;
    }
    if (calendlyEnabled && calendlyUrl) {
      try {
        new URL(calendlyUrl);
        if (!calendlyUrl.includes('calendly.com')) {
          toast.error('Please enter a valid Calendly URL');
          return;
        }
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }
    }
    setIsSavingCalendly(true);
    const success = await updateCalendlySettings({ enabled: calendlyEnabled, calendly_url: calendlyUrl });
    if (success) {
      toast.success('Calendly settings saved');
    } else {
      toast.error('Failed to save settings');
    }
    setIsSavingCalendly(false);
  };

  // Calcom save
  const handleSaveCalcom = async () => {
    if (calcomEnabled && !calcomEventSlug) {
      toast.error('Please enter your Cal.com event slug');
      return;
    }
    setIsSavingCalcom(true);
    const success = await updateCalcomSettings({ 
      enabled: calcomEnabled, 
      event_type_slug: calcomEventSlug,
      api_key: calcomApiKey || null,
      field_mappings: calcomFieldMappings,
    });
    if (success) {
      toast.success('Cal.com settings saved');
    } else {
      toast.error('Failed to save settings');
    }
    setIsSavingCalcom(false);
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendly-webhook`;
  const calcomWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calcom-webhook`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const hasCalendlyChanges = calendlyEnabled !== calendlySettings.enabled || calendlyUrl !== calendlySettings.calendly_url;
  const hasCalcomChanges = calcomEnabled !== calcomSettings.enabled || 
    calcomEventSlug !== (calcomSettings.event_type_slug || '') ||
    calcomApiKey !== (calcomSettings.api_key || '') ||
    JSON.stringify(calcomFieldMappings) !== JSON.stringify(calcomSettings.field_mappings || {});

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      
      <main className="container max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your custom fields, scripts, and integrations</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="custom-fields" className="flex items-center gap-1 text-xs">
              <Database className="w-3 h-3" />
              <span className="hidden sm:inline">Fields</span>
            </TabsTrigger>
            <TabsTrigger value="scripts" className="flex items-center gap-1 text-xs">
              <Scroll className="w-3 h-3" />
              <span className="hidden sm:inline">Scripts</span>
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="flex items-center gap-1 text-xs">
              <CheckCircle2 className="w-3 h-3" />
              <span className="hidden sm:inline">Outcomes</span>
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-1 text-xs">
              <Webhook className="w-3 h-3" />
              <span className="hidden sm:inline">Webhooks</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-1 text-xs">
              <Plug className="w-3 h-3" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-1 text-xs">
              <LayoutGrid className="w-3 h-3" />
              <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-1 text-xs">
              <Users className="w-3 h-3" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* Custom Fields Tab */}
          <TabsContent value="custom-fields" className="space-y-6 py-4">
            {/* Qualifying Questions */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Qualifying Questions</CardTitle>
                </div>
                <CardDescription>Questions to ask during calls to qualify leads.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeQuestions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No questions configured.</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndQuestions}>
                    <SortableContext items={activeQuestions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {activeQuestions.map(q => (
                          <SortableFieldItem
                            key={q.id}
                            item={q}
                            updateItem={handleUpdateQuestion}
                            onArchive={handleArchiveQuestion}
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
                <Button variant="outline" className="w-full" onClick={handleAddQuestion}>
                  <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
                {archivedQuestions.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Archived Questions</h5>
                    {archivedQuestions.map(q => (
                      <div key={q.id} className="p-2 border rounded bg-muted/30 flex items-center justify-between mb-2">
                        <span className="text-sm">{q.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleRestoreQuestion(q.id)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => confirmDeleteItem(q.id, 'question')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Fields */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Contact Fields</CardTitle>
                </div>
                <CardDescription>Per-contact custom fields like LinkedIn URL.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeCustomFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No contact fields configured.</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndFields}>
                    <SortableContext items={activeCustomFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {activeCustomFields.map(f => (
                          <SortableFieldItem
                            key={f.id}
                            item={f}
                            updateItem={handleUpdateCustomField}
                            onArchive={handleArchiveCustomField}
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
                <Button variant="outline" className="w-full" onClick={handleAddCustomField}>
                  <Plus className="w-4 h-4 mr-2" /> Add Contact Field
                </Button>
                {archivedCustomFields.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Archived Contact Fields</h5>
                    {archivedCustomFields.map(f => (
                      <div key={f.id} className="p-2 border rounded bg-muted/30 flex items-center justify-between mb-2">
                        <span className="text-sm">{f.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleRestoreCustomField(f.id)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => confirmDeleteItem(f.id, 'field')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Company Fields */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <CardTitle className="text-base">Company Fields</CardTitle>
                </div>
                <CardDescription>Shared across all contacts at the same company.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeCompanyFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No company fields configured.</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCompanyFields}>
                    <SortableContext items={activeCompanyFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {activeCompanyFields.map(f => (
                          <SortableFieldItem
                            key={f.id}
                            item={f}
                            updateItem={handleUpdateCompanyField}
                            onArchive={handleArchiveCompanyField}
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
                <Button variant="outline" className="w-full" onClick={handleAddCompanyField}>
                  <Plus className="w-4 h-4 mr-2" /> Add Company Field
                </Button>
                {archivedCompanyFields.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Archived Company Fields</h5>
                    {archivedCompanyFields.map(f => (
                      <div key={f.id} className="p-2 border rounded bg-muted/30 flex items-center justify-between mb-2">
                        <span className="text-sm">{f.label}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7" onClick={() => handleRestoreCompanyField(f.id)}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Restore
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => confirmDeleteItem(f.id, 'company')}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveCustomFields}>Save Custom Fields</Button>
            </div>
          </TabsContent>

          {/* Scripts Tab */}
          <TabsContent value="scripts" className="space-y-6 py-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Static Scripts</CardTitle>
                    <CardDescription>Pre-written scripts with placeholder support.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="script-enabled" className="text-sm">Show on Contact Card</Label>
                    <Switch
                      id="script-enabled"
                      checked={scriptSettings?.enabled ?? true}
                      onCheckedChange={(checked) => updateScriptSettings({ enabled: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {scriptsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : scripts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No scripts configured.</p>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndScripts}>
                    <SortableContext items={scripts.map(s => s.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {scripts.map(script => (
                          <SortableScriptItem
                            key={script.id}
                            script={script}
                            onUpdate={updateScript}
                            onDelete={(id) => confirmDeleteItem(id, 'script')}
                            onSetDefault={setDefaultScript}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <Button variant="outline" className="w-full" onClick={() => addScript({ name: 'New Script', content: '' })}>
                  <Plus className="w-4 h-4 mr-2" /> Add Script
                </Button>
                
                <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2 border">
                  <p className="font-medium">Available Placeholders:</p>
                  <div className="flex flex-wrap gap-1">
                    {['{first_name}', '{last_name}', '{company}', '{job_title}', '{email}', '{phone}', '{website}'].map(p => (
                      <code key={p} className="px-1.5 py-0.5 bg-background rounded text-muted-foreground">{p}</code>
                    ))}
                  </div>
                  <p className="text-muted-foreground">Custom fields can also be used with their field keys, e.g., {'{linkedin_url}'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outcomes Tab */}
          <TabsContent value="outcomes" className="space-y-6 py-4">
            {outcomesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <CardTitle className="text-base">Completed Options</CardTitle>
                    </div>
                    <CardDescription>Options shown when marking a contact as "Completed".</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCompletedOptions}>
                      <SortableContext items={completedOptions.map(o => o.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {completedOptions.map(option => (
                            <SortableOutcomeItem
                              key={option.id}
                              option={option}
                              onDelete={deleteOutcomeOption}
                              onUpdate={(id, label) => updateOutcomeOption(id, { label })}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        value={newCompletedLabel}
                        onChange={(e) => setNewCompletedLabel(e.target.value)}
                        placeholder="Add new option..."
                        className="flex-1 h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newCompletedLabel.trim()) {
                            const value = newCompletedLabel.toLowerCase().replace(/\s+/g, '_');
                            addOutcomeOption('completed', value, newCompletedLabel.trim());
                            setNewCompletedLabel('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        disabled={!newCompletedLabel.trim()}
                        onClick={() => {
                          const value = newCompletedLabel.toLowerCase().replace(/\s+/g, '_');
                          addOutcomeOption('completed', value, newCompletedLabel.trim());
                          setNewCompletedLabel('');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                      <CardTitle className="text-base">Not Interested Options</CardTitle>
                    </div>
                    <CardDescription>Options shown when marking a contact as "Not Interested".</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndNotInterestedOptions}>
                      <SortableContext items={notInterestedOptions.map(o => o.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {notInterestedOptions.map(option => (
                            <SortableOutcomeItem
                              key={option.id}
                              option={option}
                              onDelete={deleteOutcomeOption}
                              onUpdate={(id, label) => updateOutcomeOption(id, { label })}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                    <div className="flex gap-2 pt-2 border-t">
                      <Input
                        value={newNotInterestedLabel}
                        onChange={(e) => setNewNotInterestedLabel(e.target.value)}
                        placeholder="Add new option..."
                        className="flex-1 h-8"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newNotInterestedLabel.trim()) {
                            const value = newNotInterestedLabel.toLowerCase().replace(/\s+/g, '_');
                            addOutcomeOption('not_interested', value, newNotInterestedLabel.trim());
                            setNewNotInterestedLabel('');
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        className="h-8"
                        disabled={!newNotInterestedLabel.trim()}
                        onClick={() => {
                          const value = newNotInterestedLabel.toLowerCase().replace(/\s+/g, '_');
                          addOutcomeOption('not_interested', value, newNotInterestedLabel.trim());
                          setNewNotInterestedLabel('');
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6 py-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Webhook on Completion</CardTitle>
                    <CardDescription>Send contact data to an external service when marked as "Completed"</CardDescription>
                  </div>
                  <Switch
                    checked={webhookSettings.enabled}
                    onCheckedChange={(checked) => updateWebhookSettings({ enabled: checked })}
                  />
                </div>
              </CardHeader>
              {webhookSettings.enabled && (
                <CardContent className="space-y-4">
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
                      <span className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-green-500' : 'text-destructive'}`}>
                        {testResult.success ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {testResult.message}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-muted/50 rounded text-xs space-y-2 border">
                    <p className="font-medium">Payload sent on completion:</p>
                    <pre className="text-muted-foreground whitespace-pre-wrap">
{`{
  "event": "contact_completed",
  "contact": { ... },
  "companyData": { ... }
}`}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6 py-4">
            {isLoadingCalendly || isLoadingCalcom ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Calendly</CardTitle>
                          <CardDescription>Embed Calendly booking widget when marking appointments</CardDescription>
                        </div>
                      </div>
                      <Switch checked={calendlyEnabled} onCheckedChange={setCalendlyEnabled} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="calendly-url">Calendly URL</Label>
                      <Input
                        id="calendly-url"
                        type="url"
                        placeholder="https://calendly.com/your-name/30min"
                        value={calendlyUrl}
                        onChange={(e) => setCalendlyUrl(e.target.value)}
                        disabled={!calendlyEnabled}
                      />
                      <p className="text-xs text-muted-foreground">Your Calendly event URL.</p>
                    </div>
                    {calendlyEnabled && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                        <Label className="text-xs font-medium">Webhook URL (Optional)</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={webhookUrl} className="text-xs font-mono bg-background" />
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(webhookUrl)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add this URL in your{' '}
                          <a href="https://calendly.com/integrations/api_webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                            Calendly webhook settings <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSaveCalendly} disabled={!hasCalendlyChanges || isSavingCalendly}>
                        {isSavingCalendly ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Cal.com</CardTitle>
                          <CardDescription>Embed Cal.com booking widget when marking appointments</CardDescription>
                        </div>
                      </div>
                      <Switch checked={calcomEnabled} onCheckedChange={setCalcomEnabled} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="calcom-api-key">API Key</Label>
                      <Input
                        id="calcom-api-key"
                        type="password"
                        placeholder="cal_live_..."
                        value={calcomApiKey}
                        onChange={(e) => setCalcomApiKey(e.target.value)}
                        disabled={!calcomEnabled}
                      />
                      <p className="text-xs text-muted-foreground">
                        Get your API key from{' '}
                        <a href="https://cal.com/settings/developer/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                          cal.com/settings/developer/api-keys <ExternalLink className="w-3 h-3" />
                        </a>
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="calcom-slug">Event Type Slug</Label>
                      <Input
                        id="calcom-slug"
                        type="text"
                        placeholder="your-username/30min"
                        value={calcomEventSlug}
                        onChange={(e) => setCalcomEventSlug(e.target.value)}
                        disabled={!calcomEnabled}
                      />
                      <p className="text-xs text-muted-foreground">Your Cal.com event URL path (e.g., "john-doe/30min")</p>
                    </div>
                    
                    {/* Field Mappings Section */}
                    {calcomEnabled && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-sm font-medium">Field Mappings</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Map contact fields to Cal.com booking fields.
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={async () => {
                              if (!calcomApiKey) {
                                toast.error('Please enter your Cal.com API key first');
                                return;
                              }
                              const result = await fetchCalcomBookingFields(calcomEventSlug, calcomApiKey);
                              if (result.error) {
                                toast.error(result.error);
                              } else if (result.fields.length > 0) {
                                toast.success(`Found ${result.fields.length} booking fields`);
                              }
                            }}
                            disabled={!calcomEventSlug || !calcomApiKey || isFetchingCalcomFields}
                          >
                            {isFetchingCalcomFields ? (
                              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Fetching...</>
                            ) : (
                              'Fetch Fields'
                            )}
                          </Button>
                        </div>
                        
                        {calcomAvailableFields.length > 0 ? (
                          <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <Label className="text-xs">Phone Number</Label>
                              <Select
                                value={calcomFieldMappings.phone || '__none__'}
                                onValueChange={(value) => setCalcomFieldMappings(prev => ({ ...prev, phone: value === '__none__' ? undefined : value }))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {calcomAvailableFields.map(field => (
                                    <SelectItem key={field.slug} value={field.slug}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <Label className="text-xs">Company</Label>
                              <Select
                                value={calcomFieldMappings.company || '__none__'}
                                onValueChange={(value) => setCalcomFieldMappings(prev => ({ ...prev, company: value === '__none__' ? undefined : value }))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {calcomAvailableFields.map(field => (
                                    <SelectItem key={field.slug} value={field.slug}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <Label className="text-xs">Job Title</Label>
                              <Select
                                value={calcomFieldMappings.jobTitle || '__none__'}
                                onValueChange={(value) => setCalcomFieldMappings(prev => ({ ...prev, jobTitle: value === '__none__' ? undefined : value }))}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select field..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="__none__">None</SelectItem>
                                  {calcomAvailableFields.map(field => (
                                    <SelectItem key={field.slug} value={field.slug}>
                                      {field.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <Label className="text-xs">Phone Number</Label>
                              <Input
                                placeholder="e.g., phone or location"
                                value={calcomFieldMappings.phone || ''}
                                onChange={(e) => setCalcomFieldMappings(prev => ({ ...prev, phone: e.target.value || undefined }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <Label className="text-xs">Company</Label>
                              <Input
                                placeholder="e.g., company"
                                value={calcomFieldMappings.company || ''}
                                onChange={(e) => setCalcomFieldMappings(prev => ({ ...prev, company: e.target.value || undefined }))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2 items-center">
                              <Label className="text-xs">Job Title</Label>
                              <Input
                                placeholder="e.g., jobTitle"
                                value={calcomFieldMappings.jobTitle || ''}
                                onChange={(e) => setCalcomFieldMappings(prev => ({ ...prev, jobTitle: e.target.value || undefined }))}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                          Click "Fetch Fields" to load available booking fields from your Cal.com event.
                        </p>
                      </div>
                    )}
                    
                    {calcomEnabled && (
                      <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                        <Label className="text-xs font-medium">Webhook URL (Optional)</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={calcomWebhookUrl} className="text-xs font-mono bg-background" />
                          <Button variant="outline" size="sm" onClick={() => copyToClipboard(calcomWebhookUrl)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Add this URL in your{' '}
                          <a href="https://app.cal.com/settings/developer/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                            Cal.com webhook settings <ExternalLink className="w-3 h-3" />
                          </a>
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end pt-2">
                      <Button onClick={handleSaveCalcom} disabled={!hasCalcomChanges || isSavingCalcom}>
                        {isSavingCalcom ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Check className="w-4 h-4 mr-2" /> Save Changes</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-6 py-4">
            {/* Daily Call Target */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daily Call Target</CardTitle>
                <CardDescription>Set your daily call goal. Shown as a progress bar in the queue.</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  step={1}
                  value={dailyCallTargetLocal}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v) && v >= 1 && v <= 500) {
                      setDailyCallTargetLocal(v);
                      if (dailyTargetTimerRef.current) clearTimeout(dailyTargetTimerRef.current);
                      dailyTargetTimerRef.current = setTimeout(() => updateDailyCallTarget(v), 500);
                    }
                  }}
                  className="w-32"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Contact Card Section Order</CardTitle>
                </div>
                <CardDescription>Drag to reorder how sections appear on the contact card.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {sectionOrderLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSectionOrder}>
                    <SortableContext items={displaySectionOrder} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {displaySectionOrder.map((key) => (
                          <SortableSectionItem 
                            key={key} 
                            sectionKey={key}
                            showExpandToggle={EXPANDABLE_SECTIONS.includes(key)}
                            isExpanded={sectionExpandedDefaults[key] ?? false}
                            onExpandedChange={(checked) => updateExpandedDefault(key, checked)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={handleResetSectionOrder}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Reset to Default
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={handleSaveSectionOrder} 
                    disabled={!hasPendingSectionChanges || isSavingSectionOrder}
                  >
                    {isSavingSectionOrder ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                    ) : (
                      <><Check className="w-4 h-4 mr-2" /> Save Changes</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6 py-4">
            <InviteCodeManager />
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete this item AND clear all related data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
