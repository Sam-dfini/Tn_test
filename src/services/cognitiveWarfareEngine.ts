/**
 * cognitiveWarfareEngine.ts
 *
 * Core engine for detecting and analyzing cognitive warfare, disinformation,
 * and social engineering campaigns.
 *
 * Integrates Layer 1 (Static pattern detection) and Layer 2 (Gemini-powered analysis).
 */

import { generateAnalystResponse } from './geminiService';
import { Article } from '../lib/supabase';

export interface ShockVector {
  media_manipulation: number;
  panic_index: number;
  polarization_index: number;
  trust_erosion: number;
}

export interface CogWarfareAnalysis {
  id: string;
  classification: 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
  disinformation_velocity: number;
  shock_vector: ShockVector;
  falsifiable_indicators: string[];
  suspected_actor: string;
  campaign_id: string;
  campaign_stage: string;
  source_credibility: number;
  confidence_score: number;
  narrative_intent?: string;
  target_population?: string;
  manipulation_tactics?: string[];
  timestamp: string;
}

// ── Pattern Detection — Static vocabulary analysis ───────────────────────

const PANIC_KEYWORDS = ['panique', 'effondrement', 'crise', 'pénurie', 'danger', 'urgence', 'émeute', 'panic', 'collapse', 'crisis', 'shortage', 'danger', 'emergency', 'riot'];
const POLARIZATION_KEYWORDS = ['traître', 'vendu', 'ennemi', 'dictature', 'coup', 'complot', 'us vs them', 'traitor', 'enemy', 'dictatorship', 'conspiracy', 'polarization'];
const TRUST_ATTACK_KEYWORDS = ['mensonge', 'corruption', 'fraude', 'fake', 'caché', 'secret', 'mensonge', 'corruption', 'fraud', 'hidden', 'secret', 'deception', 'delegitimize'];

export function detectPatterns(texts: string[]): string[] {
  const patterns: string[] = [];
  const text = texts.join(' ').toLowerCase();

  const matchesPanic = PANIC_KEYWORDS.some(k => text.includes(k));
  const matchesPola  = POLARIZATION_KEYWORDS.some(k => text.includes(k));
  const matchesTrust = TRUST_ATTACK_KEYWORDS.some(k => text.includes(k));

  if (matchesPanic) patterns.push('High-panic vocabulary density detected across signals');
  if (matchesPola)  patterns.push('Us-vs-them polarization framing identified');
  if (matchesTrust) patterns.push('Institutional delegitimization and trust-attack language');
  
  return patterns;
}

// ── Quick Scan — Layer 1 (Instant, No API) ──────────────────────────────

export function quickScan(articles: Article[], rriState: any) {
  const texts = articles.map(a => `${a.title} ${a.summary || ''}`).join(' ');
  const textLower = texts.toLowerCase();

  const countMatches = (keys: string[]) => {
    let count = 0;
    keys.forEach(k => {
      if (textLower.includes(k)) count++;
    });
    return count;
  };

  const panicVal = Math.min(1.0, countMatches(PANIC_KEYWORDS) / 6);
  const polVal   = Math.min(1.0, countMatches(POLARIZATION_KEYWORDS) / 6);
  const trustVal = Math.min(1.0, countMatches(TRUST_ATTACK_KEYWORDS) / 6);
  const mediaVal = Math.min(1.0, articles.filter(a => (a.severity || 0) >= 3).length / 8);

  const avgScore = (panicVal + polVal + trustVal + mediaVal) / 4;
  
  let classification: CogWarfareAnalysis['classification'] = 'LOW';
  if (avgScore > 0.75) classification = 'EMERGENCY';
  else if (avgScore > 0.60) classification = 'CRITICAL';
  else if (avgScore > 0.45) classification = 'HIGH';
  else if (avgScore > 0.30) classification = 'ELEVATED';

  return {
    classification,
    timestamp: new Date().toISOString(),
    campaign_stage: avgScore > 0.4 ? 'Escalation' : 'Observation',
    disinformation_velocity: avgScore * 2.2,
    shock_vector: {
      media_manipulation: mediaVal,
      panic_index: panicVal,
      polarization_index: polVal,
      trust_erosion: trustVal
    },
    rri_epsilon_weight: trustVal + polVal,
    rri_salience_nudge: panicVal * 0.05,
    rri_amplification_delta: mediaVal * avgScore
  };
}

// ── Deep Analysis — Layer 2 (Gemini-Powered) ─────────────────────────────

export async function analyzeCognitiveWarfare(
  articles: Article[],
  patterns: string[],
  rriState: any,
  batchId: string
): Promise<CogWarfareAnalysis | null> {
  // Use first 15 articles as context
  const context = articles.slice(0, 15).map(a => `- [${a.source_name || 'Intel'}] ${a.title}: ${a.summary || ''}`).join('\n');
  
  const prompt = `Perform a Layer 2 Cognitive Warfare Analysis on the following signal stream for Tunisia.
  
SIGNALS FOR ANALYSIS:
${context}

PRE-DETECTION PATTERNS:
${patterns.join(', ')}

CURRENT RRI BASELINE: R(t)=${rriState?.rri?.toFixed(2) ?? '2.31'}

TASK: 
Detect coordinated inauthentic behavior, narrative weaponization, and institutional delegitimization. 
Analyze the "Shock Vector" (0-1.0 scale) for Media Manipulation, Panic, Polarization, and Trust Erosion.

Return a MINIFIED JSON object with this EXACT schema:
{
  "classification": "LOW" | "ELEVATED" | "HIGH" | "CRITICAL" | "EMERGENCY",
  "disinformation_velocity": float (0-1.0),
  "shock_vector": {
    "media_manipulation": float (0-1.0),
    "panic_index": float (0-1.0),
    "polarization_index": float (0-1.0),
    "trust_erosion": float (0-1.0)
  },
  "falsifiable_indicators": string[],
  "suspected_actor": string,
  "campaign_id": string,
  "campaign_stage": string,
  "source_credibility": float (0-1.0),
  "confidence_score": float (0-1.0),
  "narrative_intent": string,
  "target_population": string,
  "manipulation_tactics": string[]
}

JSON ONLY. NO MARKDOWN. NO PREAMBLE.`;

  try {
    const response = await generateAnalystResponse(prompt);
    // Find JSON in response
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}') + 1;
    if (jsonStart === -1 || jsonEnd === 0) throw new Error('No JSON found in response');
    
    const analysis = JSON.parse(response.substring(jsonStart, jsonEnd));
    
    return {
      ...analysis,
      id: `analysis-${batchId}-${Date.now()}`,
      timestamp: new Date().toISOString()
    } as CogWarfareAnalysis;
  } catch (err) {
    console.error('Cognitive Warfare Analysis Engine Failure:', err);
    return null;
  }
}

// ── RRI Mapping Logic ────────────────────────────────────────────────────

export function mapShockVectorToRRI(analysis: CogWarfareAnalysis) {
  const sv = analysis.shock_vector;
  return {
    epsilon_magnitude: parseFloat(((sv.panic_index + sv.media_manipulation) * 0.12).toFixed(4)),
    epsilon_weight:    parseFloat(((sv.trust_erosion + sv.polarization_index) * 0.18).toFixed(4)),
    salience_nudge:    parseFloat((sv.panic_index * 0.07).toFixed(4)),
    amplification_delta: parseFloat((sv.media_manipulation * analysis.disinformation_velocity * 0.25).toFixed(4)),
    cascade_risk_delta: parseFloat(((sv.panic_index * sv.polarization_index) * 0.15).toFixed(4))
  };
}

// ── Campaign History Tracker (Transient) ──────────────────────────────────

class CampaignTracker {
  private history: Record<string, {
    id: string;
    detections: number;
    first_seen: string;
    last_seen: string;
    peak_class: string;
    analyses: CogWarfareAnalysis[];
  }> = {};

  record(analysis: CogWarfareAnalysis) {
    const cid = analysis.campaign_id || 'UNKNOWN-CAMPAIGN';
    if (!this.history[cid]) {
      this.history[cid] = {
        id: cid,
        detections: 0,
        first_seen: analysis.timestamp,
        last_seen: analysis.timestamp,
        peak_class: analysis.classification,
        analyses: []
      };
    }
    
    const entry = this.history[cid];
    entry.detections++;
    entry.last_seen = analysis.timestamp;
    entry.analyses.push(analysis);
    
    const levels: Record<string, number> = { 'LOW': 0, 'ELEVATED': 1, 'HIGH': 2, 'CRITICAL': 3, 'EMERGENCY': 4 };
    if (levels[analysis.classification] > levels[entry.peak_class]) {
      entry.peak_class = analysis.classification;
    }
  }

  getActive() {
    return Object.values(this.history).sort((a, b) => 
      new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
    );
  }
}

export const campaignTracker = new CampaignTracker();
