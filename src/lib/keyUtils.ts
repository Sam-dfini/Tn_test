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
      return {
        ...item,
        id: finalId
      } as any;
    } else {
      return {
        id: finalId,
        value: item
      } as any;
    }
  });
}
