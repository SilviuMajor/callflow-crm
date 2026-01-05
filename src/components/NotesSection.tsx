import { useState } from 'react';
import { useContactHistory } from '@/hooks/useContactHistory';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface NotesSectionProps {
  contactId: string;
  onNoteAdded?: () => void;
}

export function NotesSection({ contactId, onNoteAdded }: NotesSectionProps) {
  const { history, addHistoryEntry } = useContactHistory(contactId);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Filter only note entries
  const notes = history.filter(h => h.action_type === 'note');

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    await addHistoryEntry({
      contact_id: contactId,
      action_type: 'note',
      action_timestamp: new Date().toISOString(),
      note: newNote.trim(),
    });

    setNewNote('');
    setIsAdding(false);
    onNoteAdded?.();
  };

  return (
    <div className="space-y-2">
      {/* Add note section */}
      {isAdding ? (
        <div className="space-y-2">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note..."
            className="text-sm min-h-[60px]"
            autoFocus
          />
          <div className="flex justify-end gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7"
              onClick={() => {
                setIsAdding(false);
                setNewNote('');
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="h-7"
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              <Check className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full h-8 text-xs"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Note
        </Button>
      )}

      {/* Notes list (read-only) */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((entry) => (
            <div 
              key={entry.id} 
              className="p-2 rounded border border-border bg-muted/30"
            >
              <span className="text-xs text-muted-foreground">
                {format(new Date(entry.action_timestamp), 'MMM d, yyyy h:mm a')}
              </span>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
                {entry.note}
              </p>
            </div>
          ))}
        </div>
      )}

      {notes.length === 0 && !isAdding && (
        <p className="text-xs text-muted-foreground text-center py-2">
          No notes yet
        </p>
      )}
    </div>
  );
}
