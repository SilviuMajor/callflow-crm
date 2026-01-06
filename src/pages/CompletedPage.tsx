import { useState, useMemo } from 'react';
import { TopNav } from '@/components/TopNav';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { usePots } from '@/hooks/usePots';
import { Contact, COMPLETED_REASONS, NOT_INTERESTED_REASONS, NotInterestedReason } from '@/types/contact';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, Building2, Globe, Calendar, Clock, AlertTriangle, Check, X, RotateCcw, CalendarPlus, CalendarClock, Ban, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { QualifyingQuestionsSettings } from '@/components/QualifyingQuestionsSettings';
import { ContactHistoryBar } from '@/components/ContactHistoryBar';
import { AIResearchBox } from '@/components/AIResearchBox';
import { exportToCSV, exportToJSON } from '@/utils/exportData';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

type QuickFilter = 'all' | 'completed' | 'not_interested' | 'pending_review' | 'attended' | 'no_show';
type DateRange = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';
type NoShowAction = 'reschedule' | 'pending' | 'callback' | 'not_interested' | 'leave';

export default function CompletedPage() {
  const { pots } = usePots();
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const { completedContacts, clearContactAnswers, markAppointmentAttended, returnToPot, rebookAppointment, rescheduleAppointment, updateContactStatus } = useContacts(selectedPotId);
  const { questions, setQuestions } = useQualifyingQuestions();
  const { fields: customFields } = useCustomFields();
  const { fields: companyFields } = useCompanyFields();
  const { companyData } = useCompanyData();
  
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // No-show dialog state
  const [showNoShowDialog, setShowNoShowDialog] = useState(false);
  const [showNoShowActionsDialog, setShowNoShowActionsDialog] = useState(false);
  const [noShowAction, setNoShowAction] = useState<NoShowAction>('leave');
  const [noShowNotInterestedReason, setNoShowNotInterestedReason] = useState<NotInterestedReason | ''>('');
  const [noShowRescheduleDate, setNoShowRescheduleDate] = useState('');
  const [noShowRescheduleTime, setNoShowRescheduleTime] = useState('');
  const [noShowCallbackDate, setNoShowCallbackDate] = useState('');
  const [noShowCallbackTime, setNoShowCallbackTime] = useState('');
  const [pendingNoShowContact, setPendingNoShowContact] = useState<Contact | null>(null);
  
  // Legacy return to pot dialog state (for non-no-show returns)
  const [showReturnToPotDialog, setShowReturnToPotDialog] = useState(false);
  const [returnType, setReturnType] = useState<'pending' | 'callback'>('pending');
  const [returnCallbackDate, setReturnCallbackDate] = useState('');
  const [returnCallbackTime, setReturnCallbackTime] = useState('');
  
  // Rebook dialog state
  const [showRebookDialog, setShowRebookDialog] = useState(false);
  const [rebookDate, setRebookDate] = useState('');
  const [rebookTime, setRebookTime] = useState('');
  const [rebookContact, setRebookContact] = useState<Contact | null>(null);

  // Reschedule dialog state
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleContact, setRescheduleContact] = useState<Contact | null>(null);

  const getDateRangeStart = (range: DateRange): Date | null => {
    const now = new Date();
    switch (range) {
      case 'today': return startOfDay(now);
      case 'week': return startOfWeek(now);
      case 'month': return startOfMonth(now);
      case 'quarter': return startOfQuarter(now);
      default: return null;
    }
  };

  const filteredContacts = useMemo(() => {
    let filtered = completedContacts;
    const now = new Date();
    
    // Apply quick filter
    if (quickFilter === 'completed') {
      filtered = filtered.filter(c => c.status === 'completed');
    } else if (quickFilter === 'not_interested') {
      filtered = filtered.filter(c => c.status === 'not_interested');
    } else if (quickFilter === 'pending_review') {
      filtered = filtered.filter(c => 
        c.status === 'completed' && 
        c.completedReason === 'appointment_booked' && 
        c.appointmentDate && 
        new Date(c.appointmentDate) < now && 
        c.appointmentAttended === null
      );
    } else if (quickFilter === 'attended') {
      filtered = filtered.filter(c => c.appointmentAttended === true);
    } else if (quickFilter === 'no_show') {
      filtered = filtered.filter(c => c.appointmentAttended === false);
    }
    
    // Apply reason filter
    if (filter !== 'all') {
      if (filter === 'completed') {
        filtered = filtered.filter(c => c.status === 'completed');
      } else if (filter === 'not_interested') {
        filtered = filtered.filter(c => c.status === 'not_interested');
      } else {
        filtered = filtered.filter(c => 
          c.completedReason === filter || c.notInterestedReason === filter
        );
      }
    }
    
    // Apply date range
    const rangeStart = getDateRangeStart(dateRange);
    if (rangeStart) {
      filtered = filtered.filter(c => 
        c.lastCalledAt && isAfter(new Date(c.lastCalledAt), rangeStart)
      );
    }
    
    // Apply search
    if (search.trim()) {
      const query = search.toLowerCase();
      filtered = filtered.filter(c => {
        // Basic fields
        if (c.firstName.toLowerCase().includes(query)) return true;
        if (c.lastName.toLowerCase().includes(query)) return true;
        if (c.company.toLowerCase().includes(query)) return true;
        if (c.email.toLowerCase().includes(query)) return true;
        if (c.phone.toLowerCase().includes(query)) return true;
        if (c.jobTitle.toLowerCase().includes(query)) return true;
        
        // Custom fields
        if (c.customFields) {
          for (const value of Object.values(c.customFields)) {
            if (String(value).toLowerCase().includes(query)) return true;
          }
        }
        
        // Qualifying answers
        if (c.qualifyingAnswers) {
          for (const value of Object.values(c.qualifyingAnswers)) {
            if (String(value).toLowerCase().includes(query)) return true;
          }
        }
        
        return false;
      });
    }
    
    return filtered;
  }, [completedContacts, search, filter, quickFilter, dateRange]);

  const getReasonLabel = (contact: Contact) => {
    if (contact.status === 'completed' && contact.completedReason) {
      return COMPLETED_REASONS.find(r => r.value === contact.completedReason)?.label || contact.completedReason;
    }
    if (contact.status === 'not_interested' && contact.notInterestedReason) {
      return NOT_INTERESTED_REASONS.find(r => r.value === contact.notInterestedReason)?.label || contact.notInterestedReason;
    }
    return '';
  };

  const getAppointmentStatus = (contact: Contact) => {
    if (contact.completedReason !== 'appointment_booked' || !contact.appointmentDate) {
      return null;
    }
    
    const isPast = new Date(contact.appointmentDate) < new Date();
    
    if (!isPast) {
      return { status: 'upcoming', label: 'Upcoming', date: contact.appointmentDate };
    }
    
    if (contact.appointmentAttended === null) {
      return { status: 'pending_review', label: 'PAST', date: contact.appointmentDate };
    } else if (contact.appointmentAttended === true) {
      return { status: 'attended', label: 'Attended', date: contact.appointmentDate };
    } else {
      return { status: 'no_show', label: 'No Show', date: contact.appointmentDate };
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredContacts, questions, customFields, companyFields, companyData);
  };

  const handleExportJSON = () => {
    exportToJSON(filteredContacts, questions, companyData);
  };

  const handleSaveQuestions = (updatedQuestions: typeof questions, _applyToBlank: boolean, deletedIds: string[]) => {
    setQuestions(updatedQuestions);
    if (deletedIds.length > 0) {
      clearContactAnswers(deletedIds);
    }
  };

  const handleAttendedYes = async (contact: Contact) => {
    await markAppointmentAttended(contact.id, true);
    setSelectedContact(prev => prev?.id === contact.id ? { ...prev, appointmentAttended: true } : prev);
  };

  const handleAttendedNo = (contact: Contact) => {
    setPendingNoShowContact(contact);
    setShowNoShowDialog(true);
  };

  const confirmNoShow = async () => {
    if (!pendingNoShowContact) return;
    await markAppointmentAttended(pendingNoShowContact.id, false);
    setSelectedContact(prev => prev?.id === pendingNoShowContact.id ? { ...prev, appointmentAttended: false } : prev);
    setShowNoShowDialog(false);
    // Open the new no-show actions dialog
    setNoShowAction('leave');
    setNoShowNotInterestedReason('');
    setNoShowRescheduleDate('');
    setNoShowRescheduleTime('');
    setNoShowCallbackDate('');
    setNoShowCallbackTime('');
    setShowNoShowActionsDialog(true);
  };

  const resetNoShowState = () => {
    setNoShowAction('leave');
    setNoShowNotInterestedReason('');
    setNoShowRescheduleDate('');
    setNoShowRescheduleTime('');
    setNoShowCallbackDate('');
    setNoShowCallbackTime('');
    setPendingNoShowContact(null);
  };

  const handleNoShowAction = async () => {
    if (!pendingNoShowContact) return;
    
    switch (noShowAction) {
      case 'reschedule':
        if (!noShowRescheduleDate || !noShowRescheduleTime) return;
        const rescheduleDate = new Date(`${noShowRescheduleDate}T${noShowRescheduleTime}`);
        await rescheduleAppointment(pendingNoShowContact.id, rescheduleDate, 'Rescheduled after no-show');
        // Update selected contact if viewing in modal
        if (selectedContact?.id === pendingNoShowContact.id) {
          setSelectedContact({
            ...selectedContact,
            appointmentDate: rescheduleDate,
            appointmentAttended: null,
          });
        }
        break;
      case 'pending':
        await returnToPot(pendingNoShowContact.id, undefined, pendingNoShowContact.completedReason || 'appointment_booked');
        if (selectedContact?.id === pendingNoShowContact.id) {
          setSelectedContact(null);
        }
        break;
      case 'callback':
        if (!noShowCallbackDate || !noShowCallbackTime) return;
        const callbackDate = new Date(`${noShowCallbackDate}T${noShowCallbackTime}`);
        await returnToPot(pendingNoShowContact.id, callbackDate, pendingNoShowContact.completedReason || 'appointment_booked');
        if (selectedContact?.id === pendingNoShowContact.id) {
          setSelectedContact(null);
        }
        break;
      case 'not_interested':
        if (!noShowNotInterestedReason) return;
        await updateContactStatus(pendingNoShowContact.id, 'not_interested', undefined, 'Marked not interested after no-show', undefined, noShowNotInterestedReason as NotInterestedReason);
        if (selectedContact?.id === pendingNoShowContact.id) {
          setSelectedContact({
            ...selectedContact,
            status: 'not_interested',
            notInterestedReason: noShowNotInterestedReason as NotInterestedReason,
          });
        }
        break;
      case 'leave':
        // Do nothing - already marked as no-show
        break;
    }
    
    setShowNoShowActionsDialog(false);
    resetNoShowState();
  };

  const handleReturnToPot = async () => {
    if (!pendingNoShowContact) return;
    
    let callbackDate: Date | undefined;
    if (returnType === 'callback' && returnCallbackDate && returnCallbackTime) {
      callbackDate = new Date(`${returnCallbackDate}T${returnCallbackTime}`);
    }
    
    await returnToPot(pendingNoShowContact.id, callbackDate, pendingNoShowContact.completedReason || 'appointment_booked');
    
    setShowReturnToPotDialog(false);
    setPendingNoShowContact(null);
    setReturnCallbackDate('');
    setReturnCallbackTime('');
    setReturnType('pending');
    setSelectedContact(null);
  };

  const handleOpenRebookDialog = (contact: Contact) => {
    setRebookContact(contact);
    setRebookDate('');
    setRebookTime('');
    setShowRebookDialog(true);
  };

  const handleRebook = async () => {
    if (!rebookContact || !rebookDate || !rebookTime) return;
    
    const newAppointmentDate = new Date(`${rebookDate}T${rebookTime}`);
    await rebookAppointment(rebookContact.id, newAppointmentDate, 'Rebooked after no-show');
    
    // Update local selected contact if viewing in modal
    setSelectedContact(prev => prev?.id === rebookContact.id ? { 
      ...prev, 
      appointmentDate: newAppointmentDate,
      appointmentAttended: null 
    } : prev);
    
    setShowRebookDialog(false);
    setRebookContact(null);
    setRebookDate('');
    setRebookTime('');
  };

  const handleSendBackToPot = (contact: Contact) => {
    setPendingNoShowContact(contact);
    setShowReturnToPotDialog(true);
  };

  const handleOpenRescheduleDialog = (contact: Contact) => {
    setRescheduleContact(contact);
    // Pre-fill with current appointment date
    if (contact.appointmentDate) {
      setRescheduleDate(format(contact.appointmentDate, 'yyyy-MM-dd'));
      setRescheduleTime(format(contact.appointmentDate, 'HH:mm'));
    } else {
      setRescheduleDate('');
      setRescheduleTime('');
    }
    setShowRescheduleDialog(true);
  };

  const handleReschedule = async () => {
    if (!rescheduleContact || !rescheduleDate || !rescheduleTime) return;
    
    const newAppointmentDate = new Date(`${rescheduleDate}T${rescheduleTime}`);
    await rescheduleAppointment(rescheduleContact.id, newAppointmentDate);
    
    // Update selected contact if viewing in modal
    if (selectedContact?.id === rescheduleContact.id) {
      setSelectedContact({
        ...selectedContact,
        appointmentDate: newAppointmentDate,
        appointmentAttended: null,
      });
    }
    
    setShowRescheduleDialog(false);
    setRescheduleContact(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const normalizeCompanyName = (name: string) => name.toLowerCase().trim();

  const getCompanyData = (contact: Contact) => {
    const companyKey = contact.company ? normalizeCompanyName(contact.company) : '';
    return companyData[companyKey] || { fieldValues: {} };
  };

  const pendingReviewCount = useMemo(() => {
    const now = new Date();
    return completedContacts.filter(c => 
      c.status === 'completed' && 
      c.completedReason === 'appointment_booked' && 
      c.appointmentDate && 
      new Date(c.appointmentDate) < now && 
      c.appointmentAttended === null
    ).length;
  }, [completedContacts]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav 
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onSettingsClick={() => setShowSettings(true)}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col p-4">
        {/* Top Filters Row: POT + Date Range */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Select value={selectedPotId || 'all'} onValueChange={(v) => setSelectedPotId(v === 'all' ? null : v)}>
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="All POTs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All POTs</SelectItem>
              {pots.map(pot => (
                <SelectItem key={pot.id} value={pot.id}>{pot.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Button 
            variant={quickFilter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setQuickFilter('all')}
            className="h-7 text-xs"
          >
            All
          </Button>
          <Button 
            variant={quickFilter === 'completed' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setQuickFilter('completed')}
            className="h-7 text-xs"
          >
            Completed
          </Button>
          <Button 
            variant={quickFilter === 'not_interested' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setQuickFilter('not_interested')}
            className="h-7 text-xs"
          >
            Not Interested
          </Button>
          <Button 
            variant={quickFilter === 'pending_review' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setQuickFilter('pending_review')}
            className="h-7 text-xs relative"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            Pending Review
            {pendingReviewCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {pendingReviewCount}
              </span>
            )}
          </Button>
          <Button 
            variant={quickFilter === 'attended' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setQuickFilter('attended')}
            className="h-7 text-xs"
          >
            <Check className="w-3 h-3 mr-1" />
            Attended
          </Button>
          <Button 
            variant={quickFilter === 'no_show' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setQuickFilter('no_show')}
            className="h-7 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            No Show
          </Button>
        </div>

        {/* Search & Reason Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts, fields, answers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="Filter by reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reasons</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="not_interested">Not Interested</SelectItem>
              {COMPLETED_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
              {NOT_INTERESTED_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Results count */}
        <p className="text-xs text-muted-foreground mb-2">
          {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''}
        </p>
        
        {/* Table */}
        <div className="flex-1 overflow-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0">
              <tr className="border-b border-border">
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Company</th>
                <th className="text-left p-2 font-medium">Status</th>
                <th className="text-left p-2 font-medium">Reason</th>
                <th className="text-left p-2 font-medium">Date</th>
                <th className="text-left p-2 font-medium">Appointment</th>
                <th className="text-left p-2 font-medium">Attended</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No completed contacts found
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => {
                  const aptStatus = getAppointmentStatus(contact);
                  return (
                    <tr 
                      key={contact.id} 
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setSelectedContact(contact)}
                    >
                      <td className="p-2">
                        <p className="font-medium">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
                      </td>
                      <td className="p-2">{contact.company}</td>
                      <td className="p-2">
                        <Badge 
                          variant={contact.status === 'completed' ? 'default' : 'secondary'}
                          className={contact.status === 'completed' ? 'bg-success' : ''}
                        >
                          {contact.status === 'completed' ? 'Completed' : 'Not Interested'}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">{getReasonLabel(contact)}</td>
                      <td className="p-2 text-muted-foreground">
                        {contact.lastCalledAt ? format(new Date(contact.lastCalledAt), 'do MMM yyyy') : '-'}
                      </td>
                      <td className="p-2">
                        {aptStatus ? (
                          <span className={cn(
                            "px-2 py-1 rounded text-sm font-medium inline-block",
                            new Date(aptStatus.date) < new Date() 
                              ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/30"
                              : "bg-green-500/20 text-green-600 border border-green-500/30"
                          )}>
                            {format(new Date(aptStatus.date), 'do MMM HH:mm')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        {aptStatus ? (
                          aptStatus.status === 'upcoming' ? (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="border-blue-500 text-blue-600 text-xs mr-1">
                                Upcoming
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs border-success text-success hover:bg-success hover:text-success-foreground"
                                onClick={() => handleAttendedYes(contact)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleAttendedNo(contact)}
                              >
                                <X className="w-3 h-3 mr-1" />
                                No
                              </Button>
                            </div>
                          ) : aptStatus.status === 'pending_review' ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs border-success text-success hover:bg-success hover:text-success-foreground"
                                onClick={() => handleAttendedYes(contact)}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => handleAttendedNo(contact)}
                              >
                                <X className="w-3 h-3 mr-1" />
                                No
                              </Button>
                            </div>
                          ) : aptStatus.status === 'attended' ? (
                            <span className="flex items-center gap-1 text-success text-sm font-medium">
                              <Check className="w-4 h-4" /> Yes
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-destructive text-sm font-medium">
                                <X className="w-4 h-4" /> No
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                                onClick={() => handleOpenRebookDialog(contact)}
                              >
                                <CalendarPlus className="w-3 h-3 mr-1" />
                                Rebook
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Detail Modal */}
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)} modal={true}>
        <DialogContent className="bg-card border-border w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] flex flex-col">
          {selectedContact && (
            <>
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  {selectedContact.firstName} {selectedContact.lastName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedContact.jobTitle}</p>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto pr-4 min-h-0">
                <div className="space-y-4">
                  {/* Appointment Status Section */}
                  {(() => {
                    const aptStatus = getAppointmentStatus(selectedContact);
                    if (!aptStatus) return null;
                    
                    return (
                      <div className={`p-3 rounded-lg border ${
                        aptStatus.status === 'pending_review' 
                          ? 'border-warning bg-warning/10' 
                          : aptStatus.status === 'attended'
                          ? 'border-success bg-success/10'
                          : aptStatus.status === 'no_show'
                          ? 'border-destructive bg-destructive/10'
                          : 'border-blue-500 bg-blue-500/10'
                      }`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {aptStatus.status === 'pending_review' && (
                              <Badge variant="outline" className="border-warning text-warning">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                PAST
                              </Badge>
                            )}
                            {aptStatus.status === 'upcoming' && (
                              <Badge variant="outline" className="border-blue-500 text-blue-600">
                                Upcoming
                              </Badge>
                            )}
                            <span className="text-sm font-medium">
                              Appointment: {format(new Date(aptStatus.date), 'do MMM yyyy')} at {format(new Date(aptStatus.date), 'HH:mm')}
                            </span>
                          </div>
                          {/* Reschedule button for all appointment statuses */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7"
                            onClick={() => handleOpenRescheduleDialog(selectedContact)}
                          >
                            <CalendarClock className="w-3 h-3 mr-1" />
                            Reschedule
                          </Button>
                        </div>
                        
                        {/* Upcoming appointment with override option */}
                        {aptStatus.status === 'upcoming' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Override attendance:</span>
                            <Button 
                              size="sm" 
                              className="bg-success hover:bg-success/90 h-7"
                              onClick={() => handleAttendedYes(selectedContact)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Yes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-7"
                              onClick={() => handleAttendedNo(selectedContact)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              No
                            </Button>
                          </div>
                        )}
                        
                        {aptStatus.status === 'pending_review' && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Did they attend?</span>
                            <Button 
                              size="sm" 
                              className="bg-success hover:bg-success/90 h-7"
                              onClick={() => handleAttendedYes(selectedContact)}
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Yes
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-7"
                              onClick={() => handleAttendedNo(selectedContact)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              No
                            </Button>
                          </div>
                        )}
                        
                        {aptStatus.status === 'attended' && (
                          <p className="text-sm text-success font-medium flex items-center gap-1">
                            <Check className="w-4 h-4" /> Attended
                          </p>
                        )}
                        
                        {aptStatus.status === 'no_show' && (
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-destructive font-medium flex items-center gap-1">
                              <X className="w-4 h-4" /> No Show
                            </p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-7 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
                              onClick={() => handleOpenRebookDialog(selectedContact)}
                            >
                              <CalendarPlus className="w-3 h-3 mr-1" />
                              Rebook
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant={selectedContact.status === 'completed' ? 'default' : 'secondary'}
                      className={selectedContact.status === 'completed' ? 'bg-success' : ''}
                    >
                      {getReasonLabel(selectedContact)}
                    </Badge>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => handleSendBackToPot(selectedContact)}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      Send Back to Pot
                    </Button>
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.company}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.email || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedContact.website || '-'}</span>
                      </div>
                    </div>
                    
                    {/* Custom Contact Fields */}
                    {selectedContact.customFields && Object.keys(selectedContact.customFields).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          {customFields.filter(f => !f.isArchived).map(field => {
                            const value = selectedContact.customFields?.[field.id];
                            if (value === undefined || value === '') return null;
                            return (
                              <div key={field.id} className="flex justify-between">
                                <span className="text-muted-foreground">{field.label}:</span>
                                <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* History Timeline */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">History</p>
                    <ContactHistoryBar contactId={selectedContact.id} />
                  </div>

                  {/* AI Research */}
                  {(() => {
                    const contactCompanyData = getCompanyData(selectedContact);
                    const hasAIData = contactCompanyData.aiSummary || contactCompanyData.aiCustomResearch || selectedContact.aiPersona;
                    
                    if (!hasAIData) return null;
                    
                    return (
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Research</p>
                        {contactCompanyData.aiSummary && (
                          <AIResearchBox
                            title="Company Summary"
                            content={contactCompanyData.aiSummary}
                            isLoading={false}
                            onRefresh={() => {}}
                            variant="company"
                            maxCollapsedLines={3}
                            disabled={true}
                            disabledReason="View only"
                          />
                        )}
                        {contactCompanyData.aiCustomResearch && (
                          <AIResearchBox
                            title="Targeted Research"
                            content={contactCompanyData.aiCustomResearch}
                            isLoading={false}
                            onRefresh={() => {}}
                            variant="custom"
                            maxCollapsedLines={3}
                            disabled={true}
                            disabledReason="View only"
                          />
                        )}
                        {selectedContact.aiPersona && (
                          <AIResearchBox
                            title="Persona"
                            content={selectedContact.aiPersona}
                            isLoading={false}
                            onRefresh={() => {}}
                            variant="persona"
                            maxCollapsedLines={3}
                            disabled={true}
                            disabledReason="View only"
                          />
                        )}
                      </div>
                    );
                  })()}

                  {/* Qualifying Answers */}
                  {selectedContact.qualifyingAnswers && Object.keys(selectedContact.qualifyingAnswers).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Qualifying Answers</p>
                      <div className="space-y-1 text-sm">
                        {questions.filter(q => !q.isArchived).map(q => {
                          const answer = selectedContact.qualifyingAnswers?.[q.id];
                          if (answer === undefined) return null;
                          return (
                            <div key={q.id} className="flex justify-between">
                              <span className="text-muted-foreground">{q.label}:</span>
                              <span>{Array.isArray(answer) ? answer.join(', ') : String(answer)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* No Show Confirmation Dialog */}
      <Dialog open={showNoShowDialog} onOpenChange={setShowNoShowDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as No Show?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to mark this appointment as a no-show?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNoShowDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmNoShow}>Confirm No Show</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No-Show Actions Dialog (replaces Return to Pot after no-show) */}
      <Dialog open={showNoShowActionsDialog} onOpenChange={(open) => {
        if (!open) {
          setShowNoShowActionsDialog(false);
          resetNoShowState();
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>What would you like to do?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            {pendingNoShowContact?.firstName} {pendingNoShowContact?.lastName} was marked as a no-show. Choose an action:
          </p>
          
          <RadioGroup value={noShowAction} onValueChange={(v) => setNoShowAction(v as NoShowAction)} className="space-y-3">
            {/* Reschedule */}
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              noShowAction === 'reschedule' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setNoShowAction('reschedule')}>
              <RadioGroupItem value="reschedule" id="noshow-reschedule" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="noshow-reschedule" className="font-medium cursor-pointer flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-primary" />
                  Reschedule Appointment
                </Label>
                <p className="text-xs text-muted-foreground mb-2">Book a new appointment date and time</p>
                {noShowAction === 'reschedule' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="noshow-reschedule-date" className="text-xs">Date</Label>
                      <Input
                        id="noshow-reschedule-date"
                        type="date"
                        value={noShowRescheduleDate}
                        onChange={(e) => setNoShowRescheduleDate(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="noshow-reschedule-time" className="text-xs">Time</Label>
                      <Input
                        id="noshow-reschedule-time"
                        type="time"
                        value={noShowRescheduleTime}
                        onChange={(e) => setNoShowRescheduleTime(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Return to Pending */}
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              noShowAction === 'pending' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setNoShowAction('pending')}>
              <RadioGroupItem value="pending" id="noshow-pending" className="mt-0.5" />
              <div>
                <Label htmlFor="noshow-pending" className="font-medium cursor-pointer flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[hsl(var(--callback))]" />
                  Return to Pending Queue
                </Label>
                <p className="text-xs text-muted-foreground">Contact will appear at the end of the queue</p>
              </div>
            </div>
            
            {/* Schedule Callback */}
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              noShowAction === 'callback' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setNoShowAction('callback')}>
              <RadioGroupItem value="callback" id="noshow-callback" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="noshow-callback" className="font-medium cursor-pointer flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[hsl(var(--callback))]" />
                  Schedule Callback
                </Label>
                <p className="text-xs text-muted-foreground mb-2">Set a specific date and time to call back</p>
                {noShowAction === 'callback' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="noshow-callback-date" className="text-xs">Date</Label>
                      <Input
                        id="noshow-callback-date"
                        type="date"
                        value={noShowCallbackDate}
                        onChange={(e) => setNoShowCallbackDate(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="noshow-callback-time" className="text-xs">Time</Label>
                      <Input
                        id="noshow-callback-time"
                        type="time"
                        value={noShowCallbackTime}
                        onChange={(e) => setNoShowCallbackTime(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mark as Not Interested */}
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              noShowAction === 'not_interested' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setNoShowAction('not_interested')}>
              <RadioGroupItem value="not_interested" id="noshow-not-interested" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="noshow-not-interested" className="font-medium cursor-pointer flex items-center gap-2">
                  <Ban className="w-4 h-4 text-destructive" />
                  Mark as Not Interested
                </Label>
                <p className="text-xs text-muted-foreground mb-2">Move to not interested with a reason</p>
                {noShowAction === 'not_interested' && (
                  <Select value={noShowNotInterestedReason} onValueChange={(v) => setNoShowNotInterestedReason(v as NotInterestedReason)}>
                    <SelectTrigger className="h-8 text-sm mt-2">
                      <SelectValue placeholder="Select reason..." />
                    </SelectTrigger>
                    <SelectContent>
                      {NOT_INTERESTED_REASONS.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            {/* Leave in Completed */}
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              noShowAction === 'leave' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setNoShowAction('leave')}>
              <RadioGroupItem value="leave" id="noshow-leave" className="mt-0.5" />
              <div>
                <Label htmlFor="noshow-leave" className="font-medium cursor-pointer flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  Leave in Completed
                </Label>
                <p className="text-xs text-muted-foreground">Keep as no-show, no further action</p>
              </div>
            </div>
          </RadioGroup>
          
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowNoShowActionsDialog(false);
              resetNoShowState();
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleNoShowAction}
              disabled={
                (noShowAction === 'reschedule' && (!noShowRescheduleDate || !noShowRescheduleTime)) ||
                (noShowAction === 'callback' && (!noShowCallbackDate || !noShowCallbackTime)) ||
                (noShowAction === 'not_interested' && !noShowNotInterestedReason)
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return to Pot Dialog */}
      <Dialog open={showReturnToPotDialog} onOpenChange={(open) => {
        if (!open) {
          setShowReturnToPotDialog(false);
          setPendingNoShowContact(null);
          setReturnCallbackDate('');
          setReturnCallbackTime('');
          setReturnType('pending');
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return to Data Pot</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how to return this contact to the pot:
          </p>
          
          <RadioGroup value={returnType} onValueChange={(v) => setReturnType(v as 'pending' | 'callback')} className="space-y-3">
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              returnType === 'pending' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setReturnType('pending')}>
              <RadioGroupItem value="pending" id="return-pending" className="mt-0.5" />
              <div>
                <Label htmlFor="return-pending" className="font-medium cursor-pointer">Return to Pending Queue</Label>
                <p className="text-xs text-muted-foreground">Contact will appear at the end of the queue</p>
              </div>
            </div>
            
            <div className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
              returnType === 'callback' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"
            )} onClick={() => setReturnType('callback')}>
              <RadioGroupItem value="callback" id="return-callback" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="return-callback" className="font-medium cursor-pointer">Schedule Callback</Label>
                <p className="text-xs text-muted-foreground mb-2">Set a specific date and time to call back</p>
                {returnType === 'callback' && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <Label htmlFor="return-date" className="text-xs">Date</Label>
                      <Input
                        id="return-date"
                        type="date"
                        value={returnCallbackDate}
                        onChange={(e) => setReturnCallbackDate(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="return-time" className="text-xs">Time</Label>
                      <Input
                        id="return-time"
                        type="time"
                        value={returnCallbackTime}
                        onChange={(e) => setReturnCallbackTime(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </RadioGroup>
          
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowReturnToPotDialog(false);
              setPendingNoShowContact(null);
              setReturnType('pending');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleReturnToPot}
              disabled={returnType === 'callback' && (!returnCallbackDate || !returnCallbackTime)}
              className="bg-[hsl(var(--callback))] hover:bg-[hsl(var(--callback))]/90"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Return to Pot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rebook Appointment Dialog */}
      <Dialog open={showRebookDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRebookDialog(false);
          setRebookContact(null);
          setRebookDate('');
          setRebookTime('');
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rebook Appointment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Schedule a new appointment for {rebookContact?.firstName} {rebookContact?.lastName}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="rebook-date" className="text-xs">Date</Label>
              <Input
                id="rebook-date"
                type="date"
                value={rebookDate}
                onChange={(e) => setRebookDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rebook-time" className="text-xs">Time</Label>
              <Input
                id="rebook-time"
                type="time"
                value={rebookTime}
                onChange={(e) => setRebookTime(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowRebookDialog(false);
              setRebookContact(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleRebook}
              disabled={!rebookDate || !rebookTime}
            >
              <CalendarPlus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Appointment Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={(open) => {
        if (!open) {
          setShowRescheduleDialog(false);
          setRescheduleContact(null);
          setRescheduleDate('');
          setRescheduleTime('');
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Reschedule appointment for {rescheduleContact?.firstName} {rescheduleContact?.lastName}
          </p>
          {rescheduleContact?.appointmentDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Current: {format(rescheduleContact.appointmentDate, 'do MMM yyyy')} at {format(rescheduleContact.appointmentDate, 'HH:mm')}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="reschedule-date" className="text-xs">New Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reschedule-time" className="text-xs">New Time</Label>
              <Input
                id="reschedule-time"
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowRescheduleDialog(false);
              setRescheduleContact(null);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleReschedule}
              disabled={!rescheduleDate || !rescheduleTime}
            >
              <CalendarClock className="w-4 h-4 mr-2" />
              Reschedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <QualifyingQuestionsSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        questions={questions}
        onSave={handleSaveQuestions}
      />
    </div>
  );
}