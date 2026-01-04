import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhoneOff, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { 
  Contact, 
  CallStatus, 
  CompletedReason, 
  NotInterestedReason,
  COMPLETED_REASONS,
  NOT_INTERESTED_REASONS 
} from '@/types/contact';

interface CallActionsProps {
  contact: Contact;
  onAction: (
    status: CallStatus, 
    callbackDate?: Date, 
    notes?: string,
    completedReason?: CompletedReason,
    notInterestedReason?: NotInterestedReason
  ) => void;
}

export function CallActions({ contact, onAction }: CallActionsProps) {
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');
  
  const [completedReason, setCompletedReason] = useState<CompletedReason>('appointment_booked');
  const [completedNotes, setCompletedNotes] = useState('');
  
  const [notInterestedReason, setNotInterestedReason] = useState<NotInterestedReason>('no_budget');
  const [notInterestedNotes, setNotInterestedNotes] = useState('');

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

  const handleCompleted = () => {
    onAction('completed', undefined, completedNotes, completedReason);
    setShowCompletedModal(false);
    setCompletedReason('appointment_booked');
    setCompletedNotes('');
  };

  const handleNotInterested = () => {
    onAction('not_interested', undefined, notInterestedNotes, undefined, notInterestedReason);
    setShowNotInterestedModal(false);
    setNotInterestedReason('no_budget');
    setNotInterestedNotes('');
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
          onClick={() => setShowCompletedModal(true)}
          className="flex flex-col items-center gap-2 h-auto py-6"
        >
          <CheckCircle2 className="w-6 h-6" />
          <span>Completed</span>
        </Button>

        <Button
          variant="notInterested"
          onClick={() => setShowNotInterestedModal(true)}
          className="flex flex-col items-center gap-2 h-auto py-6"
        >
          <XCircle className="w-6 h-6" />
          <span>Not Interested</span>
        </Button>
      </div>

      {/* Callback Modal */}
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

      {/* Completed Modal */}
      <Dialog open={showCompletedModal} onOpenChange={setShowCompletedModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Mark as Completed
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Outcome</Label>
              <RadioGroup value={completedReason} onValueChange={(v) => setCompletedReason(v as CompletedReason)}>
                {COMPLETED_REASONS.map(reason => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={`completed-${reason.value}`} />
                    <Label htmlFor={`completed-${reason.value}`} className="cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="completed-notes">Notes (optional)</Label>
              <Textarea
                id="completed-notes"
                placeholder="Add any additional notes..."
                value={completedNotes}
                onChange={(e) => setCompletedNotes(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletedModal(false)}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleCompleted}>
              Confirm Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not Interested Modal */}
      <Dialog open={showNotInterestedModal} onOpenChange={setShowNotInterestedModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              Mark as Not Interested
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Reason</Label>
              <RadioGroup value={notInterestedReason} onValueChange={(v) => setNotInterestedReason(v as NotInterestedReason)}>
                {NOT_INTERESTED_REASONS.map(reason => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={`not-interested-${reason.value}`} />
                    <Label htmlFor={`not-interested-${reason.value}`} className="cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="not-interested-notes">Notes (optional)</Label>
              <Textarea
                id="not-interested-notes"
                placeholder="Add any additional notes..."
                value={notInterestedNotes}
                onChange={(e) => setNotInterestedNotes(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotInterestedModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleNotInterested}>
              Confirm Not Interested
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
