import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PotWithStats } from '@/hooks/usePots';
import { Pencil, Trash2, GitMerge, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface POTManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pots: PotWithStats[];
  onRenamePot: (potId: string, newName: string) => Promise<boolean>;
  onDeletePot: (potId: string, moveContactsToPotId?: string) => Promise<boolean>;
  onMergePots: (sourcePotId: string, targetPotId: string) => Promise<boolean>;
}

export function POTManagementDialog({
  open,
  onOpenChange,
  pots,
  onRenamePot,
  onDeletePot,
  onMergePots,
}: POTManagementDialogProps) {
  const [editingPotId, setEditingPotId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmPot, setDeleteConfirmPot] = useState<PotWithStats | null>(null);
  const [deleteAction, setDeleteAction] = useState<'delete' | 'move'>('move');
  const [moveToTargetId, setMoveToTargetId] = useState<string>('');
  const [mergingPotId, setMergingPotId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  const handleStartEdit = (pot: PotWithStats) => {
    setEditingPotId(pot.id);
    setEditingName(pot.name);
  };

  const handleSaveEdit = async () => {
    if (!editingPotId || !editingName.trim()) return;
    const success = await onRenamePot(editingPotId, editingName.trim());
    if (success) {
      setEditingPotId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingPotId(null);
    setEditingName('');
  };

  const handleOpenDeleteConfirm = (pot: PotWithStats) => {
    setDeleteConfirmPot(pot);
    setDeleteAction(pot.totalRecords > 0 ? 'move' : 'delete');
    setMoveToTargetId(pots.find(p => p.id !== pot.id)?.id || '');
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmPot) return;
    const moveToId = deleteAction === 'move' ? moveToTargetId : undefined;
    const success = await onDeletePot(deleteConfirmPot.id, moveToId);
    if (success) {
      setDeleteConfirmPot(null);
    }
  };

  const handleStartMerge = (potId: string) => {
    setMergingPotId(potId);
    setMergeTargetId(pots.find(p => p.id !== potId)?.id || '');
  };

  const handleConfirmMerge = async () => {
    if (!mergingPotId || !mergeTargetId) return;
    const success = await onMergePots(mergingPotId, mergeTargetId);
    if (success) {
      setMergingPotId(null);
      setMergeTargetId('');
    }
  };

  const otherPots = (excludeId: string) => pots.filter(p => p.id !== excludeId);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage POTs</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {pots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No POTs created yet
              </p>
            ) : (
              pots.map(pot => (
                <div
                  key={pot.id}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30"
                >
                  {editingPotId === pot.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveEdit}>
                        <Check className="w-4 h-4 text-success" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : mergingPotId === pot.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Merge into:</span>
                      <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                        <SelectTrigger className="h-8 flex-1">
                          <SelectValue placeholder="Select target POT" />
                        </SelectTrigger>
                        <SelectContent>
                          {otherPots(pot.id).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleConfirmMerge} disabled={!mergeTargetId}>
                        <Check className="w-4 h-4 text-success" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setMergingPotId(null)}>
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{pot.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {pot.totalRecords} contacts
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleStartEdit(pot)}
                          title="Rename"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {pots.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleStartMerge(pot.id)}
                            title="Merge into another POT"
                          >
                            <GitMerge className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleOpenDeleteConfirm(pot)}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmPot} onOpenChange={(open) => !open && setDeleteConfirmPot(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Delete "{deleteConfirmPot?.name}"?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {deleteConfirmPot && deleteConfirmPot.totalRecords > 0 ? (
                  <>
                    <p className="text-destructive font-medium">
                      Warning: This POT contains {deleteConfirmPot.totalRecords} contact{deleteConfirmPot.totalRecords > 1 ? 's' : ''}.
                    </p>
                    <p>
                      What would you like to do with them? If you choose to delete contacts, 
                      all their data, history, and notes will be permanently lost.
                    </p>
                  </>
                ) : (
                  <p>
                    This POT is empty and will be deleted permanently. 
                    <span className="text-destructive font-medium"> This action cannot be undone.</span>
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteConfirmPot && deleteConfirmPot.totalRecords > 0 && (
            <div className="space-y-3 py-2">
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
                  deleteAction === 'move' ? "border-primary bg-primary/5" : "border-border"
                )}
                onClick={() => setDeleteAction('move')}
              >
                <input
                  type="radio"
                  checked={deleteAction === 'move'}
                  onChange={() => setDeleteAction('move')}
                  className="accent-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Move contacts to another POT</p>
                  {deleteAction === 'move' && (
                    <Select value={moveToTargetId} onValueChange={setMoveToTargetId}>
                      <SelectTrigger className="h-8 mt-2">
                        <SelectValue placeholder="Select POT" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherPots(deleteConfirmPot.id).map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              
              <div
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer",
                  deleteAction === 'delete' ? "border-destructive bg-destructive/5" : "border-border"
                )}
                onClick={() => setDeleteAction('delete')}
              >
                <input
                  type="radio"
                  checked={deleteAction === 'delete'}
                  onChange={() => setDeleteAction('delete')}
                  className="accent-destructive"
                />
                <div>
                  <p className="text-sm font-medium text-destructive">Delete all contacts</p>
                  <p className="text-xs text-muted-foreground">This cannot be undone</p>
                </div>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAction === 'move' && !moveToTargetId}
            >
              Delete POT
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
