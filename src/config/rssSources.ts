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
  {
    id: 'tap-en',
    name: 'TAP News Agency',
    url: 'https://www.tap.info.tn/en/rss_en.xml',
    language: 'en',
    reliability: 'A',
    alignment: 'PRO_GOV',
    keywords: ['Tunisia', 'News'],
  },
  {
    id: 'mosaique-fr',
    name: 'Mosaique FM',
    url: 'https://www.mosaiquefm.net/fr/rss',
    language: 'fr',
    reliability: 'B',
    alignment: 'NEUTRAL',
    keywords: ['Tunisie', 'Mosaique'],
  },
  {
    id: 'business-news-fr',
    name: 'Business News',
    url: 'https://www.businessnews.com.tn/rss',
    language: 'fr',
    reliability: 'B',
    alignment: 'CRITICAL',
    keywords: ['Tunisie', 'Saied', 'Economie'],
  }
];
