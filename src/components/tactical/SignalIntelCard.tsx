import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Brain,
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  TrendingUp,
  Target,
  Activity,
  ExternalLink,
  AlertCircle,
  History,
  Info,
  Zap,
  Radio,
} from "lucide-react";
import {
  SignalClassification,
  SignalTier,
  ActorAttribution,
  IntentType,
} from "../../services/signalClassifier";
import { Article } from "../../lib/supabase";

import { getSeverityLabel } from "../../services/rssService";

// ── Config ─────────────────────────────────────────────────────

const TIER_CONFIG: Record<
  SignalTier,
  {
    label: string;
    color: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
    pulse: boolean;
  }
> = {
  SYSTEM_SHOCK: {
    label: "SYSTEM SHOCK",
    color: "text-intel-red",
    bg: "bg-intel-red/10",
    border: "border-intel-red/40",
    icon: <Zap className="w-3.5 h-3.5" />,
    pulse: true,
  },
  SIGNAL: {
    label: "SIGNAL",
    color: "text-intel-yellow",
    bg: "bg-intel-yellow/10",
    border: "border-intel-yellow/30",
    icon: <Radio className="w-3.5 h-3.5" />,
    pulse: false,
  },
  NOISE: {
    label: "CYCLE INGESTION",
    color: "text-slate-400",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: <Activity className="w-3 h-3" />,
    pulse: false,
  },
};

const ACTOR_CONFIG: Record<
  ActorAttribution,
  { color: string; icon: React.ReactNode }
> = {
  REGIME: { color: "text-intel-red", icon: <Shield className="w-3 h-3" /> },
  OPPOSITION: {
    color: "text-intel-orange",
    icon: <Target className="w-3 h-3" />,
  },
  EXTERNAL: { color: "text-intel-cyan", icon: <Eye className="w-3 h-3" /> },
  CITIZEN: { color: "text-yellow-500", icon: <Radio className="w-3 h-3" /> },
  UNKNOWN: {
    color: "text-slate-600",
    icon: <AlertCircle className="w-3 h-3" />,
  },
};

const INTENT_COLORS: Record<IntentType, string> = {
  CONTROL: "text-intel-red",
  DISTRACT: "text-intel-orange",
  REPRESS: "text-intel-red",
  MOBILIZE: "text-yellow-500",
  DIVIDE: "text-intel-orange",
  PRESSURE: "text-intel-cyan",
  DOCUMENT: "text-slate-400",
  INFORM: "text-slate-500",
  EXPLOIT: "text-intel-orange",
};

// ── Main Component ─────────────────────────────────────────────

export const SignalIntelCard: React.FC<{
  classification: SignalClassification;
  article: Article;
  compact?: boolean;
}> = ({ classification: c, article, compact = false }) => {
  const [expanded, setExpanded] = useState(false);
  const tierCfg = TIER_CONFIG[c.tier];
  const actorCfg = ACTOR_CONFIG[c.actor];

  if (c.tier === "NOISE" && !expanded) return null;

  const eps = c.modelImpact.epsilonMagnitude;
  const epsDelta = (c.modelImpact.estimatedRRIDelta * 100).toFixed(1);

  // Provenance extraction from article metadata if present
  const provenance = (article as any).provenance || [];
  const decayInfo = provenance.find(
    (p: any) => p.action === "confidence_decay",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border overflow-hidden ${tierCfg.bg} ${tierCfg.border} group/card hover:border-intel-cyan/40 transition-all duration-300`}
    >
      {/* ── Header row ── */}
      <div
        className={`flex items-start space-x-3 p-3.5 cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        {/* Tier badge */}
        <div
          className={`flex items-center space-x-1 shrink-0 pt-0.5 ${tierCfg.color}`}
        >
          {tierCfg.pulse && (
            <div
              className={`w-1.5 h-1.5 rounded-full animate-pulse mr-1 ${tierCfg.color.replace(
                "text-",
                "bg-",
              )}`}
            />
          )}
          {tierCfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Tier + time */}
          <div className="flex items-center space-x-2">
            <span
              className={`text-[8px] font-mono font-bold uppercase
              tracking-widest ${tierCfg.color}`}
            >
              {tierCfg.label}
            </span>
            <span className="text-[7px] font-mono text-slate-700">
              {new Date(article.published_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {c.confirmsGovAction && (
              <span
                className="text-[7px] font-mono px-1.5 py-0.5 rounded
                bg-intel-purple/20 border border-intel-purple/30 text-intel-purple"
              >
                PREDICTED → CONFIRMED
              </span>
            )}
            {c.groupCount && c.groupCount > 1 && (
              <span
                className="text-[7px] font-mono px-1.5 py-0.5 rounded
                bg-intel-cyan/20 border border-intel-cyan/30 text-intel-cyan"
              >
                MULTI-SOURCE CONFIRMATION ({c.groupCount})
              </span>
            )}
          </div>

          {/* Headline */}
          <p
            className={`text-[10px] font-medium leading-snug ${
              c.tier === "SYSTEM_SHOCK" ? "text-white" : "text-slate-200"
            }`}
          >
            {article.title}
          </p>

          {/* Attribution + intent row */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            {/* Actor */}
            <div className={`flex items-center space-x-1 ${actorCfg.color}`}>
              {actorCfg.icon}
              <span className="text-[8px] font-mono">{c.actorLabel}</span>
            </div>
            {/* Intent */}
            <span
              className={`text-[8px] font-mono font-bold ${
                INTENT_COLORS[c.intent]
              }`}
            >
              {c.intentLabel}
            </span>
            {/* Impact */}
            {eps > 0.05 && (
              <span
                className={`text-[8px] font-mono ${
                  c.modelImpact.epsilonDirection === 1
                    ? "text-intel-red"
                    : "text-intel-cyan"
                }`}
              >
                ε={eps.toFixed(2)}
                {c.modelImpact.epsilonDirection === 1 ? " ↑" : " ↓"}
                R(t){c.modelImpact.epsilonDirection === 1 ? "+" : "-"}
                {epsDelta}%
              </span>
            )}
          </div>
        </div>

        {/* Options / Action row */}
        <div className="shrink-0 flex flex-col items-end space-y-2">
          <div className="flex items-center space-x-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); /* validate logic */ }}
              className="p-1 rounded bg-white/5 hover:bg-intel-cyan/20 border border-white/10 text-slate-500 hover:text-intel-cyan transition-all"
              title="Validate"
            >
              <CheckCircle className="w-3 h-3" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); /* dispute logic */ }}
              className="p-1 rounded bg-white/5 hover:bg-intel-red/20 border border-white/10 text-slate-500 hover:text-intel-red transition-all"
              title="Dispute"
            >
              <Shield className="w-3 h-3" />
            </button>
            {article.url && (
               <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded bg-white/5 hover:bg-intel-orange/20 border border-white/10 text-slate-500 hover:text-intel-orange transition-all"
                title="View Source"
               >
                 <ExternalLink className="w-3 h-3" />
               </a>
            )}
          </div>
          <button
            className={`text-slate-700 hover:text-slate-400 transition-colors flex items-center space-x-1`}
          >
            <span className="text-[7px] font-mono uppercase mr-1">
              {getSeverityLabel(article.severity)}
            </span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Expanded view ── */}
      <AnimatePresence>
        {expanded && c.tier !== "NOISE" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* The five intelligence fields */}
              <div className="space-y-2.5">
                {/* What */}
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    What
                  </div>
                  <p className="text-[9px] text-slate-300 leading-relaxed">
                    {c.briefRelevance}
                  </p>
                </div>

                {/* Actor + confidence */}
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    Who pushed it
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={actorCfg.color}>{actorCfg.icon}</div>
                    <span
                      className={`text-[9px] font-medium ${actorCfg.color}`}
                    >
                      {c.actorLabel}
                    </span>
                    <span className="text-[8px] font-mono text-slate-700">
                      ({Math.round(c.actorConfidence * 100)}% confidence)
                    </span>
                  </div>
                </div>

                {/* Intent */}
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    Intent
                  </div>
                  <p
                    className={`text-[9px] font-medium ${INTENT_COLORS[c.intent]}`}
                  >
                    {c.intentLabel}
                  </p>
                </div>

                {/* Hidden objective */}
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    Hidden objective
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    {c.hiddenObjective}
                  </p>
                </div>

                {/* Why now */}
                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    Why now
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    {c.contextualTiming}
                  </p>
                </div>
              </div>

              {/* Model impact */}
              {c.modelImpact.epsilonMagnitude > 0.03 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider">
                    Model impact
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[8px] font-mono">
                    <div>
                      <span className="text-slate-700">ε(t) = </span>
                      <span
                        className={
                          c.modelImpact.epsilonDirection === 1
                            ? "text-intel-red font-bold"
                            : "text-intel-cyan font-bold"
                        }
                      >
                        {c.modelImpact.epsilonDirection === 1 ? "+" : "-"}
                        {c.modelImpact.epsilonMagnitude.toFixed(3)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-700">Decay: </span>
                      <span className="text-slate-400">
                        {c.modelImpact.decayDays}d
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-700">Primary var: </span>
                      <span className="text-intel-cyan">
                        {c.modelImpact.primaryVariable}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-700">R(t) Δ: </span>
                      <span
                        className={
                          c.modelImpact.epsilonDirection === 1
                            ? "text-intel-red"
                            : "text-intel-cyan"
                        }
                      >
                        {c.modelImpact.epsilonDirection === 1 ? "+" : "-"}
                        {Math.abs(c.modelImpact.estimatedRRIDelta).toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.modelImpact.affectedEquations.map((eq) => (
                      <span
                        key={eq}
                        className="text-[7px] font-mono px-1.5 py-0.5 rounded
                          bg-white/5 border border-white/10 text-slate-600"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* XAI Provenance & Audit Trail */}
              {provenance.length > 0 && (
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[8px] font-mono text-slate-600 uppercase tracking-wider flex items-center space-x-1">
                      <History className="w-2.5 h-2.5" />
                      <span>Intelligence Provenance</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 ml-1">
                    {provenance.map((p: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 bg-black/20 p-2 rounded border border-white/5"
                      >
                        <div className="mt-0.5">
                          {p.action === "confidence_decay" ? (
                            <TrendingUp className="w-3 h-3 text-intel-orange" />
                          ) : (
                            <Brain className="w-3 h-3 text-intel-cyan" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[7px] font-mono text-slate-400 capitalize">
                              {p.action.replace(/_/g, " ")}
                            </span>
                            <span className="text-[6px] font-mono text-slate-600">
                              {new Date(p.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-[8px] text-slate-300 leading-snug mt-0.5">
                            {p.reasoning ||
                              p.reason ||
                              "AI-driven assessment modification."}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[6px] font-mono px-1 bg-white/5 text-slate-500 rounded">
                              Agent: {p.agent || "CoreBrain"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prediction match */}
              {c.predictionMatch && (
                <div
                  className={`pt-3 border-t border-white/5 p-3 rounded-lg ${
                    c.predictionMatch.confirmed
                      ? "bg-intel-purple/10 border border-intel-purple/20"
                      : "bg-black/20 border border-intel-border/20"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {c.predictionMatch.confirmed ? (
                      <CheckCircle className="w-3.5 h-3.5 text-intel-purple" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span
                      className={`text-[8px] font-mono uppercase font-bold ${
                        c.predictionMatch.confirmed
                          ? "text-intel-purple"
                          : "text-slate-600"
                      }`}
                    >
                      {c.predictionMatch.confirmed
                        ? "Gov Agent Prediction Confirmed"
                        : "Potential Prediction Match"}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[8px] font-mono text-slate-500">
                    Action: {c.predictionMatch.govActionType.replace(/_/g, " ")}
                    {" · "}
                    Predicted:{" "}
                    {Math.round(c.predictionMatch.predictedProbability * 100)}%
                    {" · "}
                    Match confidence:{" "}
                    {Math.round(c.predictionMatch.matchConfidence * 100)}%
                  </div>
                </div>
              )}

              {/* Source link and Human-in-the-Loop actions */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 text-[8px] font-mono
                      text-slate-700 hover:text-slate-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{article.source_name}</span>
                  </a>
                ) : (
                  <div />
                )}

                <div className="flex items-center space-x-2">
                  <button className="px-2 py-1 text-[8px] font-mono rounded bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 hover:bg-intel-cyan/20 transition-colors">
                    VALIDATE
                  </button>
                  <button className="px-2 py-1 text-[8px] font-mono rounded bg-intel-red/10 text-intel-red border border-intel-red/20 hover:bg-intel-red/20 transition-colors">
                    DISPUTE
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
