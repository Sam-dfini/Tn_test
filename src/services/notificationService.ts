import { supabase, Notification } from '../lib/supabase';
import { playNotificationSound, SoundType } from '../utils/audio';

// In-process dedup: track titles inserted in last 5 min to avoid DB duplicates
const _recentTitles = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

function _isDuplicate(title: string): boolean {
  const last = _recentTitles.get(title);
  if (last && Date.now() - last < DEDUP_WINDOW_MS) return true;
  _recentTitles.set(title, Date.now());
  // Clean up stale entries
  if (_recentTitles.size > 200) {
    const cutoff = Date.now() - DEDUP_WINDOW_MS;
    for (const [k, t] of _recentTitles) {
      if (t < cutoff) _recentTitles.delete(k);
    }
  }
  return false;
}

/**
 * Normalise an incoming notification so it matches the Supabase schema.
 * Callers can pass either:
 *   - New format: { action: { label, event, detail } }
 *   - Legacy format: { action_label, action_event, action_detail }
 */
function _toDbRow(notification: Omit<Notification, 'id' | 'read' | 'created_at'> & { action?: { label: string; event: string; detail?: any } }): Record<string, any> {
  const { action, ...rest } = notification as any;
  const row: Record<string, any> = { ...rest, read: false };

  if (action && typeof action === 'object') {
    // New format → flatten for Supabase schema
    row.action_label = action.label;
    row.action_event = action.event;
    if (action.detail !== undefined) row.action_detail = action.detail;
  }
  // Remove the object-form action field (not a DB column)
  delete row.action;
  return row;
}

export async function addNotification(
  notification: Omit<Notification, 'id' | 'read' | 'created_at'> & { action?: { label: string; event: string; detail?: any } }
): Promise<void> {
  if (_isDuplicate(notification.title)) return;

  const row = _toDbRow(notification);

  const { data, error } = await supabase
    .from('notifications')
    .insert(row)
    .select()
    .single();

  const soundType: SoundType =
    notification.type === 'SHOCK' ? 'shock' :
    notification.priority === 'CRITICAL' ? 'critical' :
    notification.priority === 'HIGH' ? 'warning' : 'info';

  if (!error && data) {
    playNotificationSound(soundType);
    // Dispatch with DB row (has flat action_label etc.) — NotificationContext normalises it
    window.dispatchEvent(new CustomEvent('ti:notification:new', { detail: data }));
  } else {
    // Fallback: dispatch locally so it still appears even if Supabase is unavailable
    playNotificationSound(soundType);
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
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllAsRead(): Promise<void> {
  await supabase.from('notifications').update({ read: true }).eq('read', false);
}

export async function getUnreadCount(): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false);
  return count || 0;
}
