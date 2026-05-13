import { supabase, Notification } from '../lib/supabase';
import { playNotificationSound, SoundType } from '../utils/audio';

export async function addNotification(
  notification: Omit<Notification, 'id' | 'read' | 'created_at'>
): Promise<void> {
  const { data, error } = await supabase.from('notifications').insert({
    ...notification,
    read: false,
  }).select().single();

  if (!error && data) {
    // Play sound based on priority and type
    const soundType: SoundType = 
      notification.type === 'SHOCK' ? 'shock' :
      notification.priority === 'CRITICAL' ? 'critical' :
      notification.priority === 'HIGH' ? 'warning' : 'info';
    
    playNotificationSound(soundType);

    // Dispatch window event so Toast components can show it immediately
    window.dispatchEvent(new CustomEvent('ti:notification:new', {
      detail: data
    }));
  } else {
    // Even if Supabase insert fails, dispatch locally so it still appears in the panel
    window.dispatchEvent(new CustomEvent('ti:notification:new', {
      detail: {
        ...notification,
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        read: false,
        created_at: new Date().toISOString(),
      }
    }));
  }
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .gte('created_at', fourteenDaysAgo)
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
