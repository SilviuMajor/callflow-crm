import { useState, useEffect } from 'react';
import { TopNav } from '@/components/TopNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar, ExternalLink, Loader2, Check, Copy } from 'lucide-react';
import { useCalendlySettings } from '@/hooks/useCalendlySettings';
import { useCalcomSettings } from '@/hooks/useCalcomSettings';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const { settings, isLoading, updateSettings } = useCalendlySettings();
  const { settings: calcomSettings, isLoading: isLoadingCalcom, updateSettings: updateCalcomSettings } = useCalcomSettings();
  
  // Calendly state
  const [enabled, setEnabled] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Cal.com state
  const [calcomEnabled, setCalcomEnabled] = useState(false);
  const [calcomEventSlug, setCalcomEventSlug] = useState('');
  const [isSavingCalcom, setIsSavingCalcom] = useState(false);
  const [hasCalcomChanges, setHasCalcomChanges] = useState(false);

  // Sync local state with fetched settings
  useEffect(() => {
    if (!isLoading) {
      setEnabled(settings.enabled);
      setCalendlyUrl(settings.calendly_url);
    }
  }, [isLoading, settings]);

  // Track changes
  useEffect(() => {
    if (!isLoading) {
      setHasChanges(
        enabled !== settings.enabled || 
        calendlyUrl !== settings.calendly_url
      );
    }
  }, [enabled, calendlyUrl, settings, isLoading]);

  // Cal.com sync
  useEffect(() => {
    if (!isLoadingCalcom) {
      setCalcomEnabled(calcomSettings.enabled);
      setCalcomEventSlug(calcomSettings.event_type_slug || '');
    }
  }, [isLoadingCalcom, calcomSettings]);

  useEffect(() => {
    if (!isLoadingCalcom) {
      setHasCalcomChanges(
        calcomEnabled !== calcomSettings.enabled || 
        calcomEventSlug !== (calcomSettings.event_type_slug || '')
      );
    }
  }, [calcomEnabled, calcomEventSlug, calcomSettings, isLoadingCalcom]);

  const handleSave = async () => {
    // Validate URL if enabled
    if (enabled && !calendlyUrl) {
      toast.error('Please enter your Calendly URL');
      return;
    }

    if (enabled && calendlyUrl) {
      try {
        new URL(calendlyUrl);
        if (!calendlyUrl.includes('calendly.com')) {
          toast.error('Please enter a valid Calendly URL');
          return;
        }
      } catch {
        toast.error('Please enter a valid URL');
        return;
      }
    }

    setIsSaving(true);
    const success = await updateSettings({
      enabled,
      calendly_url: calendlyUrl,
    });

    if (success) {
      toast.success('Calendly settings saved');
      setHasChanges(false);
    } else {
      toast.error('Failed to save settings');
    }
    setIsSaving(false);
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendly-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const handleSaveCalcom = async () => {
    if (calcomEnabled && !calcomEventSlug) {
      toast.error('Please enter your Cal.com event slug');
      return;
    }

    setIsSavingCalcom(true);
    const success = await updateCalcomSettings({
      enabled: calcomEnabled,
      event_type_slug: calcomEventSlug,
    });

    if (success) {
      toast.success('Cal.com settings saved');
      setHasCalcomChanges(false);
    } else {
      toast.error('Failed to save settings');
    }
    setIsSavingCalcom(false);
  };

  const calcomWebhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calcom-webhook`;

  const copyCalcomWebhookUrl = () => {
    navigator.clipboard.writeText(calcomWebhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  if (isLoading || isLoadingCalcom) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[calc(100vh-48px)]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Integrations</h1>
        
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Calendly</CardTitle>
                  <CardDescription>
                    Embed Calendly booking widget when marking appointments
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calendly-url">Calendly URL</Label>
              <Input
                id="calendly-url"
                type="url"
                placeholder="https://calendly.com/your-name/30min"
                value={calendlyUrl}
                onChange={(e) => setCalendlyUrl(e.target.value)}
                disabled={!enabled}
              />
              <p className="text-xs text-muted-foreground">
                Your Calendly event URL. Find it by clicking "Share" on your event type.
              </p>
            </div>

            {enabled && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Label className="text-xs font-medium">Webhook URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={webhookUrl}
                    className="text-xs font-mono bg-background"
                  />
                  <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this URL in your{' '}
                  <a 
                    href="https://calendly.com/integrations/api_webhooks" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Calendly webhook settings
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {' '}to automatically capture appointment details. Subscribe to "invitee.created" events.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cal.com Integration */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Cal.com</CardTitle>
                  <CardDescription>
                    Embed Cal.com booking widget when marking appointments
                  </CardDescription>
                </div>
              </div>
              <Switch
                checked={calcomEnabled}
                onCheckedChange={setCalcomEnabled}
              />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="calcom-slug">Event Type Slug</Label>
              <Input
                id="calcom-slug"
                type="text"
                placeholder="your-username/30min"
                value={calcomEventSlug}
                onChange={(e) => setCalcomEventSlug(e.target.value)}
                disabled={!calcomEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Your Cal.com event URL path (e.g., "john-doe/30min" from cal.com/john-doe/30min)
              </p>
            </div>

            {calcomEnabled && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
                <Label className="text-xs font-medium">Webhook URL (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={calcomWebhookUrl}
                    className="text-xs font-mono bg-background"
                  />
                  <Button variant="outline" size="sm" onClick={copyCalcomWebhookUrl}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this URL in your{' '}
                  <a 
                    href="https://app.cal.com/settings/developer/webhooks" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5"
                  >
                    Cal.com webhook settings
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {' '}to automatically capture booking details. Subscribe to "BOOKING_CREATED" events.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button 
                onClick={handleSaveCalcom} 
                disabled={!hasCalcomChanges || isSavingCalcom}
              >
                {isSavingCalcom ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
