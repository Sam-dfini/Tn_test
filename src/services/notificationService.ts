import { supabase, Notification } from '../lib/supabase';

export async function addNotification(
  notification: Omit<Notification, 'id' | 'read' | 'created_at'>
): Promise<void> {
  await supabase.from('notifications').insert({
    ...notification,
    read: false,
  });
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data || [];
}

export async function markAsRead(id: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
}

export async function markAllAsRead(): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
}

export async function getUnreadCount(): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);
  return count || 0;
}
