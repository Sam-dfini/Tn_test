import { supabase, Article, Event } from '../lib/supabase';
import { calculateEventPriority } from './priorityEngine';
import { pipelineDebugger } from './debugService';
import { logger } from '../utils/logger.js';

export async function processEvent(article: Article): Promise<string | null> {
  const dateStr = article.published_at.split('T')[0];
  const category = article.category || 'general';
  const govKey = (article.governorate || 'national').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const eventKey = `${category}-${govKey}-${dateStr}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .eq('event_key', eventKey)
        .maybeSingle();

      if (fetchError) return null;

      let eventId: string;
      let finalEvent: Event;

      if (existingEvent) {
        eventId = existingEvent.id;
        finalEvent = existingEvent as Event;
      } else {
        const newEvent = {
          event_key: eventKey,
          title: article.title.slice(0, 100),
          description: article.summary || article.title,
          category: category,
          governorate: article.governorate,
          severity: article.severity,
          status: 'emerging',
          article_count: 0,
          priority_score: 0,
          velocity_score: 0,
          is_critical: false,
          trend: 'stable',
          pro_gov_count: 0,
          neutral_count: 0,
          critical_count: 0,
          alarmist_count: 0,
          minimizing_count: 0,
        };

        const { data: createdEvent, error: createError } = await supabase
          .from('events')
          .insert(newEvent)
          .select()
          .single();

        if (createError) {
          if (createError.code === '23505' && attempt < 2) continue;
          return null;
        }
        eventId = createdEvent.id;
        finalEvent = createdEvent as Event;
      }

      // Fetch all articles for this event to calculate priority
      const { data: eventArticles } = await supabase
        .from('articles')
        .select('*')
        .eq('event_id', eventId);

      const allArticles = eventArticles || [];
      if (!allArticles.some(a => a.id === article.id)) {
        allArticles.push(article);
      }

      const priority = calculateEventPriority(finalEvent, allArticles);

      const updates: Partial<Event> = {
        article_count: allArticles.length,
        severity: Math.max(finalEvent.severity || 1, article.severity),
        pro_gov_count: allArticles.filter(a => a.bias_alignment === 'PRO_GOV').length,
        neutral_count: allArticles.filter(a => a.bias_alignment === 'NEUTRAL').length,
        critical_count: allArticles.filter(a => a.bias_alignment === 'CRITICAL').length,
        alarmist_count: allArticles.filter(a => a.bias_tone === 'ALARMIST').length,
        minimizing_count: allArticles.filter(a => a.bias_tone === 'MINIMIZING').length,
        priority_score: priority.score,
        velocity_score: priority.velocity,
        status: priority.status as any,
        is_critical: priority.isCritical,
        trend: priority.trend,
        last_updated: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('events')
        .update(updates)
        .eq('id', eventId);
      
      if (updateError) {
        pipelineDebugger.log('PIPELINE', 'error', `Event update failed: ${updateError.message}`, { eventId, updates });
        throw updateError;
      }
      
      pipelineDebugger.log('EVENTS', 'valid', `Event processed: ${finalEvent.title}`, { ...finalEvent, ...updates });
      const { count: eventCount } = await supabase.from('events').select('*', { count: 'exact', head: true });
      logger.log({ stage: "EVENT", level: "INFO", message: `Event lifecycle updated: ${finalEvent.id.slice(0, 8)}`, traceId: finalEvent.event_key });
      
      if (typeof window !== 'undefined') {
        const count = eventCount || 0;
        window.dispatchEvent(new CustomEvent('pipeline_metric_update', { 
          detail: { eventCount: count, signalCount: count * 2.5 }
        }));
      }

      return eventId;
    } catch (err) {
      if (attempt < 2) continue;
      return null;
    }
  }
  return null;
}
