import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Contact, CustomContactField, CompanyField } from '@/types/contact';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Building2, Plus } from 'lucide-react';
import { PotWithStats } from '@/hooks/usePots';

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (contact: Omit<Contact, 'id' | 'createdAt' | 'status'>, potId: string) => void;
  pots: PotWithStats[];
  onCreatePot: (name: string) => Promise<string | null>;
}

export function AddContactModal({ open, onOpenChange, onAdd, pots, onCreatePot }: AddContactModalProps) {
  const [selectedPotId, setSelectedPotId] = useState<string>('');
  const [isCreatingPot, setIsCreatingPot] = useState(false);
  const [newPotName, setNewPotName] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    jobTitle: '',
    phone: '',
    email: '',
    website: '',
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [companyFieldValues, setCompanyFieldValues] = useState<Record<string, any>>({});
  
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { getCompanyFieldValues, setCompanyFieldValues: saveCompanyData } = useCompanyData();

  const activeCustomFields = customFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const activeCompanyFields = companyFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);

  // Set default pot when pots load
  useEffect(() => {
    if (pots.length > 0 && !selectedPotId) {
      setSelectedPotId(pots[0].id);
    }
  }, [pots, selectedPotId]);

  // Load existing company data when company name changes
  useEffect(() => {
    if (formData.company) {
      const existingData = getCompanyFieldValues(formData.company);
      if (Object.keys(existingData).length > 0) {
        setCompanyFieldValues(existingData);
      }
    }
  }, [formData.company, getCompanyFieldValues]);

  const handleCreatePot = async () => {
    if (!newPotName.trim()) return;
    const potId = await onCreatePot(newPotName.trim());
    if (potId) {
      setSelectedPotId(potId);
      setNewPotName('');
      setIsCreatingPot(false);
    }
  };

  const handleSubmit = () => {
    if (formData.firstName && formData.lastName && formData.phone && selectedPotId) {
      // Save company fields to shared company data store
      if (formData.company && Object.keys(companyFieldValues).length > 0) {
        saveCompanyData(formData.company, companyFieldValues);
      }
      
      onAdd({
        ...formData,
        customFields: customFieldValues,
      }, selectedPotId);
      
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        jobTitle: '',
        phone: '',
        email: '',
        website: '',
      });
      setCustomFieldValues({});
      setCompanyFieldValues({});
      onOpenChange(false);
    }
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
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-secondary border-border"
          />
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-secondary border-border"
          />
        );
      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-secondary border-border"
          />
        );
      case 'url':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-secondary border-border"
            placeholder="https://"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-secondary border-border"
          />
        );
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
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
          {/* POT Selector */}
          <div className="grid gap-2">
            <Label>Select POT *</Label>
            {isCreatingPot ? (
              <div className="flex gap-2">
                <Input
                  value={newPotName}
                  onChange={(e) => setNewPotName(e.target.value)}
                  placeholder="New POT name..."
                  className="bg-secondary border-border"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreatePot} disabled={!newPotName.trim()}>
                  Create
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingPot(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Select value={selectedPotId} onValueChange={setSelectedPotId}>
                  <SelectTrigger className="bg-secondary border-border flex-1">
                    <SelectValue placeholder="Select a POT..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pots.map(pot => (
                      <SelectItem key={pot.id} value={pot.id}>
                        {pot.name} ({pot.totalRecords} records)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={() => setIsCreatingPot(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

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

          {/* Company Fields */}
          {activeCompanyFields.length > 0 && formData.company && (
            <>
              <div className="border-t border-primary/20 pt-4">
                <span className="text-sm font-medium text-primary flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  Company Fields (shared with all {formData.company} contacts)
                </span>
              </div>
              {activeCompanyFields.map(field => (
                <div key={field.id} className="grid gap-2">
                  <Label>{field.label}</Label>
                  {renderFieldInput(field, companyFieldValues[field.id], (v) => updateCompanyField(field.id, v))}
                </div>
              ))}
            </>
          )}

          {/* Contact Custom Fields */}
          {activeCustomFields.length > 0 && (
            <>
              <div className="border-t border-border pt-4">
                <span className="text-sm font-medium text-muted-foreground">Contact Fields</span>
              </div>
              {activeCustomFields.map(field => (
                <div key={field.id} className="grid gap-2">
                  <Label>{field.label}</Label>
                  {renderFieldInput(field, customFieldValues[field.id], (v) => updateCustomField(field.id, v))}
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
            disabled={!formData.firstName || !formData.lastName || !formData.phone || !selectedPotId}
          >
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
