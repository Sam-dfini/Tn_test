import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRiskMetrics } from '../hooks/usePipelineDomains';
import { useAuditLog } from './AuditContext';
import { useRSS } from './RSSContext';
import { generateAIAnalysis, generateForecast, AIAnalysis, ForecastResult } from '../services/ai';
import { computeSignals } from '../services/signals';
import { computeClusters } from '../services/clusters';
import { generateSmartAlerts } from '../services/smartAlerts';
import { generateAgentInsights } from '../services/agents';
import { computeMII, detectCabinetEventsFromArticles } from '../services/miiEngine';
import { analyzeActorNetwork } from '../services/actorNetwork';
import { detectArticleVolumePatterns } from '../services/temporalAnalysisService';

interface AIAnalysisContextType {
  aiAnalysis: AIAnalysis | null;
  forecast: ForecastResult | null;
  miiProfile: any;
  actorNetwork: any;
  temporalAnalysis: any;
  isAIAnalysisLoading: boolean;
  runAIAnalysis: () => Promise<void>;
}

export const AIAnalysisContext = createContext<AIAnalysisContextType>({} as AIAnalysisContextType);

export const AIAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fullData: data, rriState } = useRiskMetrics();
  const { articles } = useRSS();
  const { addAuditEntry } = useAuditLog();

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);
  
  const isCurrentlyLoading = useRef(false);

  // Deterministic computations that don't need AI but react to data/articles
  const miiProfile = useMemo(() => {
    const events = detectCabinetEventsFromArticles(articles);
    return computeMII(events);
  }, [articles]);

  const actorNetwork = useMemo(() => analyzeActorNetwork(articles), [articles]);
  
  const temporalAnalysis = useMemo(() => {
    return {
      rri: detectArticleVolumePatterns(articles, ''),
      social: detectArticleVolumePatterns(articles, 'social'),
      economy: detectArticleVolumePatterns(articles, 'economy'),
      security: detectArticleVolumePatterns(articles, 'security')
    };
  }, [articles]);

  const runAIAnalysis = useCallback(async () => {
    if (isCurrentlyLoading.current) return;
    isCurrentlyLoading.current = true;
    setIsAIAnalysisLoading(true);
    try {
      const signals = computeSignals({
        R: rriState.r_t,
        compoundStress: rriState.compound_stress,
        salience: rriState.salience,
        infoAmplification: rriState.info_amplification,
        remittanceEffect: 0.1,
        protestInfectedRatio: rriState.sir_infected,
        defectionProbability: rriState.elite_defection_prob,
        eliteCohesion: rriState.elite_cohesion_dynamics,
        velocity: rriState.velocity,
        cascadeProbability: rriState.cascade_probability,
        shock: rriState.stochastic_shock,
        historicalSimilarity: rriState.pattern_similarity
      });
      const clusters = computeClusters(signals);
      
      const { alerts, situations } = generateSmartAlerts(
        signals, signals, clusters, clusters, null
      );
      
      const { insights } = generateAgentInsights(signals, clusters, alerts, null);

      const [analysis, forecastResult] = await Promise.all([
        generateAIAnalysis(signals, clusters, alerts, situations, insights),
        generateForecast({ rri: rriState.rri, data }, [])
      ]);

      setAiAnalysis(analysis);
      setForecast(forecastResult);

      addAuditEntry({
        type: 'EXTRACTED',
        field: 'AI_ANALYSIS',
        value: analysis.riskLevel,
        source: 'CoreLogic v2.0',
        label: 'Intelligence cycle complete',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error('AI Analysis failed:', e);
    } finally {
      setIsAIAnalysisLoading(false);
      isCurrentlyLoading.current = false;
    }
  }, [rriState, addAuditEntry, data]);

  useEffect(() => {
    if (!aiAnalysis && !isAIAnalysisLoading && rriState) {
      runAIAnalysis();
    }
  }, [aiAnalysis, isAIAnalysisLoading, rriState, runAIAnalysis]);

  const value = useMemo(() => ({
    aiAnalysis,
    forecast,
    miiProfile,
    actorNetwork,
    temporalAnalysis,
    isAIAnalysisLoading,
    runAIAnalysis
  }), [aiAnalysis, forecast, miiProfile, actorNetwork, temporalAnalysis, isAIAnalysisLoading, runAIAnalysis]);

  return (
    <AIAnalysisContext.Provider value={value}>
      {children}
    </AIAnalysisContext.Provider>
  );
};

export const useAIAnalysis = () => useContext(AIAnalysisContext);
