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
  status?: 'healthy' | 'degraded' | 'failing' | 'paused';
}

export const RSS_SOURCES: RSSSource[] = [
  {
    id: 'african-manager',
    name: 'African Manager',
    url: 'https://africanmanager.com/feed/',
    language: 'fr',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['IMF', 'BCT', 'investment', 'economy', 'Tunisia'],
    status: 'healthy'
  }
];
