import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string;
  job_title: string | null;
  website: string | null;
  email: string | null;
  phone: string;
}

interface ScriptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: string;
}

const SAMPLE_DATA = {
  first_name: 'John',
  last_name: 'Smith',
  company: 'Acme Corp',
  company_name: 'Acme Corp',
  job_title: 'VP of Sales',
  website: 'https://acme.com',
  email: 'john@acme.com',
  phone: '555-123-4567',
  seller_company_name: 'Your Company',
  seller_product_offering: 'AI-powered sales tools',
  seller_usps: 'Save 40% time on research',
  seller_industry: 'SaaS',
  seller_pain_points_solved: 'manual research, slow outreach',
  seller_target_audience: 'B2B sales teams',
  seller_tone_style: 'professional yet friendly',
  company_research: '[AI will generate company research here based on the target company]',
  contact_persona: '[AI will generate contact persona insights here based on the contact role]',
};

export function ScriptPreviewDialog({ open, onOpenChange, template }: ScriptPreviewDialogProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('sample');
  const [sellerData, setSellerData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      // Fetch recent contacts for preview
      supabase
        .from('contacts')
        .select('id, first_name, last_name, company, job_title, website, email, phone')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) setContacts(data);
        });

      // Fetch seller data
      supabase
        .from('seller_company')
        .select('*')
        .limit(1)
        .single()
        .then(({ data }) => {
          if (data) {
            setSellerData({
              seller_company_name: data.company_name || '',
              seller_website: data.website || '',
              seller_product_offering: data.product_offering || '',
              seller_usps: data.usps || '',
              seller_industry: data.industry || '',
              seller_target_audience: data.target_audience || '',
              seller_tone_style: data.tone_style || '',
              seller_pain_points_solved: data.pain_points_solved || '',
            });
          }
        });
    }
  }, [open]);

  const previewContent = useMemo(() => {
    let preview = template;
    
    // Get data source
    const contactData = selectedContactId === 'sample' 
      ? SAMPLE_DATA 
      : contacts.find(c => c.id === selectedContactId);
    
    if (!contactData) return template;

    // Replace contact placeholders
    preview = preview.replace(/\{first_name\}/g, contactData.first_name || '');
    preview = preview.replace(/\{last_name\}/g, contactData.last_name || '');
    preview = preview.replace(/\{company\}/g, contactData.company || '');
    preview = preview.replace(/\{company_name\}/g, contactData.company || '');
    preview = preview.replace(/\{job_title\}/g, contactData.job_title || '');
    preview = preview.replace(/\{website\}/g, contactData.website || '');
    preview = preview.replace(/\{email\}/g, contactData.email || '');
    preview = preview.replace(/\{phone\}/g, contactData.phone || '');

    // Replace seller placeholders
    const sellerMerged = selectedContactId === 'sample' ? SAMPLE_DATA : sellerData;
    Object.entries(sellerMerged).forEach(([key, value]) => {
      if (key.startsWith('seller_')) {
        preview = preview.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
      }
    });

    // Replace AI research placeholders
    preview = preview.replace(/\{company_research\}/g, SAMPLE_DATA.company_research);
    preview = preview.replace(/\{contact_persona\}/g, SAMPLE_DATA.contact_persona);

    // Highlight AI blocks
    preview = preview.replace(
      /\{\{AI_BLOCK:([^}]+)\}\}/g,
      '<div class="my-2 p-3 rounded-lg bg-amber-50 border-2 border-amber-300 dark:bg-amber-950/30 dark:border-amber-600"><div class="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium mb-1"><span>✨ AI will generate:</span></div><div class="text-sm text-amber-800 dark:text-amber-300 italic">$1</div></div>'
    );

    return preview;
  }, [template, selectedContactId, contacts, sellerData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Script Preview
          </DialogTitle>
          <DialogDescription>
            Preview how your script will look with real or sample data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">Preview with:</Label>
            <Select value={selectedContactId} onValueChange={setSelectedContactId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sample">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3 w-3 text-amber-500" />
                    Sample Data (John Smith @ Acme Corp)
                  </span>
                </SelectItem>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name} @ {contact.company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[400px] rounded-lg border p-4 bg-muted/30">
            <div 
              className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: previewContent }}
            />
          </ScrollArea>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
