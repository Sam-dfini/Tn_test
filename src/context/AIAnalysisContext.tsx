import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useRiskMetrics } from '../hooks/usePipelineDomains';
import { useAuditLog } from './AuditContext';
import { generateAIAnalysis, generateForecast, AIAnalysis, ForecastResult } from '../services/ai';
import { computeSignals } from '../services/signals';
import { computeClusters } from '../services/clusters';
import { generateSmartAlerts } from '../services/smartAlerts';
import { generateAgentInsights } from '../services/agents';
import { computeMII } from '../services/miiEngine';
import { analyzeActorNetwork } from '../services/actorNetwork';

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
  const { addAuditEntry } = useAuditLog();

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [miiProfile, setMiiProfile] = useState<any>(null);
  const [actorNetwork, setActorNetwork] = useState<any>(null);
  const [temporalAnalysis, setTemporalAnalysis] = useState<any>(null);
  const [isAIAnalysisLoading, setIsAIAnalysisLoading] = useState(false);

  const runAIAnalysis = useCallback(async () => {
    if (isAIAnalysisLoading) return;
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

      const [analysis, forecastResult, mii, actors] = await Promise.all([
        generateAIAnalysis(signals, clusters, alerts, situations, insights),
        generateForecast({ rri: rriState.rri, data }, []),
        computeMII(),
        analyzeActorNetwork([])
      ]);

      setAiAnalysis(analysis);
      setForecast(forecastResult);
      setMiiProfile(mii);
      setActorNetwork(actors);
      setTemporalAnalysis({});

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
    }
  }, [data, rriState, isAIAnalysisLoading, addAuditEntry]);

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
