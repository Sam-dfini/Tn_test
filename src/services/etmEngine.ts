/**
 * TunisiaIntel — Existential Threat Model (ETM) Engine
 * 
 * Cognitive security intelligence layer.
 * Treats narratives as engineered systems, not isolated claims.
 * Detects construction phases: seed → amplification → closure.
 * 
 * Based on:
 * - Existential Threat Model (ETM): 5-element structural blueprint
 * - Belief Formation Factors: anxiety, social influence, plausibility, source synergy
 * - Narrative Stabilization: unfalsifiability detection
 */

import { Article } from '../lib/supabase';
import { REGIME_TALKING_POINTS, TUNISIAN_EUPHEMISM_MAP, analyzeLexical } from './narrativeEngine';

// ── Types ─────────────────────────────────────────────────────

export type NarrativeVector =
  | 'REGIME'       // state-engineered, top-down
  | 'OPPOSITION'   // organic + organized, bottom-up
  | 'EXTERNAL'     // foreign-engineered, hybrid
  | 'HYBRID';      // multiple vectors converging

export type ConstructionPhase =
  | 'SEED'         // small communities, low-visibility, testing framings
  | 'AMPLIFICATION'// reluctant truth-tellers, peer normalization, source synergy
  | 'CLOSURE'      // unfalsifiable, counter-evidence reinterpreted
  | 'DORMANT';     // low activity, not yet seeded

export type GovernorateVector = string; // governorate ID

// ── ETM Element Scores (0-100 each) ───────────────────────────

export interface ETMElements {
  patternicity: number;       // Spatial/temporal clustering used as evidence
  agencyAttribution: number;  // Responsibility shifted to hidden actors
  existentialThreat: number;  // Group identity/survival dimension activated
  coalition: number;          // Multiple actors in "they" — breadth of conspiracy
  secrecy: number;            // Absence-as-evidence, counter-evidence reinterpreted
}

// ── Full ETM Narrative Profile ─────────────────────────────────

export interface ETMNarrative {
  id: string;
  label: string;                    // human-readable name
  vector: NarrativeVector;
  phase: ConstructionPhase;
  elements: ETMElements;
  closureScore: number;             // 0-100, composite ETM closure
  sustainedAnxietyIndex: number;    // 0-100, emotional state of audience
  interventionWindow: boolean;      // true if still in amplification (actionable)
  governoratesActive: string[];     // where this narrative is dominant
  anchorEvents: string[];           // real events being weaponized
  agentsNamed: string[];            // actors attributed (France, IMF, Ennahda, etc.)
  unfalsifiabilitySignals: string[]; // specific phrases detected
  detectedAt: number;
  articleCount: number;
  sampleHeadlines: string[];
}

// ── Cognitive Environment State ────────────────────────────────

export interface CognitiveEnvironment {
  narratives: ETMNarrative[];
  narrativeClosure: number;         // 0-1, dominant cluster score for pipeline
  sustainedAnxietyIndex: number;    // 0-1, overall SAI
  dominantVector: NarrativeVector;
  mostDangerousCombination: string; // plain-language description
  interventionStillPossible: boolean;
  phase: ConstructionPhase;
}

// ── Tunisia-specific ETM lexicons ────────────────────────────

// PATTERNICITY — phrases that frame coincidence as coordination
const PATTERNICITY_PHRASES: string[] = [
  // French
  'coïncidence', 'hasard', 'pas par hasard', 'ce n\'est pas un hasard',
  'en même temps', 'simultanément', 'coordonné', 'orchestré',
  'timing', 'pas fortuit', 'curieux timing', 'comme par hasard',
  'schéma récurrent', 'pattern', 'répétition', 'encore une fois',
  // Arabic
  'مصادفة', 'ليس مصادفة', 'بالتزامن', 'منسق', 'مدبر',
  'نفس التوقيت', 'يتكرر', 'النمط', 'مرة أخرى', 'مخطط',
  'ترتيب مسبق', 'ليس عفواً',
  // English
  'coincidence', 'not a coincidence', 'at the same time', 'coordinated',
  'pattern', 'orchestrated', 'timing', 'again', 'recurring',
];

// AGENCY ATTRIBUTION — shifting from accident to intention
const AGENCY_PHRASES: string[] = [
  // French
  'ils font ça exprès', 'ils veulent', 'c\'est voulu', 'intentionnel',
  'délibéré', 'plan', 'stratégie', 'ils ont décidé', 'derrière tout ça',
  'qui profite', 'cui bono', 'réseau caché', 'main invisible',
  'forces obscures', 'lobby', 'agenda caché',
  // Arabic
  'يفعلون ذلك عمداً', 'متعمد', 'مقصود', 'خطة', 'استراتيجية',
  'من وراء ذلك', 'من يستفيد', 'شبكة خفية', 'اليد الخفية',
  'قوى خفية', 'أجندة مخفية', 'مؤامرة', 'التدبير',
  // English
  'deliberate', 'intentional', 'they want', 'hidden hand',
  'who benefits', 'agenda', 'plan', 'network behind',
];

// EXISTENTIAL THREAT — group identity/survival dimension
const EXISTENTIAL_PHRASES: string[] = [
  // French
  'notre existence', 'notre identité', 'notre peuple', 'nous détruire',
  'éliminer', 'anéantir', 'disparaître', 'notre culture',
  'génocide', 'extermination', 'fin de la tunisie', 'survie',
  'notre dignité', 'notre terre', 'nos enfants',
  // Arabic
  'وجودنا', 'هويتنا', 'شعبنا', 'تدميرنا', 'القضاء علينا',
  'الإبادة', 'نهاية تونس', 'البقاء', 'كرامتنا', 'أرضنا',
  'أجيالنا', 'ثقافتنا', 'ديننا', 'عروبتنا',
  // English
  'our existence', 'our identity', 'destroy us', 'eliminate',
  'survival', 'our people', 'our land', 'our children',
];

// COALITION — multiple actors in "they"
const COALITION_ACTORS: string[] = [
  // External actors
  'IMF', 'FMI', 'صندوق النقد',
  'World Bank', 'Banque mondiale', 'البنك الدولي',
  'France', 'فرنسا',
  'EU', 'Union Européenne', 'الاتحاد الأوروبي',
  'USA', 'Etats-Unis', 'أمريكا',
  'Israel', 'Israël', 'إسرائيل',
  'Soros', 'سوروس',
  'NGO', 'ONG', 'منظمة غير حكومية',
  // Internal actors
  'Ennahda', 'النهضة',
  'PDL',
  'franc-maçonnerie', 'ماسونية',
  'deep state', 'état profond', 'الدولة العميقة',
  'oligarques', 'أوليغارشية',
  'corrompus', 'الفاسدون',
];

// SECRECY — unfalsifiability, absence-as-evidence
const SECRECY_PHRASES: string[] = [
  // French
  'ils ne veulent pas qu\'on sache', 'caché', 'dissimulé', 'censuré',
  'vous ne verrez pas ça dans les médias', 'les médias mainstream cachent',
  'preuve que ça existe', 'si c\'était faux ils n\'auraient pas',
  'leur silence confirme', 'leur démenti prouve', 'classé secret',
  'réponse scriptée', 'discours officiel',
  // Arabic
  'لا يريدون أن تعرف', 'مخفي', 'مُكتمّ عليه', 'مُرقَّب',
  'لن تروا هذا في الإعلام', 'الإعلام يخفي', 'نفيهم يثبت',
  'صمتهم دليل', 'مُصنَّف سري', 'رواية رسمية',
  'إجابة مُعدَّة مسبقاً',
  // English
  'they don\'t want you to know', 'hidden', 'censored', 'suppressed',
  'mainstream media won\'t cover', 'their denial proves', 'silence confirms',
  'scripted response', 'official narrative', 'classified',
];

// SUSTAINED ANXIETY — repeated risk without closure
const ANXIETY_PHRASES: string[] = [
  // French
  'toujours', 'encore', 'de nouveau', 'jusqu\'à quand', 'jusqu\'où',
  'ça ne s\'arrêtera pas', 'ça va empirer', 'bientôt', 'préparez-vous',
  'avant que', 'il est trop tard', 'dernière chance',
  'on ne peut plus', 'insupportable', 'limite',
  // Arabic
  'دائماً', 'مرة أخرى', 'حتى متى', 'إلى أين', 'لن يتوقف',
  'سيزداد سوءاً', 'قريباً', 'استعدوا', 'قبل فوات الأوان',
  'آخر فرصة', 'لا يمكن الاحتمال', 'إلى الحد الأقصى',
  // English
  'always', 'again', 'until when', 'won\'t stop', 'will get worse',
  'prepare', 'before it\'s too late', 'last chance', 'unbearable',
];

// PEER NORMALIZATION — "everyone is starting to notice"
const PEER_NORMALIZATION_PHRASES: string[] = [
  // French
  'tout le monde dit', 'beaucoup commencent à réaliser',
  'les gens se réveillent', 'tu n\'es pas seul', 'nous sommes nombreux',
  'de plus en plus de gens', 'la prise de conscience',
  'même mes voisins', 'partout dans le pays',
  // Arabic
  'الجميع يقول', 'كثيرون بدأوا يدركون', 'الناس تستيقظ',
  'لست وحدك', 'نحن كثيرون', 'أكثر وأكثر من الناس',
  'الوعي ينتشر', 'حتى جيراني', 'في كل أنحاء البلاد',
  // English
  'everyone is saying', 'people are waking up', 'you\'re not alone',
  'many are starting to notice', 'growing awareness', 'across the country',
];

// RELUCTANT TRUTH-TELLER signals
const RELUCTANT_INSIDER_PHRASES: string[] = [
  // French
  'source interne', 'employé sous couverture', 'lanceur d\'alerte',
  'quelqu\'un de l\'intérieur', 'ancien fonctionnaire',
  'je ne peux pas révéler mon identité', 'témoignage anonyme',
  'document divulgué', 'fuite', 'whistleblower',
  // Arabic
  'مصدر داخلي', 'موظف متخفٍ', 'مُبلِّغ عن مخالفات',
  'شخص من الداخل', 'مسؤول سابق',
  'لا أستطيع الكشف عن هويتي', 'شهادة مجهولة',
  'وثيقة مسرَّبة', 'تسريب',
];

// ── ETM Element Detection Functions ───────────────────────────

function scorePatternicity(articles: Article[]): {
  score: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let score = 0;
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  // Spatial clustering: same keyword appearing across multiple governorates
  const govMentions: Record<string, number> = {};
  articles.forEach(a => {
    if (a.governorate) {
      govMentions[a.governorate] = (govMentions[a.governorate] || 0) + 1;
    }
  });
  const activeGovs = Object.keys(govMentions).filter(g => govMentions[g] >= 2);
  if (activeGovs.length >= 3) {
    score += 25;
    evidence.push(
      `Same narrative detected in ${activeGovs.length} governorates: ${activeGovs.slice(0, 3).join(', ')}`
    );
  }

  // Temporal clustering: surge in last 72h
  const recent = articles.filter(a => {
    const age = Date.now() - new Date(a.published_at).getTime();
    return age < 72 * 60 * 60 * 1000;
  });
  if (recent.length >= 5 && recent.length > articles.length * 0.6) {
    score += 20;
    evidence.push(
      `Temporal surge: ${recent.length} of ${articles.length} articles in last 72 hours`
    );
  }

  // Patternicity phrases
  let phraseMatches = 0;
  for (const text of texts) {
    for (const phrase of PATTERNICITY_PHRASES) {
      if (text.includes(phrase.toLowerCase())) {
        phraseMatches++;
        if (phraseMatches <= 2) evidence.push(`Patternicity phrase: "${phrase}"`);
      }
    }
  }
  score += Math.min(35, phraseMatches * 7);

  // Reframed correlation: coincidence denial
  const coincidenceDenial = texts.filter(t =>
    t.includes('pas un hasard') || t.includes('ليس مصادفة') ||
    t.includes('not a coincidence') || t.includes('pas fortuit')
  ).length;
  if (coincidenceDenial >= 2) {
    score += 20;
    evidence.push(`${coincidenceDenial} articles explicitly deny coincidence`);
  }

  return { score: Math.min(100, score), evidence };
}

function scoreAgencyAttribution(articles: Article[]): {
  score: number;
  agentsNamed: string[];
  evidence: string[];
} {
  const evidence: string[] = [];
  const agentsFound = new Set<string>();
  let score = 0;
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  // Agency phrases
  let agencyMatches = 0;
  for (const text of texts) {
    for (const phrase of AGENCY_PHRASES) {
      if (text.includes(phrase.toLowerCase())) {
        agencyMatches++;
        if (agencyMatches <= 2) evidence.push(`Agency phrase: "${phrase}"`);
      }
    }
  }
  score += Math.min(30, agencyMatches * 6);

  // Coalition actors named
  for (const actor of COALITION_ACTORS) {
    const count = texts.filter(t => t.includes(actor.toLowerCase())).length;
    if (count >= 2) {
      agentsFound.add(actor);
      score += 8;
    }
  }
  if (agentsFound.size > 0) {
    evidence.push(`Named actors: ${Array.from(agentsFound).slice(0, 5).join(', ')}`);
  }

  // Managed information stream signals (institutional uniformity)
  // Source alignment: all pro-gov sources saying same thing
  const proGovCount = articles.filter(a => a.bias_alignment === 'PRO_GOV').length;
  if (proGovCount >= 3 && proGovCount / articles.length > 0.7) {
    score += 20;
    evidence.push(`${proGovCount} of ${articles.length} articles from pro-gov sources (managed stream)`);
  }

  // Tightly bounded admissions: official sources admit part, deny the key part
  const namedSourceRatio = articles.filter(a =>
    (a.unnamed_source_count || 0) > 2
  ).length / Math.max(articles.length, 1);
  if (namedSourceRatio > 0.5) {
    score += 15;
    evidence.push(`High unnamed source rate: ${(namedSourceRatio * 100).toFixed(0)}% of articles`);
  }

  return {
    score: Math.min(100, score),
    agentsNamed: Array.from(agentsFound),
    evidence
  };
}

function scoreExistentialThreat(articles: Article[]): {
  score: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let score = 0;
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  // Existential phrases
  let existentialMatches = 0;
  for (const text of texts) {
    for (const phrase of EXISTENTIAL_PHRASES) {
      if (text.includes(phrase.toLowerCase())) {
        existentialMatches++;
        if (existentialMatches <= 3) evidence.push(`Existential phrase: "${phrase}"`);
      }
    }
  }
  score += Math.min(40, existentialMatches * 8);

  // Severity escalation (ALARMIST tone)
  const alarmistCount = articles.filter(a => a.bias_tone === 'ALARMIST').length;
  if (alarmistCount >= 3) {
    score += 20;
    evidence.push(`${alarmistCount} articles with ALARMIST tone`);
  }

  // Sustained anxiety phrases
  let anxietyMatches = 0;
  for (const text of texts) {
    for (const phrase of ANXIETY_PHRASES) {
      if (text.includes(phrase.toLowerCase())) {
        anxietyMatches++;
      }
    }
  }
  score += Math.min(25, anxietyMatches * 5);
  if (anxietyMatches > 0) {
    evidence.push(`${anxietyMatches} sustained anxiety phrase matches`);
  }

  // High severity articles
  const highSeverity = articles.filter(a => a.severity >= 4).length;
  if (highSeverity >= 3) {
    score += 15;
    evidence.push(`${highSeverity} high-severity articles (≥4)`);
  }

  return { score: Math.min(100, score), evidence };
}

function scoreCoalition(articles: Article[]): {
  score: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let score = 0;
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  // Count distinct coalition actors
  const actorsFound = new Set<string>();
  for (const actor of COALITION_ACTORS) {
    if (texts.some(t => t.includes(actor.toLowerCase()))) {
      actorsFound.add(actor);
    }
  }

  // More actors = stronger coalition signal
  score += Math.min(50, actorsFound.size * 10);
  if (actorsFound.size >= 2) {
    evidence.push(
      `Coalition of ${actorsFound.size} named actors: ${Array.from(actorsFound).slice(0, 4).join(', ')}`
    );
  }

  // Source diversity with same conclusion (source synergy)
  const uniqueSources = new Set(articles.map(a => a.source_name)).size;
  const sourceVariance = uniqueSources / Math.max(articles.length, 1);
  if (uniqueSources >= 4 && sourceVariance > 0.3) {
    score += 25;
    evidence.push(
      `Source synergy: same narrative across ${uniqueSources} distinct sources`
    );
  }

  // Regime talking points across multiple sources
  let talkingPointHits = 0;
  for (const text of texts) {
    for (const tp of REGIME_TALKING_POINTS) {
      if (text.includes(tp.toLowerCase())) talkingPointHits++;
    }
  }
  if (talkingPointHits >= 5) {
    score += 25;
    evidence.push(
      `${talkingPointHits} regime talking point matches across sources`
    );
  }

  return { score: Math.min(100, score), evidence };
}

function scoreSecrecy(articles: Article[]): {
  score: number;
  unfalsifiabilitySignals: string[];
  evidence: string[];
} {
  const evidence: string[] = [];
  const unfalsifiabilitySignals: string[] = [];
  let score = 0;
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  // Secrecy / unfalsifiability phrases
  let secrecyMatches = 0;
  for (const text of texts) {
    for (const phrase of SECRECY_PHRASES) {
      if (text.includes(phrase.toLowerCase())) {
        secrecyMatches++;
        unfalsifiabilitySignals.push(phrase);
        if (secrecyMatches <= 3) evidence.push(`Secrecy phrase: "${phrase}"`);
      }
    }
  }
  score += Math.min(40, secrecyMatches * 8);

  // Reluctant truth-tellers
  let insiderMatches = 0;
  for (const text of texts) {
    for (const phrase of RELUCTANT_INSIDER_PHRASES) {
      if (text.includes(phrase.toLowerCase())) {
        insiderMatches++;
        unfalsifiabilitySignals.push(phrase);
      }
    }
  }
  if (insiderMatches >= 2) {
    score += 20;
    evidence.push(`${insiderMatches} reluctant insider / source leak signals`);
  }

  // High unnamed source count (absence-as-evidence infrastructure)
  const highUnnamed = articles.filter(a => (a.unnamed_source_count || 0) >= 3).length;
  if (highUnnamed >= 2) {
    score += 20;
    evidence.push(`${highUnnamed} articles with ≥3 unnamed sources`);
  }

  // Peer normalization (building unfalsifiable social proof)
  let peerMatches = 0;
  for (const text of texts) {
    for (const phrase of PEER_NORMALIZATION_PHRASES) {
      if (text.includes(phrase.toLowerCase())) peerMatches++;
    }
  }
  if (peerMatches >= 3) {
    score += 20;
    evidence.push(`${peerMatches} peer normalization phrases`);
  }

  return {
    score: Math.min(100, score),
    unfalsifiabilitySignals: [...new Set(unfalsifiabilitySignals)].slice(0, 6),
    evidence
  };
}

// ── Sustained Anxiety Index ────────────────────────────────────

function computeSustainedAnxiety(articles: Article[]): number {
  let sai = 0;
  const texts = articles.map(a =>
    (a.title + ' ' + (a.content || a.summary || '')).toLowerCase()
  );

  // Anxiety phrase density
  let anxietyMatches = 0;
  for (const text of texts) {
    for (const phrase of ANXIETY_PHRASES) {
      if (text.includes(phrase.toLowerCase())) anxietyMatches++;
    }
  }
  sai += Math.min(40, anxietyMatches * 4);

  // Unresolved risk: high severity without resolution
  const unresolvedHigh = articles.filter(a =>
    a.severity >= 3 && a.bias_tone === 'ALARMIST'
  ).length;
  sai += Math.min(30, unresolvedHigh * 6);

  // Temporal persistence: same topic across multiple days
  const dateSet = new Set(
    articles.map(a => new Date(a.published_at).toISOString().slice(0, 10))
  );
  if (dateSet.size >= 3) {
    sai += 20;
  }

  // Critical bias alignment with alarmist tone (opposition + alarmist)
  const criticalAlarmist = articles.filter(a =>
    a.bias_alignment === 'CRITICAL' && a.bias_tone === 'ALARMIST'
  ).length;
  sai += Math.min(10, criticalAlarmist * 5);

  return Math.min(100, sai);
}

// ── Construction Phase Classifier ─────────────────────────────

function classifyPhase(
  elements: ETMElements,
  articleCount: number,
  uniqueSources: number,
  closureScore: number,
  sai: number
): ConstructionPhase {
  // CLOSURE: high secrecy + unfalsifiability dominant
  if (
    elements.secrecy > 65 &&
    closureScore > 70 &&
    elements.agencyAttribution > 60
  ) return 'CLOSURE';

  // AMPLIFICATION: source synergy + peer normalization active
  if (
    uniqueSources >= 3 &&
    articleCount >= 5 &&
    closureScore > 40 &&
    sai > 40
  ) return 'AMPLIFICATION';

  // SEED: early, low-spread signals
  if (
    closureScore > 20 &&
    articleCount >= 2
  ) return 'SEED';

  return 'DORMANT';
}

// ── Narrative Vector Classifier ────────────────────────────────

function classifyVector(
  articles: Article[],
  agentsNamed: string[]
): NarrativeVector {
  const proGov = articles.filter(a => a.bias_alignment === 'PRO_GOV').length;
  const critical = articles.filter(a => a.bias_alignment === 'CRITICAL').length;
  const total = articles.length;

  const externalActors = ['IMF', 'FMI', 'France', 'EU', 'USA', 'Soros',
    'Israel', 'صندوق النقد', 'أمريكا', 'فرنسا', 'الاتحاد الأوروبي'];
  const hasExternal = agentsNamed.some(a =>
    externalActors.some(e => a.includes(e))
  );

  const internalActors = ['Ennahda', 'النهضة', 'PDL', 'deep state'];
  const hasInternal = agentsNamed.some(a =>
    internalActors.some(i => a.includes(i))
  );

  if (proGov / total > 0.6) return 'REGIME';
  if (critical / total > 0.6 && !hasExternal) return 'OPPOSITION';
  if (hasExternal && !hasInternal) return 'EXTERNAL';
  return 'HYBRID';
}

// ── Anchor Event Detector ──────────────────────────────────────
// Real events being weaponized into the narrative

function detectAnchorEvents(articles: Article[]): string[] {
  const anchors: string[] = [];
  const categories = new Set(articles.map(a => a.category).filter(Boolean));

  if (categories.has('shortage_butane') || categories.has('shortage_food')) {
    anchors.push('Commodity shortages');
  }
  if (categories.has('protest') || articles.some(a => a.severity >= 4)) {
    anchors.push('Civil unrest events');
  }
  if (articles.some(a => a.governorate &&
    ['kasserine', 'gafsa', 'sidi-bouzid'].includes(a.governorate.toLowerCase())
  )) {
    anchors.push('Interior governorate tensions');
  }
  if (articles.some(a =>
    (a.title + (a.content || '')).toLowerCase().includes('IMF') ||
    (a.title + (a.content || '')).toLowerCase().includes('FMI')
  )) {
    anchors.push('IMF negotiations');
  }
  if (articles.some(a =>
    (a.title + (a.content || '')).toLowerCase().includes('steg') ||
    (a.title + (a.content || '')).toLowerCase().includes('electricity')
  )) {
    anchors.push('Energy infrastructure');
  }

  return anchors;
}

// ── Main ETM Analysis Function ─────────────────────────────────

export function analyzeETM(
  articles: Article[],
  windowHours: number = 72
): ETMNarrative[] {
  if (!articles.length) return [];

  // Filter to window
  const recent = articles.filter(a =>
    Date.now() - new Date(a.published_at).getTime() < windowHours * 3600000
  );

  if (recent.length < 2) return [];

  // Group articles by dominant topic cluster for multi-narrative analysis
  // Simple: split by bias_alignment for now (regime vs opposition narratives)
  const regimeArticles = recent.filter(a => a.bias_alignment === 'PRO_GOV');
  const criticalArticles = recent.filter(a => a.bias_alignment === 'CRITICAL');
  const neutralArticles = recent.filter(a => a.bias_alignment === 'NEUTRAL');

  const narrativeSets: Array<{ articles: Article[]; label: string }> = [];

  if (regimeArticles.length >= 2) {
    narrativeSets.push({
      articles: regimeArticles,
      label: 'State Legitimacy Narrative'
    });
  }
  if (criticalArticles.length >= 2) {
    narrativeSets.push({
      articles: criticalArticles,
      label: 'Opposition Delegitimization Narrative'
    });
  }
  if (neutralArticles.length >= 3) {
    narrativeSets.push({
      articles: [...neutralArticles, ...recent.slice(0, 5)],
      label: 'Ambient Information Environment'
    });
  }

  // Fall back to all articles if no clear split
  if (narrativeSets.length === 0) {
    narrativeSets.push({ articles: recent, label: 'General Narrative Cluster' });
  }

  return narrativeSets.map((set, idx) => {
    const { articles: setArticles, label } = set;

    // Run all five ETM element detectors
    const patResult = scorePatternicity(setArticles);
    const agResult = scoreAgencyAttribution(setArticles);
    const exResult = scoreExistentialThreat(setArticles);
    const coResult = scoreCoalition(setArticles);
    const seResult = scoreSecrecy(setArticles);

    const elements: ETMElements = {
      patternicity: patResult.score,
      agencyAttribution: agResult.score,
      existentialThreat: exResult.score,
      coalition: coResult.score,
      secrecy: seResult.score,
    };

    // Composite closure score
    // All five must be elevated for true closure
    // Multiplicative penalty when any element is missing
    const minElement = Math.min(...Object.values(elements));
    const avgElement = Object.values(elements)
      .reduce((s, v) => s + v, 0) / 5;
    // Closure = average, reduced if any element is very low
    const closureScore = Math.round(
      avgElement * (0.5 + 0.5 * (minElement / 100))
    );

    const sai = computeSustainedAnxiety(setArticles);
    const uniqueSources = new Set(setArticles.map(a => a.source_name)).size;
    const phase = classifyPhase(elements, setArticles.length, uniqueSources, closureScore, sai);
    const vector = classifyVector(setArticles, agResult.agentsNamed);
    const anchorEvents = detectAnchorEvents(setArticles);
    const govs = [...new Set(setArticles.map(a => a.governorate).filter(Boolean))] as string[];

    return {
      id: `etm-${idx}-${Date.now()}`,
      label,
      vector,
      phase,
      elements,
      closureScore,
      sustainedAnxietyIndex: sai,
      interventionWindow: phase === 'SEED' || phase === 'AMPLIFICATION',
      governoratesActive: govs,
      anchorEvents,
      agentsNamed: agResult.agentsNamed,
      unfalsifiabilitySignals: seResult.unfalsifiabilitySignals,
      detectedAt: Date.now(),
      articleCount: setArticles.length,
      sampleHeadlines: setArticles.slice(0, 3).map(a => a.title),
    } as ETMNarrative;
  });
}

// ── Cognitive Environment Aggregator ──────────────────────────

export function computeCognitiveEnvironment(
  narratives: ETMNarrative[]
): CognitiveEnvironment {
  if (!narratives.length) {
    return {
      narratives: [],
      narrativeClosure: 0,
      sustainedAnxietyIndex: 0,
      dominantVector: 'REGIME',
      mostDangerousCombination: 'No active narrative clusters detected.',
      interventionStillPossible: true,
      phase: 'DORMANT',
    };
  }

  // Dominant narrative: highest closure score
  const dominant = narratives.reduce(
    (best, n) => n.closureScore > best.closureScore ? n : best,
    narratives[0]
  );

  // narrativeClosure for cluster pipeline: 0-1
  const narrativeClosure = Math.min(1, dominant.closureScore / 100);

  // Overall SAI: max across narratives
  const sai = Math.max(...narratives.map(n => n.sustainedAnxietyIndex)) / 100;

  // Most dangerous combination
  let combo = 'Monitoring.';
  if (dominant.closureScore >= 70) {
    combo = `CLOSURE: ${dominant.label} has reached unfalsifiability. ` +
      `Fact-checking is now counterproductive. ` +
      `Anchor events: ${dominant.anchorEvents.join(', ')}.`;
  } else if (dominant.phase === 'AMPLIFICATION') {
    combo = `AMPLIFICATION: ${dominant.label} spreading via source synergy. ` +
      `Intervention window is open but closing. ` +
      `Key actors: ${dominant.agentsNamed.slice(0, 3).join(', ')}.`;
  } else if (dominant.phase === 'SEED') {
    combo = `SEED: ${dominant.label} in early construction. ` +
      `Monitor: ${dominant.governoratesActive.slice(0, 3).join(', ')}.`;
  }

  return {
    narratives,
    narrativeClosure,
    sustainedAnxietyIndex: sai,
    dominantVector: dominant.vector,
    mostDangerousCombination: combo,
    interventionStillPossible: dominant.phase !== 'CLOSURE',
    phase: dominant.phase,
  };
}

// ── narrativeClosure signal for cluster pipeline ───────────────
// Returns 0-1 for injection into computeClusters()

export function computeNarrativeClosure(
  articles: Article[]
): number {
  const narratives = analyzeETM(articles, 72);
  const env = computeCognitiveEnvironment(narratives);
  return env.narrativeClosure;
}
