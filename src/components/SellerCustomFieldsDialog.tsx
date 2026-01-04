import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { useSellerCustomFields, SellerCustomField } from '@/hooks/useSellerCustomFields';
import { Skeleton } from '@/components/ui/skeleton';

const FIELD_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

interface SellerCustomFieldsDialogProps {
  trigger?: React.ReactNode;
}

export function SellerCustomFieldsDialog({ trigger }: SellerCustomFieldsDialogProps) {
  const { fields, isLoading, addField, updateField, archiveField } = useSellerCustomFields();
  const [open, setOpen] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<SellerCustomField['type']>('short_text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const needsOptions = ['dropdown', 'radio', 'checkbox'].includes(newFieldType);

  const handleAddField = async () => {
    if (!newFieldLabel.trim()) return;
    
    setIsAdding(true);
    try {
      const options = needsOptions 
        ? newFieldOptions.split(',').map(o => o.trim()).filter(Boolean)
        : undefined;
      
      await addField(newFieldLabel.trim(), newFieldType, options);
      setNewFieldLabel('');
      setNewFieldType('short_text');
      setNewFieldOptions('');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            Manage Custom Fields
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Custom Company Fields</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Existing fields */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Custom Fields</Label>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : fields.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">No custom fields yet. Add one below.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {fields.map((field) => (
                  <div 
                    key={field.id} 
                    className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{field.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}
                        {field.options?.length ? ` (${field.options.length} options)` : ''}
                      </div>
                    </div>
                    <code className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                      {`{seller_${field.key}}`}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => archiveField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add new field */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-sm font-medium">Add New Field</Label>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="field-label" className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    id="field-label"
                    placeholder="e.g., Priority Tier"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="field-type" className="text-xs text-muted-foreground">Type</Label>
                  <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as SellerCustomField['type'])}>
                    <SelectTrigger id="field-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {needsOptions && (
                <div>
                  <Label htmlFor="field-options" className="text-xs text-muted-foreground">
                    Options (comma-separated)
                  </Label>
                  <Input
                    id="field-options"
                    placeholder="Option 1, Option 2, Option 3"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                  />
                </div>
              )}

              <Button 
                onClick={handleAddField} 
                disabled={!newFieldLabel.trim() || isAdding}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Field
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
