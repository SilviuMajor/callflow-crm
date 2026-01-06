import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PhoneOff, Clock, CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Contact, 
  CallStatus, 
  CompletedReason, 
  NotInterestedReason,
} from '@/types/contact';
import { useWebhookSettings } from '@/hooks/useWebhookSettings';
import { useOutcomeOptions } from '@/hooks/useOutcomeOptions';
import { useCalendlySettings } from '@/hooks/useCalendlySettings';
import { CalendlyEmbed } from '@/components/CalendlyEmbed';

interface OutcomePanelProps {
  contact: Contact;
  onAction: (
    status: CallStatus, 
    callbackDate?: Date, 
    notes?: string,
    completedReason?: CompletedReason,
    notInterestedReason?: NotInterestedReason,
    appointmentDate?: Date
  ) => void;
}

export function OutcomePanel({ contact, onAction }: OutcomePanelProps) {
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');
  
  const [completedReason, setCompletedReason] = useState<CompletedReason>('appointment_booked');
  const [completedNotes, setCompletedNotes] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);
  
  const [notInterestedReason, setNotInterestedReason] = useState<NotInterestedReason>('no_budget');
  const [notInterestedNotes, setNotInterestedNotes] = useState('');

  // Pre-populate notes from last callback note when modals open
  useEffect(() => {
    if (showCallbackModal) setCallbackNotes('');
  }, [showCallbackModal]);

  useEffect(() => {
    if (showCompletedModal) setCompletedNotes('');
  }, [showCompletedModal]);

  useEffect(() => {
    if (showNotInterestedModal) setNotInterestedNotes('');
  }, [showNotInterestedModal]);

  const { settings: webhookSettings, sendWebhook } = useWebhookSettings();
  const { completedOptions, notInterestedOptions } = useOutcomeOptions();
  const { settings: calendlySettings } = useCalendlySettings();

  // Check if Calendly is enabled and configured
  const isCalendlyEnabled = calendlySettings.enabled && calendlySettings.calendly_url;

  // Set default values based on first option from database
  useEffect(() => {
    if (completedOptions.length > 0 && completedReason === 'appointment_booked') {
      setCompletedReason(completedOptions[0].value as CompletedReason);
    }
  }, [completedOptions]);

  useEffect(() => {
    if (notInterestedOptions.length > 0 && notInterestedReason === 'no_budget') {
      setNotInterestedReason(notInterestedOptions[0].value as NotInterestedReason);
    }
  }, [notInterestedOptions]);

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

  const handleCompleted = async () => {
    let aptDate: Date | undefined;
    if (completedReason === 'appointment_booked' && appointmentDate && appointmentTime) {
      aptDate = new Date(`${appointmentDate}T${appointmentTime}`);
    }

    // Build the updated contact data for webhook
    const updatedContact = {
      ...contact,
      status: 'completed' as const,
      completedReason,
      appointmentDate: aptDate?.toISOString(),
      completedNotes: completedNotes,
      lastCalledAt: new Date().toISOString(),
    };

    // If webhook is enabled, send it first
    if (webhookSettings.enabled && webhookSettings.url) {
      setIsSubmitting(true);
      
      const result = await sendWebhook(updatedContact);
      
      if (!result.success) {
        setIsSubmitting(false);
        toast.error('Webhook failed', {
          description: `${result.error}. Contact was NOT saved.`,
        });
        return; // Block - don't save locally
      }
      
      toast.success('Webhook sent', {
        description: 'Contact data sent to webhook successfully.',
      });
      setIsSubmitting(false);
    }

    // Proceed to save locally
    onAction('completed', undefined, completedNotes, completedReason, undefined, aptDate);
    setShowCompletedModal(false);
    setCompletedReason('appointment_booked');
    setCompletedNotes('');
    setAppointmentDate('');
    setAppointmentTime('');
  };

  const handleNotInterested = () => {
    onAction('not_interested', undefined, notInterestedNotes, undefined, notInterestedReason);
    setShowNotInterestedModal(false);
    setNotInterestedReason('no_budget');
    setNotInterestedNotes('');
  };

  // Handle Calendly booking completion
  const handleCalendlyEventScheduled = (eventUri: string, startTime: string) => {
    setShowCalendlyModal(false);
    setWaitingForWebhook(true);
    
    // Wait a few seconds for webhook to update the contact, then show manual fallback
    toast.success('Appointment scheduled!', {
      description: 'Waiting for confirmation...',
    });
    
    // After 3 seconds, show the manual confirmation modal as fallback
    setTimeout(() => {
      setWaitingForWebhook(false);
      // Pre-fill today's date as a starting point for manual entry
      const today = new Date();
      setAppointmentDate(today.toISOString().split('T')[0]);
      setAppointmentTime('09:00');
      setCompletedReason('appointment_booked');
      setShowCompletedModal(true);
      toast.info('Please confirm appointment details', {
        description: 'Enter the appointment date and time from Calendly.',
      });
    }, 3000);
  };

  // When Calendly is enabled and user selects appointment_booked, show Calendly button
  const handleCompletedReasonChange = (value: string) => {
    setCompletedReason(value as CompletedReason);
  };

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Outcome
        </h3>
        
        <Button
          variant="outline"
          onClick={() => onAction('no_answer')}
          className="w-full justify-start gap-2 h-9"
        >
          <PhoneOff className="w-4 h-4" />
          No Answer
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowCallbackModal(true)}
          className="w-full justify-start gap-2 h-9 border-[hsl(var(--callback))] text-foreground hover:bg-[hsl(var(--callback-light))]"
        >
          <Clock className="w-4 h-4" />
          Callback
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowCompletedModal(true)}
          className="w-full justify-start gap-2 h-9 border-success text-success hover:bg-success/10"
          disabled={waitingForWebhook}
        >
          {waitingForWebhook ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowNotInterestedModal(true)}
          className="w-full justify-start gap-2 h-9 border-destructive text-destructive hover:bg-destructive/10"
        >
          <XCircle className="w-4 h-4" />
          Not Interested
        </Button>
      </div>

      {/* Callback Modal */}
      <Dialog open={showCallbackModal} onOpenChange={setShowCallbackModal}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Schedule Callback</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="callback-date" className="text-xs">Date</Label>
                <Input
                  id="callback-date"
                  type="date"
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="callback-time" className="text-xs">Time</Label>
                <Input
                  id="callback-time"
                  type="time"
                  value={callbackTime}
                  onChange={(e) => setCallbackTime(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="callback-notes" className="text-xs">Notes</Label>
              <Textarea
                id="callback-notes"
                placeholder="Add or edit notes..."
                value={callbackNotes}
                onChange={(e) => setCallbackNotes(e.target.value)}
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCallbackModal(false)}>
              Cancel
            </Button>
            <Button 
              size="sm"
              onClick={handleCallback}
              disabled={!callbackDate || !callbackTime}
              className="bg-[hsl(var(--callback))] hover:bg-[hsl(var(--callback))]/90"
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completed Modal */}
      <Dialog open={showCompletedModal} onOpenChange={setShowCompletedModal}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Mark as Completed
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <RadioGroup value={completedReason} onValueChange={handleCompletedReasonChange}>
              {completedOptions.map(reason => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={`completed-${reason.value}`} />
                  <Label htmlFor={`completed-${reason.value}`} className="text-sm cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {/* Appointment booking section - show Calendly or manual picker */}
            {completedReason === 'appointment_booked' && (
              <div className="space-y-3 p-2 bg-muted/50 rounded border border-border">
                {isCalendlyEnabled ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-center gap-2"
                      onClick={() => {
                        setShowCompletedModal(false);
                        setShowCalendlyModal(true);
                      }}
                    >
                      <Calendar className="w-4 h-4" />
                      Book via Calendly
                    </Button>
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">or enter manually</span>
                    </div>
                  </>
                ) : null}
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="apt-date" className="text-xs">Appointment Date</Label>
                    <Input
                      id="apt-date"
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="apt-time" className="text-xs">Time</Label>
                    <Input
                      id="apt-time"
                      type="time"
                      value={appointmentTime}
                      onChange={(e) => setAppointmentTime(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              <Label htmlFor="completed-notes" className="text-xs">Notes</Label>
              <Textarea
                id="completed-notes"
                placeholder="Add or edit notes..."
                value={completedNotes}
                onChange={(e) => setCompletedNotes(e.target.value)}
                className="text-sm min-h-[60px]"
              />
            </div>
            
            {webhookSettings.enabled && webhookSettings.url && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Will send to webhook on completion
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCompletedModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="bg-success hover:bg-success/90" 
              onClick={handleCompleted}
              disabled={(completedReason === 'appointment_booked' && (!appointmentDate || !appointmentTime)) || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendly Embed Modal */}
      {isCalendlyEnabled && (
        <CalendlyEmbed
          contact={contact}
          calendlyUrl={calendlySettings.calendly_url}
          open={showCalendlyModal}
          onOpenChange={setShowCalendlyModal}
          onEventScheduled={handleCalendlyEventScheduled}
        />
      )}

      {/* Not Interested Modal */}
      <Dialog open={showNotInterestedModal} onOpenChange={setShowNotInterestedModal}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-4 h-4 text-muted-foreground" />
              Mark as Not Interested
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            <RadioGroup value={notInterestedReason} onValueChange={(v) => setNotInterestedReason(v as NotInterestedReason)}>
              {notInterestedOptions.map(reason => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={`not-interested-${reason.value}`} />
                  <Label htmlFor={`not-interested-${reason.value}`} className="text-sm cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="space-y-1">
              <Label htmlFor="not-interested-notes" className="text-xs">Notes</Label>
              <Textarea
                id="not-interested-notes"
                placeholder="Add or edit notes..."
                value={notInterestedNotes}
                onChange={(e) => setNotInterestedNotes(e.target.value)}
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNotInterestedModal(false)}>
              Cancel
            </Button>
            <Button variant="secondary" size="sm" onClick={handleNotInterested}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
