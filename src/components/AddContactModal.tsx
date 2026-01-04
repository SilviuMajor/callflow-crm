import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact, CustomContactField } from '@/types/contact';
import { useCustomFields } from '@/hooks/useCustomFields';

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: Omit<Contact, 'id' | 'createdAt' | 'status'>) => void;
}

export function AddContactModal({ open, onOpenChange, onAdd }: AddContactModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: '',
    website: '',
    notes: '',
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const { fields: customFields } = useCustomFields();

  const activeCustomFields = customFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);

  const handleSubmit = () => {
    if (formData.firstName && formData.lastName && formData.phone) {
      onAdd({
        ...formData,
        customFields: customFieldValues,
      });
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        jobTitle: '',
        phone: '',
        email: '',
        website: '',
        notes: '',
      });
      setCustomFieldValues({});
      onOpenChange(false);
    }
  };

  const updateCustomField = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderCustomFieldInput = (field: CustomContactField) => {
    const value = customFieldValues[field.id] || '';

    switch (field.type) {
      case 'dropdown':
      case 'radio':
        return (
          <Select value={value} onValueChange={(v) => updateCustomField(field.id, v)}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'long_text':
        return (
          <Textarea
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="bg-secondary border-border"
          />
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="bg-secondary border-border"
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="bg-secondary border-border"
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="bg-secondary border-border"
            placeholder="https://"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="bg-secondary border-border"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="bg-secondary border-border"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Contact</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="bg-secondary border-border"
              placeholder="https://"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="bg-secondary border-border"
            />
          </div>

          {activeCustomFields.length > 0 && (
            <>
              <div className="border-t border-border pt-4">
                <span className="text-sm font-medium text-muted-foreground">Custom Fields</span>
              </div>
              {activeCustomFields.map(field => (
                <div key={field.id} className="grid gap-2">
                  <Label>{field.label}</Label>
                  {renderCustomFieldInput(field)}
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!formData.firstName || !formData.lastName || !formData.phone}
          >
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
