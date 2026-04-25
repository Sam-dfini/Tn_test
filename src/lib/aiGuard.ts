/**
 * Helper to check if AI services are available
 * In this app, we route through a backend proxy, so we return true 
 * to allow the call to reach the proxy which has the real keys.
 */
export function isAIAvailable(): boolean {
  return true;
}
