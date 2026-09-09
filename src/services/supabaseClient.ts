import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase browser client.
 *
 * The publishable key is designed to be public — every security boundary is
 * enforced server-side by RLS and the SECURITY DEFINER RPCs, never by hiding
 * this key.
 *
 * Returns null when the environment is not configured, so the app degrades to
 * its local-only mode instead of crashing on a half-configured deployment.
 */
const url = import.meta.env?.VITE_SUPABASE_URL;
const publishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null =
  url && publishableKey
    ? createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          // No OAuth redirect is used, so there is no URL fragment to detect.
          detectSessionInUrl: false
        }
      })
    : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export const GOOGLE_CLIENT_ID: string = import.meta.env?.VITE_GOOGLE_CLIENT_ID ?? '';
