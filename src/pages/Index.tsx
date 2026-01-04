import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { ContactCard } from '@/components/ContactCard';
import { CallActions } from '@/components/CallActions';
import { StatsBar } from '@/components/StatsBar';
import { AddContactModal } from '@/components/AddContactModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { EmptyState } from '@/components/EmptyState';
import { SearchBar } from '@/components/SearchBar';
import { ContactList } from '@/components/ContactList';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, Upload, BarChart3 } from 'lucide-react';
import { CallStatus, CompletedReason, NotInterestedReason } from '@/types/contact';
import { toast } from 'sonner';

const Index = () => {
  const { 
    currentContact, 
    updateContactStatus, 
    addContact, 
    importContacts, 
    stats,
    contacts,
    filteredContacts,
    setSelectedContact,
    searchQuery,
    setSearchQuery,
  } = useContacts();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

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
      pending: 'Contact marked as pending',
      no_answer: 'No answer - moving to next contact',
      callback: `Callback scheduled for ${callbackDate?.toLocaleString()}`,
      completed: 'Call completed successfully!',
      not_interested: 'Marked as not interested - moving on',
    };
    
    toast.success(messages[status]);
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TeleSales CRM</h1>
                <p className="text-sm text-muted-foreground">Focus on calling</p>
              </div>
            </div>
            
            <SearchBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              resultCount={filteredContacts.length}
              totalCount={contacts.length}
            />
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={showAnalytics ? 'bg-primary text-primary-foreground' : ''}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowImportModal(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6">
          <StatsBar stats={stats} />
        </div>

        {/* Analytics Dashboard (Expandable) */}
        {showAnalytics && (
          <div className="mb-6 animate-fade-in">
            <AnalyticsDashboard contacts={contacts} />
          </div>
        )}

        {/* Search Results View */}
        {isSearchActive ? (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Search Results ({filteredContacts.length})
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            </div>
            <ContactList 
              contacts={filteredContacts} 
              onSelectContact={(contact) => {
                setSelectedContact(contact);
                setSearchQuery('');
              }} 
            />
          </div>
        ) : (
          /* Main Calling Area */
          <div className="space-y-6">
            {currentContact ? (
              <>
                {/* Current Contact Card */}
                <ContactCard contact={currentContact} />
                
                {/* Call Actions */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                    Call Outcome
                  </h3>
                  <CallActions contact={currentContact} onAction={handleAction} />
                </div>

                {/* Quick Tip */}
                <div className="text-center text-sm text-muted-foreground">
                  Click an action button after your call to move to the next contact
                </div>
              </>
            ) : (
              <EmptyState 
                onAddContact={() => setShowAddModal(true)} 
                onImportCSV={() => setShowImportModal(true)} 
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
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
};

export default Index;
