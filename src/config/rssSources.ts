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
    id: 'google-news-tunisia',
    name: 'Google News Tunisia',
    url: 'https://news.google.com/rss/search?q=tunisia&hl=en-US&gl=US&ceid=US:en',
    language: 'en',
    reliability: 'A',
    alignment: 'NEUTRAL',
    keywords: ['Tunisia', 'Tunisie', 'Economy', 'Politics'],
    status: 'healthy'
  }
];
