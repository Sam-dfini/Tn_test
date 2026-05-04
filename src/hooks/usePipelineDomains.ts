import { usePipeline } from '../context/PipelineContext';

export const useEconomyData = () => {
  const { data, updateField, pushApprovedChanges, recalculateRRI } = usePipeline();
  return { 
    data: data?.economy || {}, 
    fullData: data, 
    updateField, 
    pushApprovedChanges, 
    recalculateRRI 
  };
};

export const useRiskMetrics = () => {
  const context = usePipeline();
  const { 
    rriState, 
    recalculateRRI, 
    aiAnalysis, 
    forecast, 
    rpiProfile, 
    cognitiveEnvironment, 
    seiResult,
    data,
    updateField,
    runAIAnalysis,
    isAIAnalysisLoading,
    pushApprovedChanges,
    isPaused,
    togglePause,
    updateArticleCache
  } = context;
  
  return { 
    rriState, 
    recalculateRRI, 
    aiAnalysis, 
    forecast, 
    rpiProfile, 
    cognitiveEnvironment, 
    seiResult,
    fullData: data,
    updateField,
    runAIAnalysis,
    isAIAnalysisLoading,
    pushApprovedChanges,
    isPaused,
    togglePause,
    updateArticleCache
  };
};

export const useSocialData = () => {
  const { data, updateField, pushApprovedChanges } = usePipeline();
  return { 
    data: data?.social || {}, 
    fullData: data, 
    updateField, 
    pushApprovedChanges 
  };
};

export const useGeopoliticalData = () => {
  const { data, updateField, pushApprovedChanges } = usePipeline();
  return { 
    data: data?.geopolitical || {}, 
    fullData: data, 
    updateField, 
    pushApprovedChanges 
  };
};

export const useEnergyData = () => {
  const { data, updateField, pushApprovedChanges } = usePipeline();
  return { 
    data: data?.energy || {}, 
    fullData: data, 
    updateField, 
    pushApprovedChanges 
  };
};

export const usePoliticalData = () => {
  const { data, updateField, pushApprovedChanges, actorNetwork } = usePipeline();
  return { 
    data: data?.geopolitical || {}, 
    fullData: data, 
    actorNetwork,
    updateField, 
    pushApprovedChanges 
  };
};

export const useAgriData = () => {
  const { rriState, data, updateField } = usePipeline();
  // Agri data is often derived from RRI variables or specific simulation outputs
  return { 
    rriState,
    fullData: data,
    updateField
  };
};

export const useCognitiveData = () => {
  const { cognitiveEnvironment, rriState, updateField } = usePipeline();
  return { 
    cognitiveEnvironment, 
    rriState,
    updateField 
  };
};

export const useSecurityData = () => {
  const { rpiProfile, rriState, updateField } = usePipeline();
  return { 
    rpiProfile, 
    rriState,
    updateField 
  };
};

export const useSimulationData = () => {
  const { forecast, rriState, runAIAnalysis, isAIAnalysisLoading } = usePipeline();
  return { 
    forecast, 
    rriState, 
    runAIAnalysis, 
    isLoading: isAIAnalysisLoading 
  };
};

export const useNotificationData = () => {
  const { addAuditEntry } = usePipeline();
  // Most notifications are handled by NotificationContext, but we can expose log-based ones
  return { addAuditEntry };
};

export const useSystemControls = () => {
  const { isPaused, togglePause, recalculateRRI, data, pushApprovedChanges, runAIAnalysis, resetToDefaults } = usePipeline();
  return { 
    isPaused, 
    togglePause, 
    recalculateRRI, 
    fullData: data, 
    pushApprovedChanges, 
    runAIAnalysis, 
    resetToDefaults 
  };
};

export const useAuditLogEvents = () => {
  const { auditLog, addAuditEntry } = usePipeline();
  return { auditLog, addAuditEntry };
};

export const useIntelligenceProfiles = () => {
  const { miiProfile, actorNetwork, temporalAnalysis, seiResult, data } = usePipeline();
  return { miiProfile, actorNetwork, temporalAnalysis, seiResult, fullData: data };
};
