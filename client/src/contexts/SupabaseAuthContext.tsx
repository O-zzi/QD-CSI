import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthError, Provider } from '@supabase/supabase-js';
import { isSupabaseAuthConfigured, getSupabaseClient, loadSupabaseConfig } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';

export type OAuthProvider = 'github' | 'twitter' | 'facebook';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: OAuthProvider) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  isSupabaseConfigured: boolean;
  useSupabaseAuth: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  const [isConfigured, setIsConfigured] = useState(isSupabaseAuthConfigured());
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load Supabase config from API on mount
  useEffect(() => {
    loadSupabaseConfig().then(() => {
      setConfigLoaded(true);
      setIsConfigured(isSupabaseAuthConfigured());
    });
  }, []);

  // Initialize Supabase auth after config is loaded
  useEffect(() => {
    if (!configLoaded) return;
    
    if (!isConfigured) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let client;
    try {
      client = getSupabaseClient();
    } catch (error) {
      console.error('Failed to get Supabase client:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    client.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
      
      if (session?.user) {
        syncUserToBackend(session);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });

      if (event === 'SIGNED_IN' && session) {
        await syncUserToBackend(session);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
      
      if (event === 'SIGNED_OUT') {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    });

    return () => subscription.unsubscribe();
  }, [configLoaded, isConfigured]);

  const syncUserToBackend = async (session: Session) => {
    try {
      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          supabaseUserId: session.user.id,
          email: session.user.email,
          firstName: session.user.user_metadata?.firstName || session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.lastName || session.user.user_metadata?.last_name,
        }),
      });
    } catch (error) {
      console.error('Failed to sync user to backend:', error);
    }
  };

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  }, [isConfigured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    
    const client = getSupabaseClient();
    await client.auth.signOut();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    queryClient.clear();
  }, [isConfigured]);

  const resetPassword = useCallback(async (email: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    return { error };
  }, [isConfigured]);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.updateUser({
      password: newPassword,
    });

    return { error };
  }, [isConfigured]);

  const signInWithOAuth = useCallback(async (provider: OAuthProvider) => {
    if (!isConfigured) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const client = getSupabaseClient();
    const { error } = await client.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    return { error };
  }, [isConfigured]);

  const useSupabaseAuthEnabled = isConfigured && import.meta.env.VITE_USE_SUPABASE_AUTH === 'true';

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUp,
        signIn,
        signInWithOAuth,
        signOut,
        resetPassword,
        updatePassword,
        isSupabaseConfigured: isConfigured,
        useSupabaseAuth: useSupabaseAuthEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
