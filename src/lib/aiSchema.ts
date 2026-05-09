/**
 * Zod Schema Validation for TunisiaIntel AI Responses
 * Hardens the intelligence synthesis pipeline with structural integrity checks.
 */

import { z } from 'zod';

/**
 * Schema for AI Analysis responses.
 */
export const AIAnalysisSchema = z.object({
  summary: z.string().min(10, "Summary must be at least 10 characters."),
  keyDrivers: z.array(z.string()).min(1, "At least one key driver is required."),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  outlook: z.string().min(10, "Outlook must be at least 10 characters."),
  recommendations: z.array(z.string()),
  rt: z.number().min(0).max(5, "R(t) must be between 0 and 5."),
  pRev: z.number().min(0).max(1, "P_rev must be a probability between 0 and 1."),
  variableUpdates: z.array(z.object({
    variable: z.string(),
    oldValue: z.union([z.number(), z.string()]),
    newValue: z.union([z.number(), z.string()]),
    reason: z.string(),
  })).optional(),
  timestamp: z.number().optional(),
});

/**
 * Schema for Forecast responses.
 */
export const ForecastSchema = z.object({
  trajectory: z.array(z.object({
    day: z.number().int().positive(),
    predictedRRI: z.number().min(0).max(5),
    predictedPRev: z.number().min(0).max(1),
  })),
  precursorSignals: z.array(z.string()),
  cascadeProbability: z.number().min(0).max(1),
  timeToCascadeDays: z.number().int().nonnegative().nullable(),
  narrative: z.string().min(10),
  timestamp: z.number().optional(),
});

/**
 * Validates and parses an AI analysis response.
 * @throws {z.ZodError} If validation fails.
 */
export function validateAIAnalysis(data: unknown) {
  return AIAnalysisSchema.parse(data);
}

/**
 * Safe version of validateAIAnalysis that returns null on failure.
 */
export function safeValidateAIAnalysis(data: unknown) {
  try {
    return AIAnalysisSchema.parse(data);
  } catch (e) {
    console.warn("AI Analysis validation failed:", e);
    return null;
  }
}

/**
 * Validates and parses a Forecast response.
 * @throws {z.ZodError} If validation fails.
 */
export function validateForecast(data: unknown) {
  return ForecastSchema.parse(data);
}

/**
 * Safe version of validateForecast that returns null on failure.
 */
export function safeValidateForecast(data: unknown) {
  try {
    return ForecastSchema.parse(data);
  } catch (e) {
    console.warn("Forecast validation failed:", e);
    return null;
  }
}
