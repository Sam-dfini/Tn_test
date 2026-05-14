import { supabase } from '../lib/supabase';
import { Article } from '../lib/supabase';
import calculateRRI from '../math/rri/engine';
import { getVarCache } from './pipelineService';

interface VariableCount {
  variable: string;
  articles: number;
  totalSeverity: number;
  avgSeverity: number;
  totalNudge: number;
}

interface HistoricalResult {
  rriState: ReturnType<typeof calculateRRI> | null;
  variableCounts: VariableCount[];
  totalArticles: number;
  elapsedMs: number;
}

export async function computeHistoricalRRI(days = 60): Promise<HistoricalResult> {
  const start = Date.now();

  // Query Supabase for articles within the lookback period
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, severity, rri_variable, rri_nudge, category, published_at')
    .gte('published_at', cutoff)
    .order('published_at', { ascending: false })
    .limit(2000);

  if (error) {
    console.error('[HISTORICAL RRI] Supabase query failed:', error.message);
    return { rriState: null, variableCounts: [], totalArticles: 0, elapsedMs: Date.now() - start };
  }

  if (!articles || articles.length === 0) {
    return { rriState: null, variableCounts: [], totalArticles: 0, elapsedMs: Date.now() - start };
  }

  // Group by rri_variable and aggregate severity/nudge
  const varMap = new Map<string, { count: number; severitySum: number; nudgeSum: number }>();

  for (const article of articles) {
    const rriVar = article.rri_variable;
    if (!rriVar) continue;

    const existing = varMap.get(rriVar) || { count: 0, severitySum: 0, nudgeSum: 0 };
    existing.count++;
    existing.severitySum += article.severity || 1;
    existing.nudgeSum += article.rri_nudge || 0;
    varMap.set(rriVar, existing);
  }

  // Build variable counts array
  const variableCounts: VariableCount[] = [];
  for (const [variable, data] of varMap.entries()) {
    variableCounts.push({
      variable,
      articles: data.count,
      totalSeverity: data.severitySum,
      avgSeverity: parseFloat((data.severitySum / data.count).toFixed(2)),
      totalNudge: parseFloat(data.nudgeSum.toFixed(4)),
    });
  }
  variableCounts.sort((a, b) => b.articles - a.articles);

  // Compute RRI with accumulated nudges
  const liveVars = getVarCache();
  const overrides: Record<string, number> = {};

  // For each variable with article data, compute a normalized value
  // Use the ratio of articles for this variable vs total as a proxy
  for (const vc of variableCounts) {
    const variableId = vc.variable;
    // Normalize: cap at 1.0 based on expected max articles per variable
    const expectedMax = Math.max(100, articles.length * 0.1);
    const normalizedValue = Math.min(1, vc.articles / expectedMax);
    overrides[variableId] = normalizedValue;
  }

  const rriState = calculateRRI(overrides, 0, liveVars ?? undefined);

  return {
    rriState,
    variableCounts,
    totalArticles: articles.length,
    elapsedMs: Date.now() - start,
  };
}
