import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface NotesEditorProps {
  notes: string | null | undefined;
  onSave: (notes: string) => void;
}

export function NotesEditor({ notes, onSave }: NotesEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(notes || '');

  const handleStartEdit = () => {
    setEditValue(notes || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(notes || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-1">
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-sm min-h-[80px]"
          autoFocus
        />
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="sm" className="h-7" onClick={handleCancel}>
            Cancel
          </Button>
          <Button size="sm" className="h-7" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-2 rounded bg-muted/50 border border-border min-h-[60px] cursor-pointer hover:bg-muted/70"
      onClick={handleStartEdit}
    >
      <p className="text-sm text-foreground whitespace-pre-wrap">
        {notes || 'Click to add notes...'}
      </p>
    </div>
  );
}
