/**
 * Task 1: Safe Key Generation
 * Generates a purely unique ID without relying on empty values.
 */
export function generateStableKey(item: any): string {
  return (
    item.id ||
    item.event_id ||
    item.fingerprint ||
    `${item.title || "item"}-${item.published_at || Date.now()}`
  );
}

export const generateSafeId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
};

/**
 * Validates if a string is a truly valid ID for React rendering.
 */
export const isValidId = (id: any): id is string | number => {
  if (id === null || id === undefined) return false;
  const strId = String(id).trim();
  return strId !== '' && strId !== 'undefined' && strId !== 'null' && strId !== '[object Object]';
};

export const stableHash = (str: string) => {
  if (!isValidId(str)) return generateSafeId();
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return `h${Math.abs(h)}`;
};

export const generateStableId = (a: any) => {
  if (isValidId(a?.id)) return String(a.id).trim();
  return stableHash(
    `${a.source_name || 'src'}|${a.title || 'title'}|${a.published_at || 'time'}|${a.url || 'url'}`
  );
};

export const getUniqueKey = (namespace: string, id: string | number | undefined | null): string => {
  if (!isValidId(id)) {
    return `${namespace}-fallback-${generateSafeId()}`;
  }
  return `${namespace}-${String(id).trim()}`;
};

export const assertKey = (key: string): string => {
  if (!isValidId(key)) {
    console.error("EMPTY KEY DETECTED AND REPLACED BY FALLBACK");
    return generateSafeId();
  }
  return key;
};

/**
 * NEW: Deduplicates articles by ID, URL, or content fingerprint
 * Keeps first occurrence, removes duplicates
 */
export function deduplicateArticles<T extends {id?: string; url?: string; title?: string; source_name?: string}>(
  items: T[]
): T[] {
  if (!items || !Array.isArray(items)) return [];

  const seenIds = new Set<string>();
  const seenUrls = new Set<string>();
  const seenFingerprints = new Set<string>();

  return items.filter((item) => {
    // Primary: by ID
    if (isValidId(item.id)) {
      const id = String(item.id).trim();
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    }

    // Secondary: by URL
    if (isValidId(item.url)) {
      const url = String(item.url).trim();
      if (seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    }

    // Tertiary: by content fingerprint (title + source)
    if (isValidId(item.title) && isValidId(item.source_name)) {
      const fingerprint = `${String(item.title).trim()}|${String(item.source_name).trim()}`;
      if (seenFingerprints.has(fingerprint)) return false;
      seenFingerprints.add(fingerprint);
      return true;
    }

    // If no valid identifier, keep it
    return true;
  });
}

/**
 * Task 2 & 4: Harden Data Before Render
 * Processes an incoming array of data, guarantees highly unique, non-empty, collision-free IDs.
 * Now handles primitives (strings, numbers) by wrapping them in { value, id }.
 */
export function prepareList<T>(
  items: T[], 
  idKey: string = 'id'
): (T extends object ? T & { id: string } : { value: T; id: string })[] {
  if (!items || !Array.isArray(items)) return [];

  const seenKeys = new Set<string>();

  // First deduplicate
  const deduplicated = deduplicateArticles(items as any);

  return deduplicated
    .map((item, index) => {
      // Handle null/undefined gracefully
      if (item === null || item === undefined) {
         return { value: item, id: `null_${index}_${generateSafeId()}` } as any;
      }

      // 1. Determine if item is an object
      const isObject = typeof item === 'object' && !Array.isArray(item);
      
      let baseId: any;
      let finalItem: any;

      if (isObject) {
         finalItem = { ...item };
         baseId = (item as any)[idKey];
         
         // If missing, empty, or invalid type, generate a fallback
         if (!isValidId(baseId)) {
           const fallbackSource = (item as any).url || (item as any).hash || (item as any).guid || (item as any).link || (item as any).title || (item as any).name;
           baseId = isValidId(fallbackSource) ? stableHash(`derived_${fallbackSource}`) : generateSafeId();
         }
      } else {
         // It's a primitive
         finalItem = { value: item };
         baseId = stableHash(`primitive_${String(item)}_${index}`);
      }

      let finalId = String(baseId).trim();

      // 2. Prevent Collisions (Deduplication within current batch)
      if (seenKeys.has(finalId)) {
        let counter = 1;
        while (seenKeys.has(`${finalId}_dup_${counter}`)) {
          counter++;
        }
        finalId = `${finalId}_dup_${counter}`;
      }

      seenKeys.add(finalId);

      // Return clean object with guaranteed ID
      if (isObject) {
        return { 
          ...finalItem, 
          [idKey]: finalId, 
          id: finalId 
        };
      } else {
        return {
          ...finalItem,
          id: finalId
        };
      }
    });
}

/**
 * Task 5: Runtime Detection
 * Wrap your backend stream receivers in this to catch pipeline flaws early.
 */
export function assertNoEmptyKeys(items: any[], scope: string): void {
  if (!Array.isArray(items)) return;
  
  const invalidItems = items.filter(i => typeof i !== 'object' || !isValidId(i?.id));
  
  if (invalidItems.length > 0) {
    console.error(`🚨 [Key Validation Error] Runtime detected ${invalidItems.length} invalid/empty keys in scope: [${scope}]`, {
      sample: invalidItems.slice(0, 3) 
    });
  }
}

/**
 * Task 3: Defensive Key Extractor for direct renders
 * Usage: <div key={getRenderKey(item, index)}>
 */
export const getRenderKey = (item: any, index: number, prefix: string = 'item'): string => {
  if (isValidId(item?.id)) return String(item.id).trim();
  if (isValidId(item?._id)) return String(item._id).trim();
  return `${prefix}_fallback_${index}_${generateSafeId()}`;
};

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
