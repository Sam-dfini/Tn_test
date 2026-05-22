import { useState, useEffect } from 'react';

export const useDeliberation = () => {
  const [latestSession, setLatestSession] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/deliberation/sessions/latest')
      .then(r => r.json())
      .then(data => {
        if (data && data.status !== 'no_sessions_yet') {
          setLatestSession(data);
        }
      })
      .catch(() => {});

    fetch('/api/deliberation/sessions?limit=5')
      .then(r => r.json())
      .then(setSessions)
      .catch(() => {});

    const handler = async () => {
      try {
        const res = await fetch('/api/deliberation/sessions/latest');
        const data = await res.json();
        if (data && data.status !== 'no_sessions_yet') {
          setLatestSession(data);
        }
      } catch {}
    };
    window.addEventListener('ti:DELIBERATION_COMPLETE', handler);
    return () => window.removeEventListener('ti:DELIBERATION_COMPLETE', handler);
  }, []);

  return { latestSession, sessions };
};
