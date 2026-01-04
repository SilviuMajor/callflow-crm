import { useState, useEffect, useRef } from 'react';
import { Contact, CustomContactField, CompanyField } from '@/types/contact';
import { Phone, Mail, Globe, ExternalLink, Copy, Pencil, Check, Building2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface ContactCardProps {
  contact: Contact;
  onUpdate?: (updates: Partial<Contact>) => void;
  onEditClick?: () => void;
}

interface AICache {
  ai_summary?: string | null;
  ai_summary_updated_at?: string | null;
  ai_custom_research?: string | null;
  ai_custom_updated_at?: string | null;
}

export function ContactCard({ contact, onUpdate, onEditClick }: ContactCardProps) {
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
  const hasAutoResearched = useRef<Record<string, boolean>>({});

  const activeCustomFields = customFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const activeCompanyFields = companyFields.filter(f => !f.isArchived).sort((a, b) => a.order - b.order);
  const companyData = contact.company ? getCompanyData(contact.company) : {};

  // Load AI research data on mount or contact change
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

        // Auto-research company on first view if no summary exists
        const companyKey = `company_${contact.company}`;
        if (!companyResult?.ai_summary && !hasAutoResearched.current[companyKey]) {
          hasAutoResearched.current[companyKey] = true;
          const result = await researchCompany(contact.company, contact.website);
          if (result) {
            setCompanyAI(prev => ({
              ...prev,
              ai_summary: result,
              ai_summary_updated_at: new Date().toISOString()
            }));
          }
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

      // Auto-research persona on first view if none exists
      const personaKey = `persona_${contact.id}`;
      if (!contactResult?.ai_persona && !hasAutoResearched.current[personaKey]) {
        hasAutoResearched.current[personaKey] = true;
        const result = await researchPersona(contact);
        if (result) {
          setContactPersona(result);
          setPersonaUpdatedAt(new Date().toISOString());
        }
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

      {/* Header */}
      <div className="flex items-start justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {contact.firstName} {contact.lastName}
        </h2>
        {onEditClick && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onEditClick}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Editable Job Title & Company */}
      <div className="space-y-2">
        <div className="group flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Title:</span>
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
                className="text-sm text-muted-foreground flex-1 cursor-pointer hover:text-foreground"
                onClick={() => onUpdate && startEditing('jobTitle', contact.jobTitle)}
              >
                {contact.jobTitle}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => copyToClipboard(contact.jobTitle, 'jobTitle')}
              >
                {copiedField === 'jobTitle' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </>
          )}
        </div>

        <div className="group flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16">Company:</span>
          {editingField === 'company' ? (
            <div className="flex-1 flex gap-1">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveField('company')}
              />
              <Button size="sm" className="h-7 w-7 p-0" onClick={() => saveField('company')}>
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <span 
                className="text-sm font-medium text-primary flex-1 cursor-pointer hover:text-primary/80"
                onClick={() => onUpdate && startEditing('company', contact.company)}
              >
                {contact.company}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => copyToClipboard(contact.company, 'company')}
              >
                {copiedField === 'company' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-2">
        <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
          <Phone className="w-4 h-4 text-success shrink-0" />
          <a href={`tel:${contact.phone}`} className="text-sm font-medium flex-1">
            {contact.phone}
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => copyToClipboard(contact.phone, 'phone')}
          >
            {copiedField === 'phone' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>

        <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
          <Mail className="w-4 h-4 text-info shrink-0" />
          <a href={`mailto:${contact.email}`} className="text-sm truncate flex-1">
            {contact.email}
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => copyToClipboard(contact.email, 'email')}
          >
            {copiedField === 'email' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={openGmail}
          >
            Gmail
          </Button>
        </div>

        <div className="group flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors">
          <Globe className="w-4 h-4 text-warning shrink-0" />
          <a 
            href={contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm truncate flex-1"
          >
            {contact.website.replace('https://', '')}
          </a>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            onClick={() => copyToClipboard(contact.website, 'website')}
          >
            {copiedField === 'website' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          <a 
            href={contact.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* AI Research Sections */}
      <div className="space-y-3">
        {/* Company Summary */}
        <AIResearchBox
          title="Company Summary"
          content={companyAI.ai_summary}
          isLoading={isResearching[`company_${contact.company}`] || false}
          onRefresh={handleRefreshCompanySearch}
          lastUpdated={companyAI.ai_summary_updated_at}
          variant="company"
          buttonLabel="Refresh"
        />

        {/* Custom Company Research */}
        <AIResearchBox
          title="Custom Research"
          content={companyAI.ai_custom_research}
          isLoading={isResearching[`custom_${contact.company}`] || false}
          onRefresh={handleRefreshCustomResearch}
          lastUpdated={companyAI.ai_custom_updated_at}
          variant="custom"
          buttonLabel="Run Research"
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
                <span className="text-xs text-muted-foreground w-24 truncate" title={field.label}>
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
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
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

      {/* Custom Fields */}
      {activeCustomFields.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground font-medium">Contact Fields</span>
          {activeCustomFields.map(field => {
            const fieldValue = getCustomFieldValue(field);
            const isEditing = editingField === `custom_${field.id}`;
            
            return (
              <div key={field.id} className="group flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-24 truncate" title={field.label}>
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
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
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
