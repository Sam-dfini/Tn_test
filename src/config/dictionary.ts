/**
 * TunisiaIntel — Unified Intelligence Dictionary
 * (Recommendation 2 from Architecture Brief)
 */

export interface KeywordConfig {
  fr: string[];
  ar: string[];
  en: string[];
  weight?: number;
  rriVariable?: string;
  [key: string]: any;
}

export const SHORTAGE_DICTIONARY: Record<string, KeywordConfig> = {
  butane: {
    fr: ['butane', 'gaz butane', 'bouteille gaz', 'pénurie gaz', 'rupture gaz', 'file gaz', 'introuvable gaz', 'gaz manque'],
    ar: ['بوطان', 'غاز البوطان', 'أسطوانة الغاز', 'نقص الغاز', 'انقطاع الغاز', 'طابور الغاز', 'غاز مفقود', 'أزمة الغاز'],
    en: ['butane shortage', 'gas shortage', 'lpg shortage'],
    weight: 0.025,
    rriVariable: 'B22',
  },
  electricity: {
    fr: ['coupure électricité', 'délestage', 'STEG coupure', 'panne courant', 'heures coupure', 'électricité coupée', 'sans électricité', 'réseau électrique'],
    ar: ['انقطاع الكهرباء', 'قطع التيار', 'ستاغ', 'أعطال كهربائية', 'ساعات الانقطاع', 'كهرباء مقطوعة', 'بدون كهرباء'],
    en: ['power cut', 'electricity cut', 'blackout', 'load shedding'],
    weight: 0.020,
    rriVariable: 'B23',
  },
  water: {
    fr: ['coupure eau', 'pénurie eau', 'SONEDE', 'eau coupée', 'manque eau', 'distribution eau', 'heures eau'],
    ar: ['انقطاع الماء', 'نقص المياه', 'سونيد', 'قطع الماء', 'مياه مقطوعة', 'ساعات الماء', 'أزمة مياه'],
    en: ['water cut', 'water shortage', 'SONEDE'],
    weight: 0.018,
    rriVariable: 'B21',
  },
  chicken: {
    fr: ['poulet', 'viande blanche', 'poulet introuvable', 'prix poulet', 'rayon poulet vide', 'rupture poulet', 'pénurie poulet'],
    ar: ['دجاج', 'دجاج مفقود', 'سعر الدجاج', 'نقص الدجاج', 'أزمة الدجاج', 'دجاج مرتفع السعر', 'رفع أسعار الدجاج'],
    en: ['chicken shortage', 'poultry shortage'],
    weight: 0.015,
    rriVariable: 'B24',
  },
  bread: {
    fr: ['pain', 'baguette', 'boulangerie', 'farine', 'pénurie pain', 'file pain', 'rupture pain'],
    ar: ['خبز', 'باقات', 'مخبزة', 'فرينة', 'نقص الخبز', 'طابور الخبز', 'أزمة خبز'],
    en: ['bread shortage', 'flour shortage', 'bakery crisis'],
    weight: 0.030,
    rriVariable: 'B25',
  },
  meat: {
    fr: ['viande rouge', 'prix viande', 'viande introuvable', 'agneau', 'bœuf pénurie', 'rupture viande'],
    ar: ['لحم', 'لحم غالي', 'نقص اللحوم', 'أسعار اللحوم', 'لحم مفقود', 'أزمة اللحوم', 'كيلو اللحم'],
    en: ['meat shortage', 'beef shortage'],
    weight: 0.012,
    rriVariable: 'B24',
  },
  milk: {
    fr: ['lait introuvable', 'pénurie lait', 'prix lait', 'rupture lait', 'manque lait'],
    ar: ['حليب مفقود', 'نقص الحليب', 'أسعار الحليب', 'أزمة الحليب', 'حليب غالي'],
    en: ['milk shortage'],
    weight: 0.010,
    rriVariable: 'B24',
  },
  sugar: {
    fr: ['sucre introuvable', 'pénurie sucre', 'prix sucre', 'rupture sucre', 'sucre manque', 'rayon sucre vide'],
    ar: ['سكر مفقود', 'نقص السكر', 'أسعار السكر', 'أزمة السكر', 'سكر غالي', 'طابور السكر'],
    en: ['sugar shortage'],
    weight: 0.015,
    rriVariable: 'B24',
  },
  coffee: {
    fr: ['café', 'grain de café', 'café introuvable', 'rupture café', 'pénurie café', 'prix café', 'café manque'],
    ar: ['قهوة', 'بن', 'نقص القهوة', 'فقدان القهوة', 'قهوة مفقودة', 'أسعار القهوة', 'أزمة القهوة'],
    en: ['coffee shortage'],
    weight: 0.008,
    rriVariable: 'B24',
  },
  oil: {
    fr: ['huile introuvable', 'pénurie huile', 'huile végétale', 'rupture huile', 'prix huile'],
    ar: ['زيت مفقود', 'نقص الزيت', 'أزمة الزيت', 'زيت نباتي', 'أسعار الزيت'],
    en: ['cooking oil shortage', 'oil shortage'],
    weight: 0.018,
    rriVariable: 'B24',
  },
  flour: {
    fr: ['farine introuvable', 'pénurie farine', 'semoule', 'rupture farine', 'pain pénurie'],
    ar: ['دقيق مفقود', 'نقص الدقيق', 'سميد', 'أزمة الدقيق', 'خبز نقص'],
    en: ['flour shortage', 'semolina shortage'],
    weight: 0.022,
    rriVariable: 'B24',
  },
  fuel: {
    fr: ['carburant', 'essence manque', 'station fermée', 'queue station', 'pénurie essence', 'diesel manque'],
    ar: ['وقود', 'بنزين مفقود', 'محطة مغلقة', 'طابور بنزين', 'نقص الوقود', 'أزمة الوقود'],
    en: ['fuel shortage', 'petrol shortage', 'gas station queue'],
    weight: 0.020,
    rriVariable: 'B25',
  },
  medicine: {
    fr: ['médicaments introuvables', 'pénurie médicaments', 'pharmacie rupture', 'manque médicaments'],
    ar: ['أدوية مفقودة', 'نقص الدواء', 'صيدلية', 'أزمة الدواء'],
    en: ['medicine shortage', 'drug shortage'],
    weight: 0.025,
    rriVariable: 'B24',
  }
};

export const ENERGY_SHOCK_DICTIONARY: Record<string, any> = {
  iran_conflict: {
    en: ['Iran attack', 'Iran war', 'Hormuz', 'strait closed', 'Iranian strike', 'Iran conflict', 'Middle East war'],
    fr: ['guerre Iran', 'détroit Hormuz', 'conflit Iran', 'attaque Iran'],
    ar: ['حرب إيران', 'مضيق هرمز', 'هجوم إيران', 'النزاع الإيراني'],
    estimatedLagDays: 14,
    severity: 3,
  },
  oil_price_spike: {
    en: ['oil price spike', 'crude surges', 'Brent rises', 'OPEC cuts', 'oil crisis', 'energy crisis', 'WTI spike'],
    fr: ['prix pétrole hausse', 'Brent monte', 'crise énergie', 'pétrole cher'],
    ar: ['ارتفاع أسعار النفط', 'بريت', 'أزمة طاقة', 'أوبك'],
    estimatedLagDays: 21,
    severity: 2,
  },
  steg_tariff: {
    fr: ['tarif STEG', 'hausse électricité', 'prix électricité augmente', 'STEG augmentation', 'facture électricité'],
    ar: ['تعريفة ستاغ', 'رفع أسعار الكهرباء', 'فاتورة الكهرباء', 'ستاغ رفع'],
    en: ['STEG tariff', 'electricity price increase Tunisia'],
    estimatedLagDays: 0,
    severity: 2,
  },
  subsidy_cut: {
    fr: ['subvention énergie coupée', 'fin subvention gaz', 'réforme subventions', 'prix gaz augmente'],
    ar: ['رفع الدعم', 'إلغاء دعم الطاقة', 'إصلاح الدعم', 'رفع أسعار الغاز'],
    en: ['subsidy reform Tunisia', 'fuel subsidy cut'],
    estimatedLagDays: 7,
    severity: 3,
  },
};
