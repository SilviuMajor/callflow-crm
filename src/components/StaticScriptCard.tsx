import { useState, useEffect, useMemo } from 'react';
import { Contact, CustomContactField, CompanyField } from '@/types/contact';
import { ChevronDown, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useStaticScripts, StaticScript } from '@/hooks/useStaticScripts';
import { useStaticScriptSettings } from '@/hooks/useStaticScriptSettings';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { cn } from '@/lib/utils';

interface StaticScriptCardProps {
  contact: Contact;
}

export function StaticScriptCard({ contact }: StaticScriptCardProps) {
  const { enabledScripts, defaultScript, isLoading } = useStaticScripts();
  const { settings } = useStaticScriptSettings();
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { getCompanyFieldValues } = useCompanyData();

  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Set default expansion state from settings
  useEffect(() => {
    if (settings) {
      setIsOpen(settings.default_expanded);
    }
  }, [settings]);

  // Set default script when loaded
  useEffect(() => {
    if (!selectedScriptId && defaultScript) {
      setSelectedScriptId(defaultScript.id);
    }
  }, [selectedScriptId, defaultScript]);

  const selectedScript = useMemo(() => 
    enabledScripts.find(s => s.id === selectedScriptId) || defaultScript,
    [enabledScripts, selectedScriptId, defaultScript]
  );

  // Replace placeholders in the script content
  const renderedContent = useMemo(() => {
    if (!selectedScript) return '';

    let content = selectedScript.content;
    const companyFieldValues = contact.company ? getCompanyFieldValues(contact.company) : {};

    // Replace contact fields
    const contactPlaceholders: Record<string, string> = {
      '{first_name}': contact.firstName || '',
      '{last_name}': contact.lastName || '',
      '{company}': contact.company || '',
      '{job_title}': contact.jobTitle || '',
      '{email}': contact.email || '',
      '{phone}': contact.phone || '',
      '{website}': contact.website || '',
    };

    Object.entries(contactPlaceholders).forEach(([placeholder, value]) => {
      content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    // Replace custom contact fields
    customFields.filter(f => !f.isArchived).forEach(field => {
      const value = contact.customFields?.[field.id];
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '');
      content = content.replace(new RegExp(`\\{${field.key}\\}`, 'g'), displayValue);
    });

    // Replace company fields
    companyFields.filter(f => !f.isArchived).forEach(field => {
      const value = companyFieldValues[field.id];
      const displayValue = Array.isArray(value) ? value.join(', ') : String(value || '');
      content = content.replace(new RegExp(`\\{${field.key}\\}`, 'g'), displayValue);
    });

    return content;
  }, [selectedScript, contact, customFields, companyFields, getCompanyFieldValues]);

  // Don't render if settings disabled or no scripts available
  if (!settings?.enabled || isLoading || enabledScripts.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-muted/30">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Script</span>
            </div>
            <div className="flex items-center gap-2">
              {enabledScripts.length > 1 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <Select value={selectedScriptId || ''} onValueChange={setSelectedScriptId}>
                    <SelectTrigger className="h-7 w-32 text-xs">
                      <SelectValue placeholder="Select script" />
                    </SelectTrigger>
                    <SelectContent>
                      {enabledScripts.map(script => (
                        <SelectItem key={script.id} value={script.id} className="text-xs">
                          {script.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 border-t border-border">
            <div className="pt-3 text-sm whitespace-pre-wrap text-foreground">
              {renderedContent || <span className="text-muted-foreground italic">No content</span>}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
