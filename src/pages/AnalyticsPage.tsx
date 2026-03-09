import { useMemo, useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { StatsBar } from '@/components/StatsBar';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { usePots } from '@/hooks/usePots';
import { useAnalyticsData, TimeGranularity } from '@/hooks/useAnalyticsData';
import { useTodayStats } from '@/hooks/useTodayStats';
import { COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { 
  isAfter, 
  startOfDay, 
  startOfWeek, 
  startOfMonth, 
  startOfYear,
  endOfWeek,
  endOfMonth,
  endOfYear,
  format,
  getMonth,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears
} from 'date-fns';

export default function AnalyticsPage() {
  const { pots } = usePots();
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { contacts: allContacts } = useContacts();
  const { questions } = useQualifyingQuestions();
  const { getTimeData, isLoading: isLoadingTimeData, dateRange } = useAnalyticsData(
    selectedPotId, 
    timeGranularity, 
    selectedDate
  );

  // Get label for date picker based on granularity
  const getDateLabel = () => {
    switch (timeGranularity) {
      case 'hourly':
        return format(selectedDate, 'EEEE, do MMMM yyyy');
      case 'daily':
        return `Week of ${format(startOfWeek(selectedDate), 'do MMM')} - ${format(endOfWeek(selectedDate), 'do MMM yyyy')}`;
      case 'weekly':
        return format(selectedDate, 'MMMM yyyy');
      case 'monthly':
        return format(selectedDate, 'yyyy');
      default:
        return format(selectedDate, 'PPP');
    }
  };

  // Navigate date based on granularity
  const navigateDate = (direction: 'prev' | 'next') => {
    const add = direction === 'next';
    switch (timeGranularity) {
      case 'hourly':
        setSelectedDate(add ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
        break;
      case 'daily':
        setSelectedDate(add ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
        break;
      case 'weekly':
        setSelectedDate(add ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
        break;
      case 'monthly':
        setSelectedDate(add ? addYears(selectedDate, 1) : subYears(selectedDate, 1));
        break;
    }
  };

  // Apply POT filtering for overview stats
  const contacts = useMemo(() => {
    let filtered = allContacts;
    if (selectedPotId) {
      filtered = filtered.filter(c => c.potId === selectedPotId);
    }
    // Filter by date range from the analytics hook
    if (dateRange) {
      filtered = filtered.filter(c => {
        // Use lastCalledAt when available (shows contacts worked in period), fallback to createdAt
        const refDate = c.lastCalledAt || c.createdAt;
        return refDate &&
          isAfter(new Date(refDate), dateRange.start) &&
          new Date(refDate) <= dateRange.end;
      });
    }
    return filtered;
  }, [allContacts, selectedPotId, dateRange]);

  // Recalculate stats based on filtered contacts
  const stats = useMemo(() => ({
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    noAnswer: contacts.filter(c => c.status === 'no_answer').length,
    callbacks: contacts.filter(c => c.status === 'callback').length,
    completed: contacts.filter(c => c.status === 'completed').length,
    notInterested: contacts.filter(c => c.status === 'not_interested').length,
    dueCallbacks: contacts.filter(
      c => c.status === 'callback' && c.callbackDate && new Date(c.callbackDate) <= new Date()
    ).length,
  }), [contacts]);

  const completedContacts = useMemo(() => 
    contacts.filter(c => c.status === 'completed'), [contacts]);
  
  const notInterestedContacts = useMemo(() => 
    contacts.filter(c => c.status === 'not_interested'), [contacts]);

  // Appointment metrics
  const appointmentMetrics = useMemo(() => {
    const appointmentsBooked = contacts.filter(
      c => c.completedReason === 'appointment_booked'
    );
    
    const attended = appointmentsBooked.filter(c => c.appointmentAttended === true).length;
    const noShow = appointmentsBooked.filter(c => c.appointmentAttended === false).length;
    const pending = appointmentsBooked.filter(c => c.appointmentAttended === null).length;
    const total = appointmentsBooked.length;
    
    const decidedTotal = attended + noShow;
    const showRate = decidedTotal > 0 ? ((attended / decidedTotal) * 100).toFixed(1) : '0';
    
    return { total, attended, noShow, pending, showRate };
  }, [contacts]);

  const conversionRate = stats.total > 0 
    ? ((stats.completed / stats.total) * 100).toFixed(1) 
    : '0';
    
  const contactRate = stats.total > 0 
    ? (((stats.completed + stats.notInterested + stats.callbacks) / stats.total) * 100).toFixed(1) 
    : '0';

  // Completed breakdown
  const completedBreakdown = COMPLETED_REASONS.map(reason => ({
    name: reason.label,
    value: completedContacts.filter(c => c.completedReason === reason.value).length,
  })).filter(r => r.value > 0);

  // Not interested breakdown (Loss Reasons)
  const notInterestedBreakdown = NOT_INTERESTED_REASONS.map(reason => ({
    name: reason.label,
    value: notInterestedContacts.filter(c => c.notInterestedReason === reason.value).length,
  })).filter(r => r.value > 0);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: stats.pending, color: 'hsl(220, 14%, 90%)' },
    { name: 'No Answer', value: stats.noAnswer, color: 'hsl(220, 14%, 70%)' },
    { name: 'Callback', value: stats.callbacks, color: 'hsl(45, 93%, 47%)' },
    { name: 'Completed', value: stats.completed, color: 'hsl(142, 76%, 36%)' },
    { name: 'Not Interested', value: stats.notInterested, color: 'hsl(0, 84%, 60%)' },
  ].filter(s => s.value > 0);

  // Qualifying analytics
  const qualifyingAnalytics = useMemo(() => {
    return questions.map(question => {
      const answeredContacts = contacts.filter(c => c.qualifyingAnswers?.[question.id] !== undefined);
      
      if (['dropdown', 'radio'].includes(question.type)) {
        const breakdown = (question.options || []).map(option => ({
          name: option,
          value: answeredContacts.filter(c => c.qualifyingAnswers?.[question.id] === option).length,
        }));
        return { question, type: 'bar', data: breakdown };
      }
      
      if (question.type === 'rating') {
        const breakdown = [1, 2, 3, 4, 5].map(rating => ({
          name: `${rating} Star`,
          value: answeredContacts.filter(c => c.qualifyingAnswers?.[question.id] === rating).length,
        }));
        const avg = answeredContacts.length > 0 
          ? (answeredContacts.reduce((sum, c) => sum + (c.qualifyingAnswers?.[question.id] || 0), 0) / answeredContacts.length).toFixed(1)
          : '0';
        return { question, type: 'rating', data: breakdown, average: avg };
      }
      
      if (question.type === 'number' || question.type === 'currency') {
        const values = answeredContacts
          .map(c => parseFloat(c.qualifyingAnswers?.[question.id] || '0'))
          .filter(v => !isNaN(v));
        const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(0) : '0';
        const min = values.length > 0 ? Math.min(...values) : 0;
        const max = values.length > 0 ? Math.max(...values) : 0;
        return { question, type: 'numeric', average: avg, min, max, count: values.length };
      }
      
      return { question, type: 'text', count: answeredContacts.length };
    });
  }, [questions, contacts]);

  const OUTCOME_COLORS = {
    completed: 'hsl(142, 76%, 36%)',
    not_interested: 'hsl(0, 84%, 60%)',
    callback: 'hsl(45, 93%, 47%)',
    no_answer: 'hsl(220, 14%, 70%)',
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav />
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* Top Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
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
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="time" className="text-xs">Time Analysis</TabsTrigger>
            <TabsTrigger value="qualifying" className="text-xs">Qualifying</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Grid */}
            <StatsBar stats={stats} />
            
            {/* Rates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Conversion Rate</p>
                <p className="text-2xl font-semibold text-success">{conversionRate}%</p>
                <Progress value={parseFloat(conversionRate)} className="mt-2 h-2" />
              </div>
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-1">Contact Rate</p>
                <p className="text-2xl font-semibold text-primary">{contactRate}%</p>
                <Progress value={parseFloat(contactRate)} className="mt-2 h-2" />
              </div>
            </div>

            {/* Appointment Metrics */}
            <div className="grid md:grid-cols-4 gap-3">
              <StatCard label="Appointments Booked" value={appointmentMetrics.total} color="text-primary" />
              <StatCard label="Attended" value={appointmentMetrics.attended} color="text-success" />
              <StatCard label="No Show" value={appointmentMetrics.noShow} color="text-destructive" />
              <div className="p-3 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground">Show Rate</p>
                <p className="text-xl font-semibold text-success">{appointmentMetrics.showRate}%</p>
              </div>
            </div>
            
            {/* Status & Completed Charts */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm font-medium mb-3">Status Distribution</p>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {statusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Completed Breakdown */}
              <div className="p-4 rounded-lg border border-border bg-card">
                <p className="text-sm font-medium mb-3">Completed Breakdown</p>
                {completedBreakdown.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={completedBreakdown} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8">No completed contacts yet</p>
                )}
              </div>
            </div>

            {/* Loss Reasons Chart - Moved from Pipeline */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Loss Reasons</p>
              {notInterestedBreakdown.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={notInterestedBreakdown} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">No loss data yet</p>
              )}
            </div>
          </TabsContent>
          
          {/* Time Tab */}
          <TabsContent value="time" className="space-y-4">
            {/* Time Granularity & Date Selection */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">View by:</span>
                <Select 
                  value={timeGranularity} 
                  onValueChange={(v) => setTimeGranularity(v as TimeGranularity)}
                >
                  <SelectTrigger className="w-[120px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => navigateDate('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal h-9 min-w-[200px]"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {getDateLabel()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {timeGranularity === 'hourly' || timeGranularity === 'daily' ? (
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    ) : timeGranularity === 'weekly' ? (
                      <div className="p-3">
                        <p className="text-sm font-medium mb-2">Select Month</p>
                        <div className="grid grid-cols-3 gap-2">
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                            <Button
                              key={month}
                              variant={getMonth(selectedDate) === i ? 'default' : 'outline'}
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setMonth(i);
                                setSelectedDate(newDate);
                              }}
                            >
                              {month}
                            </Button>
                          ))}
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Year</p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDate(subYears(selectedDate, 1))}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium flex-1 text-center">
                              {format(selectedDate, 'yyyy')}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDate(addYears(selectedDate, 1))}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3">
                        <p className="text-sm font-medium mb-2">Select Year</p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDate(subYears(selectedDate, 1))}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-medium flex-1 text-center">
                            {format(selectedDate, 'yyyy')}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDate(addYears(selectedDate, 1))}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9"
                  onClick={() => navigateDate('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Total Actions Chart */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Total Actions</p>
              {isLoadingTimeData ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : getTimeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTimeData}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="total" fill="hsl(220, 90%, 56%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No activity data for this period
                </div>
              )}
            </div>
            
            {/* Outcome Breakdown Chart */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Outcomes Breakdown</p>
              {isLoadingTimeData ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : getTimeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getTimeData}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill={OUTCOME_COLORS.completed} />
                      <Bar dataKey="not_interested" name="Not Interested" stackId="a" fill={OUTCOME_COLORS.not_interested} />
                      <Bar dataKey="callback" name="Callback" stackId="a" fill={OUTCOME_COLORS.callback} />
                      <Bar dataKey="no_answer" name="No Answer" stackId="a" fill={OUTCOME_COLORS.no_answer} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No activity data for this period
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Qualifying Tab */}
          <TabsContent value="qualifying" className="space-y-4">
            {qualifyingAnalytics.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No qualifying questions configured
              </p>
            ) : (
              qualifyingAnalytics.map((item, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-card">
                  <p className="text-sm font-medium mb-3">{item.question.label}</p>
                  
                  {item.type === 'bar' && (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={item.data} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(220, 90%, 56%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  
                  {item.type === 'rating' && (
                    <>
                      <p className="text-2xl font-semibold text-primary mb-2">
                        {item.average} <span className="text-sm font-normal text-muted-foreground">avg rating</span>
                      </p>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={item.data}>
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                  
                  {item.type === 'numeric' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Average</p>
                        <p className="text-xl font-semibold">{item.average}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Min</p>
                        <p className="text-xl font-semibold">{item.min}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Max</p>
                        <p className="text-xl font-semibold">{item.max}</p>
                      </div>
                    </div>
                  )}
                  
                  {item.type === 'text' && (
                    <p className="text-sm text-muted-foreground">
                      {item.count} text responses collected
                    </p>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-semibold", color)}>{value}</p>
    </div>
  );
}