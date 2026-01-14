import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  organization_id: string;
  full_name: string | null;
  email: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  organization: Organization | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, organizationName: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    if (profileData) {
      setProfile(profileData);

      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profileData.organization_id)
        .single();

      if (!orgError && orgData) {
        setOrganization(orgData);
      }
    }

    return profileData;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Use setTimeout to avoid race conditions with Supabase auth
        setTimeout(() => {
          fetchProfile(currentSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setOrganization(null);
      }
      
      setIsLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchProfile(existingSession.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, organizationName: string, fullName?: string) => {
    try {
      // 1. Create the organization first
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: organizationName })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        return { error: new Error('Failed to create organization') };
      }

      // 2. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName,
            organization_id: orgData.id,
          },
        },
      });

      if (authError) {
        // Rollback: delete the organization if user signup fails
        await supabase.from('organizations').delete().eq('id', orgData.id);
        return { error: authError as Error };
      }

      if (!authData.user) {
        await supabase.from('organizations').delete().eq('id', orgData.id);
        return { error: new Error('Failed to create user') };
      }

      // 3. Create the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          organization_id: orgData.id,
          full_name: fullName || null,
          email: email,
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        // Note: We don't rollback here as the user exists and they can retry
      }

      // 4. Create user role as admin (first user of org is admin)
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'admin',
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
      }

      return { error: null };
    } catch (error) {
      console.error('Signup error:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        organization,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
