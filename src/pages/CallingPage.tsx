import { useState, useRef, useEffect } from 'react';
import { useContacts } from '@/hooks/useContacts';
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
import { EditContactModal } from '@/components/EditContactModal';
import { MobilePanelIndicator } from '@/components/MobilePanelIndicator';
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [activePanel, setActivePanel] = useState(1); // 0=Queue, 1=Contact, 2=Outcomes
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
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
  } = useContacts();
  
  const { questions, setQuestions } = useQualifyingQuestions();
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { companyData } = useCompanyData();

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
    // Clear data for permanently deleted questions
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

  // Handle selecting a contact (including from linked contacts)
  const handleSelectContact = (contactId: string) => {
    selectContact(contactId);
    // On mobile, scroll to contact panel
    if (isMobile) {
      scrollToPanel(1);
    }
  };

  // Filter to only show active (non-archived) questions
  const activeQuestions = questions.filter(q => !q.isArchived);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <TopNav 
          onSettingsClick={() => setShowSettings(true)} 
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />
        
        {/* Swipeable panels container */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {/* Panel 1: Queue */}
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto" style={{ minWidth: '100%' }}>
            <QueueList
              contacts={queueContacts}
              currentContactId={currentContact?.id || null}
              onSelectContact={handleSelectContact}
              onShuffle={shufflePending}
              onSortByCompany={sortByCompany}
              isMobile={true}
            />
          </div>
          
          {/* Panel 2: Contact Card */}
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto p-4" style={{ minWidth: '100%' }}>
            {currentContact ? (
              <ContactCard 
                contact={currentContact} 
                onUpdate={handleUpdateContact}
                onEditClick={() => setShowEditModal(true)}
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
          
          {/* Panel 3: Outcomes + Qualifying */}
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto p-3 space-y-4" style={{ minWidth: '100%' }}>
            {currentContact && (
              <>
                <OutcomePanel contact={currentContact} onAction={handleAction} />
                
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
        
        {/* Bottom indicator */}
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
          onAdd={addContact}
        />
        
        <ImportCSVModal
          open={showImportModal}
          onOpenChange={setShowImportModal}
          onImport={importContacts}
        />

        {currentContact && (
          <EditContactModal
            open={showEditModal}
            onOpenChange={setShowEditModal}
            contact={currentContact}
            onSave={handleUpdateContact}
          />
        )}
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
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Queue (fixed width) */}
        <QueueList
          contacts={queueContacts}
          currentContactId={currentContact?.id || null}
          onSelectContact={handleSelectContact}
          onShuffle={shufflePending}
          onSortByCompany={sortByCompany}
        />
        
        {/* Center + Right: Resizable */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Center: Current Contact */}
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full p-4 overflow-y-auto">
              {currentContact ? (
                <ContactCard 
                  contact={currentContact} 
                  onUpdate={handleUpdateContact}
                  onEditClick={() => setShowEditModal(true)}
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
          
          {/* Right: Outcomes & Qualifying */}
          <ResizablePanel defaultSize={35} minSize={20} maxSize={50}>
            <div className="h-full border-l border-border bg-card p-3 overflow-y-auto space-y-4">
              {currentContact && (
                <>
                  <OutcomePanel contact={currentContact} onAction={handleAction} />
                  
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
        onAdd={addContact}
      />
      
      <ImportCSVModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImport={importContacts}
      />

      {currentContact && (
        <EditContactModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          contact={currentContact}
          onSave={handleUpdateContact}
        />
      )}
    </div>
  );
}
