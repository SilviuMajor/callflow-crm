import { useState, useRef, useEffect, useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { usePots } from '@/hooks/usePots';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTodayStats } from '@/hooks/useTodayStats';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { TopNav } from '@/components/TopNav';
import { QueueList } from '@/components/QueueList';
import { ContactCard } from '@/components/ContactCard';
import { OutcomePanel } from '@/components/OutcomePanel';
import { QualifyingFields } from '@/components/QualifyingFields';

import { AddContactModal } from '@/components/AddContactModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { MobilePanelIndicator } from '@/components/MobilePanelIndicator';
import { NotesSection } from '@/components/NotesSection';
import { CallStatus, CompletedReason, NotInterestedReason, Contact } from '@/types/contact';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Phone, Mail, Copy, Globe } from 'lucide-react';
import { exportToCSV, exportToJSON } from '@/utils/exportData';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

export default function CallingPage() {
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [activePanel, setActivePanel] = useState(1);
  const [overdueToastShown, setOverdueToastShown] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  // POTs management
  const { potsWithStats, selectedPotId, selectPot, createPot, renamePot, deletePot, mergePots, refreshStats, totalStats } = usePots();
  
  const {
    contacts,
    queueContacts,
    overdueCallbackCount,
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
    deleteContact,
  } = useContacts(selectedPotId);

  const { stats: todayStats, refresh: refreshTodayStats } = useTodayStats();
  const { dailyCallTarget } = useOrganizationSettings();
  
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

  // Overdue callback toast — show once per page load when overdue count is known
  useEffect(() => {
    if (!overdueToastShown && overdueCallbackCount > 0) {
      setOverdueToastShown(true);
      toast.warning(
        `${overdueCallbackCount} overdue callback${overdueCallbackCount > 1 ? 's' : ''}`,
        { description: 'These are at the top of your queue.' }
      );
    }
  }, [overdueCallbackCount, overdueToastShown]);

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

    // Find the next contact BEFORE updating (current contact will leave the queue)
    const currentIndex = queueContacts.findIndex(c => c.id === currentContact.id);
    const nextContact = queueContacts[currentIndex + 1] ?? queueContacts[0];
    const hasNext = nextContact && nextContact.id !== currentContact.id;
    const isLastContact = queueContacts.length === 1;
    
    updateContactStatus(currentContact.id, status, callbackDate, notes, completedReason, notInterestedReason, appointmentDate);

    // Refresh today's stats after each action
    setTimeout(() => refreshTodayStats(), 500);

    // Session summary when queue is cleared
    if (isLastContact) {
      setTimeout(() => {
        refreshTodayStats().then(() => {
          // Show session summary toast
          toast.success('Queue complete! 🎉', {
            description: `Today: ${todayStats.total + 1} calls — ${todayStats.completed + (status === 'completed' ? 1 : 0)} completed, ${todayStats.callbacks + (status === 'callback' ? 1 : 0)} callbacks, ${todayStats.noAnswer + (status === 'no_answer' ? 1 : 0)} no answer`,
            duration: 8000,
          });
        });
      }, 600);
    }

    // Auto-advance to next contact
    if (hasNext) {
      setTimeout(() => selectContact(nextContact.id), 100);
    } else {
      selectContact(null as any);
    }

    // Auto-swipe back to contact panel on mobile after coding an outcome
    if (isMobile) {
      scrollToPanel(1);
    }
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
    toast.success('Questions saved');
  };

  const handleUpdateContact = (updates: Partial<Contact>) => {
    if (!currentContact) return;
    updateContact(currentContact.id, updates);
  };

  const handleExportCSV = () => {
    exportToCSV(contacts, questions, customFields, companyFields, companyData);
    toast.success('Exported as CSV');
  };

  const handleExportJSON = () => {
    exportToJSON(contacts, questions, companyData);
    toast.success('Exported as JSON');
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

  const handleImportContacts = async (newContacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[], potId: string): Promise<{ imported: number; skipped: number }> => {
    const result = await importContacts(newContacts, potId);
    refreshStats();
    return result ?? { imported: 0, skipped: 0 };
  };

  const activeQuestions = questions.filter(q => !q.isArchived);

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
          <TopNav
            onExportCSV={handleExportCSV}
            onExportJSON={handleExportJSON}
            onImportClick={() => setShowImportModal(true)}
            overdueCallbackCount={overdueCallbackCount}
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
              todayStats={todayStats}
              dailyTarget={dailyCallTarget}
            />
          </div>
          
          <div className="w-full flex-shrink-0 snap-center snap-always overflow-y-auto p-4" style={{ minWidth: '100%' }}>
            {currentContact ? (
              <ContactCard 
                contact={currentContact} 
                onUpdate={handleUpdateContact}
                onSelectContact={handleSelectContact}
                onDelete={deleteContact}
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
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          onImportClick={() => setShowImportModal(true)}
          overdueCallbackCount={overdueCallbackCount}
        />
      
      <div className="flex-1 flex flex-col overflow-hidden">
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
          todayStats={todayStats}
          dailyTarget={dailyCallTarget}
        />
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full overflow-hidden">
              {currentContact ? (
                <ContactCard 
                  contact={currentContact} 
                  onUpdate={handleUpdateContact}
                  onSelectContact={handleSelectContact}
                  onDelete={deleteContact}
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
            <div className="h-full border-l border-border bg-card flex flex-col">
              {currentContact && (
                <>
                  {/* Contact Identity — TOP */}
                  <div className="p-4 border-b border-border flex-shrink-0">
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">{currentContact.firstName} {currentContact.lastName}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {currentContact.jobTitle ? `${currentContact.jobTitle} at ` : ''}<span className="text-primary font-medium">{currentContact.company}</span>
                    </p>

                    {/* Phone — stacked row with copy */}
                    {currentContact.phone && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="inline-flex items-center rounded-md bg-success/10 border border-success/50 overflow-hidden">
                          <a href={`tel:${currentContact.phone}`} className="h-7 w-7 flex items-center justify-center text-success hover:bg-success/20 transition-colors border-r border-success/50" title="Call">
                            <Phone className="w-3 h-3" />
                          </a>
                          <span className="px-2 py-1 text-success text-xs font-medium">{currentContact.phone}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigator.clipboard.writeText(currentContact.phone)} title="Copy phone">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Email — stacked row with full address + copy */}
                    {currentContact.email && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border text-xs text-foreground">
                          <Mail className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate">{currentContact.email}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigator.clipboard.writeText(currentContact.email!)} title="Copy email">
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}

                    {/* Social icons row */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {currentContact.linkedinUrl && (
                        <a href={currentContact.linkedinUrl} target="_blank" rel="noopener noreferrer" title="LinkedIn" className="flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-accent text-foreground transition-colors">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                      {currentContact.twitterUrl && (
                        <a href={currentContact.twitterUrl} target="_blank" rel="noopener noreferrer" title="Twitter / X" className="flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-accent text-foreground transition-colors">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.261 5.638 5.903-5.638zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                      )}
                      {currentContact.website && (
                        <a href={currentContact.website.startsWith('http') ? currentContact.website : `https://${currentContact.website}`} target="_blank" rel="noopener noreferrer" title="Website" className="flex items-center justify-center w-7 h-7 rounded-md border border-border hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Globe className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Notes + Qualifying — SCROLLABLE MIDDLE */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    <div className="border-b border-border pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes</h3>
                      </div>
                      <NotesSection contactId={currentContact.id} />
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Qualifying</h3>
                      <QualifyingFields
                        questions={activeQuestions}
                        answers={currentContact.qualifyingAnswers || {}}
                        onChange={handleAnswerChange}
                      />
                    </div>
                  </div>

                  {/* Outcomes — PINNED BOTTOM */}
                  <div className="border-t border-border p-3 flex-shrink-0 bg-muted/30">
                    <OutcomePanel contact={currentContact} onAction={handleAction} />
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
        </div>
      </div>

      
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
