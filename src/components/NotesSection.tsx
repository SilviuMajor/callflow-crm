import { useState } from 'react';
import { useContactHistory, HistoryEntry } from '@/hooks/useContactHistory';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface NotesSectionProps {
  contactId: string;
  onNoteAdded?: () => void;
}

export function NotesSection({ contactId, onNoteAdded }: NotesSectionProps) {
  const { history, addHistoryEntry, updateHistoryEntry, deleteHistoryEntry } = useContactHistory(contactId);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  const handleEditNote = async (id: string) => {
    if (!editValue.trim()) return;
    await updateHistoryEntry(id, { note: editValue.trim() });
    setEditingId(null);
    setEditValue('');
  };

  const handleDeleteNote = async (id: string) => {
    await deleteHistoryEntry(id);
    onNoteAdded?.();
  };

  const startEditing = (entry: HistoryEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.note || '');
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

      {/* Notes list */}
      {notes.length > 0 && (
        <div className="space-y-2">
          {notes.map((entry) => (
            <div 
              key={entry.id} 
              className="p-2 rounded border border-border bg-muted/30 group"
            >
              {editingId === entry.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="text-sm min-h-[60px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-6"
                      onClick={() => handleEditNote(entry.id)}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(entry.action_timestamp), 'MMM d, yyyy h:mm a')}
                    </span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => startEditing(entry)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteNote(entry.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap mt-1">
                    {entry.note}
                  </p>
                </>
              )}
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
