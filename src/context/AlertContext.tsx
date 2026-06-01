import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { SystemAlert, AlertCluster } from '../types/alert';
import { PipelineContext } from './PipelineContext';
import { useRSS } from './RSSContext';
import { safeStorage } from '../utils/storage';
import { useNotifications } from './NotificationContext';
import { mapSystemAlertToNotification } from '../services/alertToNotificationMapper';

interface AlertContextType {
  alerts: SystemAlert[];
  clusters: AlertCluster[];
  unreadCount: number;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (alertId: string) => void;
  clearAll: () => void;
  addAlert: (newAlert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
}

export const AlertContext = createContext<AlertContextType>({} as AlertContextType);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, rriState, sbdeResult, agroSummary } = useContext(PipelineContext);
  const { articles } = useRSS();
  const { addNotification } = useNotifications();

  const processedArticleIds = useRef<Set<string>>(new Set());

  const [alerts, setAlerts] = useState<SystemAlert[]>(() => {
    try {
      const saved = safeStorage.getItem('ti_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist alerts
  useEffect(() => {
    try {
      safeStorage.setItem('ti_alerts', JSON.stringify(alerts.slice(0, 500))); // Keep last 500
    } catch {}
  }, [alerts]);

  const addAlert = useCallback((newAlert: Omit<SystemAlert, 'id' | 'timestamp'>, triggerMetadata?: {
    triggerRule?: string;
    threshold?: number | string;
    observedValue?: number | string;
    previousValue?: number | string;
    delta?: number;
  }) => {
    setAlerts(prev => {
      // Basic deduplication: exact same title within 1 hour
      const oneHourAgo = Date.now() - 3600000;
      const isDuplicate = prev.some(
        a => a.title === newAlert.title && new Date(a.timestamp).getTime() > oneHourAgo
      );
      if (isDuplicate) return prev;

      const alert: SystemAlert = {
        ...newAlert,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      // Also add to NotificationContext for user-facing alerts
      const notification = mapSystemAlertToNotification(alert, triggerMetadata);
      addNotification(notification);
      
      return [alert, ...prev];
    });
  }, [addNotification]);

  // 1. STRATEGIC Escalations (from Pipeline)
  useEffect(() => {
    if (!rriState) return;

    if (rriState.rri > 3.0) {
      addAlert({
        title: 'CRITICAL RRI BREACH',
        message: `National RRI has crossed the 3.0 threshold (Current: ${rriState.rri.toFixed(2)}). Immediate executive review required.`,
        severity: 'STRATEGIC',
        domain: 'SYSTEM',
        source: 'CoreLogic Engine',
        affectedEquations: ['EQ.1', 'EQ.19']
      }, {
        triggerRule: 'RRI_BREACH',
        threshold: 3.0,
        observedValue: rriState.rri,
        previousValue: 3.0,
        delta: rriState.rri - 3.0,
      });
    }

    if (rriState.elite_defection_prob > 0.4) {
      addAlert({
        title: 'High Elite Defection Probability',
        message: 'System models indicate a 40%+ probability of elite fracture within the next 30 days.',
        severity: 'STRATEGIC',
        domain: 'POLITICAL',
        source: 'Actor Network',
        affectedEquations: ['EQ.2']
      }, {
        triggerRule: 'ELITE_DEFECTION',
        threshold: 0.4,
        observedValue: rriState.elite_defection_prob,
        previousValue: 0.4,
        delta: rriState.elite_defection_prob - 0.4,
      });
    }
  }, [rriState?.rri, rriState?.elite_defection_prob, addAlert]);

  // 2. OPERATIONAL Escalations (from Agro / SBDE)
  useEffect(() => {
    if (agroSummary?.bci?.crisis_imminent) {
      addAlert({
        title: `Bread Crisis Alert: ${agroSummary.bci.level}`,
        message: `BCI is at ${(agroSummary.bci.BCI * 100).toFixed(0)}%. Supply and price stress converging rapidly.`,
        severity: 'OPERATIONAL',
        domain: 'AGRICULTURE',
        source: 'AgroIntelligence Engine',
        affectedEquations: ['EQ.13']
      });
    }
  }, [agroSummary?.bci?.crisis_imminent, agroSummary?.bci?.level, agroSummary?.bci?.BCI, addAlert]);

  // 3. TACTICAL Escalations (from RSS / Events)
  useEffect(() => {
    const recentArticles = articles.slice(0, 10);
    recentArticles.forEach(article => {
      const id = (article as any).id || article.title;
      if (processedArticleIds.current.has(id)) return;
      const lowerTitle = article.title.toLowerCase();
      const lowerSummary = (article.summary || '').toLowerCase();
      const isLabor = lowerTitle.includes('protest') || lowerTitle.includes('strike')
        || lowerTitle.includes('ugtt') || lowerSummary.includes('protest') || lowerSummary.includes('strike');
      if (isLabor) {
        addAlert({
          title: `Labor/Social: ${article.title.substring(0, 50)}`,
          message: (article.summary || '').substring(0, 120),
          severity: 'TACTICAL',
          domain: 'SOCIAL',
          source: (article as any).source_name || (article as any).source || 'RSS Feed',
          governorates: (article as any).locations || [],
        });
        processedArticleIds.current.add(id);
      }
    });
  }, [articles, addAlert]);


  const markAsRead = useCallback((id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  }, []);

  const dismissAlert = useCallback((id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  const unreadCount = useMemo(() => alerts.filter(a => !a.read).length, [alerts]);

  // Basic Clustering Logic for Operational rollups
  const clusters = useMemo(() => {
    const grouped: Record<string, SystemAlert[]> = {};
    alerts.forEach(alert => {
      const key = `${alert.domain}-${alert.severity}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(alert);
    });

    return Object.entries(grouped)
      .filter(([_, group]) => group.length >= 3)
      .map(([key, group]) => {
        const sorted = [...group].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const spanMs = new Date(sorted[0].timestamp).getTime() - new Date(sorted[sorted.length - 1].timestamp).getTime();
        
        return {
          id: `cluster-${key}`,
          baseAlert: sorted[0],
          relatedAlerts: sorted.slice(1),
          totalSignals: sorted.length,
          timeSpanHours: Math.max(1, Math.round(spanMs / 3600000))
        };
      });
  }, [alerts]);

  const value = useMemo(() => ({
    alerts, clusters, unreadCount, markAsRead, markAllAsRead, dismissAlert, clearAll, addAlert
  }), [alerts, clusters, unreadCount, markAsRead, markAllAsRead, dismissAlert, clearAll, addAlert]);

  return (
    <AlertContext.Provider value={value}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => useContext(AlertContext);
