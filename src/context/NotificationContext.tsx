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
  | 'SYSTEM';   // model recalculated, staleness warning

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
      const saved = localStorage.getItem('ti_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Persist to localStorage (max 100)
  useEffect(() => {
    localStorage.setItem(
      'ti_notifications',
      JSON.stringify(notifications.slice(0, 100))
    );
  }, [notifications]);

  const addNotification = useCallback((
    n: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const notification: Notification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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
