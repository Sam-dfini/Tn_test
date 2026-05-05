/**
 * idUtils.ts
 * Unified Identity Generation for both frontend (React keys) and backend (entities).
 */

/**
 * Returns a fast, deterministic hash from a string.
 */
export function stableHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString();
}

/**
 * Generates a purely deterministic ID based on object attributes.
 * Typically used for deduplicating incoming events from disjoint feeds.
 */
export function generateDeterministicId(attributes: { [key: string]: any }): string {
  const base = Object.values(attributes)
    .filter(Boolean)
    .map(v => String(v).trim().toLowerCase())
    .join('|');

  if (!base) {
    return "anon-" + Math.random().toString(36).substring(2, 9);
  }

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

  const h1_str = (h1 >>> 0).toString(16).padStart(8, '0');
  const h2_str = (h2 >>> 0).toString(16).padStart(8, '0');
  const combined = (h1_str + h2_str).padEnd(32, '0');

  // Format as UUID
  return [
    combined.slice(0, 8),
    combined.slice(8, 12),
    '4' + combined.slice(13, 16),
    'a' + combined.slice(17, 20),
    combined.slice(20, 32)
  ].join('-');
}

/**
 * Ensures a valid ID string. Appends an index or prefix if needed.
 */
export function assertKey(id: any, prefix = 'k'): string {
  if (id === undefined || id === null) {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return `${prefix}-${String(id)}`;
}

export function generateRandomId(prefix: string = 'id'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generates a purely deterministic ID based only on title and source.
 * NO timestamps, NO random components.
 */
export function generateEventId(event: { title?: string; source?: string }): string {
  return generateDeterministicId({ title: event.title, source: event.source });
}

export function generateStableId(item: any): string {
    return generateStableKey(item);
}

export function getUniqueKey(prefix: string, item: any): string {
    return assertKey(item, prefix);
}
export function generateStableKey(item: any, index?: number, prefix: string = 'item'): string {
  if (item && item.id) return assertKey(item.id, prefix);
  
  if (index !== undefined) return `${prefix}-idx-${index}`;
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getRenderKey(item: any, index: number, prefix: string = 'item'): string {
  return generateStableKey(item, index, prefix);
}

/**
 * Takes an array of mixed elements and ensures they are objects with valid `id` properties.
 */
export function prepareList<T>(items: T[], prefix = 'list'): (T extends object ? T & { id: string } : T)[] {
  if (!items || !Array.isArray(items)) return [] as any;
  const seen = new Set<string>();

  return items.map((item, index) => {
    let baseId: string | number;
    let finalId: string;

    if (item && typeof item === 'object') {
      const existingId = (item as any).id || (item as any).articleId || (item as any).event_id;
      baseId = existingId !== undefined ? existingId : index;
      
      // If it already has a valid string ID, try to preserve it
      if (existingId !== undefined && typeof existingId === 'string' && existingId.length > 0) {
        finalId = existingId;
      } else {
        finalId = assertKey(baseId, prefix);
      }

      // Prevent duplicates within the mapped list
      if (seen.has(finalId)) {
        finalId = `${finalId}-${index}`;
      }
      seen.add(finalId);

      return { ...item, id: finalId } as any;
    } else {
      // Return primitives unwrapped
      return item as any;
    }
  });
}
