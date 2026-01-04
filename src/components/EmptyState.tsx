import { Phone, Upload, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddContact: () => void;
  onImportCSV: () => void;
}

export function EmptyState({ onAddContact, onImportCSV }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
        <Phone className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">No Contacts to Call</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Your calling queue is empty. Add contacts manually or import them from a CSV file to get started.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" onClick={onImportCSV}>
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Button>
        <Button onClick={onAddContact}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>
    </div>
  );
}
