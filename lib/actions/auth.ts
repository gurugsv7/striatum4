'use server';

/**
 * STRIATUM 4.0 — shared sign-out.
 *
 * Used by both the admin console top bar (components/admin/SignOutButton)
 * and the participant profile screen (components/profile/ProfilePanel) so
 * there is exactly one sign-out implementation.
 */
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/signin');
}
