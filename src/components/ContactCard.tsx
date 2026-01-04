import { Contact } from '@/types/contact';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, User, Briefcase, Phone, Mail, Globe, FileText } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  return (
    <Card className="bg-card border-border animate-slide-in">
      <CardContent className="p-8">
        <div className="grid gap-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                {contact.firstName} {contact.lastName}
              </h2>
              <p className="text-xl text-muted-foreground mt-1">{contact.jobTitle}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-primary">
                <Building2 className="w-5 h-5" />
                <span className="text-xl font-semibold">{contact.company}</span>
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Phone className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <a href={`tel:${contact.phone}`} className="text-lg font-medium text-foreground hover:text-primary transition-colors">
                  {contact.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Mail className="w-5 h-5 text-info" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href={`mailto:${contact.email}`} className="text-lg font-medium text-foreground hover:text-primary transition-colors truncate block max-w-[250px]">
                  {contact.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Globe className="w-5 h-5 text-warning" />
              <div>
                <p className="text-sm text-muted-foreground">Website</p>
                <a 
                  href={contact.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors truncate block max-w-[250px]"
                >
                  {contact.website.replace('https://', '')}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg">
              <Briefcase className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Position</p>
                <p className="text-lg font-medium text-foreground">{contact.jobTitle}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-foreground">{contact.notes}</p>
              </div>
            </div>
          )}

          {/* Callback indicator */}
          {contact.status === 'callback' && contact.callbackDate && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
              <p className="text-warning font-medium">
                📞 Scheduled callback: {new Date(contact.callbackDate).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
