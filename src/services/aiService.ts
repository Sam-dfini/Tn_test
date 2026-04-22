/**
 * aiService.ts
 * Refactored to use the backend proxy for AI calls.
 * This avoids client-side RPC errors and keeps API keys secure.
 */

import { AI_ENABLED } from '../config/ai';

export async function callAI(
  params: { system: string; user: string } | string,
  config?: { maxTokens?: number; responseMimeType?: string; retries?: number; model?: string }
): Promise<string> {
  if (!AI_ENABLED) {
    throw new Error("AI Service is currently disabled in system configuration.");
  }

  const maxRetries = config?.retries ?? 3;
  let attempt = 0;

  const systemInstruction = typeof params === 'object' ? params.system : "You are a helpful assistant.";
  const userPrompt = typeof params === 'object' ? params.user : params;

  // Combine system and user if needed, or pass separately if backend supports it
  // Our backend /api/ai expects { prompt, config }
  const fullPrompt = typeof params === 'object' 
    ? `[SYSTEM INSTRUCTION]\n${params.system}\n\n[USER PROMPT]\n${params.user}` 
    : params;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          config: {
            model: config?.model || 'gemini-1.5-flash',
            responseMimeType: config?.responseMimeType || 'text/plain',
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `AI Proxy Error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error: any) {
      console.error(`AI Call Attempt ${attempt + 1} Failed:`, error);
      
      const isRetryable = error?.message?.includes('429') || 
                          error?.message?.includes('Rate Limit') ||
                          error?.message?.includes('Timeout');

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error("AI Service Call Failed after maximum retries.");
}

/**
 * Utility to safely extract and parse JSON from AI markdown responses.
 */
export function parseAIJSON(text: string): any {
  try {
    const cleaned = text.trim().replace(/^```json\n?|\n?```$/g, "");
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerE) {
        console.error("AI Response parsing failed. Raw response:", text);
        throw new Error("Failed to parse extracted JSON");
      }
    }
    console.error("AI Response parsing failed. Raw response:", text);
    throw new Error("No valid JSON found in response");
  }
}
