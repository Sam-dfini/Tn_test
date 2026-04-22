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
  const t = (event.title || "").trim().toLowerCase();
  const s = (event.source || "unknown").trim().toLowerCase();
  if (!t) return "";

  const name = `${t}|${s}`;
  
  // Standard UUIDv5 Implementation (matching Python's uuid.uuid5)
  // Namespace DNS: 6ba7b810-9dad-11d1-80b4-00c04fd430c8
  const NAMESPACE_DNS_BYTES = new Uint8Array([
    0x6b, 0xa7, 0xb8, 0x10, 0x9d, 0xad, 0x11, 0xd1, 
    0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8
  ]);

  // Minimal SHA-1 implementation for deterministic ID generation
  function sha1(bytes: Uint8Array): Uint8Array {
    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;
    const len = bytes.length;
    const totalLen = len * 8;
    const padding = new Uint8Array(64 * Math.ceil((len + 9) / 64));
    padding.set(bytes);
    padding[len] = 0x80;
    const view = new DataView(padding.buffer);
    view.setUint32(padding.length - 4, totalLen);

    for (let i = 0; i < padding.length; i += 64) {
      const w = new Uint32Array(80);
      for (let j = 0; j < 16; j++) w[j] = view.getUint32(i + j * 4);
      for (let j = 16; j < 80; j++) {
        const val = w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16];
        w[j] = (val << 1) | (val >>> 31);
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4;
      for (let j = 0; j < 80; j++) {
        let f, k;
        if (j < 20) { f = (b & c) | ((~b) & d); k = 0x5A827999; }
        else if (j < 40) { f = b ^ c ^ d; k = 0x6ED9EBA1; }
        else if (j < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8F1BBCDC; }
        else { f = b ^ c ^ d; k = 0xCA62C1D6; }
        const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) >>> 0;
        e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = temp;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
    }
    const res = new Uint8Array(20);
    const resView = new DataView(res.buffer);
    resView.setUint32(0, h0); resView.setUint32(4, h1); resView.setUint32(8, h2); resView.setUint32(12, h3); resView.setUint32(16, h4);
    return res;
  }

  const nameBytes = new TextEncoder().encode(name);
  const combined = new Uint8Array(NAMESPACE_DNS_BYTES.length + nameBytes.length);
  combined.set(NAMESPACE_DNS_BYTES);
  combined.set(nameBytes, NAMESPACE_DNS_BYTES.length);
  
  const hash = sha1(combined);
  // Set version to 5 (bits 4-7 of byte 6)
  hash[6] = (hash[6] & 0x0f) | 0x50;
  // Set variant to RFC 4122 (bits 6-7 of byte 8)
  hash[8] = (hash[8] & 0x3f) | 0x80;

  const hexLines = Array.from(hash.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hexLines.slice(0, 8)}-${hexLines.slice(8, 12)}-${hexLines.slice(12, 16)}-${hexLines.slice(16, 20)}-${hexLines.slice(20, 32)}`;
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
