import { useState, useEffect } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface LinkedContact {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
}

interface LinkedContactsProps {
  company: string;
  currentContactId: string;
  onSelectContact?: (contactId: string) => void;
}

export function LinkedContacts({ company, currentContactId, onSelectContact }: LinkedContactsProps) {
  const { profile } = useAuth();
  const organizationId = profile?.organization_id;
  const [linkedContacts, setLinkedContacts] = useState<LinkedContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLinkedContacts = async () => {
      if (!company || !organizationId) {
        setLinkedContacts([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, job_title')
        .eq('company', company)
        .eq('organization_id', organizationId)
        .neq('id', currentContactId)
        .order('last_name');

      if (data && !error) {
        setLinkedContacts(data.map(row => ({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          jobTitle: row.job_title || ''
        })));
      }
      setIsLoading(false);
    };

    fetchLinkedContacts();
  }, [company, currentContactId, organizationId]);

  if (!company || isLoading) return null;

  const count = linkedContacts.length;

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Users className="w-3 h-3" />
          {count} {count === 1 ? 'contact' : 'contacts'}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="absolute z-10 mt-1 w-56 rounded-md border border-border bg-card shadow-md">
          {linkedContacts.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2 px-3 text-center">
              No other contacts at this company
            </p>
          ) : (
            <div className="py-1">
              {linkedContacts.map(contact => (
                <div
                  key={contact.id}
                  onClick={(e) => { e.stopPropagation(); onSelectContact?.(contact.id); }}
                  className="flex items-center justify-between px-3 py-1.5 hover:bg-secondary cursor-pointer group transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block truncate">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {contact.jobTitle && (
                      <span className="text-xs text-muted-foreground block truncate">
                        {contact.jobTitle}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
