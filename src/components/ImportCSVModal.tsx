import { useState, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Check, AlertCircle, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { Contact, CustomContactField, QuestionType, QUESTION_TYPES } from '@/types/contact';
import { useCustomFields } from '@/hooks/useCustomFields';
import { toast } from 'sonner';

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (contacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'review';

interface FieldMapping {
  csvHeader: string;
  targetField: string; // 'skip' | 'firstName' | 'lastName' | ... | 'custom:field_id' | 'create_new'
  confidence: 'high' | 'medium' | 'low' | 'none';
  newFieldConfig?: {
    label: string;
    key: string;
    type: QuestionType;
  };
}

const STANDARD_FIELDS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'jobTitle', label: 'Job Title' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'website', label: 'Website' },
  { key: 'notes', label: 'Notes' },
];

const STANDARD_FIELD_ALIASES: Record<string, string[]> = {
  firstName: ['first name', 'firstname', 'first', 'given name', 'givenname'],
  lastName: ['last name', 'lastname', 'last', 'surname', 'family name', 'familyname'],
  company: ['company', 'organization', 'org', 'business', 'employer', 'company name'],
  jobTitle: ['title', 'job title', 'jobtitle', 'position', 'role', 'job'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'cell', 'phone number', 'phonenumber'],
  email: ['email', 'e-mail', 'email address', 'emailaddress', 'mail'],
  website: ['website', 'site', 'url', 'web', 'homepage', 'web site'],
  notes: ['notes', 'note', 'comments', 'comment', 'description'],
};

function autoMatchColumn(csvHeader: string, customFields: CustomContactField[]): { targetField: string; confidence: 'high' | 'medium' | 'low' | 'none' } {
  const normalized = csvHeader.toLowerCase().trim();
  
  // Check standard fields
  for (const [fieldKey, aliases] of Object.entries(STANDARD_FIELD_ALIASES)) {
    if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
      return { targetField: fieldKey, confidence: normalized === aliases[0] ? 'high' : 'medium' };
    }
  }
  
  // Check custom fields
  for (const field of customFields) {
    const fieldLabel = field.label.toLowerCase();
    const fieldKey = field.key.toLowerCase();
    if (normalized === fieldLabel || normalized === fieldKey || normalized.includes(fieldLabel)) {
      return { targetField: `custom:${field.id}`, confidence: normalized === fieldLabel ? 'high' : 'medium' };
    }
  }
  
  return { targetField: 'skip', confidence: 'none' };
}

export function ImportCSVModal({ open, onOpenChange, onImport }: ImportCSVModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [showNewFieldForm, setShowNewFieldForm] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { fields: customFields, addField } = useCustomFields();

  const parseCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      if (values.some(v => v)) {
        rows.push(values);
      }
    }

    return { headers, rows };
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      
      if (headers.length === 0) {
        toast.error('Invalid CSV file');
        return;
      }

      setCsvHeaders(headers);
      setCsvRows(rows);
      
      // Auto-match columns
      const autoMappings: FieldMapping[] = headers.map(header => {
        const match = autoMatchColumn(header, customFields);
        return {
          csvHeader: header,
          targetField: match.targetField,
          confidence: match.confidence,
        };
      });
      
      setMappings(autoMappings);
      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      handleFile(file);
    } else {
      toast.error('Please upload a CSV file');
    }
  };

  const updateMapping = (index: number, targetField: string) => {
    setMappings(prev => prev.map((m, i) => 
      i === index 
        ? { ...m, targetField, confidence: targetField === 'skip' ? 'none' : 'high', newFieldConfig: undefined }
        : m
    ));
    if (targetField === 'create_new') {
      setShowNewFieldForm(index);
    } else {
      setShowNewFieldForm(null);
    }
  };

  const createNewField = (index: number, config: { label: string; key: string; type: QuestionType }) => {
    const newFieldId = addField({ 
      key: config.key, 
      label: config.label, 
      type: config.type 
    });
    
    setMappings(prev => prev.map((m, i) => 
      i === index 
        ? { ...m, targetField: `custom:${newFieldId}`, confidence: 'high', newFieldConfig: undefined }
        : m
    ));
    setShowNewFieldForm(null);
    toast.success(`Created new field: ${config.label}`);
  };

  const mappedContacts = useMemo(() => {
    if (step !== 'review') return [];
    
    return csvRows.map(row => {
      const contact: any = {
        firstName: '',
        lastName: '',
        company: '',
        jobTitle: '',
        phone: '',
        email: '',
        website: '',
        notes: '',
        customFields: {},
      };

      mappings.forEach((mapping, index) => {
        const value = row[index] || '';
        if (mapping.targetField === 'skip') return;
        
        if (mapping.targetField.startsWith('custom:')) {
          const fieldId = mapping.targetField.replace('custom:', '');
          contact.customFields[fieldId] = value;
        } else {
          contact[mapping.targetField] = value;
        }
      });

      return contact;
    }).filter(c => c.firstName || c.lastName || c.phone || c.email);
  }, [csvRows, mappings, step]);

  const handleImport = () => {
    if (mappedContacts.length > 0) {
      onImport(mappedContacts);
      toast.success(`Imported ${mappedContacts.length} contacts`);
      resetState();
      onOpenChange(false);
    }
  };

  const resetState = () => {
    setStep('upload');
    setCsvHeaders([]);
    setCsvRows([]);
    setMappings([]);
    setShowNewFieldForm(null);
  };

  const getFieldLabel = (targetField: string) => {
    if (targetField === 'skip') return 'Skip';
    if (targetField === 'create_new') return 'Create New Field';
    if (targetField.startsWith('custom:')) {
      const fieldId = targetField.replace('custom:', '');
      const field = customFields.find(f => f.id === fieldId);
      return field ? `${field.label} (custom)` : 'Unknown Field';
    }
    const standard = STANDARD_FIELDS.find(f => f.key === targetField);
    return standard ? standard.label : targetField;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) resetState(); onOpenChange(isOpen); }}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Import Contacts from CSV
            {step !== 'upload' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                Step {step === 'mapping' ? '2' : '3'} of 3: {step === 'mapping' ? 'Map Fields' : 'Review & Import'}
              </span>
            )}
          </DialogTitle>
          {step === 'upload' && (
            <DialogDescription className="text-muted-foreground">
              Upload a CSV file to import contacts. You'll be able to map columns to fields in the next step.
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="py-4">
          {step === 'upload' && (
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
          )}

          {step === 'mapping' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Map your CSV columns to contact fields. Auto-matched fields are highlighted.
              </p>
              
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-3 font-medium">CSV Column</th>
                      <th className="text-left p-3 font-medium">Map To</th>
                      <th className="text-left p-3 font-medium w-24">Match</th>
                      <th className="text-left p-3 font-medium">Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.map((mapping, index) => (
                      <tr key={index} className="border-t border-border">
                        <td className="p-3 font-medium">{mapping.csvHeader}</td>
                        <td className="p-3">
                          {showNewFieldForm === index ? (
                            <NewFieldForm 
                              defaultLabel={mapping.csvHeader}
                              onSave={(config) => createNewField(index, config)}
                              onCancel={() => {
                                setShowNewFieldForm(null);
                                updateMapping(index, 'skip');
                              }}
                            />
                          ) : (
                            <Select 
                              value={mapping.targetField} 
                              onValueChange={(v) => updateMapping(index, v)}
                            >
                              <SelectTrigger className="h-8 w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="skip">Skip this column</SelectItem>
                                {STANDARD_FIELDS.map(field => (
                                  <SelectItem key={field.key} value={field.key}>
                                    {field.label}
                                  </SelectItem>
                                ))}
                                {customFields.filter(f => !f.isArchived).map(field => (
                                  <SelectItem key={field.id} value={`custom:${field.id}`}>
                                    {field.label} (custom)
                                  </SelectItem>
                                ))}
                                <SelectItem value="create_new">
                                  <span className="flex items-center gap-1">
                                    <Plus className="w-3 h-3" />
                                    Create new field
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                        <td className="p-3">
                          {mapping.confidence === 'high' && (
                            <span className="flex items-center gap-1 text-success">
                              <Check className="w-4 h-4" /> Auto
                            </span>
                          )}
                          {mapping.confidence === 'medium' && (
                            <span className="flex items-center gap-1 text-warning">
                              <Check className="w-4 h-4" /> Likely
                            </span>
                          )}
                          {mapping.confidence === 'none' && mapping.targetField !== 'skip' && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground truncate max-w-32">
                          {csvRows[0]?.[index] || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{csvRows.length} rows found in file</span>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-success">
                <FileText className="w-5 h-5" />
                <span className="font-medium">{mappedContacts.length} contacts ready to import</span>
              </div>

              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-2">Field mapping summary:</p>
                <div className="grid grid-cols-2 gap-1">
                  {mappings.filter(m => m.targetField !== 'skip').map((mapping, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-foreground">{mapping.csvHeader}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{getFieldLabel(mapping.targetField)}</span>
                    </div>
                  ))}
                </div>
                {mappings.filter(m => m.targetField === 'skip').length > 0 && (
                  <p className="mt-2 text-muted-foreground/70">
                    {mappings.filter(m => m.targetField === 'skip').length} columns skipped
                  </p>
                )}
              </div>

              <div className="max-h-60 overflow-y-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-secondary sticky top-0">
                    <tr>
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Company</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mappedContacts.slice(0, 10).map((contact, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">{contact.firstName} {contact.lastName}</td>
                        <td className="p-2">{contact.company}</td>
                        <td className="p-2">{contact.phone}</td>
                        <td className="p-2">{contact.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {mappedContacts.length > 10 && (
                  <p className="p-2 text-center text-muted-foreground text-sm">
                    ...and {mappedContacts.length - 10} more
                  </p>
                )}
              </div>

              {mappedContacts.length === 0 && (
                <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded">
                  <AlertCircle className="w-5 h-5" />
                  <span>No valid contacts found. Please check your field mappings.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => { resetState(); }}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep('review')}>
                Next: Review
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}
          
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleImport}
                disabled={mappedContacts.length === 0}
              >
                Import {mappedContacts.length} Contacts
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewFieldForm({ 
  defaultLabel, 
  onSave, 
  onCancel 
}: { 
  defaultLabel: string; 
  onSave: (config: { label: string; key: string; type: QuestionType }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(defaultLabel);
  const [key, setKey] = useState(defaultLabel.toLowerCase().replace(/\s+/g, '_'));
  const [type, setType] = useState<QuestionType>('short_text');

  return (
    <div className="space-y-2 p-2 border border-border rounded bg-muted/30">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Label</Label>
          <Input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'));
            }}
            className="h-7 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as QuestionType)}>
            <SelectTrigger className="h-7 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-1">
        <Button size="sm" className="h-7" onClick={() => onSave({ label, key, type })}>
          Create
        </Button>
        <Button size="sm" variant="outline" className="h-7" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
