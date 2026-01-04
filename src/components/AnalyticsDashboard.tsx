import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, TrendingUp, Phone, PhoneOff, Clock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Contact, COMPLETED_REASONS, NOT_INTERESTED_REASONS } from '@/types/contact';

interface AnalyticsDashboardProps {
  contacts: Contact[];
}

export function AnalyticsDashboard({ contacts }: AnalyticsDashboardProps) {
  const [completedOpen, setCompletedOpen] = useState(false);
  const [notInterestedOpen, setNotInterestedOpen] = useState(false);

  const completedContacts = contacts.filter(c => c.status === 'completed');
  const notInterestedContacts = contacts.filter(c => c.status === 'not_interested');
  const totalCalled = contacts.filter(c => c.status !== 'pending').length;

  // Calculate completed subcategory counts
  const completedBreakdown = COMPLETED_REASONS.map(reason => ({
    ...reason,
    count: completedContacts.filter(c => c.completedReason === reason.value).length,
  }));

  // Calculate not interested subcategory counts
  const notInterestedBreakdown = NOT_INTERESTED_REASONS.map(reason => ({
    ...reason,
    count: notInterestedContacts.filter(c => c.notInterestedReason === reason.value).length,
  }));

  // Overall stats
  const stats = {
    total: contacts.length,
    pending: contacts.filter(c => c.status === 'pending').length,
    noAnswer: contacts.filter(c => c.status === 'no_answer').length,
    callbacks: contacts.filter(c => c.status === 'callback').length,
    completed: completedContacts.length,
    notInterested: notInterestedContacts.length,
    conversionRate: totalCalled > 0 ? ((completedContacts.length / totalCalled) * 100).toFixed(1) : '0',
    contactRate: totalCalled > 0 ? (((totalCalled - contacts.filter(c => c.status === 'no_answer').length) / totalCalled) * 100).toFixed(1) : '0',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Analytics Dashboard</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-success" />
            <span className="text-muted-foreground">Conversion Rate:</span>
            <span className="font-bold text-success">{stats.conversionRate}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-info" />
            <span className="text-muted-foreground">Contact Rate:</span>
            <span className="font-bold text-info">{stats.contactRate}%</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        <div className="text-center p-3 bg-secondary/50 rounded-lg">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="text-center p-3 bg-info/10 rounded-lg">
          <p className="text-2xl font-bold text-info">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="text-center p-3 bg-destructive/10 rounded-lg">
          <p className="text-2xl font-bold text-destructive">{stats.noAnswer}</p>
          <p className="text-xs text-muted-foreground">No Answer</p>
        </div>
        <div className="text-center p-3 bg-warning/10 rounded-lg">
          <p className="text-2xl font-bold text-warning">{stats.callbacks}</p>
          <p className="text-xs text-muted-foreground">Callbacks</p>
        </div>
        <div className="text-center p-3 bg-success/10 rounded-lg">
          <p className="text-2xl font-bold text-success">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-muted-foreground">{stats.notInterested}</p>
          <p className="text-xs text-muted-foreground">Not Interested</p>
        </div>
      </div>

      {/* Expandable Completed Section */}
      <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg hover:bg-success/15 transition-colors">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="font-semibold text-foreground">Completed Breakdown</span>
              <span className="text-sm text-muted-foreground">({stats.completed} total)</span>
            </div>
            {completedOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-success/30">
            {completedBreakdown.map(item => (
              <div key={item.value} className="flex items-center gap-4">
                <span className="w-40 text-sm text-foreground">{item.label}</span>
                <div className="flex-1">
                  <Progress 
                    value={stats.completed > 0 ? (item.count / stats.completed) * 100 : 0} 
                    className="h-2 bg-secondary"
                  />
                </div>
                <span className="w-12 text-sm text-right font-medium text-foreground">{item.count}</span>
                <span className="w-12 text-sm text-right text-muted-foreground">
                  {stats.completed > 0 ? ((item.count / stats.completed) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Expandable Not Interested Section */}
      <Collapsible open={notInterestedOpen} onOpenChange={setNotInterestedOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-muted border border-border rounded-lg hover:bg-secondary transition-colors">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">Not Interested Breakdown</span>
              <span className="text-sm text-muted-foreground">({stats.notInterested} total)</span>
            </div>
            {notInterestedOpen ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-muted-foreground/30">
            {notInterestedBreakdown.map(item => (
              <div key={item.value} className="flex items-center gap-4">
                <span className="w-40 text-sm text-foreground">{item.label}</span>
                <div className="flex-1">
                  <Progress 
                    value={stats.notInterested > 0 ? (item.count / stats.notInterested) * 100 : 0} 
                    className="h-2 bg-secondary"
                  />
                </div>
                <span className="w-12 text-sm text-right font-medium text-foreground">{item.count}</span>
                <span className="w-12 text-sm text-right text-muted-foreground">
                  {stats.notInterested > 0 ? ((item.count / stats.notInterested) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
