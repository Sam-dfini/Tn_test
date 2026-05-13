import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRiskMetrics } from '../hooks/usePipelineDomains';
import { useAuditLog } from './AuditContext';
import { processAllGovernorates, generateMockInputs, AgriNationalSummary } from '../services/AgriIntelEngine';
import { processAgroNational, buildAgroInput, buildBCEWMInputs, AgroNationalSummary } from '../services/AgroSystemEngine';
import { detectShortagesInArticles } from '../services/shortageDetector';
import { addNotification } from '../services/notificationService';

interface AgriIntelContextType {
  agriSummary: AgriNationalSummary | null;
  agroSummary: AgroNationalSummary | null;
  updateAgriData: () => void;
}

export const AgriIntelContext = createContext<AgriIntelContextType>({} as AgriIntelContextType);

export const AgriIntelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { fullData: data, updateField, seiResult, recalculateRRI } = useRiskMetrics();
  
  const [agriSummary, setAgriSummary] = useState<AgriNationalSummary | null>(null);
  const [agroSummary, setAgroSummary] = useState<AgroNationalSummary | null>(null);
  // We don't have articles available directly, as it was passed via event detail in PipelineContext

  const updateAgriData = useCallback(() => {
    try {
      const agriInputs = generateMockInputs('drought');
      const summary = processAllGovernorates(agriInputs);
      setAgriSummary(summary);
    } catch (e) {
      console.error('Failed to run AgriIntel baseline:', e);
    }
  }, []);

  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const { results: satResults, rri_overrides: satOverrides, articleCache } = e.detail || {};

        // 2s timeout — backend may be cold or unavailable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        let fetchOk = false;
        try {
          const response = await fetch('/api/agri/summary', { signal: controller.signal });
          clearTimeout(timeoutId);
          fetchOk = response.ok;
          if (response.ok) {
          const summary = await response.json();
          setAgroSummary(summary);

          if (summary.rri_overrides) {
            Object.entries(summary.rri_overrides).forEach(([field, value]) => {
              if (!field.startsWith('_')) {
                updateField(field, value as number, 'AgroIntelligence Engine (Backend)');
              }
            });
          }

          if (summary.bci?.crisis_imminent) {
            addNotification({
              type: 'ALERT',
              priority: 'CRITICAL',
              title: `Bread Crisis Index: ${(summary.bci.BCI * 100).toFixed(0)}% — ${summary.bci.level}`,
              message: `Supply: ${(summary.bci.supply_stress*100).toFixed(0)}% · Price: ${(summary.bci.price_pressure*100).toFixed(0)}% · Public: ${(summary.bci.public_signal*100).toFixed(0)}%`,
              action_label: 'View AgriIntel',
              action_event: 'navigate-main',
              action_detail: { tab: 'agri' },
            });
          }

          if (summary.bci?.early_warning) {
            addNotification({
              type: 'ALERT',
              priority: 'HIGH',
              title: `BCI Velocity Alert: +${(summary.bci.velocity * 100).toFixed(0)}% in 7 days`,
              message: 'Bread Crisis Index accelerating. Early warning threshold exceeded.',
              action_label: 'View AgriIntel',
              action_event: 'navigate-main',
              action_detail: { tab: 'agri' },
            });
          }
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name !== 'AbortError') {
            console.warn('Backend agro summary failed, falling back to local calculation');
          }
          fetchOk = false;
        }
        if (!fetchOk) {
          const agroInputs: Record<string, any> = {};
          const wheatStress: Record<string, number> = {};

          for (const r of satResults || []) {
            agroInputs[r.governorate] = buildAgroInput(
              r.governorate,
              r.ndvi ?? 0.35,
              r.rainfall_anomaly ?? 0,
              r.soil_moisture ?? 0.25,
              r.temperature ?? 22,
              data
            );
            wheatStress[r.governorate] = r.wheat_stress ?? 0.35;
          }

          const media_bread_score = detectShortagesInArticles(articleCache || [])
            .shortages.find(s => s.type === 'flour')?.severity ?? 0;

          const bciInputs = buildBCEWMInputs(
            satOverrides?.national_wheat_stress ?? 0.35,
            data,
            seiResult?.score ?? 0,
            media_bread_score,
            0,
            agroSummary?.bci?.BCI ?? 0
          );

          const summary = processAgroNational(agroInputs, bciInputs, wheatStress);
          setAgroSummary(summary);
        }
      } catch (err) {
        console.error('Failed to update agro summary:', err);
      } finally {
        setTimeout(() => recalculateRRI(), 200);
      }
    };

    window.addEventListener('ti:agri_update', handler);
    return () => window.removeEventListener('ti:agri_update', handler);
  // Stable deps only — removing data/seiResult/agroSummary prevents re-registration on every RRI recalc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateField, recalculateRRI]);

  const value = useMemo(() => ({
    agriSummary,
    agroSummary,
    updateAgriData,
  }), [agriSummary, agroSummary, updateAgriData]);

  return (
    <AgriIntelContext.Provider value={value}>
      {children}
    </AgriIntelContext.Provider>
  );
};

export const useAgriIntel = () => useContext(AgriIntelContext);
