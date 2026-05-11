/*
 * StubPage.tsx
 * Reusable component for stub and planned routes in TunisiaIntel v2.0.
 * Aligns with the 3-tier architecture and Mission Control.
 */

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Badge } from "./badge";
import { BookOpen, GitBranch, FlaskConical, Target, Users, BrainCircuit, AlertTriangle } from "lucide-react";

interface StubPageProps {
  title: string;
  description: string;
  status: "stub" | "planned";
  involvedDomains?: string[];
  equations?: string[];
  dataSources?: string[];
  missionContexts?: string[];
  preloadedVariables?: Record<string, number>;
  primaryEquation?: string;
}

export const StubPage: React.FC<StubPageProps> = (
  {
    title,
    description,
    status,
    involvedDomains = [],
    equations = [],
    dataSources = [],
    missionContexts = [],
    preloadedVariables = {},
    primaryEquation,
  }
) => {
  // Map domain IDs to human-readable names and icons
  const domainMap: Record<string, { label: string; icon: React.ReactNode }> = {
    "agriculture": { label: "Agriculture", icon: <Target className="w-4 h-4" /> },
    "climate-water": { label: "Climate & Water", icon: <Target className="w-4 h-4" /> },
    "informal-economy": { label: "Informal Economy", icon: <Users className="w-4 h-4" /> },
    "social-dynamics": { label: "Social Dynamics", icon: <Users className="w-4 h-4" /> },
    "narrative": { label: "Narrative", icon: <BookOpen className="w-4 h-4" /> },
    "actor-network": { label: "Actor Network", icon: <GitBranch className="w-4 h-4" /> },
    "political": { label: "Political", icon: <BrainCircuit className="w-4 h-4" /> },
    "governance-matrix": { label: "Governance Matrix", icon: <Target className="w-4 h-4" /> },
    "societal-fracture": { label: "Societal Fracture", icon: <GitBranch className="w-4 h-4" /> },
    "security-borders": { label: "Security & Borders", icon: <Target className="w-4 h-4" /> },
    "geopolitical": { label: "Geopolitical", icon: <GitBranch className="w-4 h-4" /> },
    "radicalisation": { label: "Radicalisation", icon: <AlertTriangle className="w-4 h-4" /> },
    "cognitive-warfare": { label: "Cognitive Warfare", icon: <BrainCircuit className="w-4 h-4" /> },
    "simulation": { label: "Simulation", icon: <FlaskConical className="w-4 h-4" /> },
  };

  // Map data source tags to human-readable names
  const dataSourceMap: Record<string, string> = {
    "supabase": "Supabase (Real-time)",
    "rss": "RSS Feeds",
    "gemini": "Gemini AI",
    "external-api": "External APIs",
    "osint": "OSINT Scrapers",
    "nlp": "NLP Pipeline",
    "weather-api": "Weather API",
    "satellite": "Satellite Imagery",
    "pipeline": "Internal Pipeline",
    "news": "News Analysis",
    "social-media": "Social Media",
  };

  return (
    <div className="space-y-6 p-6 glass rounded-xl border border-intel-border/50">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge
          variant={status === "stub" ? "secondary" : "outline"}
          className={status === "stub" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}
        >
          {status === "stub" ? "STUB" : "PLANNED"}
        </Badge>
      </div>

      <Alert variant="info">
        <AlertTitle>Module Overview</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Tags */}
        {involvedDomains.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400">
              Involved Domains
            </h2>
            <div className="flex flex-wrap gap-2">
              {involvedDomains.map((domain) => (
                <Badge
                  key={domain}
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-300"
                >
                  {domainMap[domain]?.icon}
                  <span className="ml-1">{domainMap[domain]?.label || domain}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Equations */}
        {equations.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400">
              Equations
            </h2>
            <div className="flex flex-wrap gap-2">
              {equations.map((eq) => (
                <Badge
                  key={eq}
                  variant="outline"
                  className="border-white/20 bg-white/5 text-slate-300"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="ml-1">{eq}</span>
                </Badge>
              ))}
              {primaryEquation && (
                <Badge
                  variant="default"
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="ml-1">Primary: {primaryEquation}</span>
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Sources */}
      {dataSources.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400">
            Data Sources
          </h2>
          <div className="flex flex-wrap gap-2">
            {dataSources.map((source) => (
              <Badge
                key={source}
                variant="outline"
                className="border-white/20 bg-white/5 text-slate-300"
              >
                <GitBranch className="w-4 h-4" />
                <span className="ml-1">{dataSourceMap[source] || source}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mission Contexts */}
      {missionContexts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400">
            Mission Contexts
          </h2>
          <div className="flex flex-wrap gap-2">
            {missionContexts.map((mission) => (
              <Badge
                key={mission}
                variant="outline"
                className="border-white/20 bg-white/5 text-slate-300"
              >
                <Target className="w-4 h-4" />
                <span className="ml-1 capitalize">
                  {mission.replace(/-/g, " ")}
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Preloaded Variables (for Missions) */}
      {Object.keys(preloadedVariables).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-mono uppercase tracking-widest text-slate-400">
            Preloaded Variables
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {Object.entries(preloadedVariables).map(([key, value]) => (
              <div
                key={key}
                className="glass rounded-lg border border-white/10 p-3 flex flex-col gap-1"
              >
                <span className="text-xs font-mono text-slate-400 uppercase">
                  {key.replace(/_/g, " ")}
                </span>
                <span className="text-lg font-bold text-white">
                  {value.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
        <Button variant="outline" className="border-white/20 bg-white/5 text-slate-300">
          <BookOpen className="w-4 h-4 mr-2" />
          View Methodology
        </Button>
        <Button variant="outline" className="border-white/20 bg-white/5 text-slate-300">
          <FlaskConical className="w-4 h-4 mr-2" />
          Open in Sandbox
        </Button>
        {status === "planned" && (
          <Button variant="outline" className="border-white/20 bg-white/5 text-slate-300">
            <Target className="w-4 h-4 mr-2" />
            Activate Mission
          </Button>
        )}
      </div>
    </div>
  );
};
