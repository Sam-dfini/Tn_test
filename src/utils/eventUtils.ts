/**
 * eventUtils.ts
 * Reliable event normalization, deduplication and identity management.
 */

import { logPipelineError } from './logger';

export const DEBUG_EVENTS = true;

export interface IntelligenceEvent {
  id: string;
  title: string;
  source: string;
  date: string; // ISO
  description: string;
  location: string | null;
  [key: string]: any; 
}

/**
 * Generates a purely deterministic ID based only on title and source.
 * NO timestamps, NO random components.
 */
export function generateEventId(event: { title?: string; source?: string }): string {
  let t = (event.title || "").trim().toLowerCase();
  const s = (event.source || "unknown").trim().toLowerCase();
  
  if (!t) {
    // If title is missing, fallback to using a portion of the source and a timestamp/random
    // but try to stay deterministic if possible.
    t = "untitled-intel-" + Math.random().toString(36).substring(7);
  }

  const base = `${t}|${s}`;
  
  // Dual-hash for 64-bit collision space
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  
  for (let i = 0; i < base.length; i++) {
    const ch = base.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822519) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489917);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822519) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489917);
  
  const idValue = `${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
  return idValue ? `art_${idValue}` : `art_fallback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Normalizes raw data into a Canonical Event record.
 * Rejects any event that cannot generate a valid ID.
 */
export function normalizeEvent(raw: any, sourceTag = "unknown"): IntelligenceEvent | null {
  if (!raw) return null;

  const title = (raw.title || raw.content || raw.summary || "").trim();
  const source = (raw.source || sourceTag).trim();

  // CONTRACT: ID must be generated BEFORE returning
  const id = generateEventId({ title, source });

  if (!id || typeof id !== "string" || id.length === 0) {
    logPipelineError(new Error(`Event rejected - invalid ID generation: ${title.slice(0, 50)}`));
    return null;
  }

  // Handle Date
  const dateStr = raw.date || raw.timestamp || raw.time || new Date().toISOString();
  let dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) dateObj = new Date();

  return {
    ...raw,
    id,
    title,
    source,
    date: dateObj.toISOString(),
    description: raw.description || raw.summary || raw.content || "",
    location: raw.location || raw.gov || raw.governorate || null,
  };
}

/**
 * Deduplicates and validates a batch of events.
 */
export function cleanEvents(rawEvents: any[], sourceTag = "unknown"): IntelligenceEvent[] {
  const uniqueMap = new Map<string, IntelligenceEvent>();
  
  if (DEBUG_EVENTS) {
    console.group(`[PIPELINE] cleanEvents: ${sourceTag}`);
    console.log("Input count:", rawEvents?.length || 0);
  }

  const items = Array.isArray(rawEvents) ? rawEvents : [];

  for (const raw of items) {
    const event = normalizeEvent(raw, sourceTag);
    if (!event || !event.id) continue;

    // Deduplication strategy: First one wins in this batch
    if (!uniqueMap.has(event.id)) {
      uniqueMap.set(event.id, event);
    } else if (DEBUG_EVENTS) {
       // Optional: log collisions
    }
  }

  const result = Array.from(uniqueMap.values());

  if (DEBUG_EVENTS) {
    console.log("Output count:", result.length);
    console.groupEnd();
  }

  return result;
}

export const deduplicateEvents = cleanEvents;

export function filterEventsByTimeframe(events: IntelligenceEvent[], timeframe = "7d") {
  const now = new Date().getTime();
  const timeframeMap: Record<string, number> = { "24h": 1, "7d": 7, "30d": 30 };
  const days = timeframeMap[timeframe] || 7;

  return events.filter(e => {
    if (!e || !e.date) return false;
    const diff = (now - new Date(e.date).getTime()) / 86400000;
    return diff <= days;
  });
}
