import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef, useMemo
} from 'react';
import { Article, supabase } from '../lib/supabase';
import {
  fetchAllFeeds, getRecentArticles
} from '../services/rssService';
import {
  addNotification, getNotifications, getUnreadCount,
  markAsRead, markAllAsRead
} from '../services/notificationService';
import { saveRRISnapshot } from '../services/rssService';
import { usePipeline } from './PipelineContext';
import { useObservability } from './ObservabilityContext';
import { prepareList } from '../lib/keyUtils';

interface RSSContextType {
  articles: Article[];
  events: any[];
  totalArticles: number;
  lastFetch: Date | null;
  isFetching: boolean;
  fetchNow: (force?: boolean) => Promise<void>;
  syncErrors: string[];
  notifications: any[];
  unreadCount: number;
  addAlert: (n: Omit<any, 'id' | 'read' | 'created_at'>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  newArticlesCount: number;
  highSeverityToday: number;
}

const RSSContext = createContext<RSSContextType | null>(null);

export const RSSProvider: React.FC<{
  children: React.ReactNode;
  rriState?: any;
}> = ({ children, rriState }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const { updateArticleCache, isPaused } = usePipeline();
  const [totalArticles, setTotalArticles] = useState(0);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const prevRRIRef = useRef<number>(0);
  const { updateMetrics, trackTrace } = useObservability();
  
  // SINGLETON INTERVAL REF
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to deduplicate arrays of items with an id
  const deduplicateById = <T extends Record<string, any>>(items: T[]): T[] => {
    return prepareList(items) as unknown as T[];
  };

  // Load recent intelligence from Supabase
  const loadData = useCallback(async () => {
    try {
      const { getLiveEvents } = await import('../services/rssService');
      const [recent, liveEvents] = await Promise.all([
        getRecentArticles({ limit: 500 }),
        getLiveEvents(30)
      ]);
      setArticles(deduplicateById(recent));
      setEvents(deduplicateById(liveEvents));
      setTotalArticles(recent.length);
      setIsHydrated(true);
    } catch (err) {
      console.error('Failed to load intelligence data:', err);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await getNotifications(50);
      setNotifications(notifs);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  // Fetch all RSS feeds
  const fetchNow = useCallback(async (force?: boolean) => {
    if (isPaused) {
      console.warn("[RSS] Ingestion blocked: System is PAUSED");
      return;
    }

    const { isIngestionBusy } = await import('../lib/ingestionEngine');
    
    // STRICT CONCURRENCY LOCK
    if (isFetching || isIngestionBusy()) {
      console.warn("[RSS] Ingestion blocked: Global lock active or session in progress");
      return;
    }
    
    console.log("[PIPELINE] Ingestion started: RSS", force ? "(FORCE)" : "");
    setIsFetching(true);
    const startTime = Date.now();
    let isMounted = true;

    // Track ingestion start
    updateMetrics({ lastIngestionTime: startTime });
    trackTrace("rss_fetch", "INGESTION", `RSS Fetch cycle started ${force ? "(Force)" : ""}`);

    try {
      const result = await fetchAllFeeds({ force });
      if (!isMounted) return;
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (result.newArticles > 0) {
        await loadData();
        await loadNotifications();
      }

      setNewArticlesCount(result.newArticles);
      setSyncErrors(result.errors || []);
      setLastFetch(new Date());

      // Update observability metrics
      updateMetrics({
        feedCount: result.feedsProcessed || 0,
        newsCount: result.totalArticlesHandled || 0,
        ingestionRate: result.newArticles,
        errorRate: (result.errors?.length || 0) / (result.feedsProcessed || 1),
        latencyMs: latency,
        lastIngestionTime: endTime
      });

      trackTrace("rss_fetch", "INGESTION", `RSS Fetch cycle completed: ${result.newArticles} new articles`, { latency });

      // Visual feedback via custom event for UI to show toast
      window.dispatchEvent(new CustomEvent('sync-completed', {
        detail: {
          newArticles: result.newArticles,
          totalHandled: result.totalArticlesHandled,
          feeds: result.feedsProcessed,
          errors: result.errors
        }
      }));

      console.log(`[PIPELINE] Ingestion report: ${result.feedsProcessed} feeds, ${result.totalArticlesHandled} items, ${result.newArticles} new articles`);

      if (result.newArticles > 0) {
        // Notification logic
        const highSeverity = articles.filter(
          a => a.severity >= 4 &&
          new Date(a.published_at) > new Date(Date.now() - 900000)
        );

        if (highSeverity.length > 0) {
          await addNotification({
            type: 'RSS',
            priority: 'HIGH',
            title: `${result.newArticles} New Articles — ${highSeverity.length} High Severity`,
            message: highSeverity[0]?.title || 'New intelligence available',
            action_label: 'View Feed',
            action_event: 'navigate-main',
            action_detail: { tab: 'newsfeed' },
          });
        }
      }
    } catch (e) {
      console.error('[RSS ERROR] Fetch failed:', e);
    } finally {
      if (isMounted) setIsFetching(false);
    }
  }, [articles, loadData, loadNotifications]);

  // Watch RRI state for threshold breaches
  useEffect(() => {
    if (!rriState) return;

    const checkRRI = async () => {
      // R(t) crossed threshold
      if (rriState.rri >= 2.625 && prevRRIRef.current < 2.625) {
        await addNotification({
          type: 'RRI',
          priority: 'CRITICAL',
          title: '⚠ Revolution Threshold Breached',
          message: `R(t) = ${rriState.rri.toFixed(4)} — P_rev = ${(rriState.p_rev*100).toFixed(1)}%`,
          action_label: 'View Risk Model',
          action_event: 'navigate-main',
          action_detail: { tab: 'risk' },
        });
        await loadNotifications();
      }
      prevRRIRef.current = rriState.rri;
    };

    checkRRI();
  }, [rriState?.rri, rriState?.velocity]);

  // CORE LOOP CONTROL
  useEffect(() => {
    loadData();
    loadNotifications();

    // Trigger an initial fetch immediately if not busy (checks backend)
    fetchNow();

    // Set up polling interval (15 minutes)
    fetchIntervalRef.current = setInterval(() => {
      fetchNow();
    }, 15 * 60 * 1000);

    return () => {
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []); // Only run once on mount

  // Realtime subscription via WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      ws = new WebSocket(`${protocol}//${host}/ws/intel`);

      ws.onmessage = (event) => {
        if (!isHydrated) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'NEW_ARTICLES') {
            const newArts = msg.payload as Article[];
            setArticles(prev => {
              const safeArts = deduplicateById([...newArts, ...prev]);
              return safeArts
                .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                .slice(0, 500);
            });
            setTotalArticles(v => v + newArts.length);
            setNewArticlesCount(v => v + newArts.length);
          } else if (msg.type === 'EVENTS_UPDATED') {
            const updatedEvents = msg.payload as any[];
            setEvents(prev => {
              const safeEvents = deduplicateById([...updatedEvents, ...prev]);
              return safeEvents
                .sort((a, b) => new Date(b.last_updated || Date.now()).getTime() - new Date(a.last_updated || Date.now()).getTime())
                .slice(0, 100);
            });
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      ws.onclose = () => {
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const highSeverityToday = articles.filter(
    a => a.severity >= 4 &&
    new Date(a.published_at) > new Date(Date.now() - 86400000)
  ).length;

  return (
    <RSSContext.Provider value={{
      articles,
      events,
      totalArticles,
      lastFetch,
      isFetching,
      fetchNow,
      syncErrors,
      notifications,
      unreadCount,
      addAlert: addNotification,
      markRead: markAsRead,
      markAllRead: markAllAsRead,
      newArticlesCount,
      highSeverityToday,
    }}>
      {children}
    </RSSContext.Provider>
  );
};

export const useRSS = () => {
  const ctx = useContext(RSSContext);
  if (!ctx) throw new Error('useRSS must be used within RSSProvider');
  return ctx;
};
