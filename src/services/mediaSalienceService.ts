import { Article } from '../lib/supabase';

const CONFLICT_KEYWORDS = [
  'war', 'strike', 'strikes', 'attack', 'missile', 'bomb', 'explosion',
  'military', 'troops', 'invasion', 'conflict', 'violence', 'casualty',
  'lebanon', 'hezbollah', 'gaza', 'hamas', 'israel', 'palestine',
  'iran', 'yemen', 'houthi', 'ukraine', 'russia', 'syria',
  'libya', 'sahel', 'terrorist', 'insurgent', 'rebel',
  'sanctions', 'warfare', 'escalation', 'ceasefire', 'truce',
];

export function computeMediaSalience(articles: Article[], lookbackHours = 72): number {
  if (!articles || articles.length === 0) return 0;

  const cutoff = Date.now() - lookbackHours * 60 * 60 * 1000;
  const recentArticles = articles.filter(a =>
    a.published_at && new Date(a.published_at).getTime() > cutoff
  );

  if (recentArticles.length === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;
  const matchedTitles = new Set<string>();

  for (const article of recentArticles) {
    const text = [article.title, article.summary, article.content]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchCount = CONFLICT_KEYWORDS.filter(kw => text.includes(kw)).length;

    if (matchCount > 0) {
      const severity = article.severity || 1;
      const score = Math.min(1, matchCount / 5) * (severity / 5);
      const textLength = text.length;
      const weight = Math.min(1, textLength / 500);

      totalScore += score * weight;
      totalWeight += weight;
      matchedTitles.add(article.title);
    }
  }

  if (totalWeight === 0) return 0;

  const rawScore = totalScore / totalWeight;
  const diversityFactor = Math.min(1, matchedTitles.size / 10);

  // Combine intensity with diversity of sources covering the conflict
  return Math.min(0.95, rawScore * (0.6 + 0.4 * diversityFactor));
}
