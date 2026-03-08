import { useState, useEffect } from 'react';
import { Users, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Linked Contacts at {company}
        </h3>
        <span className="text-xs text-muted-foreground">({linkedContacts.length})</span>
      </div>
      
      <div className="max-h-32 overflow-y-auto space-y-1 scrollbar-thin border border-border rounded-lg p-2 bg-card">
        {linkedContacts.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-2 text-center">
            No other contacts at this company
          </p>
        ) : (
          linkedContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => onSelectContact?.(contact.id)}
              className="flex items-center justify-between p-2 rounded hover:bg-secondary cursor-pointer group transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {contact.firstName} {contact.lastName}
                </span>
                {contact.jobTitle && (
                  <span className="text-xs text-muted-foreground ml-2">
                    — {contact.jobTitle}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
