import { useState, useMemo } from 'react';
import { TopNav } from '@/components/TopNav';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useCompanyFields } from '@/hooks/useCompanyFields';
import { useCompanyData } from '@/hooks/useCompanyData';
import { usePots } from '@/hooks/usePots';
import { Contact, COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Phone, Mail, Building2, Globe, Calendar, Clock, AlertTriangle, Check, X, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { QualifyingQuestionsSettings } from '@/components/QualifyingQuestionsSettings';
import { ContactHistoryBar } from '@/components/ContactHistoryBar';
import { AIResearchBox } from '@/components/AIResearchBox';
import { exportToCSV, exportToJSON } from '@/utils/exportData';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

type QuickFilter = 'all' | 'completed' | 'not_interested' | 'pending_review' | 'attended' | 'no_show';
type DateRange = 'all' | 'today' | 'week' | 'month' | 'quarter' | 'custom';

export default function CompletedPage() {
  const { pots } = usePots();
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const { completedContacts, clearContactAnswers, markAppointmentAttended, returnToPot, updateContactStatus } = useContacts(selectedPotId);
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
  const [showReturnToPotDialog, setShowReturnToPotDialog] = useState(false);
  const [returnCallbackDate, setReturnCallbackDate] = useState('');
  const [returnCallbackTime, setReturnCallbackTime] = useState('');
  const [pendingNoShowContact, setPendingNoShowContact] = useState<Contact | null>(null);

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
    setShowReturnToPotDialog(true);
  };

  const handleReturnToPot = async () => {
    if (!pendingNoShowContact || !returnCallbackDate || !returnCallbackTime) return;
    
    const callbackDate = new Date(`${returnCallbackDate}T${returnCallbackTime}`);
    await returnToPot(pendingNoShowContact.id, callbackDate, pendingNoShowContact.completedReason || 'appointment_booked');
    
    setShowReturnToPotDialog(false);
    setPendingNoShowContact(null);
    setReturnCallbackDate('');
    setReturnCallbackTime('');
    setSelectedContact(null);
  };

  const handleSendBackToPot = (contact: Contact) => {
    setPendingNoShowContact(contact);
    setShowReturnToPotDialog(true);
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
                      <td className="p-2 text-muted-foreground">
                        {aptStatus ? format(new Date(aptStatus.date), 'do MMM HH:mm') : '-'}
                      </td>
                      <td className="p-2" onClick={(e) => e.stopPropagation()}>
                        {aptStatus ? (
                          aptStatus.status === 'upcoming' ? (
                            <Badge variant="outline" className="border-blue-500 text-blue-600">Upcoming</Badge>
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
                            <span className="flex items-center gap-1 text-destructive text-sm font-medium">
                              <X className="w-4 h-4" /> No
                            </span>
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
        <DialogContent className="bg-card border-border w-[90vw] max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          {selectedContact && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedContact.firstName} {selectedContact.lastName}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{selectedContact.jobTitle}</p>
              </DialogHeader>
              
              <ScrollArea className="flex-1 pr-4">
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
                        <div className="flex items-center gap-2 mb-2">
                          {aptStatus.status === 'pending_review' && (
                            <Badge variant="outline" className="border-warning text-warning">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              PAST
                            </Badge>
                          )}
                          <span className="text-sm font-medium">
                            Appointment: {format(new Date(aptStatus.date), 'do MMM yyyy')} at {format(new Date(aptStatus.date), 'HH:mm')}
                          </span>
                        </div>
                        
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
                          <p className="text-sm text-destructive font-medium flex items-center gap-1">
                            <X className="w-4 h-4" /> No Show
                          </p>
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
              </ScrollArea>
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

      {/* Return to Pot Dialog */}
      <Dialog open={showReturnToPotDialog} onOpenChange={(open) => {
        if (!open) {
          setShowReturnToPotDialog(false);
          setPendingNoShowContact(null);
          setReturnCallbackDate('');
          setReturnCallbackTime('');
        }
      }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Back to Data Pot?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Do you want to send this contact back to the data pot for a callback?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="return-date" className="text-xs">Callback Date</Label>
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
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => {
              setShowReturnToPotDialog(false);
              setPendingNoShowContact(null);
            }}>
              No, Keep as Completed
            </Button>
            <Button 
              onClick={handleReturnToPot}
              disabled={!returnCallbackDate || !returnCallbackTime}
              className="bg-[hsl(var(--callback))] hover:bg-[hsl(var(--callback))]/90"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Yes, Send Back
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