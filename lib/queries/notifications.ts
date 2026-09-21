/**
 * STRIATUM 4.0 — notification feed read queries.
 */
import { createSupabaseServerComponentClient } from '@/lib/supabase/server';
import type { NotificationRow } from '@/lib/types/database';

export async function listMine(userId: string, limit = 50): Promise<NotificationRow[]> {
  const supabase = await createSupabaseServerComponentClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function unreadCount(userId: string): Promise<number> {
  const supabase = await createSupabaseServerComponentClient();
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}
