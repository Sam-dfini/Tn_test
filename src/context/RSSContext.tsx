import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef, useMemo
} from 'react';
import { Article, supabase } from '../lib/supabase';
import {
  fetchAllFeeds, getRecentArticles
} from '../services/rssService';
import {
  fetchAllTelegramChannels, telegramMetrics
} from '../services/telegramService';
import {
  fetchAllNewsAPIs, newsApiMetrics
} from '../services/newsApiService';
import {
  addNotification, getNotifications, getUnreadCount,
  markAsRead, markAllAsRead
} from '../services/notificationService';
import { saveRRISnapshot } from '../services/rssService';
import { intelligenceOrchestrator } from '../services/intelligenceOrchestrator';
import { useRiskMetrics } from '../hooks/usePipelineDomains';
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
  const { updateArticleCache, isPaused } = useRiskMetrics();
  const [totalArticles, setTotalArticles] = useState(0);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const isFetchingRef = useRef(false);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const prevRRIRef = useRef<number>(0);
  const { updateMetrics, trackTrace } = useObservability();
  
  // SINGLETON INTERVAL REF
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Helper to deduplicate arrays of items with an id
  const deduplicateById = <T extends { id?: any; title?: string; published_at?: any }>(items: T[]): T[] => {
    if (!items || !Array.isArray(items)) return [];
    const map = new Map();
    items.forEach((item, index) => {
      if (!item) return;
      const key = item.id || `idx_${index}_${item.title?.slice(0, 10)}_${item.published_at}`;
      // Keep the first one encountered (usually the newest if prepending)
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  };

  // Load recent intelligence from Supabase
  const articlesRef = useRef<Article[]>([]);
  useEffect(() => {
    articlesRef.current = articles;
  }, [articles]);

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
    if (isFetchingRef.current || isIngestionBusy()) {
      console.warn("[RSS] Ingestion blocked: Global lock active or session in progress");
      return;
    }
    
    console.log("[PIPELINE] Ingestion started: RSS", force ? "(FORCE)" : "");
    setIsFetching(true);
    isFetchingRef.current = true;
    const startTime = Date.now();
    let isMounted = true;

    // Track ingestion start
    updateMetrics({ lastIngestionTime: startTime });
    trackTrace("rss_fetch", "INGESTION", `RSS Fetch cycle started ${force ? "(Force)" : ""}`);

    try {
      // Run RSS, Telegram, and News APIs concurrently
      const [result, tgResult, apiResult] = await Promise.allSettled([
        fetchAllFeeds({ force }),
        fetchAllTelegramChannels({ force }),
        fetchAllNewsAPIs({ force }),
      ]);

      const rss = result.status === 'fulfilled' ? result.value : { newArticles: 0, feedsProcessed: 0, totalArticlesHandled: 0, errors: [] };
      const tg = tgResult.status === 'fulfilled' ? tgResult.value : { newArticles: 0, channelsProcessed: 0, droppedByGeo: 0, errors: [] };
      const api = apiResult.status === 'fulfilled' ? apiResult.value : { newArticles: 0, droppedByGeo: 0, errors: [] };

      if (!isMounted) return;

      const combinedNew = rss.newArticles + tg.newArticles + api.newArticles;
      const combinedErrors = [...(rss.errors || []), ...(tg.errors || []), ...(api.errors || [])];
      const endTime = Date.now();
      const latency = endTime - startTime;

      setNewArticlesCount(combinedNew);
      setSyncErrors(combinedErrors);
      setLastFetch(new Date());

      updateMetrics({
        feedCount: (rss.feedsProcessed || 0) + (tg.channelsProcessed || 0) + 3,
        newsCount: (rss.totalArticlesHandled || 0) + tg.newArticles + api.newArticles,
        ingestionRate: combinedNew,
        errorRate: combinedErrors.length / Math.max(1, (rss.feedsProcessed || 0) + (tg.channelsProcessed || 0) + 3),
        latencyMs: latency,
        lastIngestionTime: endTime,
      });

      trackTrace('rss_fetch', 'INGESTION',
        `Pipeline cycle: RSS +${rss.newArticles} | TG +${tg.newArticles} | API +${api.newArticles} | geo-dropped: ${(tg.droppedByGeo || 0) + (api.droppedByGeo || 0)}`,
        { latency });

      // Visual feedback via custom event for UI to show toast
      window.dispatchEvent(new CustomEvent('sync-completed', {
        detail: {
          newArticles: rss.newArticles,
          totalHandled: rss.totalArticlesHandled,
          feeds: rss.feedsProcessed,
          errors: rss.errors
        }
      }));

      console.log(`[PIPELINE] Ingestion report: ${rss.feedsProcessed} feeds, ${rss.totalArticlesHandled} items, ${rss.newArticles} new articles`);

      if (rss.newArticles > 0 || tg.newArticles > 0 || api.newArticles > 0) {
        // Run Real-Time Intelligence Loop (Step 5)
        const recent = await getRecentArticles({ limit: 50 });
        intelligenceOrchestrator.runIntelligenceLoop(recent).catch(err => 
          console.error("[ORCHESTRATOR] Background loop error:", err)
        );

        // Notification logic
        const shocks = recent.filter(a => 
          a.severity >= 5 || 
          (a.severity >= 4 && a.propaganda_score < 0.3)
        );

        if (shocks.length > 0) {
          // CREATE SNAPSHOT FOR THE SYSTEM SHOCK
          if (rriState) {
            saveRRISnapshot(rriState, `System Shock: ${shocks[0].title.slice(0, 50)}`).catch(e => 
              console.error("[RSS] Snapshot failed:", e)
            );
          }

          await addNotification({
            type: 'SHOCK',
            priority: 'CRITICAL',
            title: 'SYSTEM SHOCK DETECTED',
            message: shocks[0].title,
            action_label: 'Analyze Shock',
            action_event: 'navigate-main',
            action_detail: { tab: 'newsfeed' },
          });
        } else {
          const highSeverity = recent.filter(a => a.severity >= 4);
          if (highSeverity.length > 0) {
            await addNotification({
              type: 'RSS',
              priority: 'HIGH',
              title: `${combinedNew} New Articles — ${highSeverity.length} High Priority`,
              message: highSeverity[0]?.title || 'New intelligence available',
              action_label: 'View Feed',
              action_event: 'navigate-main',
              action_detail: { tab: 'newsfeed' },
            });
          } else if (combinedNew > 0) {
            // LOW priority for "grey or other" - no toast but plays sound
            await addNotification({
              type: 'RSS',
              priority: 'LOW',
              title: `${combinedNew} New Signals Extracted`,
              message: 'Intelligence feed updated with low-priority signals.',
            });
          }
        }
        await loadNotifications();
      }
    } catch (e) {
      console.error('[RSS ERROR] Fetch failed:', e);
    } finally {
      if (isMounted) {
        setIsFetching(false);
        isFetchingRef.current = false;
      }
    }
  }, [isPaused, updateMetrics, trackTrace, loadNotifications]);

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
  const hasInit = useRef(false);
  useEffect(() => {
    if (!hasInit.current) {
      loadData();
      loadNotifications();
      fetchNow();
      hasInit.current = true;
    }

    // ── BACKGROUND INGESTION CYCLE ──────────────────────────────────────────
    // Every 5 minutes, run a full check.
    const interval = setInterval(() => {
      if (!isPaused) {
        console.log("[RSS] Scheduled ingestion triggered...");
        fetchNow();
      }
    }, 300_000); 

    fetchIntervalRef.current = interval;

    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
    };
  }, [isPaused, fetchNow, loadData, loadNotifications]);

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
