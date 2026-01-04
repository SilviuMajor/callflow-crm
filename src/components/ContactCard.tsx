import { useState } from 'react';
import { Contact } from '@/types/contact';
import { Phone, Mail, Globe, ExternalLink, Copy, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface ContactCardProps {
  contact: Contact;
  onUpdate?: (updates: Partial<Contact>) => void;
  onEditClick?: () => void;
}

export function ContactCard({ contact, onUpdate, onEditClick }: ContactCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

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

  const formatCallbackDate = (date: Date) => {
    return new Date(date).toLocaleString([], { 
      dateStyle: 'medium', 
      timeStyle: 'short' 
    });
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
