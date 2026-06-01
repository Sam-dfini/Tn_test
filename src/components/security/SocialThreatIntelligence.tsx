/*
 * SocialThreatIntelligence.tsx
 * Renamed from SocialIntelligence.tsx (Threat & Security)
 * Part of the Security & Threat domain.
 */

import React, { useState } from "react";
import { useRiskMetrics } from "../../hooks/usePipelineDomains";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/card";
import { Alert, AlertDescription, AlertTitle } from "../shared/alert";
import { Target, Users, Shield, AlertTriangle } from "lucide-react";
import { RiskChart } from "../observability/RiskChart";
import { DataTable } from "../shared/data-table";
import { GovernorateMap } from "../shared/governorate-map";
import { usePipeline } from "../../context/PipelineContext";

const categories = [
  { id: "MIGRATION", label: "Migration & Diaspora", icon: Users },
  { id: "BRAIN_DRAIN", label: "Brain Drain", icon: Shield },
  { id: "LABOR", label: "Labor & Policy", icon: Target },
  { id: "FAMILY", label: "Family & Health", icon: AlertTriangle },
];

export const SocialThreatIntelligence: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState("MIGRATION");
  const { fullData } = useRiskMetrics() as any;
  const data = Array.isArray(fullData) ? fullData : [];
  const pipeline = usePipeline();
  const alerts = pipeline?.activeSignals || [];

  // Filter alerts for this domain
  const domainAlerts = alerts.filter(
    (alert: any) => alert.domain === "SOCIAL_THREAT" || alert.type === "SOCIAL_THREAT"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-on-surface uppercase tracking-tight">Social Threat Intelligence</h1>
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
                  activeCategory === category.id
                    ? "bg-intel-cyan text-black"
                    : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
                }`}
              >
                <category.icon className="inline-block w-3 h-3 mr-1" />
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Alert variant="info">
        <AlertTitle>DOMAIN OVERVIEW</AlertTitle>
        <AlertDescription className="font-mono text-[10px] uppercase">
          Migration, diaspora, brain drain, labor policies, and social threats monitoring uplink active.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <RiskChart
              data={data.filter((d: any) => d.category === activeCategory)}
              category={activeCategory}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {domainAlerts.length > 0 ? (
                domainAlerts.map((alert: any) => (
                  <Alert
                    key={alert.id}
                    variant={alert.severity === "CRITICAL" ? "destructive" : "warning"}
                  >
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </Alert>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                   <div className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">No Domain Alerts Found</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Governorate-Level Threats</CardTitle>
        </CardHeader>
        <CardContent>
          <GovernorateMap
            data={data.filter((d: any) => d.category === activeCategory)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={data.filter((d: any) => d.category === activeCategory)}
            columns={["governorate", "metric", "value", "trend"]}
          />
        </CardContent>
      </Card>
    </div>
  );
};

// Export for backward compatibility (temporary)
export const SocialIntelligence = SocialThreatIntelligence;
