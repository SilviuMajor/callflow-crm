import { Phone, PhoneOff, Clock, CheckCircle2, XCircle, Users } from 'lucide-react';

interface StatsBarProps {
  stats: {
    total: number;
    pending: number;
    noAnswer: number;
    callbacks: number;
    completed: number;
    notInterested: number;
    dueCallbacks: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 bg-secondary rounded-lg">
          <Users className="w-5 h-5 text-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 bg-info/20 rounded-lg">
          <Phone className="w-5 h-5 text-info" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 bg-destructive/20 rounded-lg">
          <PhoneOff className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.noAnswer}</p>
          <p className="text-xs text-muted-foreground">No Answer</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3 relative">
        <div className="p-2 bg-warning/20 rounded-lg">
          <Clock className="w-5 h-5 text-warning" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.callbacks}</p>
          <p className="text-xs text-muted-foreground">Callbacks</p>
        </div>
        {stats.dueCallbacks > 0 && (
          <span className="absolute -top-2 -right-2 bg-warning text-warning-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse-glow">
            {stats.dueCallbacks}
          </span>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 bg-success/20 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-success" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.completed}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="p-2 bg-muted rounded-lg">
          <XCircle className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{stats.notInterested}</p>
          <p className="text-xs text-muted-foreground">Not Interested</p>
        </div>
      </div>
    </div>
  );
}
