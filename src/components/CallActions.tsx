import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PhoneOff, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Contact, CallStatus } from '@/types/contact';

interface CallActionsProps {
  contact: Contact;
  onAction: (status: CallStatus, callbackDate?: Date, notes?: string) => void;
}

export function CallActions({ contact, onAction }: CallActionsProps) {
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');

  const handleCallback = () => {
    if (callbackDate && callbackTime) {
      const scheduledDate = new Date(`${callbackDate}T${callbackTime}`);
      onAction('callback', scheduledDate, callbackNotes);
      setShowCallbackModal(false);
      setCallbackDate('');
      setCallbackTime('');
      setCallbackNotes('');
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="noAnswer"
          onClick={() => onAction('no_answer')}
          className="flex flex-col items-center gap-2 h-auto py-6"
        >
          <PhoneOff className="w-6 h-6" />
          <span>No Answer</span>
        </Button>

        <Button
          variant="callback"
          onClick={() => setShowCallbackModal(true)}
          className="flex flex-col items-center gap-2 h-auto py-6"
        >
          <Clock className="w-6 h-6" />
          <span>Callback</span>
        </Button>

        <Button
          variant="completed"
          onClick={() => onAction('completed')}
          className="flex flex-col items-center gap-2 h-auto py-6"
        >
          <CheckCircle2 className="w-6 h-6" />
          <span>Completed</span>
        </Button>

        <Button
          variant="notInterested"
          onClick={() => onAction('not_interested')}
          className="flex flex-col items-center gap-2 h-auto py-6"
        >
          <XCircle className="w-6 h-6" />
          <span>Not Interested</span>
        </Button>
      </div>

      <Dialog open={showCallbackModal} onOpenChange={setShowCallbackModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">Schedule Callback</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="callback-date">Date</Label>
              <Input
                id="callback-date"
                type="date"
                value={callbackDate}
                onChange={(e) => setCallbackDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="callback-time">Time</Label>
              <Input
                id="callback-time"
                type="time"
                value={callbackTime}
                onChange={(e) => setCallbackTime(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="callback-notes">Notes (optional)</Label>
              <Textarea
                id="callback-notes"
                placeholder="Add notes about the callback..."
                value={callbackNotes}
                onChange={(e) => setCallbackNotes(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallbackModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="warning" 
              onClick={handleCallback}
              disabled={!callbackDate || !callbackTime}
            >
              Schedule Callback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
