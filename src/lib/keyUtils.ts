/**
 * Centralized key generation and validation strategy.
 * Prevents key collision by namespacing entities.
 */

export const getUniqueKey = (namespace: string, id: string | number): string => {
  return `${namespace}-${id}`;
};

/**
 * Utility to assert uniqueness of a list of items based on ID before render.
 */
export function assertUnique<T extends { id: any }>(list: T[], label: string) {
  if (process.env.NODE_ENV !== 'production') {
    const seen = new Set();
    for (const item of list) {
      if (seen.has(item.id)) {
        console.error(`[KeyDebug] DUPLICATE DETECTED in ${label}:`, item.id);
      }
      seen.add(item.id);
    }
  }
}

/**
 * Pre-processes a list: deduplicates by ID and sorts by publication date (if available).
 */
export function prepareList<T extends { id: any; pubDate?: number }>(
  list: T[]
): T[] {
  const map = new Map<any, T>();
  list.forEach((item) => {
    // Keep the latest version if duplicate ID appears in stream
    map.set(item.id, item);
  });

  const sortedList = Array.from(map.values());
  if (sortedList[0]?.pubDate) {
    sortedList.sort((a, b) => (b.pubDate ?? 0) - (a.pubDate ?? 0));
  }
  return sortedList;
}
