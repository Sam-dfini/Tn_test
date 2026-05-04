import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Download, FileText, Table2, Code,
  Check, ChevronDown, Loader2, Shield,
  Lock, Globe, AlertTriangle, Sparkles, Activity
} from 'lucide-react';
import {
  generateReport,
  ReportConfig,
  ReportSection,
  ReportFormat,
} from '../../services/IntelligenceDossierExporter';
import { callAI } from '../../services/aiService';
import { generateAnalystResponse } from '../../services/ai';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { useAuditLog } from '../../context/AuditContext';
import { useRSS } from '../../context/RSSContext';
import { useAI } from '../../context/AIContext';
import PremiumReport from '../shared/PremiumReport';

const SECTION_OPTIONS: {
  id: ReportSection;
  label: string;
  description: string;
  recommended: boolean;
}[] = [
  { id: 'rri_summary', label: 'RRI Summary', description: 'R(t), P_rev, velocity, all model outputs', recommended: true },
  { id: 'economic', label: 'Economic', description: 'FX reserves, inflation, debt, trade', recommended: true },
  { id: 'social', label: 'Social', description: 'Protests, UGTT, water, Decree 54', recommended: true },
  { id: 'political', label: 'Political', description: 'Opposition, freedoms, judicial independence', recommended: false },
  { id: 'security', label: 'Security', description: 'Migration, trafficking, border incidents', recommended: false },
  { id: 'geopolitical', label: 'Geopolitical', description: 'IMF, EU, US, France, Gulf relations', recommended: true },
  { id: 'prisoners', label: 'Political Prisoners', description: 'Detention tracker with live clocks', recommended: true },
  { id: 'threshold_breaches', label: 'Threshold Breaches', description: 'All active RRI threshold breaches', recommended: true },
  { id: 'events', label: 'Events', description: 'Recent intelligence events from RSS', recommended: false },
  { id: 'narrative', label: 'Narrative Analysis', description: 'Media bias and propaganda summary', recommended: false },
  { id: 'rri_variables', label: 'RRI Variables', description: 'All 30+ active variable values', recommended: false },
  { id: 'sitrep', label: 'Automated SITREP', description: 'Consolidated situation report', recommended: true },
  { id: 'audit_trail', label: 'Audit Trail', description: 'Human-AI intervention log', recommended: true },
];

export const IntelligenceDossierExporterModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { rriState, fullData: data } = useRiskMetrics();
  const { auditLog } = useAuditLog();
  const { articles } = useRSS();

  const { canCallAI, recordCall } = useAI();
  const [format, setFormat] = useState<ReportFormat>('pdf');
  const [classification, setClassification] =
    useState<ReportConfig['classification']>('ANALYST');
  const [dateRange, setDateRange] =
    useState<ReportConfig['dateRange']>('today');
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>(
    SECTION_OPTIONS.filter(s => s.recommended).map(s => s.id)
  );
  const [includeAI, setIncludeAI] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [analyst, setAnalyst] = useState('Sam Dfini');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const toggleSection = (id: ReportSection) => {
    setSelectedSections(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    );
  };

  const selectAll = () =>
    setSelectedSections(SECTION_OPTIONS.map(s => s.id));

  const selectRecommended = () =>
    setSelectedSections(
      SECTION_OPTIONS.filter(s => s.recommended).map(s => s.id)
    );

  const handleGenerate = async () => {
    if (selectedSections.length === 0) return;
    setGenerating(true);
    setDone(false);

    let aiAnalysis = '';
    let sitrepData = null;

    if (includeAI && canCallAI()) {
      // 1. Generate Strategic Analysis
      const strategicPrompt = `You are a senior political risk analyst for Tunisia. 
      Based on the current data (RRI: ${rriState.rri.toFixed(4)}, P_rev: ${(rriState.p_rev * 100).toFixed(1)}%),
      write a 3-paragraph strategic intelligence summary for a professional report.
      Paragraph 1: Executive Summary of current risk.
      Paragraph 2: Key drivers and accelerants (economic, social, political).
      Paragraph 3: Short-term outlook and recommendations.
      Be professional, analytical, and concise.`;
      
      try {
        const result = await generateAnalystResponse(strategicPrompt, { rriState, data });
        if (result) {
          aiAnalysis = result;
          recordCall();
        }
      } catch (error) {
        console.error('Failed to generate AI analysis for report:', error);
      }

      // 2. Generate SITREP Data if section requested
      if (selectedSections.includes('sitrep')) {
        const sitrepPrompt = `Generate a structured SITREP (Situation Report) JSON for Tunisian domestic stability.
        RRI: ${rriState.rri.toFixed(4)}. 
        Data Snapshot: ${JSON.stringify({ 
          inflation: data.economy.inflation, 
          fx: data.economy.fx_reserves,
          mobilization: data.social.ugtt_mobilisation_level 
        })}.
        Return JSON with:
        {
          "status": "ADVISORY | WARNING | CRITICAL",
          "summary": "1 sentence operational summary",
          "key_threats": ["list of 3 operational threats"]
        }`;

        try {
          const sitrepResult = await generateAnalystResponse(sitrepPrompt, {}, { responseMimeType: 'application/json' });
          if (sitrepResult) {
            sitrepData = JSON.parse(sitrepResult.replace(/```json|```/g, '').trim());
            recordCall();
          }
        } catch (error) {
          console.error('Failed to generate SITREP:', error);
        }
      }
    }

    try {
      generateReport(
        {
          title: `Tunisia Intelligence Report — ${
            new Date().toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric'
            })
          }`,
          classification,
          format,
          sections: selectedSections,
          dateRange,
          includeCharts,
          includeAIAnalysis: includeAI,
          analyst,
        },
        {
          rriState,
          data: { ...data, sitrep: sitrepData },
          articles: articles.slice(0, 50),
          events: [], // populated from Supabase if available
          auditLog,
          aiAnalysis,
          generatedAt: new Date().toISOString()
            .slice(0, 19).replace('T', ' ') + ' UTC',
        }
      );
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setGenerating(false);
    }
  };

  const formatConfig = [
    {
      id: 'pdf' as ReportFormat,
      label: 'PDF Report',
      icon: FileText,
      desc: 'Styled intelligence report with cover page',
      color: 'text-intel-red',
      bg: 'bg-intel-red/10 border-intel-red/30',
    },
    {
      id: 'csv' as ReportFormat,
      label: 'CSV Data',
      icon: Table2,
      desc: 'Flat data export for spreadsheet analysis',
      color: 'text-intel-green',
      bg: 'bg-intel-green/10 border-intel-green/30',
    },
    {
      id: 'json' as ReportFormat,
      label: 'JSON Export',
      icon: Code,
      desc: 'Structured data for API / developer use',
      color: 'text-intel-cyan',
      bg: 'bg-intel-cyan/10 border-intel-cyan/30',
    },
  ];

  const classificationConfig = [
    { id: 'PUBLIC', icon: Globe, label: 'Public', color: 'text-intel-green' },
    { id: 'ANALYST', icon: FileText, label: 'Analyst', color: 'text-intel-cyan' },
    { id: 'RESTRICTED', icon: Lock, label: 'Restricted', color: 'text-intel-orange' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm
              z-[300]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-x-4 top-[5%] bottom-[5%]
              md:inset-x-auto md:left-1/2 md:-translate-x-1/2
              md:w-[640px] md:top-[8%] md:bottom-[8%]
              bg-[#05070a] border border-intel-border rounded-2xl
              z-[400] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between
              px-6 py-4 border-b border-intel-border/50 shrink-0">
              <div className="flex items-center space-x-3">
                <Download className="w-4 h-4 text-intel-cyan" />
                <div>
                  <div className="text-sm font-bold text-white
                    uppercase tracking-widest">
                    Generate Report
                  </div>
                  <div className="text-[9px] font-mono text-slate-600">
                    PDF · CSV · JSON — Tunisia Intelligence
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowPremium(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 mr-2"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Premium</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-600 hover:text-white
                    hover:bg-white/5 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6
              scrollbar-thin scrollbar-thumb-intel-cyan/10">

              {/* Format selection */}
              <div className="space-y-3">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">Format</div>
                <div className="grid grid-cols-3 gap-3">
                  {formatConfig.map(f => {
                    const Icon = f.icon;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`p-3 rounded-xl border text-left
                          transition-all space-y-1.5 ${
                          format === f.id
                            ? f.bg
                            : 'border-intel-border/30 bg-black/20 hover:border-intel-border/60'
                        }`}
                      >
                        <div className="flex items-center
                          justify-between">
                          <Icon className={`w-4 h-4 ${
                            format === f.id ? f.color : 'text-slate-600'
                          }`} />
                          {format === f.id && (
                            <Check className={`w-3 h-3 ${f.color}`} />
                          )}
                        </div>
                        <div className={`text-[10px] font-bold ${
                          format === f.id ? 'text-white' : 'text-slate-400'
                        }`}>{f.label}</div>
                        <div className="text-[8px] text-slate-600
                          leading-snug">{f.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Classification + Date range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">Classification</div>
                  <div className="flex items-center space-x-1 bg-black/40
                    border border-intel-border rounded-xl p-1">
                    {classificationConfig.map(c => {
                      const Icon = c.icon;
                      return (
                        <button
                          key={c.id}
                          onClick={() =>
                            setClassification(c.id as any)
                          }
                          className={`flex-1 flex items-center
                            justify-center space-x-1.5 py-1.5 px-2
                            rounded-lg text-[8px] font-mono uppercase
                            transition-all ${
                            classification === c.id
                              ? 'bg-white/10 text-white'
                              : 'text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          <Icon className={`w-3 h-3 ${
                            classification === c.id ? c.color : ''
                          }`} />
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">Date Range</div>
                  <select
                    value={dateRange}
                    onChange={e =>
                      setDateRange(e.target.value as any)
                    }
                    className="w-full bg-black/40 border
                      border-intel-border rounded-xl px-3 py-2
                      text-[10px] font-mono text-slate-300
                      focus:outline-none focus:border-intel-cyan/40
                      transition-colors"
                  >
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="all">All Data</option>
                  </select>
                </div>
              </div>

              {/* Analyst name */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">Analyst Name</div>
                  <input
                    value={analyst}
                    onChange={e => setAnalyst(e.target.value)}
                    className="w-full bg-black/40 border
                      border-intel-border rounded-xl px-3 py-2
                      text-[10px] font-mono text-slate-300
                      focus:outline-none focus:border-intel-cyan/40
                      transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">AI Intelligence</div>
                  <button
                    onClick={() => setIncludeAI(!includeAI)}
                    className={`w-full flex items-center justify-between
                      px-3 py-2 rounded-xl border transition-all ${
                      includeAI
                        ? 'border-intel-cyan/30 bg-intel-cyan/5 text-intel-cyan'
                        : 'border-intel-border/30 bg-black/40 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Sparkles className={`w-3 h-3 ${includeAI ? 'text-intel-cyan' : 'text-slate-600'}`} />
                      <span className="text-[10px] font-mono uppercase tracking-tight">AI Analysis</span>
                    </div>
                    <div className={`w-6 h-3 rounded-full relative transition-colors ${
                      includeAI ? 'bg-intel-cyan/40' : 'bg-slate-800'
                    }`}>
                      <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${
                        includeAI ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">Visual Data</div>
                  <button
                    onClick={() => setIncludeCharts(!includeCharts)}
                    className={`w-full flex items-center justify-between
                      px-3 py-2 rounded-xl border transition-all ${
                      includeCharts
                        ? 'border-intel-cyan/30 bg-intel-cyan/5 text-intel-cyan'
                        : 'border-intel-border/30 bg-black/40 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Activity className={`w-3 h-3 ${includeCharts ? 'text-intel-cyan' : 'text-slate-600'}`} />
                      <span className="text-[10px] font-mono uppercase tracking-tight">Risk Graphs</span>
                    </div>
                    <div className={`w-6 h-3 rounded-full relative transition-colors ${
                      includeCharts ? 'bg-intel-cyan/40' : 'bg-slate-800'
                    }`}>
                      <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${
                        includeCharts ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </div>
                  </button>
                </div>
              </div>

              {/* Section selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-mono text-slate-500
                    uppercase tracking-widest">
                    Sections ({selectedSections.length} selected)
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={selectRecommended}
                      className="text-[8px] font-mono text-intel-cyan
                        hover:underline"
                    >
                      Recommended
                    </button>
                    <button
                      onClick={selectAll}
                      className="text-[8px] font-mono text-slate-500
                        hover:text-slate-300"
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedSections([])}
                      className="text-[8px] font-mono text-slate-600
                        hover:text-slate-400"
                    >
                      None
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {SECTION_OPTIONS.map(section => {
                    const selected =
                      selectedSections.includes(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center
                          space-x-3 p-3 rounded-xl border text-left
                          transition-all ${
                          selected
                            ? 'border-intel-cyan/30 bg-intel-cyan/5'
                            : 'border-intel-border/20 bg-black/10 hover:border-intel-border/40'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border
                          flex items-center justify-center shrink-0
                          transition-all ${
                          selected
                            ? 'bg-intel-cyan border-intel-cyan'
                            : 'border-slate-700'
                        }`}>
                          {selected && (
                            <Check className="w-2.5 h-2.5
                              text-black" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center
                            space-x-2">
                            <span className={`text-[10px] font-bold
                              ${selected ? 'text-white' : 'text-slate-400'}`}>
                              {section.label}
                            </span>
                            {section.recommended && (
                              <span className="text-[7px] font-mono
                                text-intel-cyan/60 uppercase">
                                recommended
                              </span>
                            )}
                          </div>
                          <div className="text-[8px] text-slate-600
                            leading-snug">
                            {section.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-black/30 border
                border-intel-border/30 space-y-2">
                <div className="text-[9px] font-mono text-slate-500
                  uppercase tracking-widest">Report Preview</div>
                <div className="text-[10px] font-mono text-slate-400
                  space-y-1">
                  <div>Format: <span className="text-white">
                    {format.toUpperCase()}
                  </span></div>
                  <div>Classification: <span className={
                    classification === 'RESTRICTED'
                      ? 'text-intel-orange'
                      : classification === 'ANALYST'
                      ? 'text-intel-cyan'
                      : 'text-intel-green'
                  }>{classification}</span></div>
                  <div>Sections: <span className="text-white">
                    {selectedSections.length}
                  </span></div>
                  <div>Current R(t): <span className="text-intel-orange">
                    {rriState.rri.toFixed(4)}
                  </span> · P_rev: <span className="text-intel-orange">
                    {(rriState.p_rev * 100).toFixed(1)}%
                  </span></div>
                </div>
              </div>
            </div>

            {/* Footer — Generate button */}
            <div className="px-6 py-4 border-t border-intel-border/50
              shrink-0 space-y-3">
              {selectedSections.length === 0 && (
                <div className="flex items-center space-x-2
                  text-[9px] font-mono text-intel-orange">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Select at least one section</span>
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating || selectedSections.length === 0}
                className={`w-full flex items-center justify-center
                  space-x-3 py-3 rounded-xl font-mono text-[11px]
                  font-bold uppercase tracking-wider transition-all ${
                  done
                    ? 'bg-intel-green/20 border border-intel-green/40 text-intel-green'
                    : generating
                    ? 'bg-intel-cyan/10 border border-intel-cyan/20 text-intel-cyan cursor-wait'
                    : selectedSections.length === 0
                    ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-intel-cyan/10 border border-intel-cyan/30 text-intel-cyan hover:bg-intel-cyan/20 hover:border-intel-cyan/50'
                }`}
              >
                {done ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Downloaded</span>
                  </>
                ) : generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating {format.toUpperCase()}...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>
                      Generate {format.toUpperCase()} Report
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}

      <PremiumReport 
        isOpen={showPremium}
        onClose={() => setShowPremium(false)}
        rriState={rriState}
        data={data}
        analyst={analyst}
      />
    </AnimatePresence>
  );
};
