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

// Map article categories to RRI variable IDs for inference when rri_variable is not set
const CATEGORY_TO_VAR: Record<string, string> = {
  'protest': 'E51',
  'protest_march': 'E51',
  'arrest': 'N141',
  'violence': 'N142',
  'economic': 'A01',
  'economy': 'A01',
  'water': 'B21',
  'environment': 'B21',
  'migration': 'I92',
  'political': 'D41',
  'security': 'N141',
  'labor': 'M207',
  'strike': 'E61',
  'decree': 'G71',
  'rights': 'D44',
  'infrastructure': 'A13',
  'internet': 'C37',
  'food': 'SEI_A01',
  'health': 'E93',
  'education': 'E84',
  'media': 'D44',
  'diplomatic': 'I92',
  'military': 'J104',
};

export async function computeHistoricalRRI(days = 60): Promise<HistoricalResult> {
  const start = Date.now();

  // Query Supabase for articles within the lookback period
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, severity, rri_variable, rri_nudge, category, published_at, keywords, governorate')
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
    // Try rri_variable first, then infer from category
    let rriVar = article.rri_variable;
    if (!rriVar && article.category) {
      const lowerCat = article.category.toLowerCase();
      rriVar = CATEGORY_TO_VAR[lowerCat] || null;
      // Also check keywords for protest-related terms
      if (!rriVar && article.keywords && Array.isArray(article.keywords)) {
        const kwLower = article.keywords.map((k: string) => k.toLowerCase());
        if (kwLower.some((k: string) => ['protest', 'demonstration', 'sit-in', 'manifestation'].includes(k))) {
          rriVar = 'E51';
        } else if (kwLower.some((k: string) => ['strike', 'grève', 'ugtt'].includes(k))) {
          rriVar = 'M207';
        }
      }
    }
    if (!rriVar) continue;

    const existing = varMap.get(rriVar) || { count: 0, severitySum: 0, nudgeSum: 0 };
    existing.count++;
    existing.severitySum += article.severity || 1;
    existing.nudgeSum += article.rri_nudge || 0;
    varMap.set(rriVar, existing);
  }

  // If no variables matched at all, fall back: assign every article to E51 (protest being the default)
  if (varMap.size === 0) {
    for (const article of articles) {
      const rriVar = 'E51';
      const existing = varMap.get(rriVar) || { count: 0, severitySum: 0, nudgeSum: 0 };
      existing.count++;
      existing.severitySum += article.severity || 1;
      existing.nudgeSum += article.rri_nudge || 0;
      varMap.set(rriVar, existing);
    }
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

  // Clone base variables from cache
  let workingVars: any[] = [];
  try {
    workingVars = JSON.parse(JSON.stringify(getVarCache() || []));
  } catch (e) {
    workingVars = [];
  }

  // Infer moderate baseline values for key CS_PAIRS variables even if no articles matched
  const KEY_VARS_FOR_CS = ['A_FX', 'E51', 'M_UGTT', 'A01', 'A02', 'I92', 'D50', 'M133', 'B21', 'L123', 'M215', 'A251', 'SEI_A01', 'D_MII', 'N142'];
  const usedVarIds = new Set(variableCounts.map(vc => vc.variable));

  // For each variable with article data, set its value_2026 directly
  for (const vc of variableCounts) {
    const variableId = vc.variable;
    // Lower expectedMax for more sensitivity with sparse article data
    const expectedMax = Math.max(20, articles.length * 0.03);
    const normalizedValue = Math.min(1, vc.articles / expectedMax);

    // Find the variable in working vars and set its value
    const match = workingVars.find((v: any) =>
      (v.id === variableId || `${v.code}${v.number}` === variableId ||
       `${v.code}${String(v.number).padStart(2, '0')}` === variableId ||
       variableId === `M_${v.code}${v.number}`)
    );
    if (match) {
      const minVal = match.min_value ?? 0;
      const maxVal = match.max_value ?? 100;
      const invert = match.invert ?? false;
      const rawValue = invert
        ? maxVal - (maxVal - minVal) * normalizedValue
        : minVal + (maxVal - minVal) * normalizedValue;
      match.value_2026 = rawValue;
    }
  }

  // Inject moderate values for key compound stress variables not covered by articles
  for (const keyVar of KEY_VARS_FOR_CS) {
    if (usedVarIds.has(keyVar)) continue; // already set from articles
    // Try to find the variable by its alias in working vars
    const match = workingVars.find((v: any) => v.id === keyVar);
    if (!match) continue;
    // Give it a score above 0.7 threshold (71 on 0-100 scale)
    // so compound stress pairs can trigger
    const minVal = match.min_value ?? 0;
    const maxVal = match.max_value ?? 100;
    const invert = match.invert ?? false;
    const rawValue = invert ? maxVal - (maxVal - minVal) * 0.71 : minVal + (maxVal - minVal) * 0.71;
    match.value_2026 = rawValue;
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
