import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useInviteCodes } from '@/hooks/useInviteCodes';
import { Plus, Copy, XCircle, Loader2, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function InviteCodeManager() {
  const { inviteCodes, isLoading, createInviteCode, deactivateInviteCode, copyToClipboard } = useInviteCodes();
  const [maxUses, setMaxUses] = useState('1');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    const expiresAt = expiresInDays 
      ? new Date(Date.now() + parseInt(expiresInDays) * 86400000).toISOString()
      : null;
    
    await createInviteCode({
      usesRemaining: maxUses ? parseInt(maxUses) : undefined,
      expiresAt,
    });
    setIsCreating(false);
  };

  const activeCodes = inviteCodes.filter(c => c.is_active);
  const inactiveCodes = inviteCodes.filter(c => !c.is_active);

  return (
    <div className="space-y-6">
      {/* Generate New Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4" />
            Generate Invite Code
          </CardTitle>
          <CardDescription>
            Create invite codes to allow new users to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Max Uses</Label>
              <Input
                type="number"
                min="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="1"
                className="h-9"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Expires in (days)</Label>
              <Input
                type="number"
                min="1"
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(e.target.value)}
                placeholder="No expiry"
                className="h-9"
              />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={isCreating} className="w-full">
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Generate Code
          </Button>
        </CardContent>
      </Card>

      {/* Active Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeCodes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active invite codes. Generate one above.
            </p>
          ) : (
            <div className="space-y-2">
              {activeCodes.map(code => (
                <div key={code.id} className="flex items-center gap-3 p-3 border rounded-lg bg-background">
                  <code className="font-mono text-sm font-bold tracking-wider flex-1">
                    {code.code}
                  </code>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {code.uses_remaining !== null && (
                      <Badge variant="secondary" className="text-xs">
                        {code.uses_remaining} use{code.uses_remaining !== 1 ? 's' : ''} left
                      </Badge>
                    )}
                    {code.expires_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(code.expires_at), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(code.code)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => deactivateInviteCode(code.id)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Codes */}
      {inactiveCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Deactivated Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inactiveCodes.map(code => (
                <div key={code.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 opacity-60">
                  <code className="font-mono text-sm tracking-wider flex-1 line-through">
                    {code.code}
                  </code>
                  <Badge variant="outline" className="text-xs">Deactivated</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
