import { supabase } from '../lib/supabase';
import { callAI, parseAIJSON } from './aiService';
import { generateAnalystResponse } from './ai';
import { safeAI } from '../lib/aiSafe';

// ============================================================
// LAYER 1 — LEXICAL PATTERN ENGINE
// Runs instantly on every article. No API calls.
// Tunisia-specific vocabulary built from years of
// monitoring Tunisian state vs independent media.
// ============================================================

// State euphemisms → their honest equivalents
// Format: [euphemism, honest_term, propaganda_weight 1-3]
export const TUNISIAN_EUPHEMISM_MAP: [string, string, number][] = [
  // Security / protest
  ['forces de l\'ordre', 'police / security forces', 2],
  ['maintien de l\'ordre', 'suppression of protests', 2],
  ['rassemblement illégal', 'protest', 3],
  ['trouble à l\'ordre public', 'political dissent', 3],
  ['nécessité sécuritaire', 'political crackdown', 3],
  ['opération sécuritaire', 'arrest operation', 2],
  ['قوات الأمن', 'security forces', 1],
  ['حفظ النظام', 'maintaining order', 2],
  ['اعتداء على أمن الدولة', 'political speech', 3],
  ['الإرهاب', 'terrorism (often misused)', 2],

  // Judicial / political prisoners
  ['mandat de dépôt', 'detained without trial', 2],
  ['garde à vue prolongée', 'illegal detention extension', 3],
  ['poursuites judiciaires', 'political prosecution', 2],
  ['atteinte à la sûreté de l\'État', 'political opinion crime', 3],
  ['complot contre l\'État', 'opposition activity', 3],
  ['إجراءات قانونية', 'political prosecution', 2],
  ['التحقيق', 'politically motivated investigation', 1],

  // Economic
  ['réformes structurelles', 'austerity measures', 1],
  ['assainissement budgétaire', 'cuts to public services', 2],
  ['rationalisation des dépenses', 'cuts to subsidies', 2],
  ['pression inflationniste', 'uncontrolled inflation', 1],
  ['إصلاحات اقتصادية', 'austerity', 1],
  ['ضبط النفقات', 'budget cuts', 2],

  // Migration
  ['migration irrégulière', 'desperate migration', 1],
  ['clandestins', 'migrants / refugees', 2],
  ['تدفق المهاجرين', 'migration crisis', 1],
  ['الهجرة غير النظامية', 'dangerous migration', 1],

  // Regime self-description
  ['le peuple a choisi', 'result of low-turnout election', 3],
  ['volonté populaire', 'presidential decree', 3],
  ['processus démocratique', 'authoritarian consolidation', 3],
  ['الشعب اختار', 'unverified electoral mandate', 3],
  ['المسار الديمقراطي', 'dismantlement of democracy', 3],
];

// ============================================================
// ECONOMIC SIGNAL EXTRACTION ENGINE
// Detects "silent" structural changes in staple goods & policy
// ============================================================

export const STAPLE_GOODS: string[] = [
  'خبز', 'pain', 'bread',
  'سميد', 'semoule', 'semolina',
  'حليب', 'lait', 'milk',
  'سكر', 'sucre', 'sugar',
  'زيت', 'huile', 'oil',
  'فرينة', 'farine', 'flour',
  'وقود', 'carburant', 'fuel', 'essence',
  'نخالة', 'son', 'bran',
  'قمح', 'blé', 'wheat',
];

export const POLICY_CHANGE_KEYWORDS: string[] = [
  'استخلاص', 'extraction',
  'دعم', 'subvention', 'subsidy',
  'تكلفة', 'coût', 'cost',
  'إنتاج', 'production',
  'توريد', 'importation', 'import',
  'أسعار', 'prix', 'prices',
  'تعديل', 'ajustement', 'adjustment',
  'إصلاح', 'réforme', 'reform',
  'منظومة', 'système', 'system',
  'توزيع', 'distribution',
  'نقص', 'pénurie', 'shortage',
  'وزن', 'poids', 'weight',
  'تركيبة', 'composition',
];

export interface EconomicSignal {
  is_signal: boolean;
  staple_good?: string;
  signal_type: 'PRICE' | 'COMPOSITION' | 'SUPPLY' | 'SUBSIDY' | 'NONE';
  impact_score: number; // 0-100
}

export function detectEconomicSignal(text: string): EconomicSignal {
  const textLower = text.toLowerCase();
  
  const foundStaple = STAPLE_GOODS.find(g => textLower.includes(g));
  if (!foundStaple) return { is_signal: false, signal_type: 'NONE', impact_score: 0 };

  const foundPolicy = POLICY_CHANGE_KEYWORDS.filter(k => textLower.includes(k));
  if (foundPolicy.length === 0) return { is_signal: false, signal_type: 'NONE', impact_score: 0 };

  // Semantic Rules
  let signalType: EconomicSignal['signal_type'] = 'NONE';
  let score = 30; // Base score for any staple + policy mention

  if (textLower.includes('prix') || textLower.includes('أسعار') || textLower.includes('تكلفة')) {
    signalType = 'PRICE';
    score += 30;
  }
  if (textLower.includes('extraction') || textLower.includes('استخلاص') || textLower.includes('تركيبة') || textLower.includes('نخالة')) {
    signalType = 'COMPOSITION';
    score += 40;
  }
  if (textLower.includes('pénurie') || textLower.includes('نقص') || textLower.includes('توزيع')) {
    signalType = 'SUPPLY';
    score += 20;
  }
  if (textLower.includes('subvention') || textLower.includes('دعم')) {
    signalType = 'SUBSIDY';
    score += 30;
  }

  return {
    is_signal: true,
    staple_good: foundStaple,
    signal_type: signalType,
    impact_score: Math.min(score, 100)
  };
}

// State narrative talking points
// Phrases that indicate coordinated regime messaging
export const REGIME_TALKING_POINTS: string[] = [
  'ingérence étrangère',
  'foreign interference',
  'التدخل الأجنبي',
  'complot contre la tunisie',
  'destabilisation',
  'تحريض على الفوضى',
  'ممولون من الخارج',
  'ennemis de la tunisie',
  'أعداء تونس',
  'agents de l\'étranger',
  'عملاء الخارج',
  'حماية الدولة',
  'الحفاظ على الدولة',
  'sauvegarde de l\'état',
  'تهديد الأمن القومي',
  'menace sécuritaire',
  'comploteurs',
  'المتآمرون',
  'الفوضى',
  'chaos planifié',
];

// Unnamed source indicators (propaganda technique 3)
const UNNAMED_SOURCE_PATTERNS: RegExp[] = [
  /sources? (officielles?|autorisées?|sécuritaires?)/gi,
  /autorités? compétentes?/gi,
  /milieux? (officiels?|proches? du gouvernement)/gi,
  /sources? (informées?|bien informées?)/gi,
  /مصادر? (رسمية|مطلعة|أمنية|موثوقة)/gi,
  /الجهات? المختصة/gi,
  /وفق مصادر/gi,
  /according to (official|security|unnamed) sources?/gi,
  /sources? (close to|familiar with) the (government|presidency)/gi,
];

// Attribution asymmetry patterns
// Subject + negative verb (propaganda assigns blame to opposition)
const OPPOSITION_BLAME_PATTERNS: RegExp[] = [
  /(manifestants?|protestataires?|opposants?|militants?)\s+(ont? (bloqué|perturbé|attaqué|envahi|détruit))/gi,
  /(protesters?|opposition|activists?)\s+(blocked|disrupted|attacked|stormed|destroyed)/gi,
  /(المحتجون|المعارضون|الناشطون)\s+(حاصروا|قطعوا|اعتدوا|هاجموا)/gi,
];

// Government reactive framing
const GOV_REACTIVE_PATTERNS: RegExp[] = [
  /(forces?|autorités?|gouvernement)\s+(a? (répondu|réagi|intervenu|procédé))/gi,
  /(forces?|authorities?|government)\s+(responded|reacted|intervened|proceeded)/gi,
  /(الحكومة|الأمن|السلطات)\s+(تدخلت|ردت|استجابت)/gi,
];

// ============================================================
// LAYER 1 ANALYSIS FUNCTION
// Returns instantly — no async needed
// ============================================================

export interface LexicalAnalysis {
  propaganda_score: number;           // 0-100
  euphemism_count: number;
  euphemisms_found: string[];
  talking_point_count: number;
  talking_points_found: string[];
  unnamed_source_count: number;
  has_attribution_asymmetry: boolean;
  techniques: string[];               // human-readable technique names
  lexical_confidence: number;         // 0-1, how confident we are
  economic_signal?: EconomicSignal;
}

export function analyzeLexical(
  title: string,
  content: string = '',
  sourceAlignment: string = 'NEUTRAL'
): LexicalAnalysis {
  const text = (title + ' ' + content);
  const textLower = text.toLowerCase();

  // 1. Euphemism detection
  const euphemismsFound: string[] = [];
  let euphemismWeight = 0;
  for (const [euphemism, , weight] of TUNISIAN_EUPHEMISM_MAP) {
    if (textLower.includes(euphemism.toLowerCase())) {
      euphemismsFound.push(euphemism);
      euphemismWeight += weight;
    }
  }

  // 2. Regime talking points
  const talkingPointsFound: string[] = [];
  for (const phrase of REGIME_TALKING_POINTS) {
    if (textLower.includes(phrase.toLowerCase())) {
      talkingPointsFound.push(phrase);
    }
  }

  // 3. Unnamed sources
  let unnamedSourceCount = 0;
  for (const pattern of UNNAMED_SOURCE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) unnamedSourceCount += matches.length;
  }

  // 4. Attribution asymmetry
  const hasOppositionBlame = OPPOSITION_BLAME_PATTERNS
    .some(p => p.test(text));
  const hasGovReactive = GOV_REACTIVE_PATTERNS
    .some(p => p.test(text));
  const hasAttributionAsymmetry = hasOppositionBlame && hasGovReactive;

  // 5. Technique list
  const techniques: string[] = [];
  if (euphemismsFound.length >= 2) techniques.push('EUPHEMISTIC_SUBSTITUTION');
  if (talkingPointsFound.length >= 1) techniques.push('REGIME_TALKING_POINTS');
  if (unnamedSourceCount >= 2) techniques.push('UNNAMED_SOURCE_LAUNDERING');
  if (hasAttributionAsymmetry) techniques.push('ATTRIBUTION_ASYMMETRY');
  // Pro-gov source with minimizing tone = likely minimization
  if (sourceAlignment === 'PRO_GOV' && talkingPointsFound.length > 0)
    techniques.push('SEVERITY_MINIMIZATION');

  // 6. Propaganda score (0-100)
  let score = 0;
  score += Math.min(euphemismWeight * 5, 30);       // max 30 from euphemisms
  score += Math.min(talkingPointsFound.length * 15, 30); // max 30 from talking points
  score += Math.min(unnamedSourceCount * 8, 20);    // max 20 from unnamed sources
  if (hasAttributionAsymmetry) score += 15;          // 15 for asymmetry
  if (sourceAlignment === 'PRO_GOV') score = Math.min(score * 1.3, 100);

  // 7. Confidence — how much text we had to work with
  const textLength = text.length;
  const lexicalConfidence = Math.min(textLength / 500, 1);

  // 8. Economic Signal Detection
  const economicSignal = detectEconomicSignal(text);

  return {
    propaganda_score: Math.round(Math.min(score, 100)),
    euphemism_count: euphemismsFound.length,
    euphemisms_found: euphemismsFound.slice(0, 5),
    talking_point_count: talkingPointsFound.length,
    talking_points_found: talkingPointsFound.slice(0, 5),
    unnamed_source_count: unnamedSourceCount,
    has_attribution_asymmetry: hasAttributionAsymmetry,
    techniques,
    lexical_confidence: lexicalConfidence,
    economic_signal: economicSignal.is_signal ? economicSignal : undefined,
  };
}

// ============================================================
// LAYER 2 — GEMINI DEEP ANALYSIS
// Async, cached in Supabase.
// Called for high-severity or high-lexical-score articles.
// ============================================================

export interface GeminiNarrativeAnalysis {
  propaganda_score: number;         // Gemini's 0-100
  narrative_frame: string;          // SECURITY / ECONOMIC / RIGHTS / STABILITY / HUMANITARIAN
  narrative_explanation: string;    // 2-sentence explanation
  techniques_confirmed: string[];   // which lexical findings Gemini confirms
  key_omissions: string[];         // what the article doesn't mention
  reality_assessment: string;      // ACCURATE / PARTIAL / MISLEADING / PROPAGANDA
}

export async function analyzeNarrativeDeep(
  article: {
    id: string;
    title: string;
    content?: string;
    summary?: string;
    source_name: string;
    bias_alignment: string;
    category?: string;
    governorate?: string;
  },
  lexical: LexicalAnalysis
): Promise<GeminiNarrativeAnalysis | null> {

  // Check cache first
  const { data: cached } = await supabase
    .from('narrative_cache')
    .select('*')
    .eq('article_id', article.id)
    .single();

  if (cached) {
    return {
      propaganda_score: cached.propaganda_score,
      narrative_frame: cached.narrative_frame,
      narrative_explanation: cached.narrative_explanation,
      techniques_confirmed: cached.techniques_detected || [],
      key_omissions: [],
      reality_assessment: 'CACHED',
    };
  }

  try {
    const textSample = (article.content || article.summary || article.title)
      .slice(0, 600);

    const prompt = `You are an expert analyst of Tunisian media and political communication.
Analyze this article for propaganda techniques, narrative framing, and reality accuracy.

SOURCE: ${article.source_name} (alignment: ${article.bias_alignment})
CATEGORY: ${article.category || 'unknown'} | LOCATION: ${article.governorate || 'national'}
TITLE: ${article.title}
TEXT: ${textSample}

Pre-detected by lexical engine:
- Euphemisms: ${lexical.euphemisms_found.join(', ') || 'none'}
- Talking points: ${lexical.talking_points_found.join(', ') || 'none'}
- Unnamed sources: ${lexical.unnamed_source_count}
- Lexical propaganda score: ${lexical.propaganda_score}/100

IMPORTANT: Your response must be a single, valid JSON object. 
Do not include any introductory or concluding text.
Do not include markdown code blocks (like \`\`\`json).
Escape all double quotes within string values using a backslash (\\").

JSON structure:
{
  "propaganda_score": <integer 0-100>,
  "narrative_frame": "SECURITY" | "ECONOMIC" | "RIGHTS" | "STABILITY" | "HUMANITARIAN",
  "narrative_explanation": "<2 sentences explaining how this article frames reality>",
  "techniques_confirmed": ["<technique1>", "<technique2>"],
  "key_omissions": ["<what this article doesn't mention that others do>"],
  "reality_assessment": "ACCURATE" | "PARTIAL" | "MISLEADING" | "PROPAGANDA"
}
`;

    const response = await safeAI(
      () => callAI(prompt, {
        maxTokens: 1000,
        responseMimeType: 'application/json'
      }),
      null
    );
    if (!response || response === "ERROR: QUOTA_EXHAUSTED") {
      return null;
    }

    const parsed = parseAIJSON(response) as GeminiNarrativeAnalysis;

    // Cache the result
    await supabase.from('narrative_cache').upsert({
      article_id: article.id,
      propaganda_score: parsed.propaganda_score,
      narrative_frame: parsed.narrative_frame,
      narrative_explanation: parsed.narrative_explanation,
      techniques_detected: parsed.techniques_confirmed,
      unnamed_source_count: lexical.unnamed_source_count,
      euphemism_count: lexical.euphemism_count,
      analyzed_at: new Date().toISOString(),
    });

    // Update article in Supabase
    await supabase.from('articles').update({
      propaganda_score: parsed.propaganda_score,
      narrative_frame: parsed.narrative_frame,
      narrative_explanation: parsed.narrative_explanation,
      techniques_detected: parsed.techniques_confirmed,
      euphemism_count: lexical.euphemism_count,
      unnamed_source_count: lexical.unnamed_source_count,
    }).eq('id', article.id);

    return parsed;
  } catch (err) {
    console.error('Narrative deep analysis failed:', err);
    return null;
  }
}

// ============================================================
// LAYER 3 — CROSS-SOURCE COMPARISON ENGINE
// Given a set of articles covering the same event,
// compute the narrative divergence, omission map,
// and coordination signal.
// ============================================================

export interface CrossSourceReport {
  event_id: string;
  event_title: string;
  article_count: number;

  // Divergence
  narrative_divergence: number;       // 0-100
  divergence_label: string;           // LOW / MODERATE / HIGH / EXTREME

  // Omission map
  // Keywords present in critical sources but absent in pro-gov sources
  omission_gaps: Array<{
    keyword: string;
    present_in: string[];    // source names that mention it
    absent_from: string[];   // source names that don't
    significance: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;

  // Coordination signal
  coordination_detected: boolean;
  coordinated_phrases: string[];      // phrases appearing in 2+ pro-gov sources

  // Narrative comparison
  by_source: Array<{
    source_name: string;
    alignment: string;
    propaganda_score: number;
    narrative_frame: string;
    key_phrase: string;           // most characteristic phrase
    tone: string;
  }>;

  // AI synthesis
  reality_gap_explanation: string;  // what the sources collectively hide/reveal
  reality_gap_score: number;        // 0-100
}

export function computeCrossSource(
  articles: Array<{
    source_name: string;
    bias_alignment: string;
    bias_tone: string;
    title: string;
    content?: string;
    summary?: string;
    propaganda_score?: number;
    narrative_frame?: string;
    narrative_explanation?: string;
  }>
): Omit<CrossSourceReport, 'event_id' | 'event_title' | 'reality_gap_explanation'> {

  if (!articles.length) return {
    article_count: 0,
    narrative_divergence: 0,
    divergence_label: 'LOW',
    omission_gaps: [],
    coordination_detected: false,
    coordinated_phrases: [],
    by_source: [],
    reality_gap_score: 0,
  };

  const criticalArticles = articles.filter(
    a => a.bias_alignment === 'CRITICAL'
  );
  const proGovArticles = articles.filter(
    a => a.bias_alignment === 'PRO_GOV'
  );
  const neutralArticles = articles.filter(
    a => a.bias_alignment === 'NEUTRAL'
  );

  // 1. Compute narrative divergence
  // Based on: propaganda score variance, frame distribution,
  // tone distribution, keyword overlap
  const allScores = articles
    .map(a => a.propaganda_score || 0)
    .filter(s => s > 0);

  let divergence = 0;
  if (allScores.length >= 2) {
    const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
    const variance = allScores.reduce(
      (sum, s) => sum + Math.pow(s - avg, 2), 0
    ) / allScores.length;
    // High variance = high divergence
    divergence = Math.min(Math.sqrt(variance) * 2, 60);
  }

  // Additional divergence from alignment distribution
  if (criticalArticles.length > 0 && proGovArticles.length > 0) {
    divergence += 20;
  }

  // Additional divergence from tone conflict
  const hasAlarmist = articles.some(a => a.bias_tone === 'ALARMIST');
  const hasMinimizing = articles.some(a => a.bias_tone === 'MINIMIZING');
  if (hasAlarmist && hasMinimizing) divergence += 20;

  divergence = Math.min(Math.round(divergence), 100);

  const divergenceLabel =
    divergence >= 75 ? 'EXTREME' :
    divergence >= 50 ? 'HIGH' :
    divergence >= 25 ? 'MODERATE' : 'LOW';

  // 2. Omission map
  // Keywords appearing in critical sources but not pro-gov
  const HIGH_SIGNIFICANCE_KEYWORDS = [
    'arrestation', 'arrested', 'اعتقال',
    'blessé', 'injured', 'مصاب',
    'battu', 'beaten', 'اعتداء',
    'décès', 'death', 'وفاة',
    'manifestation', 'protest', 'احتجاج',
    'torture', 'عذاب',
    'détention arbitraire', 'arbitrary detention',
    'hunger strike', 'grève de la faim', 'إضراب جوع',
    'disparu', 'disappeared', 'اختفاء',
  ];

  const MEDIUM_SIGNIFICANCE_KEYWORDS = [
    'corruption', 'فساد',
    'répression', 'قمع',
    'censure', 'رقابة',
    'austerité', 'تقشف',
    'dette', 'دين',
    'inflation', 'تضخم',
    'chômage', 'بطالة',
    'pénurie', 'نقص',
  ];

  const omissionGaps: CrossSourceReport['omission_gaps'] = [];

  const criticalTexts = criticalArticles.map(
    a => (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  ).join(' ');

  const proGovTexts = proGovArticles.map(
    a => (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  ).join(' ');

  for (const kw of HIGH_SIGNIFICANCE_KEYWORDS) {
    const inCritical = criticalTexts.includes(kw.toLowerCase());
    const inProGov = proGovTexts.includes(kw.toLowerCase());

    if (inCritical && !inProGov && proGovArticles.length > 0) {
      omissionGaps.push({
        keyword: kw,
        present_in: criticalArticles.map(a => a.source_name),
        absent_from: proGovArticles.map(a => a.source_name),
        significance: 'HIGH',
      });
    }
  }

  for (const kw of MEDIUM_SIGNIFICANCE_KEYWORDS) {
    const inCritical = criticalTexts.includes(kw.toLowerCase());
    const inProGov = proGovTexts.includes(kw.toLowerCase());

    if (inCritical && !inProGov && proGovArticles.length > 0) {
      omissionGaps.push({
        keyword: kw,
        present_in: criticalArticles.map(a => a.source_name),
        absent_from: proGovArticles.map(a => a.source_name),
        significance: 'MEDIUM',
      });
    }
  }

  // 3. Coordination signal
  // Unusual phrases appearing in 2+ pro-gov sources within same event
  const coordinatedPhrases: string[] = [];
  let coordinationDetected = false;

  if (proGovArticles.length >= 2) {
    for (const phrase of REGIME_TALKING_POINTS) {
      const count = proGovArticles.filter(
        a => (a.title + ' ' + (a.content || '')).toLowerCase()
             .includes(phrase.toLowerCase())
      ).length;
      if (count >= 2) {
        coordinatedPhrases.push(phrase);
        coordinationDetected = true;
      }
    }
  }

  // 4. Per-source breakdown
  const bySource = articles.map(a => ({
    source_name: a.source_name,
    alignment: a.bias_alignment,
    propaganda_score: a.propaganda_score || 0,
    narrative_frame: a.narrative_frame || 'UNKNOWN',
    key_phrase: a.title.split(' ').slice(0, 8).join(' '),
    tone: a.bias_tone,
  }));

  // 5. Reality gap score
  // Higher when: critical sources alarming + pro-gov minimizing
  // + high omission gaps + coordination detected
  let realityGapScore = 0;
  realityGapScore += Math.min(omissionGaps
    .filter(g => g.significance === 'HIGH').length * 15, 40);
  realityGapScore += omissionGaps
    .filter(g => g.significance === 'MEDIUM').length * 5;
  realityGapScore += coordinationDetected ? 20 : 0;
  realityGapScore += divergence * 0.3;
  realityGapScore = Math.min(Math.round(realityGapScore), 100);

  return {
    article_count: articles.length,
    narrative_divergence: divergence,
    divergence_label: divergenceLabel as any,
    omission_gaps: omissionGaps.slice(0, 8),
    coordination_detected: coordinationDetected,
    coordinated_phrases: coordinatedPhrases,
    by_source: bySource,
    reality_gap_score: realityGapScore,
  };
}

// ============================================================
// LAYER 3B — AI SYNTHESIS for cross-source reports
// Takes the computed report and asks Gemini to explain
// what the gap between sources reveals
// ============================================================

export async function synthesizeRealityGap(
  eventTitle: string,
  report: Omit<CrossSourceReport,
    'event_id' | 'event_title' | 'reality_gap_explanation'>
): Promise<string> {
  try {
    const omissionList = report.omission_gaps
      .filter(g => g.significance === 'HIGH')
      .map(g => `"${g.keyword}" mentioned by ${g.present_in.join('/')} but NOT by ${g.absent_from.join('/')}`)
      .join('\n');

    const prompt = `You are analyzing narrative divergence in Tunisian media coverage.

EVENT: ${eventTitle}
Narrative divergence: ${report.narrative_divergence}% (${report.divergence_label})
Reality gap score: ${report.reality_gap_score}/100

Key omissions — keywords in critical media absent from official media:
${omissionList || 'None detected'}

Coordinated phrases in official sources: ${report.coordinated_phrases.join(', ') || 'None'}

Source breakdown:
${report.by_source.map(s =>
  `- ${s.source_name}: score=${s.propaganda_score}, frame=${s.narrative_frame}, tone=${s.tone}`
).join('\n')}

Write exactly 2 sentences explaining:
1. What the narrative gap reveals about what is actually happening
2. What the official sources are hiding or downplaying

Be direct, specific to this event. No hedging.`;

    const response = await generateAnalystResponse(prompt, {});
    return response || 'Cross-source synthesis unavailable.';
  } catch {
    return 'Cross-source synthesis unavailable.';
  }
}

// ============================================================
// MAIN EXPORT — Full article analysis pipeline
// Call this after fetching + classifying each article
// ============================================================

export async function analyzeArticle(
  article: {
    id: string;
    title: string;
    content?: string;
    summary?: string;
    source_name: string;
    bias_alignment: string;
    category?: string;
    governorate?: string;
    severity: number;
  }
): Promise<{
  lexical: LexicalAnalysis;
  deep: GeminiNarrativeAnalysis | null;
  combined_score: number;
}> {
  // Layer 1 always runs
  const lexical = analyzeLexical(
    article.title,
    article.content || article.summary || '',
    article.bias_alignment
  );

  // Layer 2 only for: severity >= 3 OR lexical score >= 30
  let deep: GeminiNarrativeAnalysis | null = null;
  if (article.severity >= 3 || lexical.propaganda_score >= 30) {
    deep = await analyzeNarrativeDeep(article, lexical);
  }

  // Combined score — weighted average
  const deepScore = deep?.propaganda_score ?? null;
  const combined = deepScore !== null
    ? Math.round(lexical.propaganda_score * 0.4 + deepScore * 0.6)
    : lexical.propaganda_score;

  return { lexical, deep, combined_score: combined };
}
