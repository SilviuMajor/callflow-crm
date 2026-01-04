import { useMemo, useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { useContacts } from '@/hooks/useContacts';
import { useQualifyingQuestions } from '@/hooks/useQualifyingQuestions';
import { Contact, COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  LineChart,
  Line,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';

const COLORS = ['hsl(220, 90%, 56%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(199, 89%, 48%)'];

export default function AnalyticsPage() {
  const { contacts, stats } = useContacts();
  const { questions } = useQualifyingQuestions();

  const completedContacts = useMemo(() => 
    contacts.filter(c => c.status === 'completed'), [contacts]);
  
  const notInterestedContacts = useMemo(() => 
    contacts.filter(c => c.status === 'not_interested'), [contacts]);

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

  // Not interested breakdown
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

  // Funnel data
  const funnelData = [
    { name: 'Total Contacts', value: stats.total, fill: 'hsl(220, 90%, 56%)' },
    { name: 'Contacted', value: stats.completed + stats.notInterested + stats.callbacks + stats.noAnswer, fill: 'hsl(199, 89%, 48%)' },
    { name: 'Engaged', value: stats.completed + stats.notInterested + stats.callbacks, fill: 'hsl(38, 92%, 50%)' },
    { name: 'Completed', value: stats.completed, fill: 'hsl(142, 76%, 36%)' },
  ];

  // Time-based mock data (would be real with persistence)
  const timeData = [
    { hour: '9am', calls: 12 },
    { hour: '10am', calls: 18 },
    { hour: '11am', calls: 15 },
    { hour: '12pm', calls: 8 },
    { hour: '1pm', calls: 10 },
    { hour: '2pm', calls: 22 },
    { hour: '3pm', calls: 19 },
    { hour: '4pm', calls: 16 },
    { hour: '5pm', calls: 11 },
  ];

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

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav />
      
      <div className="flex-1 overflow-y-auto p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="time" className="text-xs">Time Analysis</TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs">Pipeline</TabsTrigger>
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
            
            {/* Status Pie Chart */}
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
          </TabsContent>
          
          {/* Time Tab */}
          <TabsContent value="time" className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Calls by Hour</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="calls" fill="hsl(220, 90%, 56%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Trend</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeData}>
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="calls" stroke="hsl(220, 90%, 56%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
          
          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Sales Funnel</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={funnelData}
                      isAnimationActive
                    >
                      <LabelList position="right" fill="#000" stroke="none" dataKey="name" fontSize={12} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Not Interested Breakdown */}
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-sm font-medium mb-3">Lost Reasons</p>
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
                <p className="text-xs text-muted-foreground text-center py-8">No data yet</p>
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
