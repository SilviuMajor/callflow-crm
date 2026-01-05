import { useState, useMemo } from 'react';
import { TopNav } from '@/components/TopNav';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { Contact, COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Phone, Mail, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QualifyingQuestionsSettings } from '@/components/QualifyingQuestionsSettings';
import { exportToCSV, exportToJSON } from '@/utils/exportData';

export default function CompletedPage() {
  const { completedContacts, clearContactAnswers } = useContacts();
  const { questions, setQuestions } = useQualifyingQuestions();
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { companyData } = useCompanyData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const filteredContacts = useMemo(() => {
    let filtered = completedContacts;
    
    if (filter !== 'all') {
      if (filter === 'completed') {
        filtered = filtered.filter(c => c.status === 'completed');
      } else if (filter === 'not_interested') {
        filtered = filtered.filter(c => c.status === 'not_interested');
      } else {
        filtered = filtered.filter(c => 
          c.completedReason === filter || c.notInterestedReason === filter
        );
      }
    }
    
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(c => 
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [completedContacts, search, filter]);

  const getReasonLabel = (contact: Contact) => {
    if (contact.status === 'completed' && contact.completedReason) {
      return COMPLETED_REASONS.find(r => r.value === contact.completedReason)?.label || contact.completedReason;
    }
    if (contact.status === 'not_interested' && contact.notInterestedReason) {
      return NOT_INTERESTED_REASONS.find(r => r.value === contact.notInterestedReason)?.label || contact.notInterestedReason;
    }
    return '';
  };

  const handleExportCSV = () => {
    exportToCSV(filteredContacts, questions, customFields, companyFields, companyData);
  };

  const handleExportJSON = () => {
    exportToJSON(filteredContacts, questions, companyData);
  };

  const handleSaveQuestions = (updatedQuestions: typeof questions, _applyToBlank: boolean, deletedIds: string[]) => {
    setQuestions(updatedQuestions);
    if (deletedIds.length > 0) {
      clearContactAnswers(deletedIds);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              {COMPLETED_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
              {NOT_INTERESTED_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-2">
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
        </p>
        
        {/* Table */}
        <div className="flex-1 overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Company</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Reason</th>
                <th className="text-left p-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No completed contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => (
                  <tr 
                    key={contact.id} 
                    className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedContact(contact)}
                  >
                    <td className="p-2">
                      <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                      <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                    </td>
                    <td className="p-2">{contact.company}</td>
                    <td className="p-2">
                      <Badge 
                        variant={contact.status === 'completed' ? 'default' : 'secondary'}
                        className={contact.status === 'completed' ? 'bg-success' : ''}
                      >
                        {contact.status === 'completed' ? 'Completed' : 'Not Interested'}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">{getReasonLabel(contact)}</td>
                    <td className="p-2 text-muted-foreground">
                      {contact.lastCalledAt?.toLocaleDateString() || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedContact.firstName} {selectedContact.lastName}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{selectedContact.jobTitle}</p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedContact.email}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <Badge 
                    variant={selectedContact.status === 'completed' ? 'default' : 'secondary'}
                    className={selectedContact.status === 'completed' ? 'bg-success' : ''}
                  >
                    {getReasonLabel(selectedContact)}
                  </Badge>
                </div>
                
                
                {selectedContact.qualifyingAnswers && Object.keys(selectedContact.qualifyingAnswers).length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Qualifying Answers</p>
                    <div className="space-y-1 text-sm">
                      {Object.entries(selectedContact.qualifyingAnswers).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <QualifyingQuestionsSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        questions={questions}
        onSave={handleSaveQuestions}
      />
    </div>
  );
}
