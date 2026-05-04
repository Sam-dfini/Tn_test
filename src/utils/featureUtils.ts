/**
 * TunisiaIntel — Feature Extraction & Keyword Utilities
 * Centralized logic for text analysis and entity detection.
 * (Recommendation 2 from Architecture Brief)
 */

export interface KeywordDictionary {
  [key: string]: {
    fr?: string[];
    ar?: string[];
    en?: string[];
    weight?: number;
    [metadata: string]: any;
  };
}

/**
 * Checks if a block of text contains any keywords from a list.
 */
export function hasMatches(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase();
  return keywords.some(kw => lowerText.includes(kw.toLowerCase()));
}

/**
 * Returns all matching types for a given text from a dictionary.
 */
export function getMatches<T extends string>(
  text: string, 
  dictionary: Record<T, { fr?: string[]; ar?: string[]; en?: string[] }>
): T[] {
  const matches: T[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [type, config] of Object.entries(dictionary) as [T, any][]) {
    const allKws = [...(config.fr || []), ...(config.ar || []), ...(config.en || [])];
    if (allKws.some((kw: string) => lowerText.includes(kw.toLowerCase()))) {
      matches.push(type);
    }
  }
  
  return matches;
}

/**
 * Detects location/governorate from text mapping.
 */
export function detectGovernorate(text: string, governorateMap: Record<string, string[]>): string | null {
  const lowerText = text.toLowerCase();
  for (const [govId, keywords] of Object.entries(governorateMap)) {
    if (keywords.some(kw => lowerText.includes(kw.toLowerCase()))) {
      return govId;
    }
  }
  return null;
}

/**
 * Common regex patterns for TunisiaIntel
 */
export const TUNISIA_PATTERNS = {
  DATE_ISO: /\d{4}-\d{2}-\d{2}/,
  CURRENCY_TND: /\d+(?:\.\d+)?\s*(?:dt|tnd|dinar)/i,
  HASHTAG: /#[\w\u0600-\u06FF]+/g,
};
