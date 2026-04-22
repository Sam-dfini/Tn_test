import { useState, useEffect, useRef } from 'react';

/**
 * A hook designed to ingest a continuous stream of data items and deduplicate them based on a unique identifier.
 * Ideal for real-time applications where WebSockets, API merges, and RSS polling may yield duplicate records.
 * 
 * @param dataStream The raw incoming array of items which may contain duplicates
 * @param idExtractor A function that returns the unique identifier for an item
 * @param maxItems The maximum size of the buffer (to prevent memory leaks on endless streams)
 */
export function useDeduplicatedStream<T>(
  dataStream: T[],
  idExtractor: (item: T) => string | number,
  maxItems: number = 200
): T[] {
  // Use state to trigger deterministic re-renders efficiently
  const [deduplicatedList, setDeduplicatedList] = useState<T[]>([]);
  
  // Ref acts as memory across renders without triggering loops
  const dedupeMapRef = useRef<Map<string | number, T>>(new Map());

  // Move mutation OUT of the render phase (useMemo) and into the commit phase (useEffect)
  useEffect(() => {
    const map = dedupeMapRef.current;
    let hasChanges = false;

    dataStream.forEach((item) => {
      const id = idExtractor(item);
      if (id === undefined || id === null || id === '') return;

      // ERROR 3 FIX: If updating an existing item, delete it first to push it
      // to the END of Map's insertion order. Otherwise, frequent updates get kept at
      // the front and get deleted by the overflow buffer logic.
      if (map.has(id)) {
        if (map.get(id) !== item) {
          map.delete(id); 
          map.set(id, item);
          hasChanges = true;
        }
      } else {
        map.set(id, item);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      const values = Array.from(map.values());
      
      // Enforce buffer limits by targeting the OLDEST (front) elements
      if (values.length > maxItems) {
        const keysToDelete = Array.from(map.keys()).slice(0, values.length - maxItems);
        keysToDelete.forEach(key => map.delete(key));
        setDeduplicatedList(Array.from(map.values()));
      } else {
        setDeduplicatedList(values);
      }
    }
  }, [dataStream, idExtractor, maxItems]);

  // Clean up if unmounted to prevent memory leaks
  useEffect(() => {
    return () => dedupeMapRef.current.clear();
  }, []);

  // Guarantee we return at least the initial state correctly
  return deduplicatedList.length > 0 ? deduplicatedList : dataStream;
}
