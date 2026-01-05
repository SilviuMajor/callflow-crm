import { useMemo, useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { usePots } from '@/hooks/usePots';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
import { isAfter, startOfDay, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns';

type DateRange = 'all' | 'today' | 'week' | 'month' | 'quarter';
type TimeGranularity = 'hourly' | 'daily' | 'weekly' | 'monthly';

export default function AnalyticsPage() {
  const { pots } = usePots();
  const [selectedPotId, setSelectedPotId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('week');
  const [timeGranularity, setTimeGranularity] = useState<TimeGranularity>('daily');
  
  const { contacts: allContacts } = useContacts();
  const { questions } = useQualifyingQuestions();
  const { getTimeData, isLoading: isLoadingTimeData } = useAnalyticsData(selectedPotId, dateRange);

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

  // Apply POT and date range filtering
  const contacts = useMemo(() => {
    let filtered = allContacts;
    
    if (selectedPotId) {
      filtered = filtered.filter(c => c.potId === selectedPotId);
    }
    
    const rangeStart = getDateRangeStart(dateRange);
    if (rangeStart) {
      filtered = filtered.filter(c => 
        c.createdAt && isAfter(new Date(c.createdAt), rangeStart)
      );
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

  // Get real time data from hook
  const timeData = useMemo(() => getTimeData(timeGranularity), [getTimeData, timeGranularity]);

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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="time" className="text-xs">Time Analysis</TabsTrigger>
            <TabsTrigger value="qualifying" className="text-xs">Qualifying</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard label="Total" value={stats.total} />
              <StatCard label="Pending" value={stats.pending} />
              <StatCard label="No Answer" value={stats.noAnswer} />
              <StatCard label="Callbacks" value={stats.callbacks} />
              <StatCard label="Completed" value={stats.completed} color="text-success" />
              <StatCard label="Not Interested" value={stats.notInterested} />
            </div>
            
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
            {/* Time Granularity Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">View by:</span>
              <ToggleGroup 
                type="single" 
                value={timeGranularity} 
                onValueChange={(v) => v && setTimeGranularity(v as TimeGranularity)}
                className="border rounded-lg"
              >
                <ToggleGroupItem value="hourly" className="text-xs px-3">Hourly</ToggleGroupItem>
                <ToggleGroupItem value="daily" className="text-xs px-3">Daily</ToggleGroupItem>
                <ToggleGroupItem value="weekly" className="text-xs px-3">Weekly</ToggleGroupItem>
                <ToggleGroupItem value="monthly" className="text-xs px-3">Monthly</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Total Actions Chart */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Total Actions</p>
              {isLoadingTimeData ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
              ) : timeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData}>
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
              ) : timeData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={timeData}>
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
              <div className="p-8 text-center text-muted-foreground">
                <p>No qualifying questions configured</p>
                <p className="text-xs mt-1">Add questions in the Calling page settings</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {qualifyingAnalytics.map(({ question, type, data, average, min, max, count }) => (
                  <div key={question.id} className="p-4 rounded-lg border border-border bg-card">
                    <p className="text-sm font-medium mb-3">{question.label}</p>
                    
                    {type === 'bar' && data && (
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="hsl(220, 90%, 56%)" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {type === 'rating' && (
                      <>
                        <p className="text-2xl font-semibold text-warning mb-2">★ {average}</p>
                        <div className="h-24">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                              <YAxis hide />
                              <Tooltip />
                              <Bar dataKey="value" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                    
                    {type === 'numeric' && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Min</p>
                            <p className="font-semibold">{question.type === 'currency' ? '$' : ''}{min}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg</p>
                            <p className="font-semibold text-primary">{question.type === 'currency' ? '$' : ''}{average}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Max</p>
                            <p className="font-semibold">{question.type === 'currency' ? '$' : ''}{max}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">{count} responses</p>
                      </div>
                    )}
                    
                    {type === 'text' && (
                      <p className="text-muted-foreground text-sm">{count} responses collected</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'text-foreground' }: { label: string; value: number; color?: string }) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
