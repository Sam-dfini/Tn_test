
import { Article, supabase } from '../lib/supabase';
import { RSSSource } from '../config/rssSources';
import { pipelineDebugger } from './debugService';

const NEWSDATA_API_KEY = 'pub_33fbfaf5f962474c87e881434e96fedb';

export interface NewsDataArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source_id: string;
  image_url: string;
  content?: string;
  language?: string;
  category?: string[];
  country?: string[];
}

export async function fetchNewsData(query: string = 'Tunisia'): Promise<Article[]> {
  try {
    const url = `https://newsdata.io/api/1/news?apikey=${NEWSDATA_API_KEY}&q=${encodeURIComponent(query)}&language=en,fr,ar`;
    
    // We use the proxy to bypass CORS
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`NewsData API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(`NewsData API status: ${data.status}`);
    }

    const newsDataArticles: NewsDataArticle[] = data.results || [];
    
    // Map NewsData articles to our internal Article format
    const mappedArticles: Article[] = newsDataArticles.map(item => {
      // Calculate a rough severity based on keywords
      let severity = 1;
      const lowerTitle = item.title.toLowerCase();
      
      if (lowerTitle.includes('protest') || lowerTitle.includes('strike') || lowerTitle.includes('clash')) severity = 3;
      if (lowerTitle.includes('dead') || lowerTitle.includes('killed') || lowerTitle.includes('crisis')) severity = 4;
      if (lowerTitle.includes('revolution') || lowerTitle.includes('curfew')) severity = 5;

      return {
        id: `nd-${btoa(item.link).substring(0, 32)}`,
        fingerprint: btoa(item.link).substring(0, 32),
        source_id: item.source_id,
        source_name: item.source_id.toUpperCase(),
        title: item.title,
        url: item.link,
        published_at: item.pubDate || new Date().toISOString(),
        fetched_at: new Date().toISOString(),
        severity: severity as any,
        language: item.language || 'en',
        category: (item.category && item.category[0]) || 'GENERAL',
        ai_summary: item.description || '',
        bias_alignment: 'NEUTRAL',
        bias_tone: 'NEUTRAL',
        rri_nudge: 0,
        confirm_count: 0,
        dispute_count: 0,
        context_count: 0,
        processed: false,
        pipeline_pushed: false,
        created_at: new Date().toISOString(),
      } as any; // Cast to any to bypass minor optional differences if any
    });

    return mappedArticles;
  } catch (error) {
    console.error('Error fetching NewsData:', error);
    pipelineDebugger.log('FEED', 'error', `NewsData fetch failed: ${error}`, { error });
    return [];
  }
}

/**
 * Sync NewsData articles to Supabase
 */
export async function syncNewsDataToSupabase(articles: Article[]) {
  if (articles.length === 0) return 0;
  
  let newCount = 0;
  
  for (const article of articles) {
    try {
      // Check if already exists by URL
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('url', article.url)
        .maybeSingle();
      
      if (!existing) {
        const { error } = await supabase.from('articles').insert([article]);
        if (!error) {
          newCount++;
          // Trigger signal extraction (placeholder)
          window.dispatchEvent(new CustomEvent('supabase_op', { 
            detail: { table: 'articles', op: 'INSERT', timestamp: Date.now() } 
          }));
        }
      }
    } catch (e) {
      console.error('Failed to sync article', e);
    }
  }
  
  return newCount;
}
