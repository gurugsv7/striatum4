/**
 * STRIATUM 4.0 — middleware session-refresh helper.
 *
 * Consumed by the root middleware.ts. Refreshes the Supabase auth session
 * on every request (so Server Components downstream see a valid session)
 * and hands back the resolved user plus a NextResponse carrying any renewed
 * auth cookies. Route protection/redirect decisions live in middleware.ts
 * itself — this helper only does the session plumbing.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import type { Database } from '@/lib/types/database';

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Fail open on misconfiguration rather than crashing every request;
    // route guards downstream will still gate protected pages (user will
    // simply resolve to null and get redirected to /signin).
    return { response, user: null };
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
