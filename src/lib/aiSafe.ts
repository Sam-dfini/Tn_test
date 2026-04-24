import { AI_ENABLED } from "../config/ai";

export async function safeAI<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!AI_ENABLED) return fallback;

  try {
    const result = await fn();

    // protect against empty / invalid responses
    if (result === null || result === undefined) {
      return fallback;
    }

    return result;
  } catch (err) {
    console.warn("[AI DISABLED / FAILED]", err);
    return fallback;
  }
}
