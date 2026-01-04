import { Contact, COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-info/20 text-info border-info/30',
  no_answer: 'bg-destructive/20 text-destructive border-destructive/30',
  callback: 'bg-warning/20 text-warning border-warning/30',
  completed: 'bg-success/20 text-success border-success/30',
  not_interested: 'bg-muted text-muted-foreground border-muted',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  no_answer: 'No Answer',
  callback: 'Callback',
  completed: 'Completed',
  not_interested: 'Not Interested',
};

export function ContactList({ contacts, onSelectContact }: ContactListProps) {
  const getSubcategoryLabel = (contact: Contact) => {
    if (contact.status === 'completed' && contact.completedReason) {
      return COMPLETED_REASONS.find(r => r.value === contact.completedReason)?.label || '';
    }
    if (contact.status === 'not_interested' && contact.notInterestedReason) {
      return NOT_INTERESTED_REASONS.find(r => r.value === contact.notInterestedReason)?.label || '';
    }
    return '';
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary/50">
            <tr>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Name</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Company</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Phone</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left p-3 text-sm font-medium text-muted-foreground">Subcategory</th>
              <th className="text-right p-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map(contact => (
              <tr key={contact.id} className="hover:bg-secondary/30 transition-colors">
                <td className="p-3">
                  <div>
                    <p className="font-medium text-foreground">{contact.firstName} {contact.lastName}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                </td>
                <td className="p-3">
                  <div>
                    <p className="text-foreground">{contact.company}</p>
                    <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
                  </div>
                </td>
                <td className="p-3 text-foreground">{contact.phone}</td>
                <td className="p-3">
                  <Badge variant="outline" className={statusColors[contact.status]}>
                    {statusLabels[contact.status]}
                  </Badge>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {getSubcategoryLabel(contact)}
                </td>
                <td className="p-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectContact(contact)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {contacts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No contacts match your search criteria
        </div>
      )}
    </div>
  );
}
