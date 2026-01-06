import { useState, useRef, useEffect, useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { usePots } from '@/hooks/usePots';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useIsMobile } from '@/hooks/use-mobile';
import { TopNav } from '@/components/TopNav';
import { QueueList } from '@/components/QueueList';
import { ContactCard } from '@/components/ContactCard';
import { OutcomePanel } from '@/components/OutcomePanel';
import { QualifyingFields } from '@/components/QualifyingFields';
import { QualifyingQuestionsSettings } from '@/components/QualifyingQuestionsSettings';
import { AddContactModal } from '@/components/AddContactModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { MobilePanelIndicator } from '@/components/MobilePanelIndicator';
import { NotesSection } from '@/components/NotesSection';
import { CallStatus, CompletedReason, NotInterestedReason, Contact } from '@/types/contact';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Upload } from 'lucide-react';
import { exportToCSV, exportToJSON } from '@/utils/exportData';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function CallingPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activePanel, setActivePanel] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // POTs management
  const { potsWithStats, selectedPotId, selectPot, createPot, renamePot, deletePot, mergePots, refreshStats, totalStats } = usePots();
  
  const {
    contacts,
    queueContacts,
    currentContact,
    updateContactStatus,
    updateContact,
    updateContactAnswers,
    clearContactAnswers,
    selectContact,
    shufflePending,
    sortByCompany,
    addContact,
    importContacts,
  } = useContacts(selectedPotId);
  
  const { questions, setQuestions } = useQualifyingQuestions();
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { companyData } = useCompanyData();

  // Create a map of contact ID to pot name for display in queue
  const contactPotMap = useMemo(() => {
    const map: Record<string, string> = {};
    contacts.forEach(contact => {
      if (contact.potId) {
        const pot = potsWithStats.find(p => p.id === contact.potId);
        if (pot) {
          map[contact.id] = pot.name;
        }
      }
    });
    return map;
  }, [contacts, potsWithStats]);

  // Refresh POT stats when contacts change
  useEffect(() => {
    refreshStats();
  }, [contacts, refreshStats]);

  // Handle scroll snap end to update active panel indicator
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isMobile) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const panelWidth = container.clientWidth;
      const newActivePanel = Math.round(scrollLeft / panelWidth);
      setActivePanel(newActivePanel);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Scroll to panel when indicator is clicked
  const scrollToPanel = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const panelWidth = container.clientWidth;
    container.scrollTo({
      left: index * panelWidth,
      behavior: 'smooth'
    });
    setActivePanel(index);
  };

  const handleAction = (
    status: CallStatus,
    callbackDate?: Date,
    notes?: string,
    completedReason?: CompletedReason,
    notInterestedReason?: NotInterestedReason,
    appointmentDate?: Date
  ) => {
    if (!currentContact) return;
    
    updateContactStatus(currentContact.id, status, callbackDate, notes, completedReason, notInterestedReason, appointmentDate);
    
    const messages: Record<CallStatus, string> = {
      'no_answer': 'Marked as no answer',
      'callback': `Callback scheduled for ${callbackDate?.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`,
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

  const handleSaveQuestions = (newQuestions: typeof questions, applyToBlank: boolean, deletedQuestionIds: string[]) => {
    if (deletedQuestionIds.length > 0) {
      clearContactAnswers(deletedQuestionIds);
    }
    
    setQuestions(newQuestions);
    toast({
      title: 'Questions saved',
      description: applyToBlank ? 'Applied to contacts with blank fields' : undefined,
      duration: 2000,
    });
  };

  const handleUpdateContact = (updates: Partial<Contact>) => {
    if (!currentContact) return;
    updateContact(currentContact.id, updates);
  };

  const handleExportCSV = () => {
    exportToCSV(contacts, questions, customFields, companyFields, companyData);
    toast({ title: 'Exported as CSV', duration: 2000 });
  };

  const handleExportJSON = () => {
    exportToJSON(contacts, questions, companyData);
    toast({ title: 'Exported as JSON', duration: 2000 });
  };

  const handleSelectContact = (contactId: string) => {
    selectContact(contactId);
    if (isMobile) {
      scrollToPanel(1);
    }
  };

  const handleAddContact = async (contact: Omit<Contact, 'id' | 'createdAt' | 'status'>, potId: string) => {
    await addContact(contact, potId);
    refreshStats();
  };

  const handleImportContacts = async (newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[], potId: string) => {
    await importContacts(newContacts, potId);
    refreshStats();
  };

  const activeQuestions = questions.filter(q => !q.isArchived);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopNav 
          onSettingsClick={() => setShowSettings(true)} 
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onImportClick={() => setShowImportModal(true)}
        />
        
        <div 
          ref={scrollContainerRef}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto" style={{ minWidth: '100%' }}>
            <QueueList
              contacts={queueContacts}
              currentContactId={currentContact?.id || null}
              onSelectContact={handleSelectContact}
              onShuffle={shufflePending}
              onSortByCompany={sortByCompany}
              isMobile={true}
              pots={potsWithStats}
              selectedPotId={selectedPotId}
              onSelectPot={selectPot}
              totalStats={totalStats}
              contactPotMap={contactPotMap}
              onRenamePot={renamePot}
              onDeletePot={deletePot}
              onMergePots={mergePots}
            />
          </div>
          
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto p-4" style={{ minWidth: '100%' }}>
            {currentContact ? (
              <ContactCard 
                contact={currentContact} 
                onUpdate={handleUpdateContact}
                onSelectContact={handleSelectContact}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm">No contacts in queue</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowImportModal(true)}>
                    <Upload className="w-4 h-4 mr-1" />
                    Import
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto p-3 space-y-4" style={{ minWidth: '100%' }}>
            {currentContact && (
              <>
                <OutcomePanel contact={currentContact} onAction={handleAction} />
                
                <div className="border-t border-border pt-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Notes
                  </h3>
                  <NotesSection
                    contactId={currentContact.id}
                  />
                </div>
                
                <div className="border-t border-border pt-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Qualifying
                  </h3>
                  <QualifyingFields
                    questions={activeQuestions}
                    answers={currentContact.qualifyingAnswers || {}}
                    onChange={handleAnswerChange}
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        <MobilePanelIndicator
          activeIndex={activePanel}
          total={3}
          labels={['Queue', 'Contact', 'Outcomes']}
          onSelect={scrollToPanel}
        />

        <QualifyingQuestionsSettings
          open={showSettings}
          onOpenChange={setShowSettings}
          questions={questions}
          onSave={handleSaveQuestions}
        />
        
        <AddContactModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          onAdd={handleAddContact}
          pots={potsWithStats}
          onCreatePot={createPot}
        />
        
        <ImportCSVModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImport={handleImportContacts}
          onCreatePot={createPot}
        />
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        onSettingsClick={() => setShowSettings(true)} 
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onImportClick={() => setShowImportModal(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <QueueList
          contacts={queueContacts}
          currentContactId={currentContact?.id || null}
          onSelectContact={handleSelectContact}
          onShuffle={shufflePending}
          onSortByCompany={sortByCompany}
          pots={potsWithStats}
          selectedPotId={selectedPotId}
          onSelectPot={selectPot}
          totalStats={totalStats}
          contactPotMap={contactPotMap}
          onRenamePot={renamePot}
          onDeletePot={deletePot}
          onMergePots={mergePots}
        />
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full p-4 overflow-y-auto">
              {currentContact ? (
                <ContactCard 
                  contact={currentContact} 
                  onUpdate={handleUpdateContact}
                  onSelectContact={handleSelectContact}
                />
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
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full border-l border-border bg-card p-3 overflow-y-auto space-y-4">
              {currentContact && (
                <>
                  <OutcomePanel contact={currentContact} onAction={handleAction} />
                  
                  <div className="border-t border-border pt-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Notes
                    </h3>
                    <NotesSection
                      contactId={currentContact.id}
                    />
                  </div>
                  
                  <div className="border-t border-border pt-3">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Qualifying
                    </h3>
                    <QualifyingFields
                      questions={activeQuestions}
                      answers={currentContact.qualifyingAnswers || {}}
                      onChange={handleAnswerChange}
                    />
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
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
        onAdd={handleAddContact}
        pots={potsWithStats}
        onCreatePot={createPot}
      />
      
      <ImportCSVModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={handleImportContacts}
        onCreatePot={createPot}
      />
    </div>
  );
}
