import { useState, useEffect } from 'react';

export const useSimulation = () => {
  const [latestRun, setLatestRun] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runScenario = async (scenarioId?: string, customScenario?: any) => {
    setIsRunning(true);
    try {
      const params = new URLSearchParams();
      if (scenarioId) params.set('scenario_id', scenarioId);
      const url = `/api/simulation/run${params.toString() ? '?' + params.toString() : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: customScenario ? JSON.stringify({ custom_scenario: customScenario }) : undefined,
      });
      const data = await res.json();
      return data.run_id;
    } catch {
      setIsRunning(false);
      return null;
    }
  };

  useEffect(() => {
    const handler = async (e: any) => {
      const { run_id } = e.detail || {};
      if (!run_id) return;
      try {
        const res = await fetch(`/api/simulation/runs/${run_id}`);
        const run = await res.json();
        setLatestRun(run);
      } catch {}
      setIsRunning(false);
    };
    window.addEventListener('ti:SIMULATION_COMPLETE', handler);
    return () => window.removeEventListener('ti:SIMULATION_COMPLETE', handler);
  }, []);

  return { latestRun, isRunning, runScenario };
};
