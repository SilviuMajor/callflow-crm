import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOutcomeOptions, OutcomeOption } from '@/hooks/useOutcomeOptions';
import { Plus, GripVertical, Trash2, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OutcomeSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SortableItem({ option, onDelete, onUpdate }: { 
  option: OutcomeOption; 
  onDelete: (id: string) => void;
  onUpdate: (id: string, label: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(option.label);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editLabel.trim() && editLabel !== option.label) {
      onUpdate(option.id, editLabel.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 bg-background border rounded-md"
    >
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
        <span 
          className="flex-1 text-sm cursor-pointer hover:text-primary"
          onClick={() => setIsEditing(true)}
        >
          {option.label}
        </span>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(option.id)}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function OptionsList({ 
  options, 
  outcomeType, 
  onDelete, 
  onUpdate, 
  onReorder,
  onAdd 
}: {
  options: OutcomeOption[];
  outcomeType: 'completed' | 'not_interested';
  onDelete: (id: string) => void;
  onUpdate: (id: string, label: string) => void;
  onReorder: (outcomeType: 'completed' | 'not_interested', ids: string[]) => void;
  onAdd: (label: string) => void;
}) {
  const [newLabel, setNewLabel] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((o) => o.id === active.id);
      const newIndex = options.findIndex((o) => o.id === over.id);
      const newOrder = arrayMove(options, oldIndex, newIndex);
      onReorder(outcomeType, newOrder.map(o => o.id));
    }
  };

  const handleAdd = () => {
    if (newLabel.trim()) {
      const value = newLabel.toLowerCase().replace(/\s+/g, '_');
      onAdd(newLabel.trim());
      setNewLabel('');
    }
  };

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={options.map(o => o.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {options.map((option) => (
              <SortableItem 
                key={option.id} 
                option={option} 
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex gap-2 pt-2 border-t">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Add new option..."
          className="flex-1 h-8"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <Button size="sm" className="h-8" onClick={handleAdd} disabled={!newLabel.trim()}>
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}

export function OutcomeSettingsDialog({ open, onOpenChange }: OutcomeSettingsDialogProps) {
  const { 
    completedOptions, 
    notInterestedOptions, 
    isLoading, 
    addOption, 
    updateOption, 
    deleteOption, 
    reorderOptions 
  } = useOutcomeOptions();

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Outcome Options</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="completed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="not_interested">Not Interested</TabsTrigger>
          </TabsList>
          
          <TabsContent value="completed" className="mt-4">
            <OptionsList
              options={completedOptions}
              outcomeType="completed"
              onDelete={deleteOption}
              onUpdate={(id, label) => updateOption(id, { label })}
              onReorder={reorderOptions}
              onAdd={(label) => {
                const value = label.toLowerCase().replace(/\s+/g, '_');
                addOption('completed', value, label);
              }}
            />
          </TabsContent>
          
          <TabsContent value="not_interested" className="mt-4">
            <OptionsList
              options={notInterestedOptions}
              outcomeType="not_interested"
              onDelete={deleteOption}
              onUpdate={(id, label) => updateOption(id, { label })}
              onReorder={reorderOptions}
              onAdd={(label) => {
                const value = label.toLowerCase().replace(/\s+/g, '_');
                addOption('not_interested', value, label);
              }}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
