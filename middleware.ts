/**
 * STRIATUM 4.0 — root middleware.
 *
 * 1. Refreshes the Supabase session on every request.
 * 2. First-gate route protection (participant auth, admin auth, launch
 *    gate). This is a first gate only — every admin server action must
 *    independently re-check with requireAdmin(), and RLS is the final
 *    backstop (see docs/03-ARCHITECTURE.md §3).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { updateSupabaseSession } from '@/lib/supabase/middleware';
import type { Database } from '@/lib/types/database';

const AUTH_REQUIRED_PREFIXES = ['/home', '/my-events', '/profile', '/delegate', '/results'];

function requiresAuth(pathname: string): boolean {
  if (AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  // /events/[slug]/register requires auth; /events/[slug] itself is public.
  if (/^\/events\/[^/]+\/register(\/|$)/.test(pathname)) {
    return true;
  }
  return false;
}

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

async function isLaunched(request: NextRequest): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false; // fail open to Coming Soon

  try {
    // Lightweight anon-scoped read of the single app_settings row. Uses its
    // own throwaway client (no cookie writes needed) to keep this check cheap
    // and independent of the session-refresh client below.
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
    });
    const { data, error } = await supabase
      .from('app_settings')
      .select('launched')
      .eq('id', true)
      .maybeSingle();
    if (error || !data) return false; // fail open to Coming Soon
    return data.launched === true;
  } catch {
    return false; // fail open to Coming Soon
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user } = await updateSupabaseSession(request);

  // Launch gate: /welcome and /signin bounce to "/" (Coming Soon) until launched.
  if (pathname === '/welcome' || pathname === '/signin') {
    const launched = await isLaunched(request);
    if (!launched) {
      const redirectUrl = new URL('/', request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  if (isAdminPath(pathname)) {
    if (!user) {
      return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(pathname)}`, request.url));
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let isAdmin = false;
    if (url && anonKey) {
      try {
        const supabase = createServerClient<Database>(url, anonKey, {
          cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
        });
        const { data } = await supabase.rpc('is_admin', { p_uid: user.id });
        isAdmin = data === true;
      } catch {
        isAdmin = false;
      }
    }
    if (!isAdmin) {
      // Never reveal that the route exists — redirect to /home like any
      // other unknown-to-them path.
      return NextResponse.redirect(new URL('/home', request.url));
    }
    return response;
  }

  if (requiresAuth(pathname) && !user) {
    return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(pathname)}`, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next internals)
     * - static assets with a file extension
     * - api routes are left out of matching by convention; add /api/** back
     *   in if server actions ever require middleware-level gating too.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
