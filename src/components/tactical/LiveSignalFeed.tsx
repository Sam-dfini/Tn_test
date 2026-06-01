import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Radio, Zap, Filter, RefreshCw, Brain } from 'lucide-react';
import { useRSS } from '../../context/RSSContext';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { prepareList, assertKey, getRenderKey } from '../../lib/keyUtils';
import { classifySignals, buildSignalSummary, SignalClassification } from '../../services/signalClassifier';
import { assessGovernmentAgent } from '../../services/govAgent';
import { SignalIntelCard } from '../tactical/SignalIntelCard';
import { SignalTier } from '../../services/signalClassifier';
import { TruthBadge } from '../shared/TruthBadge';

type FeedFilter = 'ALL' | 'SYSTEM_SHOCK' | 'SIGNAL' | 'CONFIRMED';

export const LiveSignalFeed: React.FC<{
  maxItems?: number;
  showFilter?: boolean;
  compact?: boolean;       // compact card mode
  title?: string;
}> = ({
  maxItems = 8,
  showFilter = true,
  compact = false,
  title = 'Live Signal Intelligence',
}) => {
  const { articles } = useRSS();
  const { rriState, fullData: data, seiResult, activeSignals } = useRiskMetrics();
  const { miiProfile, actorNetwork } = useAIAnalysis();
  const [filter, setFilter] = useState<FeedFilter>('ALL');

  // Gov agent assessment (for prediction matching)
  const govAssessment = useMemo(() => {
    try {
      return assessGovernmentAgent(rriState, data, {
        miiProfile, actorNetwork, seiResult
      });
    } catch { return null; }
  }, [rriState, data, miiProfile, actorNetwork, seiResult]);

  // Classify all recent articles
  const classified = useMemo(() => {
    const articleClassified = articles.length ? classifySignals(articles, rriState, data, govAssessment, 30) : [];
    
    // Merge backend-detected shocks from active_signals
    const backendShocks: SignalClassification[] = (activeSignals || []).map((shock: any) => ({
      articleId: shock.id || `shock-${Date.now()}`,
      tier: 'SYSTEM_SHOCK' as SignalTier,
      severity: shock.severity || 5,
      category: shock.category || 'system_shock',
      geoRelevanceScore: 100,
      reason: shock.label || shock.reason || 'Backend shock detection',
      shockEvent: shock.shockEvent || null,
      classifiedAt: shock.timestamp || new Date().toISOString(),
      confirmsGovAction: false,
    }));
    
    // Deduplicate: backend shocks take priority over article-based ones
    const articleIds = new Set(articleClassified.map(c => c.articleId));
    const uniqueBackendShocks = backendShocks.filter(s => !articleIds.has(s.articleId));
    
    return [...uniqueBackendShocks, ...articleClassified];
  }, [articles, rriState, data, govAssessment, activeSignals]);

  // Summary stats
  const summary = useMemo(() =>
    buildSignalSummary(classified), [classified]
  );

  // Build article map for card rendering
  const articleMap = useMemo(() => {
    const map = new Map<string, typeof articles[0]>();
    articles.forEach(a => map.set(a.id, a));
    return map;
  }, [articles]);

  // Apply filter and group by event_id
  const filtered = useMemo(() => {
    let results = classified;
    if (filter === 'SYSTEM_SHOCK') {
      results = classified.filter(c => c.tier === 'SYSTEM_SHOCK');
    } else if (filter === 'SIGNAL') {
      results = classified.filter(c => c.tier === 'SIGNAL');
    } else if (filter === 'CONFIRMED') {
      results = classified.filter(c => c.confirmsGovAction);
    } else {
      // ALL: exclude noise unless we have very few items
      results = classified.filter(c => c.tier !== 'NOISE');
    }

    // Grouping logic
    const groups = new Map<string, SignalClassification[]>();
    const ungrouped: SignalClassification[] = [];

    results.forEach(c => {
      const article = articleMap.get(c.articleId);
      if (article?.event_id) {
        if (!groups.has(article.event_id)) groups.set(article.event_id, []);
        groups.get(article.event_id)!.push(c);
      } else {
        ungrouped.push(c);
      }
    });

    const groupedResults = Array.from(groups.values()).map(group => {
      const sorted = [...group].sort((a, b) => {
        const tierOrder = { SYSTEM_SHOCK: 0, SIGNAL: 1, NOISE: 2 };
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        const artA = articleMap.get(a.articleId);
        const artB = articleMap.get(b.articleId);
        
        const severityDiff = (artB?.severity || 0) - (artA?.severity || 0);
        if (severityDiff !== 0) return severityDiff;
        
        const timeA = artA ? new Date(artA.published_at || 0).getTime() : 0;
        const timeB = artB ? new Date(artB.published_at || 0).getTime() : 0;
        return timeB - timeA;
      });
      
      const representative = sorted[0];
      return {
        ...representative,
        groupCount: group.length,
        groupedArticleIds: group.map(g => g.articleId)
      };
    });

    return [...groupedResults, ...ungrouped]
      .sort((a, b) => {
        const tierOrder = { SYSTEM_SHOCK: 0, SIGNAL: 1, NOISE: 2 };
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        
        const artA = articleMap.get(a.articleId);
        const artB = articleMap.get(b.articleId);
        const timeA = artA ? new Date(artA.published_at || 0).getTime() : 0;
        const timeB = artB ? new Date(artB.published_at || 0).getTime() : 0;
        
        // Use recency primarily, fallback to epsilon magnitude
        if (timeA !== timeB) return timeB - timeA;
        return b.modelImpact.epsilonMagnitude - a.modelImpact.epsilonMagnitude;
      })
      .slice(0, maxItems);
  }, [classified, filter, maxItems, articleMap]);

  // Final prepared list for rendering (memoized to prevent key regeneration)
  const preparedList = useMemo(() => {
    return prepareList(filtered);
  }, [filtered]);

  // Filters
  const filters = ['ALL', 'SYSTEM_SHOCK', 'SIGNAL', 'CONFIRMED'] as FeedFilter[];

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Radio className="w-4 h-4 text-intel-yellow" />
          <span className="text-[10px] font-mono text-on-surface uppercase tracking-widest">
            {title}
          </span>
          <TruthBadge truthClass="LIVE" />
          <button 
            className="p-1 hover:bg-white/5 rounded text-slate-500 hover:text-intel-cyan transition-colors"
            title="Refresh Feed"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {showFilter && (
          <div className="flex items-center space-x-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
            {filters.map((f: any) => (
              <button key={f}
                onClick={() => setFilter(f)}
                className={`text-[9px] font-mono uppercase px-2 py-1 rounded
                  transition-all ${
                  filter === f
                    ? 'bg-intel-yellow/10 text-intel-yellow border border-intel-yellow/20'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {f === 'CONFIRMED' ? 'PREDICTED' : f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center space-x-4 text-[8px] font-mono text-slate-600
        bg-black/30 border border-intel-border/20 rounded-lg px-3 py-2">
        <span>
          <strong className="text-intel-red">{summary.systemShocks}</strong> shocks
        </span>
        <span>
          <strong className="text-intel-yellow">{summary.signals}</strong> signals
        </span>
        {summary.confirmedPredictions > 0 && (
          <span>
            <strong className="text-intel-purple">{summary.confirmedPredictions}</strong> predicted confirmed
          </span>
        )}
        {Math.abs(summary.totalEpsilon) > 0.05 && (
          <span>
            Σε(t) = <strong className={
              summary.totalEpsilon > 0 ? 'text-intel-red' : 'text-intel-cyan'
            }>{summary.totalEpsilon > 0 ? '+' : ''}{summary.totalEpsilon.toFixed(3)}</strong>
          </span>
        )}
        {summary.dominantActor && (
          <span>
            Dominant actor: <strong className="text-slate-400">{summary.dominantActor}</strong>
          </span>
        )}
      </div>

      {/* Signal cards */}
      {filtered.length === 0 ? (
        <div className="text-[9px] font-mono text-slate-700 text-center py-6">
          No {filter === 'ALL' ? 'significant' : filter.toLowerCase()} signals detected.
        </div>
      ) : (
        <div className="space-y-2">
          {preparedList.map((c: any, i: number) => {
            const article = articleMap.get(c.articleId);
            if (!article) return null;
            return (
              <SignalIntelCard
                key={c.id}
                classification={c}
                article={article}
                compact={compact}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
