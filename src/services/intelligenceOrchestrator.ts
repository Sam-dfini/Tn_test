import { supabase, Article } from '../lib/supabase';
import { IntelligencePipeline } from '../lib/IntelligenceEngine';
import { coreLogicEngine } from './coreLogicEngine';
import { generateSmartAlerts, SmartAlertResult } from './smartAlerts';
import { getSignalsFromModel, Signals } from './signals';
import { computeClusters, Clusters } from './clusters';
import { classifySignals, SignalClassification } from './signalClassifier';
import { detectShortagesInArticles, ShortageSignal } from './shortageDetector';
import { analyzeArticle } from './narrativeEngine';
import { addNotification } from './notificationService';
import { pipelineDebugger } from './debugService';

/**
 * Intelligence Orchestrator (Mission Orchestrator)
 * 
 * Implements Step 5: Real-Time Intelligence Loop
 * INGEST → ANALYZE → UPDATE RRI → DETECT → ALERT → STORE
 */
export class IntelligenceOrchestrator {
  private pipeline: IntelligencePipeline;
  private isProcessing: boolean = false;

  constructor() {
    this.pipeline = new IntelligencePipeline(500); // 500 event buffer
  }

  /**
   * Run the full intelligence loop
   */
  public async runIntelligenceLoop(newArticles: Article[] = []): Promise<void> {
    if (this.isProcessing) {
      console.warn('Intelligence loop already running. Skipping.');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();
    pipelineDebugger.log('ORCHESTRATOR', 'valid', `Starting intelligence loop for ${newArticles.length} articles...`, { articleCount: newArticles.length });

    try {
      // 1. INGEST
      if (newArticles.length > 0) {
        this.pipeline.ingest(newArticles, 'unified_orchestrator');
      }
      const snapshot = this.pipeline.getSnapshot();

      // 2. ANALYZE (Signal Classification, Shortages, Deep Narrative)
      pipelineDebugger.log('ORCHESTRATOR', 'valid', 'Analyzing and classifying signals...', {});
      
      const analysisState = coreLogicEngine.getFullAnalysis();
      const classifications = classifySignals(newArticles as any, analysisState, {}, null);
      const detections = detectShortagesInArticles(newArticles);
      
      // RUN DEEP ANALYSIS ON TOP 3 CRITICAL SIGNALS (Quota safety)
      const criticalSignals = classifications
        .filter(c => c.tier === 'SYSTEM_SHOCK')
        .slice(0, 3);
      
      if (criticalSignals.length > 0) {
        pipelineDebugger.log('ORCHESTRATOR', 'valid', `Running deep narrative analysis on ${criticalSignals.length} critical signals...`, { criticalCount: criticalSignals.length });
        for (const signal of criticalSignals) {
          const matchingArticle = newArticles.find(a => a.id === signal.articleId);
          if (matchingArticle) {
            await analyzeArticle(matchingArticle as any).catch(e => 
              console.error(`[ORCHESTRATOR] Deep analysis failed for ${signal.articleId}:`, e)
            );
          }
        }
      }

      // 3. UPDATE RRI
      pipelineDebugger.log('ORCHESTRATOR', 'valid', 'Updating RRI model variables from signal impacts...', {});
      this.applySignalImpacts(classifications);
      this.applyShortageImpacts(detections.shortages);
      
      const updatedAnalysis = coreLogicEngine.getFullAnalysis();
      
      // 4. COMPUTE SIGNALS & CLUSTERS
      const currentSignals = getSignalsFromModel(updatedAnalysis);
      
      // Inject narrative closure if detected (simplified mapping)
      const avgPropaganda = classifications.length > 0 
        ? classifications.reduce((acc, c) => acc + (c.articleId.length % 5) / 5, 0) / classifications.length // Dummy
        : 0;
      const currentClusters = computeClusters(currentSignals, avgPropaganda);
      
      // 5. DETECT (Smart Alerts)
      pipelineDebugger.log('ORCHESTRATOR', 'valid', 'Executing pattern detection...', {});
      const previousState = await this.getPreviousState();
      
      const alertResult: SmartAlertResult = generateSmartAlerts(
        currentSignals,
        previousState.signals,
        currentClusters,
        previousState.clusters,
        { rpi: updatedAnalysis.rt / 5, mii: { phase: 'NORMAL' } },
        null,
        null
      );

      // 6. ALERT
      if (alertResult.alerts.length > 0) {
        const topAlerts = alertResult.alerts.filter(a => a.priority > 7.5);
        if (topAlerts.length > 0) {
          pipelineDebugger.log('ORCHESTRATOR', 'warning', `Detected ${topAlerts.length} critical patterns!`, { alertCount: topAlerts.length });
          for (const alert of topAlerts) {
            addNotification({
              type: 'ALERT',
              priority: 'CRITICAL',
              title: 'CRITICAL PATTERN DETECTED',
              message: alert.message,
              action: { label: 'View Intelligence', event: 'navigate-main', detail: { tab: 'risk' } }
            }).catch(e => console.error("Notification failed:", e));
          }
        }
      }

      // 7. STORE
      pipelineDebugger.log('ORCHESTRATOR', 'valid', 'Persisting intelligence state...', {});
      await this.persistState(updatedAnalysis, alertResult, currentSignals, currentClusters);

      const duration = Date.now() - startTime;
      pipelineDebugger.log('ORCHESTRATOR', 'valid', `Intelligence loop completed successfully in ${duration}ms`, { duration });

    } catch (error) {
      console.error('CRITICAL: Intelligence Loop Failure:', error);
      pipelineDebugger.log('ORCHESTRATOR', 'error', `Loop failed: ${error instanceof Error ? error.message : String(error)}`, { error });
    } finally {
      this.isProcessing = false;
    }
  }

  private applySignalImpacts(classifications: SignalClassification[]) {
    for (const signal of classifications) {
      if (signal.tier === 'NOISE') continue;

      const impact = signal.modelImpact;
      if (impact.epsilonMagnitude > 0) {
        coreLogicEngine.nudgeByCode(
          impact.primaryVariable, 
          impact.epsilonMagnitude * impact.epsilonDirection * 2 
        );

        for (const secVar of impact.secondaryVariables) {
          coreLogicEngine.nudgeByCode(secVar, impact.epsilonMagnitude * impact.epsilonDirection);
        }
      }
    }
  }

  private applyShortageImpacts(shortages: ShortageSignal[]) {
    if (shortages.length === 0) return;

    const shortageVarMap: Record<string, string> = {
      'butane': 'B22',
      'water': 'B21',
      'electricity': 'B23',
      'food': 'B24',
      'medicine': 'B24',
      'fuel': 'B25'
    };

    for (const shortage of shortages) {
      const varCode = shortageVarMap[shortage.type];
      if (varCode) {
        coreLogicEngine.nudgeByCode(varCode, 0.05); 
      }
    }
  }

  private async getPreviousState(): Promise<{ signals: Signals, clusters: Clusters }> {
    try {
      const { data, error } = await supabase
        .from('agent_memory')
        .select('*')
        .eq('agent_id', 'orchestrator_state')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.content) {
        return data.content;
      }
    } catch (e) {
      // Fallback
    }

    const initialSignals = getSignalsFromModel(coreLogicEngine.getFullAnalysis());
    return {
      signals: initialSignals,
      clusters: computeClusters(initialSignals)
    };
  }

  private async persistState(analysis: any, alerts: SmartAlertResult, signals: Signals, clusters: Clusters): Promise<void> {
    try {
      await supabase.from('agent_memory').insert({
        agent_id: 'orchestrator_state',
        content: { signals, clusters },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Storage failure:', error);
    }
  }
}

export const intelligenceOrchestrator = new IntelligenceOrchestrator();
