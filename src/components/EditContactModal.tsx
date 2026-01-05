import { useState, useEffect } from 'react';
import { Contact, CustomContactField, CompanyField, QuestionType } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Building2 } from 'lucide-react';

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
  const [companyFieldValues, setCompanyFieldValues] = useState<Record<string, any>>({});
  
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { getCompanyFieldValues, setCompanyFieldValues: saveCompanyData } = useCompanyData();

  const activeCustomFields = customFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const activeCompanyFields = companyFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);

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
      // Load company data
      if (contact.company) {
        setCompanyFieldValues(getCompanyFieldValues(contact.company));
      }
    }
  }, [contact, getCompanyFieldValues]);

  const handleSave = () => {
    // Save company fields to shared company data store
    if (formData.company) {
      saveCompanyData(formData.company, companyFieldValues);
    }
    
    // Save contact-specific data
    onSave({
      ...formData,
      customFields: customFieldValues,
    });
    onOpenChange(false);
  };

  const updateCustomField = (fieldId: string, value: any) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const updateCompanyField = (fieldId: string, value: any) => {
    setCompanyFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  const renderFieldInput = (field: CustomContactField | CompanyField, value: any, onChange: (v: any) => void) => {
    switch (field.type) {
      case 'dropdown':
      case 'radio':
        return (
          <Select value={value || ''} onValueChange={onChange}>
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
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm min-h-[60px]"
          />
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm"
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm"
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm"
            placeholder="https://"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 text-sm"
          />
        );
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
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

          {/* Company Fields */}
          {activeCompanyFields.length > 0 && formData.company && (
            <>
              <div className="border-t border-primary/20 pt-3 mt-1">
                <span className="text-xs font-medium text-primary flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Company Fields (shared with all {formData.company} contacts)
                </span>
              </div>
              {activeCompanyFields.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  {renderFieldInput(field, companyFieldValues[field.id], (v) => updateCompanyField(field.id, v))}
                </div>
              ))}
            </>
          )}

          {/* Contact Custom Fields */}
          {activeCustomFields.length > 0 && (
            <>
              <div className="border-t border-border pt-3 mt-1">
                <span className="text-xs font-medium text-muted-foreground">Contact Fields</span>
              </div>
              {activeCustomFields.map(field => (
                <div key={field.id} className="space-y-1">
                  <Label className="text-xs">{field.label}</Label>
                  {renderFieldInput(field, customFieldValues[field.id], (v) => updateCustomField(field.id, v))}
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
