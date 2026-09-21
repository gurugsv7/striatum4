/**
 * STRIATUM 4.0 — service-role Supabase client.
 *
 * SERVER-ONLY. Bypasses RLS entirely. Never import this file from a
 * 'use client' component, a client-bundled hook, or anything under app/**
 * that isn't a server action or route handler. `import 'server-only'`
 * below makes an accidental client-bundle import a build-time error.
 *
 * Used exclusively for:
 *   - calling the SECURITY DEFINER RPC functions in 0002_functions.sql
 *     (approve/reject payments, confirm_free_event_registration,
 *     redeem_event_qr, publish/unpublish_results)
 *   - minting short-lived signed URLs for the private payment-screenshots
 *     bucket
 *   - uploading to storage on the participant's behalf during a server
 *     action (screenshot upload, admin QR/asset upload)
 *
 * Never use this client to read/write anything an ordinary RLS-scoped
 * server client (lib/supabase/server.ts) could already do for the acting
 * user — the service role should only be reached for for the specific
 * privileged operations above.
 */
import 'server-only';

import { createClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/types/database';

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }
  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. This is required for ' +
        'lib/supabase/admin.ts and must never be exposed to the browser bundle.'
    );
  }

  if (!adminClient) {
    adminClient = createClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}
