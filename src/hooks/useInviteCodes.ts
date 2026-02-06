import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from './useOrganization';
import { toast } from 'sonner';

export interface InviteCode {
  id: string;
  code: string;
  organization_id: string;
  created_by: string | null;
  uses_remaining: number | null;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

function generateCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1 to avoid confusion
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function useInviteCodes() {
  const { organizationId } = useOrganization();
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInviteCodes = useCallback(async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invite codes:', error);
    } else {
      setInviteCodes(data || []);
    }
    setIsLoading(false);
  }, [organizationId]);

  useEffect(() => {
    fetchInviteCodes();
  }, [fetchInviteCodes]);

  const createInviteCode = async (options?: {
    usesRemaining?: number;
    expiresAt?: string | null;
  }) => {
    if (!organizationId) {
      toast.error('Organization not found');
      return null;
    }

    const code = generateCode();
    
    const { data, error } = await supabase
      .from('invite_codes')
      .insert({
        code,
        organization_id: organizationId,
        uses_remaining: options?.usesRemaining ?? 1,
        expires_at: options?.expiresAt ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite code:', error);
      toast.error('Failed to create invite code');
      return null;
    }

    setInviteCodes(prev => [data, ...prev]);
    toast.success('Invite code created');
    return data;
  };

  const deactivateInviteCode = async (id: string) => {
    const { error } = await supabase
      .from('invite_codes')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deactivating invite code:', error);
      toast.error('Failed to deactivate invite code');
      return;
    }

    setInviteCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: false } : c));
    toast.success('Invite code deactivated');
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Code copied to clipboard');
    } catch {
      toast.error('Failed to copy code');
    }
  };

  return {
    inviteCodes,
    isLoading,
    createInviteCode,
    deactivateInviteCode,
    copyToClipboard,
    refetch: fetchInviteCodes,
  };
}
