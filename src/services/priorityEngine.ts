import { Event, Article } from '../lib/supabase';
import { RSS_SOURCES } from '../config/rssSources';
import { pipelineDebugger } from './debugService';
import { logger } from '../utils/logger.ts';

export interface PriorityResult {
  score: number;
  status: 'emerging' | 'active' | 'escalating' | 'cooling' | 'resolved';
  velocity: number;
  trend: 'up' | 'down' | 'stable';
  isCritical: boolean;
}

/**
 * source_credibility_weights
 */
const SOURCE_CREDIBILITY: Record<string, number> = {
  'A': 1.0,
  'B': 0.7,
  'C': 0.4,
};

/**
 * Priority Scoring System
 * priorityScore = f(severity, signalIntensity, articleVolume, sourceCredibility, recency, velocity)
 */
export function calculateEventPriority(
  event: Event, 
  articles: Article[]
): PriorityResult {
  if (!articles || articles.length === 0) {
    return {
      score: event.priority_score || 0,
      status: 'cooling',
      velocity: 0,
      trend: 'stable',
      isCritical: false,
    };
  }

  // 1. Severity (0-5 scale normalized to 0-1)
  const severityScore = (event.severity || 1) / 5;

  // 2. Article Volume (Logarithmic scale to avoid extremes)
  const volumeScore = Math.min(Math.log10(articles.length + 1) / 2, 1);

  // 3. Source Credibility (Average of sources weighted by reliability)
  const sourceReliabilitySum = articles.reduce((acc, art) => {
    const source = RSS_SOURCES.find(s => s.id === art.source_id);
    return acc + (SOURCE_CREDIBILITY[source?.reliability || 'B'] || 0.7);
  }, 0);
  const credibilityScore = sourceReliabilitySum / articles.length;

  // 4. Recency & Time Decay
  // decayFactor = exp(-lambda * timeSinceLastUpdate)
  const lastUpdate = new Date(event.last_updated || articles[0].published_at).getTime();
  const now = Date.now();
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
  const lambda = 0.05; // Decay constant (lose ~50% in 14 hours)
  const decayFactor = Math.exp(-lambda * hoursSinceUpdate);

  // 5. Velocity (articles per hour in the last 24h)
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const recentArticles = articles.filter(a => new Date(a.published_at).getTime() > oneDayAgo);
  const velocity = recentArticles.length / 24;
  const velocityScore = Math.min(velocity / 2, 1); // Cap at 2 articles/hour for max score

  // 6. Signal Intensity (derived from RRI nudges in articles)
  const avgIntensity = articles.reduce((acc, a) => acc + (a.rri_nudge || 0), 0) / articles.length;
  const signalScore = Math.min(Math.abs(avgIntensity) * 10, 1);

  // 7. Base Weighted Score
  // Weights: Severity (30%), Signal (20%), Velocity (20%), Volume (15%), Credibility (15%)
  let baseScore = (severityScore * 0.3) + 
                  (signalScore * 0.2) + 
                  (velocityScore * 0.2) + 
                  (volumeScore * 0.15) + 
                  (credibilityScore * 0.15);

  // Apply decay to the final score
  const finalScore = Number((baseScore * decayFactor * 10).toFixed(2));

  // 8. Trends and Status
  const oldScore = event.priority_score || 0;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (finalScore > oldScore + 0.5) trend = 'up';
  else if (finalScore < oldScore - 0.5) trend = 'down';

  let status: 'emerging' | 'active' | 'escalating' | 'cooling' | 'resolved' = 'active';
  if (velocity > 1.5 || finalScore > 7) status = 'escalating';
  else if (articles.length <= 2 && hoursSinceUpdate < 2) status = 'emerging';
  else if (decayFactor < 0.6) status = 'cooling';
  else if (event.status === 'RESOLVED') status = 'resolved';

  const isCritical = finalScore > 8 || (severityScore >= 0.8 && velocity > 1);

  // LOG SIGNALS
  pipelineDebugger.log('SIGNALS', 'valid', `Computed priority for ${event.id}`, {
    eventId: event.id,
    severity: severityScore,
    volume: volumeScore,
    velocity: velocityScore,
    signal: signalScore,
    decay: decayFactor,
    finalScore
  });

  logger.log({
    stage: "SIGNAL",
    level: isCritical ? "WARN" : "INFO",
    message: `${isCritical ? 'ALERT: ' : ''}Signal score ${finalScore} for ${event.title.slice(0, 30)}...`,
    traceId: event.event_key,
    payload: { score: finalScore, isCritical, velocity }
  });

  // Trigger alert if jumping to critical
  if (isCritical && !event.is_critical) {
    console.warn(`[ALERT] Event escalated to CRITICAL: ${event.title} (Score: ${finalScore})`);
  }

  return {
    score: finalScore,
    status,
    velocity: velocityScore,
    trend,
    isCritical
  };
}
