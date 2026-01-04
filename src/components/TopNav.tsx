import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, BarChart3, CheckCircle, Settings, Search, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface TopNavProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSettingsClick?: () => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

export function TopNav({ searchQuery, onSearchChange, onSettingsClick, onExportCSV, onExportJSON }: TopNavProps) {
  const location = useLocation();
  
  const navItems = [
    { path: '/calling', label: 'Calling', icon: Phone },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/completed', label: 'Completed', icon: CheckCircle },
    { path: '/ai-settings', label: 'AI', icon: Sparkles },
  ];

  return (
    <header className="h-12 border-b border-border bg-card flex items-center px-3 gap-3">
      <Link to="/" className="font-semibold text-sm text-foreground shrink-0">
        TeleSales
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
            </Link>
          </Button>
        ))}
        
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
        
        {onSettingsClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={onSettingsClick}
          >
            <Settings className="w-3.5 h-3.5" />
          </Button>
        )}
      </nav>
    </header>
  );
}
