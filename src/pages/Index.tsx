import { useState } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { ContactCard } from '@/components/ContactCard';
import { CallActions } from '@/components/CallActions';
import { StatsBar } from '@/components/StatsBar';
import { AddContactModal } from '@/components/AddContactModal';
import { ImportCSVModal } from '@/components/ImportCSVModal';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, Upload, List } from 'lucide-react';
import { CallStatus } from '@/types/contact';
import { toast } from 'sonner';

const Index = () => {
  const { 
    currentContact, 
    updateContactStatus, 
    addContact, 
    importContacts, 
    stats,
    contacts,
  } = useContacts();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const handleAction = (status: CallStatus, callbackDate?: Date, notes?: string) => {
    if (!currentContact) return;
    
    updateContactStatus(currentContact.id, status, callbackDate, notes);
    
    const messages: Record<CallStatus, string> = {
      pending: 'Contact marked as pending',
      no_answer: 'No answer - moving to next contact',
      callback: `Callback scheduled for ${callbackDate?.toLocaleString()}`,
      completed: 'Call completed successfully!',
      not_interested: 'Marked as not interested - moving on',
    };
    
    toast.success(messages[status]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TeleSales CRM</h1>
                <p className="text-sm text-muted-foreground">Focus on calling</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowQueue(!showQueue)}
              >
                <List className="w-4 h-4 mr-2" />
                Queue
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

        {/* Queue Sidebar */}
        {showQueue && (
          <div className="mb-6 bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-3">Pending Queue ({stats.pending})</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {contacts.filter(c => c.status === 'pending').map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{contact.firstName} {contact.lastName}</p>
                    <p className="text-sm text-muted-foreground">{contact.company}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Calling Area */}
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
                💡 Click an action button after your call to move to the next contact
              </div>
            </>
          ) : (
            <EmptyState 
              onAddContact={() => setShowAddModal(true)} 
              onImportCSV={() => setShowImportModal(true)} 
            />
          )}
        </div>
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
