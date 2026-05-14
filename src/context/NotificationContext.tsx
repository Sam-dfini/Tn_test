import { generateRandomId } from '../utils/idUtils';
import { safeStorage } from '../utils/storage';
import React, {
  createContext, useContext, useState,
  useEffect, useCallback
} from 'react';

// ============================================================
// TYPES
// ============================================================

export type NotificationType =
  | 'RRI'       // R(t) threshold, velocity, pattern
  | 'ALERT'     // FX reserves, UGTT, water crisis
  | 'PIPELINE'  // push complete, field updated, doc ingested
  | 'RSS'       // new article, high severity article
  | 'SOURCE'    // source connected/disconnected
  | 'SYSTEM'    // model recalculated, staleness warning
  | 'SHOCK';    // stochastic shock events

export type NotificationPriority =
  | 'CRITICAL'  // red, pulsing — requires immediate attention
  | 'HIGH'      // orange — important signal
  | 'MEDIUM'    // yellow — worth knowing
  | 'LOW';      // grey — informational

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  // Optional action — navigates when clicked
  action?: {
    label: string;
    event: string;
    detail?: any;
  };
  // Optional source document info (for RSS/PIPELINE)
  sourceUrl?: string;
  sourceName?: string;
  // Optional field changes (for PIPELINE)
  fieldChanges?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  // Optional RRI delta (for RRI/ALERT)
  rriDelta?: number;
  rriVariable?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  criticalCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  clearRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// ============================================================
// PROVIDER
// ============================================================

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = safeStorage.getItem('ti_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Persist to localStorage (max 100 AND max 14 days)
  useEffect(() => {
    const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    
    // Auto-prune old notifications
    const pruned = notifications.filter(n => n.timestamp > fourteenDaysAgo);
    
    // If we pruned something, update state
    if (pruned.length < notifications.length) {
      setNotifications(pruned.slice(0, 100));
      return; // effect will re-run with new notifications
    }

    safeStorage.setItem(
      'ti_notifications',
      JSON.stringify(notifications.slice(0, 100))
    );
  }, [notifications]);

  // Listen for notifications from external sources (notificationService)
  useEffect(() => {
    const handler = (e: any) => {
      const raw = e.detail;
      if (!raw || !raw.title) return;
      const n: Notification = {
        id: raw.id || generateRandomId('notif'),
        type: raw.type || 'SYSTEM',
        priority: raw.priority || 'LOW',
        title: raw.title,
        message: raw.message || '',
        timestamp: raw.timestamp || (raw.created_at ? new Date(raw.created_at).getTime() : Date.now()),
        read: raw.read || false,
        action: raw.action ? raw.action : (raw.action_label ? {
          label: raw.action_label,
          event: raw.action_event || '',
          detail: raw.action_detail,
        } : undefined),
        sourceUrl: raw.sourceUrl,
        sourceName: raw.sourceName,
      };
      setNotifications(prev => {
        const fiveMinAgo = Date.now() - 5 * 60 * 1000;
        const dup = prev.find(p => p.title === n.title && p.timestamp > fiveMinAgo);
        if (dup) return prev;
        return [n, ...prev].slice(0, 100);
      });
    };
    window.addEventListener('ti:notification:new', handler);
    return () => window.removeEventListener('ti:notification:new', handler);
  }, []);

  // System health monitoring — check backend every 5 minutes
  useEffect(() => {
    let wasHealthy = true;
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('/api/health', { signal: controller.signal });
        clearTimeout(timeout);
        if (!wasHealthy) {
          setNotifications(prev => {
            const n: Notification = {
              id: generateRandomId('sys'),
              type: 'SYSTEM', priority: 'LOW',
              title: 'Backend Connection Restored',
              message: 'Express server and API endpoints are reachable.',
              timestamp: Date.now(), read: false,
            };
            return [n, ...prev].slice(0, 100);
          });
        }
        wasHealthy = true;
      } catch {
        if (wasHealthy) {
          setNotifications(prev => {
            const n: Notification = {
              id: generateRandomId('sys'),
              type: 'SYSTEM', priority: 'HIGH',
              title: 'Backend Connection Lost',
              message: 'Cannot reach /api/health. Some features may be unavailable.',
              timestamp: Date.now(), read: false,
            };
            return [n, ...prev].slice(0, 100);
          });
        }
        wasHealthy = false;
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 300_000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = useCallback((
    n: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const notification: Notification = {
      ...n,
      id: generateRandomId('notif'),
      timestamp: Date.now(),
      read: false,
    };

    setNotifications(prev => {
      // Deduplicate — don't add same title within 5 minutes
      const fiveMinAgo = Date.now() - 5 * 60 * 1000;
      const recentDuplicate = prev.find(
        p => p.title === notification.title &&
             p.timestamp > fiveMinAgo
      );
      if (recentDuplicate) return prev;
      return [notification, ...prev].slice(0, 100);
    });

    // Dispatch window event so any component can react
    window.dispatchEvent(new CustomEvent('ti:notification:new', {
      detail: notification
    }));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(
    n => !n.read && n.priority === 'CRITICAL'
  ).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      criticalCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      clearRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error(
    'useNotifications must be used within NotificationProvider'
  );
  return ctx;
};
