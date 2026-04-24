/**
 * RSS Sources Configuration
 */
export interface RSSSource {
  id: string;
  name: string;
  url: string;
  language: string;
  reliability: 'A' | 'B' | 'C';
  alignment: 'CRITICAL' | 'NEUTRAL' | 'PRO_GOV';
  keywords: string[];
}

export const RSS_SOURCES: RSSSource[] = [
  {
    id: 'france24',
    name: 'France 24 English',
    url: 'https://www.france24.com/en/rss',
    language: 'en',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['Tunisia', 'Tunisie', 'Saied', 'IMF'],
  },
];
