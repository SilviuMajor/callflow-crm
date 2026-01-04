import { Contact } from '@/types/contact';
import { Phone, Mail, Globe, FileText, ExternalLink } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">
          {contact.firstName} {contact.lastName}
        </h2>
        <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>
        <p className="text-sm font-medium text-primary">{contact.company}</p>
      </div>

      {/* Contact Details */}
      <div className="space-y-2">
        <a 
          href={`tel:${contact.phone}`} 
          className="flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <Phone className="w-4 h-4 text-success" />
          <span className="text-sm font-medium">{contact.phone}</span>
        </a>

        <a 
          href={`mailto:${contact.email}`}
          className="flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <Mail className="w-4 h-4 text-info" />
          <span className="text-sm truncate">{contact.email}</span>
        </a>

        <a 
          href={contact.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors"
        >
          <Globe className="w-4 h-4 text-warning" />
          <span className="text-sm truncate flex-1">{contact.website.replace('https://', '')}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </a>
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="p-2 rounded bg-muted/50 border border-border">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-foreground">{contact.notes}</p>
          </div>
        </div>
      )}

      {/* Callback indicator */}
      {contact.status === 'callback' && contact.callbackDate && (
        <div className="p-2 rounded bg-[hsl(var(--callback-light))] border border-[hsl(var(--callback))]">
          <p className="text-sm font-medium text-foreground">
            📞 Callback: {new Date(contact.callbackDate).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
