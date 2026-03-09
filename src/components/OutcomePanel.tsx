import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useCalcomSettings } from '@/hooks/useCalcomSettings';
import { CalendlyEmbed } from '@/components/CalendlyEmbed';
import { CalcomEmbed } from '@/components/CalcomEmbed';

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

function formatDuration(_: number): string { return ''; }

export function OutcomePanel({ contact, onAction }: OutcomePanelProps) {
  // Modal state
  const [showNoAnswerModal, setShowNoAnswerModal] = useState(false);
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showCalendlyModal, setShowCalendlyModal] = useState(false);
  const [showCalcomModal, setShowCalcomModal] = useState(false);

  // No Answer quick note
  const [noAnswerNote, setNoAnswerNote] = useState('');

  // Callback fields
  const [callbackDate, setCallbackDate] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [callbackNotes, setCallbackNotes] = useState('');

  // Completed fields
  const [completedReason, setCompletedReason] = useState<CompletedReason>('appointment_booked');
  const [completedNotes, setCompletedNotes] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingForWebhook, setWaitingForWebhook] = useState(false);

  // Not Interested fields
  const [notInterestedReason, setNotInterestedReason] = useState<NotInterestedReason>('no_budget');
  const [notInterestedNotes, setNotInterestedNotes] = useState('');


  const { settings: webhookSettings, sendWebhook } = useWebhookSettings();
  const { completedOptions, notInterestedOptions } = useOutcomeOptions();
  const { settings: calendlySettings } = useCalendlySettings();
  const { settings: calcomSettings } = useCalcomSettings();

  const isCalendlyEnabled = calendlySettings.enabled && calendlySettings.calendly_url;
  const isCalcomEnabled = calcomSettings?.enabled && calcomSettings?.event_type_slug;
  const webhookEnabled = webhookSettings.enabled && webhookSettings.url;

  // Reset modals on open
  useEffect(() => { if (showNoAnswerModal) setNoAnswerNote(''); }, [showNoAnswerModal]);
  useEffect(() => { if (showCallbackModal) setCallbackNotes(''); }, [showCallbackModal]);
  useEffect(() => { if (showCompletedModal) setCompletedNotes(''); }, [showCompletedModal]);
  useEffect(() => { if (showNotInterestedModal) setNotInterestedNotes(''); }, [showNotInterestedModal]);

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

  // Keyboard shortcuts (Task 6) — only when no modal is open
  useEffect(() => {
    const anyModalOpen = showNoAnswerModal || showCallbackModal || showCompletedModal || showNotInterestedModal || showCalendlyModal || showCalcomModal;
    if (anyModalOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case 'n': e.preventDefault(); setShowNoAnswerModal(true); break;
        case 'c': e.preventDefault(); setShowCallbackModal(true); break;
        case 'd': e.preventDefault(); setShowCompletedModal(true); break;
        case 'x': e.preventDefault(); setShowNotInterestedModal(true); break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showNoAnswerModal, showCallbackModal, showCompletedModal, showNotInterestedModal, showCalendlyModal, showCalcomModal]);

  // Fire webhook silently (non-blocking) for all outcomes except completed (which is blocking)
  const fireWebhookSilent = useCallback(async (updatedContact: Record<string, any>, eventType: string) => {
    if (!webhookEnabled) return;
    sendWebhook(updatedContact, eventType).then(result => {
      if (!result.success) console.warn('Webhook failed silently:', result.error);
    });
  }, [webhookEnabled, sendWebhook]);

  const handleNoAnswer = () => {
    const updatedContact = { ...contact, status: 'no_answer' as const, lastCalledAt: new Date().toISOString() };
    fireWebhookSilent(updatedContact, 'contact_no_answer');
    onAction('no_answer', undefined, noAnswerNote || undefined);
    setShowNoAnswerModal(false);
    setNoAnswerNote('');
  };

  const handleCallback = () => {
    if (callbackDate && callbackTime) {
      const scheduledDate = new Date(`${callbackDate}T${callbackTime}`);
      const updatedContact = { ...contact, status: 'callback' as const, callbackDate: scheduledDate.toISOString(), lastCalledAt: new Date().toISOString() };
      fireWebhookSilent(updatedContact, 'contact_callback');
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

    const updatedContact = {
      ...contact,
      status: 'completed' as const,
      completedReason,
      appointmentDate: aptDate?.toISOString(),
      lastCalledAt: new Date().toISOString(),
    };

    // Completed webhook is blocking — user sees error if it fails
    if (webhookEnabled) {
      setIsSubmitting(true);
      const result = await sendWebhook(updatedContact, 'contact_completed');
      if (!result.success) {
        setIsSubmitting(false);
        toast.error('Webhook failed', { description: `${result.error}. Contact was NOT saved.` });
        return;
      }
      toast.success('Webhook sent');
      setIsSubmitting(false);
    }

    onAction('completed', undefined, completedNotes, completedReason, undefined, aptDate);
    setShowCompletedModal(false);
    setCompletedReason('appointment_booked');
    setCompletedNotes('');
    setAppointmentDate('');
    setAppointmentTime('');
    endCall();
  };

  const handleNotInterested = () => {
    const updatedContact = { ...contact, status: 'not_interested' as const, notInterestedReason, lastCalledAt: new Date().toISOString() };
    fireWebhookSilent(updatedContact, 'contact_not_interested');
    onAction('not_interested', undefined, notInterestedNotes, undefined, notInterestedReason);
    setShowNotInterestedModal(false);
    setNotInterestedReason('no_budget');
    setNotInterestedNotes('');
    endCall();
  };

  const handleCalendlyEventScheduled = (_eventUri: string, _startTime: string) => {
    setShowCalendlyModal(false);
    setWaitingForWebhook(true);
    toast.success('Appointment scheduled!', { description: 'Waiting for confirmation...' });
    setTimeout(() => {
      setWaitingForWebhook(false);
      const today = new Date();
      setAppointmentDate(today.toISOString().split('T')[0]);
      setAppointmentTime('09:00');
      setCompletedReason('appointment_booked');
      setShowCompletedModal(true);
      toast.info('Please confirm appointment details');
    }, 3000);
  };

  const handleCalcomEventScheduled = () => {
    setShowCalcomModal(false);
    toast.success('Appointment booked!', {
      description: `${contact.firstName} ${contact.lastName} will be automatically marked as completed.`,
    });
  };

  return (
    <TooltipProvider delayDuration={400}>
      <>
        {/* Call Timer */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg border border-border bg-muted/30">
          {callActive ? (
            <>
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-mono font-medium text-foreground tabular-nums flex-1">
                {formatDuration(callSeconds)}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 px-2 border-destructive text-destructive hover:bg-destructive/10" onClick={endCall}>
                    <Square className="w-3 h-3 mr-1" />
                    End <span className="ml-1 text-[10px] opacity-60">E</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>End call (E)</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="text-xs text-muted-foreground flex-1">
                {callSeconds > 0 ? `Last: ${formatDuration(callSeconds)}` : 'Ready'}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" className="h-7 px-2 border-success text-success hover:bg-success/10" onClick={startCall}>
                    <Phone className="w-3 h-3 mr-1" />
                    Start <span className="ml-1 text-[10px] opacity-60">S</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Start call timer (S)</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>

        {/* Outcome Buttons */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Outcome
          </h3>

          {/* No Answer — most-used, gets stronger styling */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setShowNoAnswerModal(true)}
                className="w-full justify-start gap-2 h-10 font-medium border-2"
              >
                <PhoneOff className="w-4 h-4" />
                No Answer
                <span className="ml-auto text-[10px] text-muted-foreground font-normal">N</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>No answer (N)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setShowCallbackModal(true)}
                className="w-full justify-start gap-2 h-9 border-[hsl(var(--callback))] text-foreground hover:bg-[hsl(var(--callback-light))]"
              >
                <Clock className="w-4 h-4" />
                Callback
                <span className="ml-auto text-[10px] text-muted-foreground">C</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Schedule callback (C)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setShowCompletedModal(true)}
                className="w-full justify-start gap-2 h-9 border-success text-success hover:bg-success/10"
                disabled={waitingForWebhook}
              >
                {waitingForWebhook ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Confirming...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" />Completed<span className="ml-auto text-[10px] text-muted-foreground">D</span></>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Mark completed (D)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setShowNotInterestedModal(true)}
                className="w-full justify-start gap-2 h-9 border-destructive text-destructive hover:bg-destructive/10"
              >
                <XCircle className="w-4 h-4" />
                Not Interested
                <span className="ml-auto text-[10px] text-muted-foreground">X</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Not interested (X)</TooltipContent>
          </Tooltip>
        </div>

        {/* No Answer Modal — with quick note */}
        <Dialog open={showNoAnswerModal} onOpenChange={setShowNoAnswerModal}>
          <DialogContent className="bg-card border-border sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                <PhoneOff className="w-4 h-4" />
                No Answer
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label htmlFor="na-note" className="text-xs">Quick note (optional)</Label>
              <Textarea
                id="na-note"
                placeholder="e.g. Left voicemail, spoke to PA..."
                value={noAnswerNote}
                onChange={(e) => setNoAnswerNote(e.target.value)}
                className="text-sm min-h-[60px] mt-1"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleNoAnswer(); } }}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNoAnswerModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleNoAnswer}>
                <PhoneOff className="w-3 h-3 mr-1" />
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  <Input id="callback-date" type="date" value={callbackDate} onChange={(e) => setCallbackDate(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="callback-time" className="text-xs">Time</Label>
                  <Input id="callback-time" type="time" value={callbackTime} onChange={(e) => setCallbackTime(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="callback-notes" className="text-xs">Notes</Label>
                <Textarea id="callback-notes" placeholder="Add or edit notes..." value={callbackNotes} onChange={(e) => setCallbackNotes(e.target.value)} className="text-sm min-h-[60px]" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCallbackModal(false)}>Cancel</Button>
              <Button size="sm" onClick={handleCallback} disabled={!callbackDate || !callbackTime} className="bg-[hsl(var(--callback))] hover:bg-[hsl(var(--callback))]/90">
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
              <RadioGroup value={completedReason} onValueChange={(v) => setCompletedReason(v as CompletedReason)}>
                {completedOptions.map(reason => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={`completed-${reason.value}`} />
                    <Label htmlFor={`completed-${reason.value}`} className="text-sm cursor-pointer">{reason.label}</Label>
                  </div>
                ))}
              </RadioGroup>

              {completedReason === 'appointment_booked' && (
                <div className="space-y-3 p-2 bg-muted/50 rounded border border-border">
                  {(isCalendlyEnabled || isCalcomEnabled) && (
                    <>
                      <div className="flex gap-2">
                        {isCalendlyEnabled && (
                          <Button type="button" variant="outline" className="flex-1 justify-center gap-2" onClick={() => { setShowCompletedModal(false); setShowCalendlyModal(true); }}>
                            <Calendar className="w-4 h-4" />Book via Calendly
                          </Button>
                        )}
                        {isCalcomEnabled && (
                          <Button type="button" variant="outline" className="flex-1 justify-center gap-2" onClick={() => { setShowCompletedModal(false); setShowCalcomModal(true); }}>
                            <Calendar className="w-4 h-4" />Book via Cal.com
                          </Button>
                        )}
                      </div>
                      <div className="text-center"><span className="text-xs text-muted-foreground">or enter manually</span></div>
                    </>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="apt-date" className="text-xs">Appointment Date</Label>
                      <Input id="apt-date" type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="apt-time" className="text-xs">Time</Label>
                      <Input id="apt-time" type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="completed-notes" className="text-xs">Notes</Label>
                <Textarea id="completed-notes" placeholder="Add or edit notes..." value={completedNotes} onChange={(e) => setCompletedNotes(e.target.value)} className="text-sm min-h-[60px]" />
              </div>

              {webhookEnabled && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />Will send to webhook on completion
                </p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCompletedModal(false)} disabled={isSubmitting}>Cancel</Button>
              <Button
                size="sm"
                className="bg-success hover:bg-success/90"
                onClick={handleCompleted}
                disabled={(completedReason === 'appointment_booked' && (!appointmentDate || !appointmentTime)) || isSubmitting}
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Calendly Embed */}
        {isCalendlyEnabled && (
          <CalendlyEmbed contact={contact} calendlyUrl={calendlySettings.calendly_url} open={showCalendlyModal} onOpenChange={setShowCalendlyModal} onEventScheduled={handleCalendlyEventScheduled} />
        )}

        {/* Cal.com Embed */}
        {isCalcomEnabled && calcomSettings?.event_type_slug && (
          <CalcomEmbed contact={contact} eventTypeSlug={calcomSettings.event_type_slug} open={showCalcomModal} onOpenChange={setShowCalcomModal} onEventScheduled={handleCalcomEventScheduled} fieldMappings={calcomSettings.field_mappings} />
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
                    <Label htmlFor={`not-interested-${reason.value}`} className="text-sm cursor-pointer">{reason.label}</Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="space-y-1">
                <Label htmlFor="not-interested-notes" className="text-xs">Notes</Label>
                <Textarea id="not-interested-notes" placeholder="Add or edit notes..." value={notInterestedNotes} onChange={(e) => setNotInterestedNotes(e.target.value)} className="text-sm min-h-[60px]" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowNotInterestedModal(false)}>Cancel</Button>
              <Button variant="secondary" size="sm" onClick={handleNotInterested}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    </TooltipProvider>
  );
}
