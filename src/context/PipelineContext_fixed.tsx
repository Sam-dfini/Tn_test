  return (
    <PipelineContext.Provider
      value{{
        data,
        updateField,
        pushApprovedChanges,
        resetToDefaults,
        addAuditEntry,
        auditLog,
        rriState,
        recalculateRRI,
        updateArticleCache: (articles: any) => {
          if (!articles) return;
          setArticleCache(articles);
          const rpi = analyzeRadicalisation(articles, rriState.w_t ?? 0.35);
          const cog = quickScan(articles, rriState);
          const sei = analyzeSEI(articles);
          setRpiProfile(rpi);
          setCognitiveEnvironment(cog);
          setSeiResult(sei);
        },
        injectSignal: (signalId: string) => {
          const signal = PRESET_SHOCKS.find(s => s.id === signalId);
          if (signal) {
            setData(prev => ({
              ...prev,
              active_signals: [...prev.active_signals, signal]
            }));
          }
        },
        injectShock: (shock: ShockSignal) => {
          setData(prev => ({
            ...prev,
            active_signals: [...prev.active_signals, shock]
          }));
        },
        activeSignals: data.active_signals,
        miiProfile,
        sbdeResult,
        actorNetwork,
        aiAnalysis,
        forecast,
        runAIAnalysis,
        isAIAnalysisLoading,
        rpiProfile,
        cognitiveEnvironment,
        seiResult,
        agroSummary,
        agriSummary,
        temporalAnalysis,
        isPaused,
        togglePause,
        loadPipelineData: () => {
          try {
            const saved = safeStorage.getItem('ti_platform_data');
            if (saved) {
              setData(JSON.parse(saved));
            }
          } catch (e) {
            console.error('Failed to load pipeline data:', e);
          }
        },
      }}
    >
      {children}
    </PipelineContext.Provider>
  );
