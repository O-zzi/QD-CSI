import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let configLoaded = false;
let configPromise: Promise<void> | null = null;
let runtimeUrl: string | null = null;
let runtimeKey: string | null = null;

export async function loadSupabaseConfig(): Promise<void> {
  if (configLoaded) return;
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
    try {
      const res = await fetch('/api/public-config');
      const data = await res.json();
      runtimeUrl = data.supabaseUrl;
      runtimeKey = data.supabaseAnonKey;
      console.log('[Supabase] Config loaded:', { 
        hasUrl: !!runtimeUrl, 
        hasKey: !!runtimeKey 
      });
    } catch (error) {
      console.error('[Supabase] Failed to load config:', error);
    }
    configLoaded = true;
  })();
  
  return configPromise;
}

export function getSupabaseUrl(): string | null {
  return runtimeUrl;
}

export function getSupabaseAnonKey(): string | null {
  return runtimeKey;
}

export function isSupabaseAuthConfigured(): boolean {
  return !!(runtimeUrl && runtimeKey);
}

export function getSupabaseClient(): SupabaseClient {
  if (!runtimeUrl || !runtimeKey) {
    throw new Error('Supabase is not configured. Please ensure config is loaded first.');
  }
  
  if (!supabaseClient) {
    console.log('[Supabase] Creating client with URL:', runtimeUrl);
    supabaseClient = createClient(runtimeUrl, runtimeKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'quarterdeck-auth',
      },
    });
  }
  
  return supabaseClient;
}

export const supabase = null;
