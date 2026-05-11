/**
 * TunisiaIntel — Entity Resolution Engine
 * Extracts and maps relationships between Companies, People, and Organizations
 * derived from RSS news streams and the Investment Database.
 */

import { Article } from '../lib/supabase';

export type EntityType = 'COMPANY' | 'PERSON' | 'ORGANIZATION' | 'SECTOR';

export interface EntityNode {
  id: string;
  label: string;
  type: EntityType;
  sentiment: number;      // -1 to 1
  mentions: number;
  lastSeen: string;
  description?: string;
}

export interface EntityLink {
  source: string;
  target: string;
  type: 'PARTNERSHIP' | 'OWNERSHIP' | 'CONFLICT' | 'FUNDING' | 'CORRELATION';
  weight: number;
  evidence: string;
}

export interface EntityNetwork {
  nodes: EntityNode[];
  links: EntityLink[];
}

// ── Known Entities (Seed Database) ─────────────────────────────

const SEED_ENTITIES: EntityNode[] = [
  { id: 'utica', label: 'UTICA', type: 'ORGANIZATION', sentiment: 0.2, mentions: 0, lastSeen: '' },
  { id: 'ugtt', label: 'UGTT', type: 'ORGANIZATION', sentiment: -0.1, mentions: 0, lastSeen: '' },
  { id: 'bct', label: 'Central Bank (BCT)', type: 'ORGANIZATION', sentiment: 0.1, mentions: 0, lastSeen: '' },
  { id: 'cpg', label: 'CPG (Phosphates)', type: 'COMPANY', sentiment: -0.4, mentions: 0, lastSeen: '' },
  { id: 'steg', label: 'STEG (Energy)', type: 'COMPANY', sentiment: -0.3, mentions: 0, lastSeen: '' },
  { id: 'tap', label: 'TAP Agency', type: 'ORGANIZATION', sentiment: 0, mentions: 0, lastSeen: '' },
];

const SEED_LINKS: EntityLink[] = [
  { source: 'utica', target: 'bct', type: 'CORRELATION', weight: 0.6, evidence: 'Macroeconomic policy dialogue' },
  { source: 'ugtt', target: 'steg', type: 'CONFLICT', weight: 0.8, evidence: 'Wage negotiations and strike threats' },
  { source: 'cpg', target: 'ugtt', type: 'CONFLICT', weight: 0.9, evidence: 'Historical labor disruption nexus' },
];

// ── NLP Extraction Logic ──────────────────────────────────────

const ENTITY_KEYWORDS: Record<string, { id: string; type: EntityType }> = {
  'UTICA': { id: 'utica', type: 'ORGANIZATION' },
  'UGTT': { id: 'ugtt', type: 'ORGANIZATION' },
  'BCT': { id: 'bct', type: 'ORGANIZATION' },
  'Banque Centrale': { id: 'bct', type: 'ORGANIZATION' },
  'CPG': { id: 'cpg', type: 'COMPANY' },
  'Phosphates': { id: 'cpg', type: 'COMPANY' },
  'STEG': { id: 'steg', type: 'COMPANY' },
  'Sonede': { id: 'sonede', type: 'COMPANY' },
  'Al Karama': { id: 'alkarama', type: 'COMPANY' },
  'Groupe': { id: 'group', type: 'COMPANY' },
  'Kais Saied': { id: 'saied', type: 'PERSON' },
};

export function resolveEntitiesFromArticles(articles: Article[]): EntityNetwork {
  const nodes = [...SEED_ENTITIES];
  const links = [...SEED_LINKS];

  articles.forEach(article => {
    const text = (article.title + ' ' + (article.content || '')).toLowerCase();
    
    // Simple Keyword matching for now (Heuristic extraction)
    Object.entries(ENTITY_KEYWORDS).forEach(([kw, config]) => {
      if (text.includes(kw.toLowerCase())) {
        let node = nodes.find(n => n.id === config.id);
        if (!node) {
          node = {
            id: config.id,
            label: kw,
            type: config.type,
            sentiment: 0,
            mentions: 0,
            lastSeen: article.published_at,
          };
          nodes.push(node);
        }
        node.mentions++;
        node.lastSeen = article.published_at;

        // Sentiment estimation (very basic)
        if (text.includes('crise') || text.includes('problème') || text.includes('échec')) {
          node.sentiment -= 0.1;
        }
        if (text.includes('succès') || text.includes('croissance') || text.includes('accord')) {
          node.sentiment += 0.1;
        }
      }
    });

    // Detect co-occurrence links
    const detectedInArticle = Object.entries(ENTITY_KEYWORDS)
      .filter(([kw]) => text.includes(kw.toLowerCase()))
      .map(([, config]) => config.id);

    if (detectedInArticle.length > 1) {
      for (let i = 0; i < detectedInArticle.length; i++) {
        for (let j = i + 1; j < detectedInArticle.length; j++) {
          const source = detectedInArticle[i];
          const target = detectedInArticle[j];
          
          let link = links.find(l => (l.source === source && l.target === target) || (l.source === target && l.target === source));
          if (!link) {
            links.push({
              source,
              target,
              type: 'CORRELATION',
              weight: 0.1,
              evidence: `Co-occurrence in article: "${article.title}"`
            });
          } else {
            link.weight = Math.min(1, link.weight + 0.05);
          }
        }
      }
    }
  });

  return {
    nodes: nodes.filter(n => n.mentions > 0 || SEED_ENTITIES.some(s => s.id === n.id)),
    links: links.map(l => ({ ...l, weight: Number(l.weight.toFixed(2)) })),
  };
}
