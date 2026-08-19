import { createClient, SupabaseClient } from '@supabase/supabase-js';

function normalizeSupabaseUrl(value: string): string {
  return value.replace(/\/?rest\/v1\/?$/, '').replace(/\/$/, '');
}

const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

if (!supabaseUrl || !supabaseAnonKey) {
  // Warning only — avoid throwing during builds. Developer should set .env values.
  // This will log in server and client environments when variables are missing.
  // Keep this lightweight and non-blocking.
  // eslint-disable-next-line no-console
  console.warn('Supabase environment variables are not set: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabaseClient: SupabaseClient =
  globalThis.__supabaseClient ?? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

if (typeof window !== 'undefined' && !globalThis.__supabaseClient) {
  globalThis.__supabaseClient = supabaseClient;
}

export default supabaseClient;
