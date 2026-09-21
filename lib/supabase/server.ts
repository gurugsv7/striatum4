/**
 * STRIATUM 4.0 — server-side Supabase client (anon key, cookie-bound).
 *
 * Runs AS the current authenticated user (or anonymous) and is bound by RLS.
 * Use this from Server Components, Route Handlers, and Server Actions for
 * everything that RLS already allows for the acting user. For privileged
 * transitions that must go through a SECURITY DEFINER function or bypass
 * RLS entirely, use `lib/supabase/admin.ts` instead.
 */
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import type { Database } from '@/lib/types/database';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
    );
  }
  return { url, anonKey };
}

/**
 * Full read/write server client for use in Route Handlers and Server
 * Actions, where writing cookies back to the response is valid. Refreshes
 * the session and persists renewed auth cookies as a side effect of any
 * `supabase.auth.*` call.
 */
export async function createSupabaseServerClient() {
  const { url, anonKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as CookieOptions);
          });
        } catch {
          // Called from a Server Component render — cookies() is read-only
          // there. Session refresh is still handled by middleware, so this
          // is safe to swallow.
        }
      },
    },
  });
}

/**
 * Read-only variant explicitly intended for Server Components. Identical
 * client, but the name documents intent at call sites: never rely on this
 * instance to persist a cookie write (it may silently no-op).
 */
export async function createSupabaseServerComponentClient() {
  const { url, anonKey } = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components cannot set cookies. Session refresh happens in
        // middleware; this client is read-only by contract.
      },
    },
  });
}
