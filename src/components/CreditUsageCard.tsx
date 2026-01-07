import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Sparkles, Calendar, Building2, User, Target, Scroll } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAICreditUsage, MonthlyUsage } from '@/hooks/useAICreditUsage';
import { format } from 'date-fns';

const FEATURE_ICONS: Record<string, React.ElementType> = {
  company_research: Building2,
  contact_persona: User,
  targeted_research: Target,
  script_generation: Scroll,
};

const FEATURE_LABELS: Record<string, string> = {
  company_research: 'Company Research',
  contact_persona: 'Contact Persona',
  targeted_research: 'Targeted Research',
  script_generation: 'Script Generation',
};

const FEATURE_COLORS: Record<string, string> = {
  company_research: 'bg-blue-100 text-blue-700',
  contact_persona: 'bg-emerald-100 text-emerald-700',
  targeted_research: 'bg-purple-100 text-purple-700',
  script_generation: 'bg-amber-100 text-amber-700',
};

export function CreditUsageCard() {
  const { monthlyUsage, currentMonthTotal, isLoading } = useAICreditUsage();
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const next = new Set(prev);
      if (next.has(month)) {
        next.delete(month);
      } else {
        next.add(month);
      }
      return next;
    });
  };

  const toggleDay = (key: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const formatMonthLabel = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return format(date, 'MMMM yyyy');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Credit Usage</CardTitle>
          </div>
          <Badge variant="secondary" className="text-lg font-semibold px-3 py-1">
            {currentMonthTotal} credits this month
          </Badge>
        </div>
        <CardDescription>
          Track your AI usage. Each AI generation costs 1 credit.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {monthlyUsage.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No AI usage recorded yet</p>
            <p className="text-sm">Usage will appear here when you use AI features</p>
          </div>
        ) : (
          monthlyUsage.map((month) => (
            <Collapsible
              key={month.month}
              open={expandedMonths.has(month.month)}
              onOpenChange={() => toggleMonth(month.month)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    {expandedMonths.has(month.month) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatMonthLabel(month.month)}</span>
                  </div>
                  <Badge variant="outline">{month.total} credits</Badge>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-2 space-y-1">
                  {month.dailyBreakdown.map((day) => {
                    const dayKey = `${month.month}-${day.date}`;
                    return (
                      <Collapsible
                        key={day.date}
                        open={expandedDays.has(dayKey)}
                        onOpenChange={() => toggleDay(dayKey)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-2 rounded hover:bg-muted/30 transition-colors text-sm">
                            <div className="flex items-center gap-2">
                              {expandedDays.has(dayKey) ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              <span className="text-muted-foreground">
                                {format(new Date(day.date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <span className="text-muted-foreground">{day.total} credits</span>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-5 py-1 space-y-1">
                            {day.records.map((record) => {
                              const Icon = FEATURE_ICONS[record.feature_type] || Sparkles;
                              return (
                                <div
                                  key={record.id}
                                  className="flex items-center justify-between text-xs p-1.5 rounded bg-background"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${FEATURE_COLORS[record.feature_type] || 'bg-gray-100 text-gray-700'}`}>
                                      <Icon className="h-3 w-3" />
                                    </div>
                                    <span>{FEATURE_LABELS[record.feature_type] || record.feature_type}</span>
                                  </div>
                                  <span className="text-muted-foreground">
                                    {format(new Date(record.created_at), 'h:mm a')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  );
}
