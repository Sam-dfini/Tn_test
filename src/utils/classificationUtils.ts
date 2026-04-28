// NLP CLASSIFICATION
// Determines category, severity, governorate, RRI impact, Bias
// ============================================================

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  protest: ['protest', 'manifestation', 'احتجاج', 'grève', 'strike', 'blockade', 'sit-in', 'rassemblement', 'وقفة'],
  arrest: ['arrest', 'detained', 'arrestation', 'اعتقال', 'décret 54', 'decree 54', 'incarcéré', 'emprisonné', 'محاكمة', 'سجن', 'حكم', 'prison', 'sentence', 'dahmani', 'دهماني'],
  economic: ['inflation', 'réserves', 'BCT', 'IMF', 'dinar', 'FMI', 'dette', 'budget', 'forex', 'مالية', 'Bourse', 'BVMT', 'Tunindex'],
  political: ['Saied', 'présidence', 'parlement', 'constitution', 'NSF', 'Ennahda', 'opposition', 'سعيد'],
  water: ['eau', 'water', 'SONEDE', 'sécheresse', 'pénurie eau', 'مياه', 'جفاف'],
  migration: ['migration', 'Sfax', 'harraga', 'traversée', 'هجرة', 'قوارب', 'noyé', 'drowning'],
  labor: ['UGTT', 'syndicat', 'salaire', 'CPG', 'phosphate', 'travailleur', 'نقابة'],
  rights: ['droits', 'liberté', 'RSF', 'HRW', 'Amnesty', 'censure', 'حريات', 'dahmani', 'دهماني'],
  shortage_butane: ['butane', 'gaz butane', 'bouteille', 'بوطان', 'غاز البوطان', 'أسطوانة'],
  shortage_food: ['poulet', 'viande', 'sucre', 'huile', 'pénurie alimentaire', 'دجاج', 'لحم', 'سكر', 'زيت'],
  shortage_energy: ['STEG coupure', 'délestage', 'انقطاع الكهرباء', 'قطع التيار'],
  energy_shock: ['Iran', 'Hormuz', 'oil price spike', 'Brent', 'OPEC cuts', 'prix pétrole'],
  cabinet_change: ['reshuffle', 'remaniement', 'وزير', 'ministre', 'nomination', 'cabinet', 'démission', 'limogeage', 'تعيين', 'إقالة', 'استقالة', 'وزارة', 'تعديل وزاري', 'remaniement ministériel', 'remaniement gouvernemental', 'cabinet reshuffle', 'ministerial change', 'government reshuffle', 'reshuffle of the cabinet', 'new ministers', 'new minister'],
  econ_policy_change: ['استخلاص', 'extraction', 'دعم', 'subvention', 'subsidy', 'تركيبة', 'composition', 'تعديل', 'ajustement', 'adjustment', 'إصلاح', 'réforme', 'reform'],
};

export const GOVERNORATE_KEYWORDS: Record<string, string[]> = {
  'Sfax': ['Sfax', 'صفاقس', 'sfaxien'],
  'Gafsa': ['Gafsa', 'قفصة', 'CPG', 'Metlaoui', 'مطلوي'],
  'Kasserine': ['Kasserine', 'القصرين'],
  'Sidi Bouzid': ['Sidi Bouzid', 'سيدي بوزيد'],
  'Tunis': ['Tunis', 'تونس', 'Bardo', 'Carthage'],
  'Gabes': ['Gabes', 'قابس', 'chimique'],
  'Bizerte': ['Bizerte', 'بنزرت'],
  'Sousse': ['Sousse', 'سوسة'],
  'Kairouan': ['Kairouan', 'القيروان'],
  'Jendouba': ['Jendouba', 'جندوبة'],
  'Kef': ['Kef', 'الكاف', 'Le Kef'],
  'Ariana': ['Ariana', 'أريانة'],
  'Ben Arous': ['Ben Arous', 'بن عروس'],
  'Manouba': ['Manouba', 'منوبة'],
  'Nabeul': ['Nabeul', 'نابل', 'Hammamet', 'حمامات'],
  'Zaghouan': ['Zaghouan', 'زغوان'],
  'Monastir': ['Monastir', 'المنستير'],
  'Mahdia': ['Mahdia', 'المهدية'],
  'Siliana': ['Siliana', 'سليانة'],
  'Beja': ['Beja', 'باجة'],
  'Tozeur': ['Tozeur', 'توزر'],
  'Kebili': ['Kebili', 'قبلي'],
  'Tataouine': ['Tataouine', 'تطاوين'],
  'Medenine': ['Medenine', 'مدنين', 'Djerba', 'جربة'],
};

const ALARMIST_KEYWORDS = ['crisis', 'collapse', 'chaos', 'danger', 'threat', 'warning', 'emergency', 'catastrophe', 'crise', 'effondrement', 'danger', 'menace', 'urgence', 'أزمة', 'انهيار', 'خطر', 'تهديد', 'طوارئ'];
const MINIMIZING_KEYWORDS = ['stable', 'normal', 'control', 'routine', 'minor', 'calm', 'progress', 'stabilité', 'normalité', 'contrôle', 'routine', 'calme', 'progrès', 'استقرار', 'عادي', 'سيطرة', 'روتين', 'هدوء', 'تقدم'];

// This should be imported from narrativeEngine but we'll simulate it for now to avoid complexity or import it if safe
import { analyzeLexical } from '../services/narrativeEngine';

export function classifyArticle(title: string, content: string = '', sourceAlignment: string = 'NEUTRAL'): {
  category: string;
  severity: number;
  governorate: string | null;
  rri_nudge: number;
  rri_variable: string;
  keywords: string[];
  bias_alignment: 'PRO_GOV' | 'NEUTRAL' | 'CRITICAL';
  bias_tone: 'ALARMIST' | 'NEUTRAL' | 'MINIMIZING';
  propaganda_score: number;
  techniques_detected: string[];
} {
  const text = (title + ' ' + content).toLowerCase();
  const matchedKeywords: string[] = [];

  // Detect category
  let category = 'general';
  let maxMatches = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = kws.filter(kw => text.includes(kw.toLowerCase()));
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      category = cat;
      matchedKeywords.push(...matches);
    }
  }

  // Detect severity
  const SEVERITY_KEYWORDS: Record<number, string[]> = {
    5: ['terrorism', 'terrorisme', 'explosion', 'mort', 'killed', 'coup', 'assassin'],
    4: ['UGTT', 'general strike', 'grève générale', 'Decree 54', 'arrested', 'BCT', 'IMF', 'default'],
    3: ['protest', 'manifestation', 'احتجاج', 'grève', 'pénurie', 'shortage'],
    2: ['statement', 'communiqué', 'déclaration', 'réunion', 'meeting'],
  };

  let severity = 1;
  for (const [sev, kws] of Object.entries(SEVERITY_KEYWORDS).reverse()) {
    if (kws.some(kw => text.includes(kw.toLowerCase()))) {
      severity = parseInt(sev);
      break;
    }
  }

  // Detect governorate
  let governorate: string | null = null;
  for (const [gov, kws] of Object.entries(GOVERNORATE_KEYWORDS)) {
    if (kws.some(kw => text.includes(kw.toLowerCase()))) {
      governorate = gov;
      break;
    }
  }

  // Detect Tone
  let bias_tone: 'ALARMIST' | 'NEUTRAL' | 'MINIMIZING' = 'NEUTRAL';
  const alarmistMatches = ALARMIST_KEYWORDS.filter(kw => text.includes(kw));
  const minimizingMatches = MINIMIZING_KEYWORDS.filter(kw => text.includes(kw));
  
  if (alarmistMatches.length > minimizingMatches.length) bias_tone = 'ALARMIST';
  else if (minimizingMatches.length > alarmistMatches.length) bias_tone = 'MINIMIZING';

  // RRI impact
  const RRI_VARIABLE_MAP: Record<string, { variable: string; nudge: number }> = {
    protest: { variable: 'E51', nudge: 0.015 },
    arrest: { variable: 'D44', nudge: 0.012 },
    economic: { variable: 'A01', nudge: 0.010 },
    political: { variable: 'D41', nudge: 0.008 },
    water: { variable: 'B21', nudge: 0.018 },
    migration: { variable: 'F66', nudge: 0.010 },
    labor: { variable: 'M_UGTT', nudge: 0.020 },
    rights: { variable: 'D44', nudge: 0.012 },
    shortage_butane: { variable: 'B22', nudge: 0.025 },
    shortage_food:   { variable: 'B24', nudge: 0.018 },
    shortage_energy: { variable: 'B23', nudge: 0.020 },
    energy_shock:    { variable: 'H04', nudge: 0.015 },
    cabinet_change:  { variable: 'D_MII', nudge: 0.020 },
    econ_policy_change: { variable: 'A251', nudge: 0.035 }, 
  };

  const rriMapping = RRI_VARIABLE_MAP[category] || { variable: 'O151', nudge: 0.005 };

  // Run comprehensive lexical analysis
  const lexical = analyzeLexical(title, content, sourceAlignment);

  // Override category if a strong economic signal is detected
  let finalCategory = category;
  let finalSeverity = severity;
  let finalNudge = rriMapping.nudge * (severity / 3);

  if (lexical.economic_signal && lexical.economic_signal.impact_score >= 50) {
    finalCategory = 'econ_policy_change';
    finalSeverity = Math.max(severity, 4); 
    const econMapping = RRI_VARIABLE_MAP['econ_policy_change'];
    finalNudge = econMapping.nudge * (lexical.economic_signal.impact_score / 100);
  }

  return {
    category: finalCategory,
    severity: finalSeverity,
    governorate,
    rri_nudge: finalNudge,
    rri_variable: finalCategory === 'econ_policy_change' ? 'A251' : rriMapping.variable,
    keywords: [...new Set([...matchedKeywords, ...(lexical.economic_signal?.staple_good ? [lexical.economic_signal.staple_good] : [])])].slice(0, 10),
    bias_alignment: sourceAlignment as any,
    bias_tone,
    propaganda_score: lexical.propaganda_score,
    techniques_detected: lexical.techniques,
  };
}
