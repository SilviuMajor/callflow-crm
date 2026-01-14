import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to get the current user's organization ID.
 * This should be used in all hooks that insert data to ensure
 * the organization_id is always set correctly.
 */
export function useOrganization() {
  const { profile, organization, isLoading } = useAuth();

  return {
    organizationId: profile?.organization_id ?? null,
    organization,
    isLoading,
  };
}
