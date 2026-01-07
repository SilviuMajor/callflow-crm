import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, Building2, User, Target, Scroll } from 'lucide-react';
import { useAutoGenerateSettings } from '@/hooks/useAutoGenerateSettings';

const FEATURES = [
  { key: 'company_research', label: 'Company Research', icon: Building2, color: 'text-blue-500' },
  { key: 'contact_persona', label: 'Contact Persona', icon: User, color: 'text-emerald-500' },
  { key: 'targeted_research', label: 'Targeted Research', icon: Target, color: 'text-purple-500' },
  { key: 'script_generation', label: 'AI Script', icon: Scroll, color: 'text-amber-500' },
] as const;

export function AutoGenerateSettings() {
  const { settings, isLoading, updateSettings } = useAutoGenerateSettings();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Auto-Generate Settings</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-generate-enabled" className="text-sm text-muted-foreground">
              {settings.enabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="auto-generate-enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSettings({ enabled: checked })}
            />
          </div>
        </div>
        <CardDescription>
          Automatically generate AI content when a contact loads for the first time.
          Features run sequentially in order of dependency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {FEATURES.map(({ key, label, icon: Icon, color }) => (
            <div
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                settings.enabled ? 'bg-background' : 'bg-muted/30 opacity-60'
              }`}
            >
              <Checkbox
                id={key}
                checked={settings[key as keyof typeof settings] as boolean}
                disabled={!settings.enabled}
                onCheckedChange={(checked) => 
                  updateSettings({ [key]: checked === true })
                }
              />
              <div className={`p-1.5 rounded ${color} bg-opacity-10`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <Label
                htmlFor={key}
                className={`flex-1 cursor-pointer ${!settings.enabled ? 'text-muted-foreground' : ''}`}
              >
                {label}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Note: Each auto-generated feature uses 1 credit. Features are generated in dependency order 
          (Company Research → Contact Persona → Targeted Research → Script).
        </p>
      </CardContent>
    </Card>
  );
}
