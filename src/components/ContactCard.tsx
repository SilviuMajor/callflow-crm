import { useState, useEffect } from 'react';
import { Contact, CustomContactField, CompanyField } from '@/types/contact';
import { Phone, Mail, Globe, ExternalLink, Copy, Pencil, Check, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useAIResearch } from '@/hooks/useAIResearch';
import { AIResearchBox } from '@/components/AIResearchBox';
import { InlineEditField } from '@/components/InlineEditField';
import { LinkedContacts } from '@/components/LinkedContacts';
import { supabase } from '@/integrations/supabase/client';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

interface ContactCardProps {
  contact: Contact;
  onUpdate?: (updates: Partial<Contact>) => void;
  onEditClick?: () => void;
  onSelectContact?: (contactId: string) => void;
}

interface AICache {
  ai_summary?: string | null;
  ai_summary_updated_at?: string | null;
  ai_custom_research?: string | null;
  ai_custom_updated_at?: string | null;
}

export function ContactCard({ contact, onUpdate, onEditClick, onSelectContact }: ContactCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { getCompanyData, updateCompanyData } = useCompanyData();
  const { isResearching, researchCompany, researchCompanyCustom, researchPersona } = useAIResearch();

  // AI Research state
  const [companyAI, setCompanyAI] = useState<AICache>({});
  const [contactPersona, setContactPersona] = useState<string | null>(null);
  const [personaUpdatedAt, setPersonaUpdatedAt] = useState<string | null>(null);

  const activeCustomFields = customFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const activeCompanyFields = companyFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const companyData = contact.company ? getCompanyData(contact.company) : {};

  // Load AI research data on mount or contact change (NO auto-research)
  useEffect(() => {
    const loadAIData = async () => {
      // Load company AI data
      if (contact.company) {
        const { data: companyResult } = await supabase
          .from('company_data')
          .select('ai_summary, ai_summary_updated_at, ai_custom_research, ai_custom_updated_at')
          .eq('company_name', contact.company)
          .single();

        if (companyResult) {
          setCompanyAI(companyResult);
        } else {
          setCompanyAI({});
        }
      }

      // Load contact persona from the contact itself
      const { data: contactResult } = await supabase
        .from('contacts')
        .select('ai_persona, ai_persona_updated_at')
        .eq('id', contact.id)
        .single();

      if (contactResult) {
        setContactPersona(contactResult.ai_persona);
        setPersonaUpdatedAt(contactResult.ai_persona_updated_at);
      }
    };

    loadAIData();
  }, [contact.id, contact.company]);

  const handleRefreshCompanySearch = async () => {
    if (!contact.company) return;
    const result = await researchCompany(contact.company, contact.website);
    if (result) {
      setCompanyAI(prev => ({
        ...prev,
        ai_summary: result,
        ai_summary_updated_at: new Date().toISOString()
      }));
    }
  };

  const handleRefreshCustomResearch = async () => {
    if (!contact.company) return;
    const result = await researchCompanyCustom(contact.company, contact.website);
    if (result) {
      setCompanyAI(prev => ({
        ...prev,
        ai_custom_research: result,
        ai_custom_updated_at: new Date().toISOString()
      }));
    }
  };

  const handleRefreshPersona = async () => {
    const result = await researchPersona(contact);
    if (result) {
      setContactPersona(result);
      setPersonaUpdatedAt(new Date().toISOString());
    }
  };

  const copyToClipboard = async (value: string, fieldName: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    toast({ title: 'Copied to clipboard', duration: 1500 });
    setTimeout(() => setCopiedField(null), 1500);
  };

  const openGmail = () => {
    window.open(`https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(contact.email)}`, '_blank');
  };

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const saveField = (field: string) => {
    if (onUpdate) {
      onUpdate({ [field]: editValue });
    }
    setEditingField(null);
  };

  const saveCustomField = (fieldId: string) => {
    if (onUpdate) {
      onUpdate({ 
        customFields: { 
          ...contact.customFields, 
          [fieldId]: editValue 
        } 
      });
    }
    setEditingField(null);
  };

  const saveCompanyField = (fieldId: string) => {
    if (contact.company) {
      updateCompanyData(contact.company, fieldId, editValue);
      toast({ title: 'Company data updated', description: 'Applied to all contacts at this company', duration: 2000 });
    }
    setEditingField(null);
  };

  const formatCallbackDate = (date: Date) => {
    return new Date(date).toLocaleString([], { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
  };

  const getCustomFieldValue = (field: CustomContactField): string => {
    const value = contact.customFields?.[field.id];
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const getCompanyFieldValue = (field: CompanyField): string => {
    const value = companyData[field.id];
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const renderFieldInput = (field: CustomContactField | CompanyField, isCompany: boolean) => {
    const value = editValue;

    switch (field.type) {
      case 'dropdown':
        return (
          <Select value={value} onValueChange={setEditValue}>
            <SelectTrigger className="h-7 text-sm">
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
            onChange={(e) => setEditValue(e.target.value)}
            className="text-sm min-h-[60px]"
            autoFocus
          />
        );
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : field.type === 'number' || field.type === 'currency' ? 'number' : 'text'}
            onKeyDown={(e) => e.key === 'Enter' && (isCompany ? saveCompanyField(field.id) : saveCustomField(field.id))}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Callback indicator - at top */}
      {contact.status === 'callback' && contact.callbackDate && (
        <div className="p-2 rounded bg-[hsl(var(--callback-light))] border border-[hsl(var(--callback))]">
          <p className="text-sm font-medium text-foreground">
            📞 Callback: {formatCallbackDate(contact.callbackDate)}
          </p>
        </div>
      )}

      {/* Header - Edit button only */}
      {onEditClick && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEditClick}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Two-column resizable layout (stacks on mobile) */}
      <div className="hidden md:block">
        <ResizablePanelGroup direction="horizontal" className="min-h-[300px] rounded-lg border border-border">
          {/* LEFT BLOCK: Company Info */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="space-y-3 p-3 h-full bg-card overflow-y-auto">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Company Info
              </h3>
              
              {/* Company - LARGER */}
              <div className="group flex items-center gap-2">
                {editingField === 'company' ? (
                  <div className="flex-1 flex gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-9 text-lg font-semibold"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveField('company')}
                    />
                    <Button size="sm" className="h-9 w-9 p-0" onClick={() => saveField('company')}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span 
                      className="text-lg font-semibold text-primary flex-1 cursor-pointer hover:text-primary/80 truncate"
                      onClick={() => onUpdate && startEditing('company', contact.company)}
                    >
                      {contact.company}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      onClick={() => copyToClipboard(contact.company, 'company')}
                    >
                      {copiedField === 'company' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </>
                )}
              </div>

              {/* Website */}
              <div className="group flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Website:</span>
                <div className="flex-1 min-w-0">
                  <InlineEditField
                    value={contact.website || ''}
                    onSave={(value) => onUpdate?.({ website: value })}
                    placeholder="Add website..."
                    type="url"
                    className="text-sm truncate"
                  />
                </div>
                {contact.website && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      onClick={() => copyToClipboard(contact.website || '', 'website')}
                    >
                      {copiedField === 'website' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                    <a 
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </a>
                  </>
                )}
              </div>

              {/* Company Summary - inside left block */}
              {contact.company && (
                <AIResearchBox
                  title="Company Summary"
                  content={companyAI.ai_summary}
                  isLoading={isResearching[`company_${contact.company}`] || false}
                  onRefresh={handleRefreshCompanySearch}
                  lastUpdated={companyAI.ai_summary_updated_at}
                  variant="company"
                  buttonLabel="Refresh"
                  maxCollapsedLines={5}
                />
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* RIGHT BLOCK: Contact Details + Custom Fields */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="space-y-3 p-3 h-full bg-card overflow-y-auto">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <User className="w-3 h-3" />
                Contact Details
              </h3>
              
              {/* Contact Name - BIG and editable */}
              <div className="group flex items-center gap-2">
                {editingField === 'firstName' ? (
                  <div className="flex-1 flex gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-10 text-xl font-bold"
                      autoFocus
                      placeholder="First name"
                      onKeyDown={(e) => e.key === 'Enter' && saveField('firstName')}
                    />
                    <Button size="sm" className="h-10 w-10 p-0" onClick={() => saveField('firstName')}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : editingField === 'lastName' ? (
                  <div className="flex-1 flex gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-10 text-xl font-bold"
                      autoFocus
                      placeholder="Last name"
                      onKeyDown={(e) => e.key === 'Enter' && saveField('lastName')}
                    />
                    <Button size="sm" className="h-10 w-10 p-0" onClick={() => saveField('lastName')}>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-1">
                    <span 
                      className="text-xl font-bold text-foreground cursor-pointer hover:text-primary"
                      onClick={() => onUpdate && startEditing('firstName', contact.firstName)}
                    >
                      {contact.firstName}
                    </span>
                    <span 
                      className="text-xl font-bold text-foreground cursor-pointer hover:text-primary"
                      onClick={() => onUpdate && startEditing('lastName', contact.lastName)}
                    >
                      {contact.lastName}
                    </span>
                  </div>
                )}
              </div>

              {/* Job Title - under name */}
              <div className="group flex items-center gap-2">
                {editingField === 'jobTitle' ? (
                  <div className="flex-1 flex gap-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && saveField('jobTitle')}
                    />
                    <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveField('jobTitle')}>
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span 
                      className="text-sm text-muted-foreground flex-1 cursor-pointer hover:text-foreground truncate"
                      onClick={() => onUpdate && startEditing('jobTitle', contact.jobTitle)}
                    >
                      {contact.jobTitle || <span className="text-muted-foreground/50">Click to add title...</span>}
                    </span>
                    {contact.jobTitle && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={() => copyToClipboard(contact.jobTitle, 'jobTitle')}
                      >
                        {copiedField === 'jobTitle' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Phone */}
              <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
                <Phone className="w-4 h-4 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <InlineEditField
                    value={contact.phone}
                    onSave={(value) => onUpdate?.({ phone: value })}
                    placeholder="Add phone..."
                    type="tel"
                    className="text-sm font-medium"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  onClick={() => copyToClipboard(contact.phone, 'phone')}
                >
                  {copiedField === 'phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>

              {/* Email */}
              <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
                <Mail className="w-4 h-4 text-info shrink-0" />
                <div className="flex-1 min-w-0">
                  <InlineEditField
                    value={contact.email || ''}
                    onSave={(value) => onUpdate?.({ email: value })}
                    placeholder="Add email..."
                    type="email"
                    className="text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  onClick={() => copyToClipboard(contact.email || '', 'email')}
                >
                  {copiedField === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs flex-shrink-0"
                  onClick={openGmail}
                >
                  Gmail
                </Button>
              </div>

              {/* Custom Contact Fields */}
              {activeCustomFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground font-medium">Custom Fields</span>
                  {activeCustomFields.map(field => {
                    const fieldValue = getCustomFieldValue(field);
                    const isEditing = editingField === `custom_${field.id}`;
                    
                    return (
                      <div key={field.id} className="group flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0" title={field.label}>
                          {field.label}:
                        </span>
                        {isEditing ? (
                          <div className="flex-1 flex gap-1">
                            {renderFieldInput(field, false)}
                            <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveCustomField(field.id)}>
                              <Check className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span 
                              className="text-sm text-foreground flex-1 cursor-pointer hover:text-primary truncate"
                              onClick={() => onUpdate && startEditing(`custom_${field.id}`, fieldValue)}
                            >
                              {fieldValue || <span className="text-muted-foreground/50">Click to add...</span>}
                            </span>
                            {fieldValue && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                onClick={() => copyToClipboard(fieldValue, `custom_${field.id}`)}
                              >
                                {copiedField === `custom_${field.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Linked Contacts - inside Contact Details */}
              <LinkedContacts
                company={contact.company}
                currentContactId={contact.id}
                onSelectContact={onSelectContact}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile stacked layout */}
      <div className="md:hidden space-y-4">
        {/* LEFT BLOCK: Company Info */}
        <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Company Info
          </h3>
          
          {/* Company - LARGER */}
          <div className="group flex items-center gap-2">
            {editingField === 'company' ? (
              <div className="flex-1 flex gap-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-9 text-lg font-semibold"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveField('company')}
                />
                <Button size="sm" className="h-9 w-9 p-0" onClick={() => saveField('company')}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <span 
                  className="text-lg font-semibold text-primary flex-1 cursor-pointer hover:text-primary/80 truncate"
                  onClick={() => onUpdate && startEditing('company', contact.company)}
                >
                  {contact.company}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  onClick={() => copyToClipboard(contact.company, 'company')}
                >
                  {copiedField === 'company' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
              </>
            )}
          </div>

          {/* Website */}
          <div className="group flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">Website:</span>
            <div className="flex-1 min-w-0">
              <InlineEditField
                value={contact.website || ''}
                onSave={(value) => onUpdate?.({ website: value })}
                placeholder="Add website..."
                type="url"
                className="text-sm truncate"
              />
            </div>
            {contact.website && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                  onClick={() => copyToClipboard(contact.website || '', 'website')}
                >
                  {copiedField === 'website' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
                <a 
                  href={contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                </a>
              </>
            )}
          </div>

          {/* Company Summary */}
          {contact.company && (
            <AIResearchBox
              title="Company Summary"
              content={companyAI.ai_summary}
              isLoading={isResearching[`company_${contact.company}`] || false}
              onRefresh={handleRefreshCompanySearch}
              lastUpdated={companyAI.ai_summary_updated_at}
              variant="company"
              buttonLabel="Refresh"
              maxCollapsedLines={5}
            />
          )}
        </div>

        {/* RIGHT BLOCK: Contact Details + Custom Fields */}
        <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <User className="w-3 h-3" />
            Contact Details
          </h3>
          
          {/* Contact Name - BIG and editable */}
          <div className="group flex items-center gap-2">
            {editingField === 'firstName' ? (
              <div className="flex-1 flex gap-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-10 text-xl font-bold"
                  autoFocus
                  placeholder="First name"
                  onKeyDown={(e) => e.key === 'Enter' && saveField('firstName')}
                />
                <Button size="sm" className="h-10 w-10 p-0" onClick={() => saveField('firstName')}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : editingField === 'lastName' ? (
              <div className="flex-1 flex gap-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-10 text-xl font-bold"
                  autoFocus
                  placeholder="Last name"
                  onKeyDown={(e) => e.key === 'Enter' && saveField('lastName')}
                />
                <Button size="sm" className="h-10 w-10 p-0" onClick={() => saveField('lastName')}>
                  <Check className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-1">
                <span 
                  className="text-xl font-bold text-foreground cursor-pointer hover:text-primary"
                  onClick={() => onUpdate && startEditing('firstName', contact.firstName)}
                >
                  {contact.firstName}
                </span>
                <span 
                  className="text-xl font-bold text-foreground cursor-pointer hover:text-primary"
                  onClick={() => onUpdate && startEditing('lastName', contact.lastName)}
                >
                  {contact.lastName}
                </span>
              </div>
            )}
          </div>

          {/* Job Title - under name */}
          <div className="group flex items-center gap-2">
            {editingField === 'jobTitle' ? (
              <div className="flex-1 flex gap-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && saveField('jobTitle')}
                />
                <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveField('jobTitle')}>
                  <Check className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <>
                <span 
                  className="text-sm text-muted-foreground flex-1 cursor-pointer hover:text-foreground truncate"
                  onClick={() => onUpdate && startEditing('jobTitle', contact.jobTitle)}
                >
                  {contact.jobTitle || <span className="text-muted-foreground/50">Click to add title...</span>}
                </span>
                {contact.jobTitle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                    onClick={() => copyToClipboard(contact.jobTitle, 'jobTitle')}
                  >
                    {copiedField === 'jobTitle' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Phone */}
          <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
            <Phone className="w-4 h-4 text-success shrink-0" />
            <div className="flex-1 min-w-0">
              <InlineEditField
                value={contact.phone}
                onSave={(value) => onUpdate?.({ phone: value })}
                placeholder="Add phone..."
                type="tel"
                className="text-sm font-medium"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={() => copyToClipboard(contact.phone, 'phone')}
            >
              {copiedField === 'phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>

          {/* Email */}
          <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
            <Mail className="w-4 h-4 text-info shrink-0" />
            <div className="flex-1 min-w-0">
              <InlineEditField
                value={contact.email || ''}
                onSave={(value) => onUpdate?.({ email: value })}
                placeholder="Add email..."
                type="email"
                className="text-sm"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={() => copyToClipboard(contact.email || '', 'email')}
            >
              {copiedField === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs flex-shrink-0"
              onClick={openGmail}
            >
              Gmail
            </Button>
          </div>

          {/* Custom Contact Fields */}
          {activeCustomFields.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground font-medium">Custom Fields</span>
              {activeCustomFields.map(field => {
                const fieldValue = getCustomFieldValue(field);
                const isEditing = editingField === `custom_${field.id}`;
                
                return (
                  <div key={field.id} className="group flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20 truncate flex-shrink-0" title={field.label}>
                      {field.label}:
                    </span>
                    {isEditing ? (
                      <div className="flex-1 flex gap-1">
                        {renderFieldInput(field, false)}
                        <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveCustomField(field.id)}>
                          <Check className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span 
                          className="text-sm text-foreground flex-1 cursor-pointer hover:text-primary truncate"
                          onClick={() => onUpdate && startEditing(`custom_${field.id}`, fieldValue)}
                        >
                          {fieldValue || <span className="text-muted-foreground/50">Click to add...</span>}
                        </span>
                        {fieldValue && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            onClick={() => copyToClipboard(fieldValue, `custom_${field.id}`)}
                          >
                            {copiedField === `custom_${field.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Linked Contacts - inside Contact Details (mobile) */}
          <LinkedContacts
            company={contact.company}
            currentContactId={contact.id}
            onSelectContact={onSelectContact}
          />
        </div>
      </div>

      {/* AI Research Sections - Custom Research and Persona */}
      <div className="space-y-3">
        {/* Custom Company Research */}
        <AIResearchBox
          title="Custom Research"
          content={companyAI.ai_custom_research}
          isLoading={isResearching[`custom_${contact.company}`] || false}
          onRefresh={handleRefreshCustomResearch}
          lastUpdated={companyAI.ai_custom_updated_at}
          variant="custom"
          buttonLabel="Run Research"
          maxCollapsedLines={5}
        />

        {/* Persona */}
        <AIResearchBox
          title="Persona"
          content={contactPersona}
          isLoading={isResearching[`persona_${contact.id}`] || false}
          onRefresh={handleRefreshPersona}
          lastUpdated={personaUpdatedAt}
          variant="persona"
          buttonLabel="Refresh"
          maxCollapsedLines={5}
        />
      </div>

      {/* Company Fields */}
      {activeCompanyFields.length > 0 && contact.company && (
        <div className="space-y-2 p-2 rounded border border-primary/20 bg-primary/5">
          <span className="text-xs text-primary font-medium flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Company Data (syncs to all {contact.company} contacts)
          </span>
          {activeCompanyFields.map(field => {
            const fieldValue = getCompanyFieldValue(field);
            const isEditing = editingField === `company_${field.id}`;
            
            return (
              <div key={field.id} className="group flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24 truncate flex-shrink-0" title={field.label}>
                  {field.label}:
                </span>
                {isEditing ? (
                  <div className="flex-1 flex gap-1">
                    {renderFieldInput(field, true)}
                    <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveCompanyField(field.id)}>
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span 
                      className="text-sm text-foreground flex-1 cursor-pointer hover:text-primary truncate"
                      onClick={() => startEditing(`company_${field.id}`, fieldValue)}
                    >
                      {fieldValue || <span className="text-muted-foreground/50">Click to add...</span>}
                    </span>
                    {fieldValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                        onClick={() => copyToClipboard(fieldValue, `company_${field.id}`)}
                      >
                        {copiedField === `company_${field.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editable Notes */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Notes</span>
        {editingField === 'notes' ? (
          <div className="space-y-1">
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="text-sm min-h-[80px]"
              autoFocus
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditingField(null)}>
                Cancel
              </Button>
              <Button size="sm" className="h-7" onClick={() => saveField('notes')}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="p-2 rounded bg-muted/50 border border-border min-h-[60px] cursor-pointer hover:bg-muted/70"
            onClick={() => onUpdate && startEditing('notes', contact.notes)}
          >
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {contact.notes || 'Click to add notes...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
