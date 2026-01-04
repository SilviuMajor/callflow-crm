import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Contact } from '@/types/contact';
import { toast } from 'sonner';

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]) => void;
}

export function ImportCSVModal({ open, onOpenChange, onImport }: ImportCSVModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<Omit<Contact, 'id' | 'createdAt' | 'status'>[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const contacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const contact: any = {
        firstName: '',
        lastName: '',
        company: '',
        jobTitle: '',
        phone: '',
        email: '',
        website: '',
        notes: '',
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header.includes('first') && header.includes('name')) contact.firstName = value;
        else if (header.includes('last') && header.includes('name')) contact.lastName = value;
        else if (header === 'name' || header === 'full name') {
          const parts = value.split(' ');
          contact.firstName = parts[0] || '';
          contact.lastName = parts.slice(1).join(' ') || '';
        }
        else if (header.includes('company') || header.includes('organization')) contact.company = value;
        else if (header.includes('title') || header.includes('position') || header.includes('job')) contact.jobTitle = value;
        else if (header.includes('phone') || header.includes('tel')) contact.phone = value;
        else if (header.includes('email')) contact.email = value;
        else if (header.includes('website') || header.includes('url') || header.includes('site')) contact.website = value;
        else if (header.includes('note')) contact.notes = value;
      });

      if (contact.firstName || contact.lastName || contact.phone) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      handleFile(file);
    }
  };

  const handleImport = () => {
    if (preview.length > 0) {
      onImport(preview);
      toast.success(`Imported ${preview.length} contacts`);
      setPreview([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Contacts from CSV</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a CSV file with columns: first name, last name, company, job title, phone, email, website, notes
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {preview.length === 0 ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/10' : 'border-border'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground mb-2">Drag and drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mb-4">or</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{preview.length} contacts ready to import</span>
              </div>
              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((contact, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">{contact.firstName} {contact.lastName}</td>
                        <td className="p-2">{contact.company}</td>
                        <td className="p-2">{contact.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="p-2 text-center text-muted-foreground text-sm">
                    ...and {preview.length - 10} more
                  </p>
                )}
              </div>
              <Button variant="outline" onClick={() => setPreview([])}>
                Choose Different File
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setPreview([]); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={preview.length === 0}
          >
            Import {preview.length} Contacts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
