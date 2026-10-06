import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'a_deux_supabase_url';
const STORAGE_KEY_ANON = 'a_deux_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // First check localStorage override, then env variables
  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const localAnon = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  const url = (localUrl || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (localAnon || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  return { url, anonKey };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window === 'undefined') return;
  if (url) {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_URL);
  }
  if (anonKey) {
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_ANON);
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    !url.includes('your-project.supabase.co') &&
    anonKey !== 'your-anon-key'
  );
}

let supabaseInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastAnon = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (supabaseInstance && lastUrl === url && lastAnon === anonKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUrl = url;
    lastAnon = anonKey;
    return supabaseInstance;
  } catch (err) {
    console.error('Erreur initialisation Supabase:', err);
    return null;
  }
}
