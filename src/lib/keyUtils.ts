/**
 * Key Utilities for stable React lists
 */

export function assertKey(id: any, prefix = 'k'): string {
  if (id === undefined || id === null) {
    return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return `${prefix}-${String(id)}`;
}

export function getRenderKey(item: any, index: number, prefix = 'item'): string {
  if (item && item.id) return assertKey(item.id, prefix);
  return `${prefix}-idx-${index}`;
}

export function prepareList<T>(items: T[], prefix = 'list'): (T extends object ? T & { id: string } : { id: string, value: T })[] {
  if (!items || !Array.isArray(items)) return [] as any;
  const seen = new Set<string>();
  
  return items.map((item, index) => {
    let baseId: string | number;
    let val: any = item;
    
    if (item && typeof item === 'object') {
      baseId = (item as any).id || (item as any).articleId || (item as any).event_id || index;
    } else {
      baseId = String(item) || index;
    }
    
    let finalId = assertKey(baseId, prefix);
    
    // Ensure uniqueness within this specific map operation
    if (seen.has(finalId)) {
      finalId = `${finalId}-${index}`;
    }
    seen.add(finalId);
    
    if (item && typeof item === 'object') {
      const originalId = (item as any).id || (item as any).articleId || (item as any).event_id;
      return {
        ...item,
        id: originalId || finalId,
        renderId: finalId
      } as any;
    } else {
      return {
        id: finalId,
        renderId: finalId,
        value: item
      } as any;
    }
  });
}

// Backwards compatibility aliases and helpers for various components

export function generateStableKey(prefix: string, item: any, index: number): string {
  return getRenderKey(item, index, prefix);
}

export function getUniqueKey(prefix: string, id: any): string {
  return assertKey(id, prefix);
}

export function assertUnique(keys: Set<string>, key: string): string {
  let finalKey = key;
  let counter = 1;
  while (keys.has(finalKey)) {
    finalKey = `${key}-${counter}`;
    counter++;
  }
  keys.add(finalKey);
  return finalKey;
}

export function generateStableId(item: any, prefix = 'id'): string {
  if (item && item.id) return `${prefix}-${item.id}`;
  if (item && item.fingerprint) return `${prefix}-${item.fingerprint}`;
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

export function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
