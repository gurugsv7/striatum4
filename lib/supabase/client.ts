/**
 * STRIATUM 4.0 — browser Supabase client (anon key).
 *
 * 'use client' components only. Runs AS the current user, bound by RLS.
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/lib/types/database';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }

  // A single client instance per browser tab avoids re-subscribing auth
  // listeners on every render.
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, anonKey);
  }
  return browserClient;
}
