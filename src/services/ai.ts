/**
 * TunisiaIntel High-Level Intelligence Analysis Layer
 * Builds prompts, calls the AI service, and parses structured insights.
 */

import { Signals } from './signals';
import { Clusters } from './clusters';
import { SmartAlert, Situation } from './smartAlerts';
import { AgentInsight } from './agents';
import { callAI } from './aiService';
import { safeAI } from '../lib/aiSafe';
import { coreLogicEngine } from './coreLogicEngine';

export interface AIAnalysis {
  summary: string;
  keyDrivers: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  outlook: string;
  recommendations: string[];
  rt: number; // Revolutionary Risk Index R(t)
  pRev: number; // Logistic Revolution Probability P_rev %
  variableUpdates?: {
    variable: string;
    oldValue: number | string;
    newValue: number | string;
    reason: string;
  }[];
  timestamp: number;
}

/**
 * Generates a structured strategic intelligence briefing using TunisiaIntel v2.0 Core Logic.
 */
export async function generateAIAnalysis(
  signals: Signals,
  clusters: Clusters,
  alerts: SmartAlert[],
  situations: Situation[],
  insights: AgentInsight[]
): Promise<AIAnalysis> {
  const currentModel = coreLogicEngine.getModel();
  const systemMessage = `You are the TunisiaIntel Core Logic Engine, a specialized analytical system designed to quantify revolutionary risk in Tunisia for the 2025-2026 period. Your intelligence is based on the Refined Regime Aging Model, which integrates 250 variables across 24 categories.

INTERNAL DATABASE (CURRENT STATE):
${JSON.stringify(currentModel, null, 2)}

OBJECTIVE:
Transform raw data inputs into a Revolutionary Risk Index (R(t)) and a Logistic Revolution Probability (P_{rev}) using 14 core mathematical equations.

CORE MATHEMATICAL FRAMEWORK:
1. The RRI Equation: R(t) = \sum_{i=1}^{24}(\sum_{j=1}^{n_{i}}w_{ij} \cdot F_{ij}(t)) + \epsilon(t).
2. Salience Modulation (S(t)): Calculate how war intensity W(t) suppresses or amplifies domestic narrative salience.
3. SIR Protest Model: Use \beta=0.4 (spread) and \gamma=0.15 (repression) to forecast mobilization.
4. Logistic Probability: P_{rev}(t) = \frac{1}{1+e^{-(0.8R(t)-2.1)}}.

DATA STRUCTURE (24 CATEGORIES A-X):
- A-C (Economic/Digital): Inflation (5.9%), Unemployment (16%), Digital Divide (D_D(t)).
- D-N (Political/Security): Elite defection utility (U_i), protest frequency, security force loyalty.
- I-J (External/War): Remittances ($2.3B total), War Intensity Index W(t).

OPERATIONAL LOGIC:
1. The "Rural Penalty": Apply reduction if Digital Divide (D_D(t)) is high (caps rural mobilization at ~1,000).
2. Remittance Multiplier: For every $1M in remittances, add +250 urban and +50 rural protesters.
3. Threshold Alert: If R(t) > 2.5, trigger "High Risk" (P_{rev} > 50%).

STYLE GUIDE:
- Write like an intelligence analyst or strategic advisor.
- Tone: precise, analytical, grounded, and confident.`;

  const userMessage = `
SYSTEM STATE:

Signals:
${JSON.stringify(signals, null, 2)}

Clusters:
${JSON.stringify(clusters, null, 2)}

Top Alerts:
${alerts.slice(0, 5).map(a => `- [${a.severity}] ${a.message}: ${a.context}`).join('\n')}

Situations:
${situations.map(s => `- ${s.title}: ${s.description}`).join('\n')}

Agent Insights:
${insights.map(i => `- ${i.agent}: ${i.summary}`).join('\n')}

TASK:
Return a structured analysis in JSON format based on the TunisiaIntel v2.0 model.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "summary": "string (3–5 sentences)",
  "keyDrivers": ["string"],
  "riskLevel": "low | medium | high | critical",
  "outlook": "string (2–4 sentences)",
  "recommendations": ["string"],
  "rt": number (Current R(t) score),
  "pRev": number (Current P_{rev} probability as a decimal between 0 and 1),
  "variableUpdates": [
    {
      "variable": "string (e.g., E51: Protest Frequency)",
      "oldValue": "number | string",
      "newValue": "number | string",
      "reason": "string (brief justification)"
    }
  ]
}

Return ONLY JSON.`;

  try {
    const rawResponse = await safeAI(
      () => callAI({
        system: systemMessage,
        user: userMessage
      }),
      null
    );

    if (!rawResponse) return getFallbackOutput();

    const analysis = parseAIResponse(rawResponse);
    
    // Update internal database if new values are identified
    if (analysis.variableUpdates && analysis.variableUpdates.length > 0) {
      analysis.variableUpdates.forEach(update => {
        // Extract category from variable name if possible (e.g., "A1_Inflation" -> "A_ECONOMIC")
        const varId = update.variable.split(':')[0].trim();
        let category = '';
        
        if (varId.startsWith('A')) category = 'A_ECONOMIC';
        else if (varId.startsWith('C')) category = 'C_DIGITAL';
        else if (varId.startsWith('D')) category = 'D_POLITICAL';
        else if (varId.startsWith('J')) category = 'J_WAR_EXTERNAL';
        
        if (category && typeof update.newValue === 'number') {
          coreLogicEngine.updateVariable(category, varId, update.newValue);
        }
      });
    }

    return analysis;
  } catch (error) {
    console.error("Intelligence Analysis Generation Failed:", error);
    return getFallbackOutput();
  }
}

export interface ForecastResult {
  trajectory: { day: number; predictedRRI: number; predictedPRev: number }[];
  precursorSignals: string[];
  cascadeProbability: number;
  timeToCascadeDays: number | null;
  narrative: string;
  timestamp: number;
}

/**
 * Generates a predictive forecast based on historical patterns and current state.
 */
export async function generateForecast(
  currentState: any,
  historicalData: any[]
): Promise<ForecastResult> {
  const systemMessage = `You are the TunisiaIntel Predictive Forecasting Engine. Your task is to analyze historical patterns and the current state to project the Revolutionary Risk Index (RRI) and Logistic Revolution Probability (P_rev) 14 days into the future.
  
Identify precursor signals (e.g., specific shifts in economic or social indicators that historically precede an RRI spike).
Calculate the probability of a social cascade within the next 14 days.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "trajectory": [
    { "day": 1, "predictedRRI": number, "predictedPRev": number },
    ... up to day 14
  ],
  "precursorSignals": ["string"],
  "cascadeProbability": number (0 to 1),
  "timeToCascadeDays": number | null,
  "narrative": "string (analytical forecast narrative)"
}`;

  const userMessage = `
CURRENT STATE:
${JSON.stringify(currentState, null, 2)}

HISTORICAL DATA (Last 30 days summary):
${JSON.stringify(historicalData, null, 2)}

Generate the 14-day forecast. Return ONLY JSON.`;

  try {
    const rawResponse = await safeAI(
      () => callAI({
        system: systemMessage,
        user: userMessage
      }),
      null
    );
    if (!rawResponse) throw new Error("Fallback required");
    const parsed = parseForecastResponse(rawResponse);
    return {
      ...parsed,
      timestamp: Date.now()
    };
  } catch (error) {
    console.warn("Using heuristic fallback for forecast:", error);
    // Dynamic fallback trajectory based on current RRI
    const baseRRI = currentState.rri || 2.0;
    const basePRev = currentState.p_rev || 0.1;

    return {
      trajectory: Array.from({ length: 14 }).map((_, i) => ({
        day: i + 1,
        predictedRRI: Number((baseRRI + (Math.sin(i / 2) * 0.1)).toFixed(3)),
        predictedPRev: Number((basePRev + (i * 0.005)).toFixed(4))
      })),
      precursorSignals: [
        "Sustained inflation pressure in basic commodities",
        "Increased chatter on localized social platforms",
        "Volatility in secondary market liquidity"
      ],
      cascadeProbability: Number((basePRev * 1.2).toFixed(2)),
      timeToCascadeDays: basePRev > 0.4 ? 12 : null,
      narrative: "Predicted trajectory indicates a stable but high-pressure state. Heuristic modeling suggests localized mobilization risks if economic indicators continue to diverge.",
      timestamp: Date.now()
    };
  }
}

/**
 * Generic analyst response generator for various UI components.
 */
export async function generateAnalystResponse(prompt: string, systemInstruction?: any, config?: { maxTokens?: number; responseMimeType?: string }): Promise<string> {
  try {
    const system = typeof systemInstruction === 'string' 
      ? systemInstruction 
      : (systemInstruction && typeof systemInstruction === 'object' && Object.keys(systemInstruction).length > 0)
        ? JSON.stringify(systemInstruction)
        : "You are a senior geopolitical analyst for TunisiaIntel. Provide concise, evidence-based insights.";

    return await safeAI(
      () => callAI({
        system,
        user: prompt
      }, config),
      "Analyst is currently unavailable. System operating in restricted tactical mode."
    );
  } catch (error) {
    console.error("Analyst Response Failed:", error);
    return "Analyst is currently unavailable. Please check system logs.";
  }
}

/**
 * Chat interface for interacting with the virtual analyst.
 */
export async function chatWithAnalyst(messages: any[], context?: any): Promise<string> {
  try {
    const lastMessage = messages[messages.length - 1]?.text || "";
    const history = messages.slice(0, -1).map(m => `${m.role === 'user' ? 'User' : 'Analyst'}: ${m.text}`).join('\n');
    const currentModel = coreLogicEngine.getModel();
    
    // Fetch active AI configuration for the answering role
    let aiConfig: { provider?: string, model?: string } = {};
    try {
      const models = JSON.parse(localStorage.getItem('ti_ai_models') || '[]');
      const roles = JSON.parse(localStorage.getItem('ti_ai_role_assignments') || '{}');
      const activeId = roles['answering'];
      const active = models.find((m: any) => m.id === activeId);
      if (active) {
        aiConfig = { provider: active.provider, model: active.modelName };
      }
    } catch (e) {
      console.warn("Failed to fetch AI config for analyst chat:", e);
    }

    const fullPrompt = `${history}\n
INTERNAL DATABASE (CURRENT STATE):
${JSON.stringify(currentModel, null, 2)}

Context: ${JSON.stringify(context || {})} 
User: ${lastMessage}`;
    
    return await safeAI(
      () => callAI({
        system: "You are a senior geopolitical analyst. Engage in a professional, data-driven conversation about the current intelligence state. You have access to the internal database and can suggest updates to it based on provided information.",
        user: fullPrompt
      }, aiConfig),
      "I'm currently operating in restricted offline mode. Real-time neural analysis is partially disabled."
    );
  } catch (error) {
    console.error("Chat Failed:", error);
    return "I'm having trouble connecting to the intelligence database. Let's try again in a moment.";
  }
}

/**
 * Safely parses the AI response into the ForecastResult structure.
 */
function parseForecastResponse(response: string): Omit<ForecastResult, 'timestamp'> {
  try {
    let cleaned = response.trim().replace(/^```json\n?|\n?```$/g, "");
    if (!cleaned.endsWith('}')) {
      cleaned = repairTruncatedJSON(cleaned);
    }
    const parsed = JSON.parse(cleaned);
    return {
      trajectory: Array.isArray(parsed.trajectory) ? parsed.trajectory : [],
      precursorSignals: Array.isArray(parsed.precursorSignals) ? parsed.precursorSignals : [],
      cascadeProbability: typeof parsed.cascadeProbability === 'number' ? parsed.cascadeProbability : 0,
      timeToCascadeDays: typeof parsed.timeToCascadeDays === 'number' ? parsed.timeToCascadeDays : null,
      narrative: parsed.narrative || "Forecast narrative unavailable."
    };
  } catch (e) {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let cleaned = jsonMatch[0];
        if (!cleaned.endsWith('}')) {
          cleaned = repairTruncatedJSON(cleaned);
        }
        const parsed = JSON.parse(cleaned);
        return {
          trajectory: Array.isArray(parsed.trajectory) ? parsed.trajectory : [],
          precursorSignals: Array.isArray(parsed.precursorSignals) ? parsed.precursorSignals : [],
          cascadeProbability: typeof parsed.cascadeProbability === 'number' ? parsed.cascadeProbability : 0,
          timeToCascadeDays: typeof parsed.timeToCascadeDays === 'number' ? parsed.timeToCascadeDays : null,
          narrative: parsed.narrative || "Forecast narrative unavailable."
        };
      } catch (innerE) {}
    }
    return {
      trajectory: [],
      precursorSignals: ["Failed to parse forecast"],
      cascadeProbability: 0,
      timeToCascadeDays: null,
      narrative: "Forecast parsing failed."
    };
  }
}

/**
 * Safely parses the AI response into the AIAnalysis structure.
 */
function parseAIResponse(response: string): AIAnalysis {
  try {
    // Attempt direct parse
    let cleaned = response.trim().replace(/^```json\n?|\n?```$/g, "");
    
    // Robustness: Attempt to fix common JSON truncation issues
    if (!cleaned.endsWith('}')) {
      cleaned = repairTruncatedJSON(cleaned);
    }
    
    const parsed = JSON.parse(cleaned);

    return {
      summary: parsed.summary || "Analysis summary unavailable.",
      keyDrivers: parsed.keyDrivers || [],
      riskLevel: validateRiskLevel(parsed.riskLevel),
      outlook: parsed.outlook || "No forecast available.",
      recommendations: parsed.recommendations || [],
      rt: typeof parsed.rt === 'number' ? parsed.rt : 0,
      pRev: typeof parsed.pRev === 'number' ? parsed.pRev : 0,
      variableUpdates: Array.isArray(parsed.variableUpdates) ? parsed.variableUpdates : [],
      timestamp: Date.now()
    };
  } catch (e) {
    console.warn("JSON Parsing failed, attempting repair and regex extraction...");
    
    // Fallback: Try to extract JSON block using regex
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        let cleaned = jsonMatch[0];
        if (!cleaned.endsWith('}')) {
          cleaned = repairTruncatedJSON(cleaned);
        }
        const parsed = JSON.parse(cleaned);
        return {
          summary: parsed.summary || "Analysis summary unavailable.",
          keyDrivers: parsed.keyDrivers || [],
          riskLevel: validateRiskLevel(parsed.riskLevel),
          outlook: parsed.outlook || "No forecast available.",
          recommendations: parsed.recommendations || [],
          rt: typeof parsed.rt === 'number' ? parsed.rt : 0,
          pRev: typeof parsed.pRev === 'number' ? parsed.pRev : 0,
          variableUpdates: Array.isArray(parsed.variableUpdates) ? parsed.variableUpdates : [],
          timestamp: Date.now()
        };
      } catch (innerE) {
        // Continue to fallback
      }
    }

    return getFallbackOutput();
  }
}

/**
 * Ensures the risk level is one of the allowed values.
 */
function validateRiskLevel(level: any): "low" | "medium" | "high" | "critical" {
  const valid = ["low", "medium", "high", "critical"];
  return valid.includes(level) ? (level as any) : "medium";
}

/**
 * Provides a safe default output in case of failures.
 */
function getFallbackOutput(): AIAnalysis {
  return {
    summary: "Analysis unavailable due to processing error.",
    keyDrivers: [],
    riskLevel: "medium",
    outlook: "No forecast available.",
    recommendations: [],
    rt: 0,
    pRev: 0,
    variableUpdates: [],
    timestamp: Date.now()
  };
}

/**
 * Attempts to repair a truncated JSON string by closing unclosed quotes,
 * brackets, and braces.
 */
function repairTruncatedJSON(json: string): string {
  let repaired = json.trim();
  
  // 1. Handle unclosed quotes
  let quoteCount = 0;
  for (let i = 0; i < repaired.length; i++) {
    if (repaired[i] === '"' && (i === 0 || repaired[i-1] !== '\\')) {
      quoteCount++;
    }
  }
  if (quoteCount % 2 !== 0) {
    repaired += '"';
  }
  
  // 2. Handle unclosed structures
  const stack: string[] = [];
  let inQuote = false;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    if (char === '"' && (i === 0 || repaired[i-1] !== '\\')) {
      inQuote = !inQuote;
      continue;
    }
    
    if (!inQuote) {
      if (char === '{') stack.push('}');
      if (char === '[') stack.push(']');
      if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }
  
  // Close remaining structures in reverse order
  while (stack.length > 0) {
    repaired += stack.pop();
  }
  
  return repaired;
}
