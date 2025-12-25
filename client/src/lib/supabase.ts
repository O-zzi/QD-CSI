import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let configLoaded = false;
let configPromise: Promise<void> | null = null;
let runtimeUrl: string | null = null;
let runtimeKey: string | null = null;

const STORAGE_KEY = 'quarterdeck-auth';

export async function loadSupabaseConfig(): Promise<void> {
  if (configLoaded) return;
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
    try {
      console.log('[Supabase] Loading config from /api/public-config...');
      const res = await fetch('/api/public-config');
      const data = await res.json();
      runtimeUrl = data.supabaseUrl;
      runtimeKey = data.supabaseAnonKey;
      console.log('[Supabase] Config loaded:', { 
        hasUrl: !!runtimeUrl, 
        hasKey: !!runtimeKey 
      });
      
      // Check localStorage for any existing sessions
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('supabase') || k.includes('sb-'));
        console.log('[Supabase] Auth-related localStorage keys:', keys);
      }
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
    console.log('[Supabase] Creating client');
    
    supabaseClient = createClient(runtimeUrl, runtimeKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storageKey: STORAGE_KEY,
      },
    });
  }
  
  return supabaseClient;
}

export const supabase = null;
