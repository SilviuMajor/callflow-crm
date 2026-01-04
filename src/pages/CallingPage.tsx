import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { TopNav } from '@/components/TopNav';
import { QueueList } from '@/components/QueueList';
import { ContactCard } from '@/components/ContactCard';
import { OutcomePanel } from '@/components/OutcomePanel';
import { QualifyingFields } from '@/components/QualifyingFields';
import { QualifyingQuestionsSettings } from '@/components/QualifyingQuestionsSettings';
import { AddContactModal } from '@/components/AddContactModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { CallStatus, CompletedReason, NotInterestedReason } from '@/types/contact';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';

export default function CallingPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const {
    queueContacts,
    currentContact,
    updateContactStatus,
    updateContactAnswers,
    selectContact,
    shufflePending,
    sortByCompany,
    addContact,
    importContacts,
  } = useContacts();
  
  const { questions, setQuestions } = useQualifyingQuestions();

  const handleAction = (
    status: CallStatus,
    callbackDate?: Date,
    notes?: string,
    completedReason?: CompletedReason,
    notInterestedReason?: NotInterestedReason
  ) => {
    if (!currentContact) return;
    
    updateContactStatus(currentContact.id, status, callbackDate, notes, completedReason, notInterestedReason);
    
    const messages: Record<CallStatus, string> = {
      'no_answer': 'Marked as no answer',
      'callback': `Callback scheduled for ${callbackDate?.toLocaleString()}`,
      'completed': 'Marked as completed',
      'not_interested': 'Marked as not interested',
      'pending': 'Status updated',
    };
    
    toast({
      title: messages[status],
      duration: 2000,
    });
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    if (!currentContact) return;
    updateContactAnswers(currentContact.id, { [questionId]: value });
  };

  const handleSaveQuestions = (newQuestions: typeof questions, applyToBlank: boolean) => {
    setQuestions(newQuestions);
    toast({
      title: 'Questions saved',
      description: applyToBlank ? 'Applied to contacts with blank fields' : undefined,
      duration: 2000,
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav onSettingsClick={() => setShowSettings(true)} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Queue */}
        <QueueList
          contacts={queueContacts}
          currentContactId={currentContact?.id || null}
          onSelectContact={selectContact}
          onShuffle={shufflePending}
          onSortByCompany={sortByCompany}
        />
        
        {/* Center: Current Contact */}
        <div className="flex-1 p-4 overflow-y-auto">
          {currentContact ? (
            <ContactCard contact={currentContact} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm">No contacts in queue</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Contact
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
                  <Upload className="w-4 h-4 mr-1" />
                  Import CSV
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Right: Outcomes & Qualifying */}
        <div className="w-72 border-l border-border bg-card p-3 overflow-y-auto space-y-4">
          {currentContact && (
            <>
              <OutcomePanel contact={currentContact} onAction={handleAction} />
              
              <div className="border-t border-border pt-3">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                  Qualifying
                </h3>
                <QualifyingFields
                  questions={questions}
                  answers={currentContact.qualifyingAnswers || {}}
                  onChange={handleAnswerChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <QualifyingQuestionsSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        questions={questions}
        onSave={handleSaveQuestions}
      />
      
      <AddContactModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={addContact}
      />
      
      <ImportCSVModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={importContacts}
      />
    </div>
  );
}
