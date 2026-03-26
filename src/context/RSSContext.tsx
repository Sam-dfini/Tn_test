import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef
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

interface RSSContextType {
  // Articles
  articles: Article[];
  totalArticles: number;
  lastFetch: Date | null;
  isFetching: boolean;
  fetchNow: () => Promise<void>;

  // Notifications
  notifications: any[];
  unreadCount: number;
  addAlert: (n: Omit<any, 'id' | 'read' | 'created_at'>) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;

  // Stats
  newArticlesCount: number;
  highSeverityToday: number;
}

const RSSContext = createContext<RSSContextType | null>(null);

export const RSSProvider: React.FC<{
  children: React.ReactNode;
  rriState?: any;
}> = ({ children, rriState }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newArticlesCount, setNewArticlesCount] = useState(0);
  const prevRRIRef = useRef<number>(0);
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recent articles from Supabase
  const loadArticles = useCallback(async () => {
    try {
      const recent = await getRecentArticles({ limit: 100 });
      setArticles(recent);
      setTotalArticles(recent.length);
    } catch (err) {
      console.error('Failed to load articles:', err);
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
  const fetchNow = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const result = await fetchAllFeeds();
      setNewArticlesCount(result.newArticles);
      setLastFetch(new Date());

      if (result.newArticles > 0) {
        await loadArticles();

        // Notify about new articles
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
          await loadNotifications();
        }
      }
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, articles, loadArticles, loadNotifications]);

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

      // V(t) acceleration
      if (rriState.velocity > 0.25 && prevRRIRef.current <= 0.25) {
        await addNotification({
          type: 'RRI',
          priority: 'HIGH',
          title: 'Rapid Deterioration Detected',
          message: `V(t) = +${rriState.velocity.toFixed(3)} — ${rriState.velocity_label}`,
          action_label: 'View Velocity',
          action_event: 'navigate-main',
          action_detail: { tab: 'risk' },
        });
        await loadNotifications();
      }

      // Save snapshot every 6 hours
      const lastSnapshot = localStorage.getItem('last_rri_snapshot');
      const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
      if (!lastSnapshot || parseInt(lastSnapshot) < sixHoursAgo) {
        await saveRRISnapshot(rriState, 'scheduled');
        localStorage.setItem('last_rri_snapshot', String(Date.now()));
      }

      prevRRIRef.current = rriState.rri;
    };

    checkRRI();
  }, [rriState?.rri, rriState?.velocity]);

  // Auto-fetch RSS every 15 minutes
  useEffect(() => {
    loadArticles();
    loadNotifications();

    // Initial fetch after 2 seconds
    const initialTimer = setTimeout(fetchNow, 2000);

    // Then every 15 minutes
    fetchIntervalRef.current = setInterval(fetchNow, 15 * 60 * 1000);

    return () => {
      clearTimeout(initialTimer);
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }
    };
  }, []);

  // Realtime subscription for new articles
  useEffect(() => {
    const subscription = supabase
      .channel('articles')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'articles',
      }, (payload) => {
        const newArticle = payload.new as Article;
        setArticles(prev => [newArticle, ...prev].slice(0, 100));
        setTotalArticles(prev => prev + 1);

        // Fire window event for NewsFeed to pick up
        window.dispatchEvent(new CustomEvent('ti:rss:article', {
          detail: newArticle
        }));
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const highSeverityToday = articles.filter(
    a => a.severity >= 4 &&
    new Date(a.published_at) > new Date(Date.now() - 86400000)
  ).length;

  return (
    <RSSContext.Provider value={{
      articles,
      totalArticles,
      lastFetch,
      isFetching,
      fetchNow,
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
