import { Link, useLocation } from 'react-router-dom';
import { Target, BarChart3, CheckCircle, Settings, Search, Download, Sparkles, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  onImportClick?: () => void;
  overdueCallbackCount?: number;
}

export function TopNav({ searchQuery, onSearchChange, onExportCSV, onExportJSON, onImportClick, overdueCallbackCount = 0 }: TopNavProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/calling', label: 'Attack', icon: Target },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/completed', label: 'Completed', icon: CheckCircle },
    { path: '/ai-settings', label: 'AI', icon: Sparkles },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="h-12 border-b border-border bg-card flex items-center px-3 gap-3">
      <Link to="/" className="font-semibold text-sm text-foreground shrink-0">
        Attack
      </Link>
      
      {onSearchChange && (
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-7 text-sm bg-background"
          />
        </div>
      )}
      
      <nav className="flex items-center gap-1 ml-auto">
        {navItems.map(item => (
          <Button
            key={item.path}
            asChild
            variant={location.pathname === item.path ? 'secondary' : 'ghost'}
            size="sm"
            className="h-8 px-3 text-xs"
          >
            <Link to={item.path} className="flex items-center gap-1.5">
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
              {item.path === '/calling' && overdueCallbackCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none animate-pulse">
                  {overdueCallbackCount > 99 ? '99+' : overdueCallbackCount}
                </span>
              )}
            </Link>
          </Button>
        ))}
        
        {onImportClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3 text-xs"
            onClick={onImportClick}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Import
          </Button>
        )}
        
        {(onExportCSV || onExportJSON) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportCSV && (
                <DropdownMenuItem onClick={onExportCSV}>
                  Export as CSV
                </DropdownMenuItem>
              )}
              {onExportJSON && (
                <DropdownMenuItem onClick={onExportJSON}>
                  Export as JSON
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </header>
  );
}
