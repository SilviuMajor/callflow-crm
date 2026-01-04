import { useState, useEffect } from 'react';
import { Contact, CustomContactField, QuestionType } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCustomFields } from '@/hooks/useCustomFields';

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  onSave: (updates: Partial<Contact>) => void;
}

export function EditContactModal({ open, onOpenChange, contact, onSave }: EditContactModalProps) {
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

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        jobTitle: contact.jobTitle,
        phone: contact.phone,
        email: contact.email,
        website: contact.website,
        notes: contact.notes,
      });
      setCustomFieldValues(contact.customFields || {});
    }
  }, [contact]);

  const handleSave = () => {
    onSave({
      ...formData,
      customFields: customFieldValues,
    });
    onOpenChange(false);
  };

  const updateCustomField = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderCustomFieldInput = (field: CustomContactField) => {
    const value = customFieldValues[field.id] || '';

    switch (field.type) {
      case 'dropdown':
        return (
          <Select value={value} onValueChange={(v) => updateCustomField(field.id, v)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <Select value={value} onValueChange={(v) => updateCustomField(field.id, v)}>
            <SelectTrigger className="h-8 text-sm">
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
            className="text-sm min-h-[60px]"
          />
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="h-8 text-sm"
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="h-8 text-sm"
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="h-8 text-sm"
            placeholder="https://"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="h-8 text-sm"
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateCustomField(field.id, e.target.value)}
            className="h-8 text-sm"
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="company" className="text-xs">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="jobTitle" className="text-xs">Job Title</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="website" className="text-xs">Website</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="text-sm min-h-[80px]"
            />
          </div>

          {activeCustomFields.length > 0 && (
            <>
              <div className="border-t border-border pt-3 mt-1">
                <span className="text-xs font-medium text-muted-foreground">Custom Fields</span>
              </div>
              {activeCustomFields.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  {renderCustomFieldInput(field)}
                </div>
              ))}
            </>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
