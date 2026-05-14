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

  // Compute RRI by mutating variables directly
  const liveVars = getVarCache();
  // Clone base variables from cache or fall back to empty
  let workingVars: any[] = [];
  try {
    workingVars = JSON.parse(JSON.stringify(liveVars || []));
  } catch (e) {
    workingVars = [];
  }

  // For each variable with article data, set its value_2026 directly
  for (const vc of variableCounts) {
    const variableId = vc.variable;
    const expectedMax = Math.max(100, articles.length * 0.1);
    const normalizedValue = Math.min(1, vc.articles / expectedMax);

    // Find the variable in working vars and set its value
    const match = workingVars.find((v: any) =>
      (v.id === variableId || `${v.code}${v.number}` === variableId ||
       `${v.code}${String(v.number).padStart(2, '0')}` === variableId)
    );
    if (match) {
      // Convert normalized article score (0-1) to variable's natural raw scale
      const minVal = match.min_value ?? 0;
      const maxVal = match.max_value ?? 100;
      const invert = match.invert ?? false;
      const rawValue = invert
        ? maxVal - (maxVal - minVal) * normalizedValue
        : minVal + (maxVal - minVal) * normalizedValue;
      match.value_2026 = rawValue;
    }
  }

  // Pass the mutated array to calculateRRI (array path bypasses override logic)
  const rriState = calculateRRI(workingVars, 0);

  return {
    rriState,
    variableCounts,
    totalArticles: articles.length,
    elapsedMs: Date.now() - start,
  };
}
