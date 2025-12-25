import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Runtime config that will be populated from /api/public-config
let runtimeConfig: { supabaseUrl: string | null; supabaseAnonKey: string | null } = {
  supabaseUrl: null,
  supabaseAnonKey: null,
};

// Check build-time env vars first
const buildTimeUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : null;
const buildTimeKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : null;

let supabaseClient: SupabaseClient | null = null;
let configLoaded = false;
let configPromise: Promise<void> | null = null;

// Load config from API
export async function loadSupabaseConfig(): Promise<void> {
  if (configLoaded) return;
  if (configPromise) return configPromise;
  
  configPromise = (async () => {
    try {
      const res = await fetch('/api/public-config');
      const data = await res.json();
      runtimeConfig.supabaseUrl = data.supabaseUrl;
      runtimeConfig.supabaseAnonKey = data.supabaseAnonKey;
    } catch (error) {
      console.error('Failed to load Supabase config:', error);
    }
    configLoaded = true;
  })();
  
  return configPromise;
}

export function getSupabaseUrl(): string | null {
  return buildTimeUrl || runtimeConfig.supabaseUrl;
}

export function getSupabaseAnonKey(): string | null {
  return buildTimeKey || runtimeConfig.supabaseAnonKey;
}

export function isSupabaseAuthConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return !!(url && key);
}

export function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  
  return supabaseClient;
}

// For backward compatibility - will be null if not configured at build time
export const supabase = (buildTimeUrl && buildTimeKey)
  ? createClient(buildTimeUrl, buildTimeKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;
