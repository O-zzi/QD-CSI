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
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | { message: string }; requiresEmailVerification?: boolean }>;
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
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load Supabase config from API on mount
  useEffect(() => {
    console.log('[Auth] Loading Supabase config...');
    loadSupabaseConfig().then(() => {
      const configured = isSupabaseAuthConfigured();
      console.log('[Auth] Config loaded, isConfigured:', configured);
      setConfigLoaded(true);
      setIsConfigured(configured);
    });
  }, []);

  // Initialize Supabase auth after config is loaded
  useEffect(() => {
    if (!configLoaded) {
      console.log('[Auth] Waiting for config to load...');
      return;
    }
    
    if (!isConfigured) {
      console.log('[Auth] Supabase not configured, skipping auth init');
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    console.log('[Auth] Initializing auth...');
    let client;
    try {
      client = getSupabaseClient();
    } catch (error) {
      console.error('[Auth] Failed to get Supabase client:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    console.log('[Auth] Getting session...');
    client.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[Auth] getSession result:', { 
        hasSession: !!session, 
        user: session?.user?.email,
        error: error?.message 
      });
      
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
      
      if (session?.user) {
        console.log('[Auth] User found, syncing to backend...');
        syncUserToBackend(session);
      }
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] onAuthStateChange:', event, session?.user?.email);
      
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });

      if (event === 'SIGNED_IN' && session) {
        console.log('[Auth] User signed in, syncing to backend...');
        await syncUserToBackend(session);
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      }
    });

    return () => subscription.unsubscribe();
  }, [configLoaded, isConfigured]);

  const syncUserToBackend = async (session: Session): Promise<{ success: boolean; requiresEmailVerification?: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/sync', {
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
      console.log('[Auth] Sync response:', response.status);
      
      if (response.status === 403) {
        const data = await response.json();
        console.log('[Auth] Email verification required:', data.message);
        return { success: false, requiresEmailVerification: true, error: data.message };
      }
      
      if (!response.ok) {
        const data = await response.json();
        return { success: false, error: data.message || 'Sync failed' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Auth] Failed to sync user to backend:', error);
      return { success: false, error: 'Network error during sync' };
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

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: AuthError | { message: string }; requiresEmailVerification?: boolean }> => {
    if (!isConfigured) {
      console.log('[Auth] signIn failed - not configured');
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    console.log('[Auth] signIn called for:', email);
    const client = getSupabaseClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log('[Auth] signIn error:', error.message);
      return { error };
    }
    
    console.log('[Auth] signIn success:', data.user?.email);
    
    // Sync to backend - this establishes the session
    if (data.session) {
      const syncResult = await syncUserToBackend(data.session);
      
      if (!syncResult.success) {
        if (syncResult.requiresEmailVerification) {
          console.log('[Auth] Email verification required, signing out...');
          await client.auth.signOut();
          localStorage.removeItem('quarterdeck-auth');
          return { 
            error: { message: 'Please verify your email address before signing in. Check your inbox for a verification link.' },
            requiresEmailVerification: true 
          };
        }
        return { error: { message: syncResult.error || 'Failed to establish session' } };
      }
    }

    return {};
  }, [isConfigured]);

  const signOut = useCallback(async () => {
    console.log('[Auth] signOut called');
    
    // Clear state immediately
    setState({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
    });
    
    // Clear query cache
    queryClient.clear();
    
    // Clear localStorage
    localStorage.removeItem('quarterdeck-auth');
    
    // Sign out from Supabase if configured
    if (isConfigured) {
      try {
        const client = getSupabaseClient();
        await client.auth.signOut();
      } catch (error) {
        console.error('[Auth] Supabase signOut error:', error);
      }
    }
    
    // Sign out from backend session
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('[Auth] Backend logout error:', error);
    }
    
    console.log('[Auth] signOut complete');
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
        useSupabaseAuth: isConfigured,
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
