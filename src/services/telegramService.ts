import { supabase, Article } from '../lib/supabase';
import { classifyArticle } from '../utils/classificationUtils';
import { processEvent } from './eventService';
import { pipelineDebugger } from './debugService';

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  date: number;
  text?: string;
  caption?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

export async function fetchTelegramUpdates(): Promise<Article[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not found');
    return [];
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.status}`);
    }

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Telegram API response not OK: ${JSON.stringify(data)}`);
    }

    const updates: TelegramUpdate[] = data.result;
    const articles: Article[] = [];

    for (const update of updates) {
      const msg = update.message || update.channel_post;
      if (!msg || (!msg.text && !msg.caption)) continue;

      // Filter by chatId if provided
      if (chatId && msg.chat.id.toString() !== chatId.toString()) continue;

      const text = msg.text || msg.caption || '';
      const title = text.split('\n')[0].slice(0, 100);
      const url = `https://t.me/c/${Math.abs(msg.chat.id + 1000000000000)}/${msg.message_id}`;

      // Classification
      const classification = classifyArticle(title, text, 'NEUTRAL');

      const article: Article = {
        id: `tg-${msg.message_id}`,
        fingerprint: `tg-${msg.message_id}`,
        source_id: 'telegram',
        source_name: msg.chat.title || 'Telegram Channel',
        title: title,
        url: url,
        published_at: new Date(msg.date * 1000).toISOString(),
        fetched_at: new Date().toISOString(),
        content: text,
        summary: text.slice(0, 200),
        language: 'ar', // Default for this channel request
        category: classification.category,
        severity: classification.severity as any,
        governorate: classification.governorate || 'National',
        keywords: classification.keywords,
        bias_alignment: 'NEUTRAL',
        bias_tone: classification.bias_tone,
        propaganda_score: classification.propaganda_score,
        techniques_detected: classification.techniques_detected,
        rri_nudge: classification.rri_nudge,
        rri_variable: classification.rri_variable,
        confirm_count: 0,
        dispute_count: 0,
        context_count: 0,
        processed: false,
        pipeline_pushed: false,
      };

      articles.push(article);
    }

    return articles;
  } catch (error) {
    console.error('Error fetching Telegram updates:', error);
    pipelineDebugger.log('FEED', 'error', `Telegram fetch failed: ${error}`, { error });
    return [];
  }
}

export async function syncTelegramToSupabase(articles: Article[]): Promise<number> {
  if (articles.length === 0) return 0;
  
  let newCount = 0;
  for (const article of articles) {
    try {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .eq('fingerprint', article.fingerprint)
        .maybeSingle();
      
      if (!existing) {
        const { error } = await supabase.from('articles').insert([article]);
        if (!error) {
          newCount++;
          // Also process event
          await processEvent(article);
        }
      }
    } catch (e) {
      console.error('Failed to sync telegram article', e);
    }
  }
  return newCount;
}
