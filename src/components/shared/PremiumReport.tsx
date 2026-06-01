import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { 
  Shield, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  Globe, 
  Users, 
  Lock,
  Download,
  X,
  Sparkles,
  ChevronRight,
  Zap
} from 'lucide-react';

interface PremiumReportProps {
  isOpen: boolean;
  onClose: () => void;
  rriState: any;
  data: any;
  analyst: string;
}

const PremiumReport: React.FC<PremiumReportProps> = ({ 
  isOpen, 
  onClose, 
  rriState, 
  data, 
  analyst 
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    
    try {
      const pages = reportRef.current.querySelectorAll('.report-page');
      for (let i = 0; i < pages.length; i++) {
        const dataUrl = await toPng(pages[i] as HTMLElement, {
          quality: 1.0,
          pixelRatio: 4, // 4K-ish quality
          backgroundColor: '#0A0A0A',
        });
        
        const link = document.createElement('a');
        link.download = `TUNISIA_INTEL_PREMIUM_PAGE_${i + 1}.png`;
        link.href = dataUrl;
        link.click();
        // Small delay to prevent browser blocking multiple downloads
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const PageWrapper = ({ children, pageNum }: { children: React.ReactNode, pageNum: number }) => (
    <div className="report-page relative w-[794px] h-[1123px] bg-[#0A0A0A] overflow-hidden flex flex-col p-12 mb-8 shadow-2xl border border-white/5">
      {/* Background Grid Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#00F5FF 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
      
      {/* Top Border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00F5FF]" />
      
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-auto pt-6 border-t border-white/10 flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
            TUNISIAINTEL v3.0 • Analyst: {analyst} • NOT FOR PUBLIC DISTRIBUTION
          </div>
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">
            Based on open-source intelligence only • Confidential Intelligence Product
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400">
          Page {pageNum} of 5
        </div>
      </div>
    </div>
  );

  const Logo = () => (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#00F5FF]/10 blur-xl rounded-full" />
      <svg viewBox="0 0 100 100" className="w-full h-full text-[#00F5FF] drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
        <path d="M50 10 L90 85 L10 85 Z" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M50 25 L80 80 L20 80 Z" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.7" />
        <path d="M50 40 L70 75 L30 75 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      </svg>
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <div className="mb-6">
      <div className="text-[10px] font-mono text-[#00F5FF] uppercase tracking-[0.3em] mb-1">{title}</div>
      <div className="h-px bg-gradient-to-r from-[#00F5FF]/40 to-transparent" />
    </div>
  );

  const prisoners = [
    ['Rached Ghannouchi', 'Ennahda Leader', 'Terrorism', '1,080d'],
    ['Noureddine Bhiri', 'Former Justice Min.', 'Terrorism', '1,550d'],
    ['Ghazi Chaouachi', 'NSF Sec. General', 'Terrorism', '1,145d'],
    ['Jaouhar Ben Mbarek', 'Const. Scholar', 'Terrorism', '1,145d'],
    ['Abir Moussi', 'PDL Leader', 'Public Order', '910d'],
    ['Sonia Dahmani', 'Lawyer/Commentator', 'Decree 54', '690d'],
    ['Mehdi Zagrouba', 'Defense Attorney', 'Terrorism', '792d'],
  ];

  const thresholds = [
    'ΔA01', 'ΔA02', 'ΔA03', 'ΔA04', 'ΔA05', 'ΔA06', 'ΔA07', 'ΔA08', 'ΔA09', 'ΔA10',
    'ΔB22', 'ΔB23', 'ΔB24', 'ΔB25', 'ΔH03', 'ΔH04', 'ΔH05', 'ΔN141', 'ΔA_TND', 'ΔA_PARALLEL'
  ];

  return (
    <div className="fixed inset-0 z-modal bg-black/90 backdrop-blur-md flex flex-col items-center overflow-y-auto py-12">
      <div className="fixed top-6 right-6 flex items-center space-x-4 z-popup">
        <button 
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center space-x-2 bg-[#00F5FF] hover:bg-[#00F5FF]/80 text-black px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>{exporting ? 'Generating 4K Assets...' : 'Export Premium (4K Images)'}</span>
        </button>
        <button 
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-on-surface transition-all"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div ref={reportRef} className="flex flex-col items-center">
        {/* PAGE 1: COVER */}
        <PageWrapper pageNum={1}>
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="mb-8">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.5em] mb-4">
                — ANALYST INTELLIGENCE REPORT —
              </div>
              <Logo />
            </div>
            
            <h1 className="text-7xl font-bold text-on-surface tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              TUNISIA <span className="text-[#00F5FF]">INTEL</span>
            </h1>
            
            <div className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-16">
              Tunisia Intelligence Report — {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • {rriState.rri >= 2.625 ? 'Critical Alert Report' : 'Daily Intelligence Report'}
            </div>

            <div className="grid grid-cols-3 gap-6 w-full max-w-2xl mb-16">
              {[
                { label: 'R(T) INDEX', value: rriState.rri.toFixed(4), color: rriState.rri >= 2.625 ? '#FF453A' : '#FFB300' },
                { label: 'P(REVOLUTION)', value: (rriState.p_rev * 100).toFixed(1) + '%', color: rriState.p_rev > 0.5 ? '#FF453A' : '#FFB300' },
                { label: 'RISK STATUS', value: rriState.rri >= 2.625 ? 'CRITICAL' : 'ELEVATED', color: rriState.rri >= 2.625 ? '#FF453A' : '#FFB300' }
              ].map((box) => (
                <div key={box.label} className="bg-black/60 border border-[#FFB300]/30 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#FFB300]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">{box.label}</div>
                  <div className="text-2xl font-bold tracking-tight" style={{ color: box.color }}>{box.value}</div>
                </div>
              ))}
            </div>

            <div className="max-w-xl text-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Executive Summary</div>
              <p className="text-sm text-slate-300 leading-relaxed font-light">
                {data.sitrep?.summary || `Tunisia remains in an ${rriState.rri >= 2.625 ? 'extremely critical' : 'elevated'} risk environment. 
                ${rriState.velocity > 0 ? 'Model velocity is positive, indicating deteriorating stability.' : 'Velocity is currently stable or improving.'}
                Pattern match to ${rriState.pattern_label || 'historical benchmarks'} remains a key monitoring priority.`}
              </p>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 2: RRI & ECONOMY */}
        <PageWrapper pageNum={2}>
          <SectionHeader title="REVOLUTIONARY RISK INDEX (RRI) — CURRENT STATE" />
          
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Primary Risk Coefficient</div>
              <div className={`text-6xl font-bold tracking-tighter mb-6 ${rriState.rri >= 2.625 ? 'text-intel-red' : 'text-[#00F5FF]'}`}>
                {rriState.rri.toFixed(4)}
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'P(REVOLUTION)', value: (rriState.p_rev * 100).toFixed(1) + '%', color: 'text-on-surface' },
                  { label: 'VELOCITY', value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3), color: rriState.velocity > 0 ? 'text-intel-red' : 'text-emerald-400' },
                  { label: 'PATTERN MATCH', value: Math.round(rriState.pattern_similarity * 100) + '%', color: 'text-on-surface' },
                  { label: 'VOLATILITY', value: rriState.volatility > 0.1 ? 'HIGH' : 'LOW', color: 'text-slate-400' }
                ].map((m) => (
                  <div key={m.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{m.label}</span>
                    <span className={`text-xs font-bold ${m.color}`}>{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Risk Accelerometers</div>
              <div className="space-y-4">
                {[
                  { label: 'Economic Stress', value: Math.min(100, Math.round((data.economy?.inflation || 7.1) * 10)), color: '#FF453A' },
                  { label: 'Social Mobilisation', value: data.social?.ugtt_mobilisation_level === 'HIGH' ? 95 : 65, color: '#FFB300' },
                  { label: 'Political Fragmentation', value: Math.round((rriState.elite_defection_prob || 0.12) * 500), color: '#00F5FF' },
                  { label: 'External Pressure', value: Math.round(100 - (data.geopolitical?.imf_deal_probability || 31)), color: '#FF453A' },
                  { label: 'Security Volatility', value: Math.round((rriState.cascade_probability || 0.58) * 100), color: '#FFB300' },
                ].map((a) => (
                  <div key={a.label} className="space-y-1">
                    <div className="flex justify-between text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
                      <span>{a.label}</span>
                      <span>{a.value}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${a.value}%`, backgroundColor: a.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SectionHeader title="ECONOMIC INTELLIGENCE" />
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {[
              { label: 'FX Reserves', value: `${data.economy?.fx_reserves || 84} days`, status: (data.economy?.fx_reserves || 84) < 90 ? 'CRITICAL' : 'OK' },
              { label: 'Inflation (CPI)', value: `${data.economy?.inflation || 7.1}%`, status: (data.economy?.inflation || 7.1) > 8 ? 'CRITICAL' : 'WARNING' },
              { label: 'TND/USD', value: String(data.economy?.tnd_usd || 3.18), status: 'STABLE' },
              { label: 'Unemployment', value: `${data.economy?.unemployment || 16.2}%`, status: (data.economy?.unemployment || 16.2) > 15 ? 'HIGH' : 'OK' },
              { label: 'Public Debt', value: `${data.economy?.public_debt || 82}% GDP`, status: (data.economy?.public_debt || 82) > 80 ? 'CRITICAL' : 'WARNING' },
              { label: 'GDP Growth', value: `${data.economy?.gdp_growth || 0.4}%`, status: (data.economy?.gdp_growth || 0.4) < 1 ? 'STAGNANT' : 'OK' },
              { label: 'Trade Deficit', value: `${data.economy?.trade_deficit || 1.2}B TND`, status: 'NEGATIVE' },
              { label: 'Remittances', value: data.economy?.remittances_total_bnd ? `${data.economy.remittances_total_bnd}B TND` : 'N/A', status: 'OK' },
            ].map((e) => (
              <div key={e.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{e.label}</span>
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-on-surface">{e.value}</span>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                    e.status === 'CRITICAL' ? 'border-red-500/30 text-red-500 bg-red-500/5' :
                    e.status === 'WARNING' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' :
                    'border-slate-500/30 text-slate-500 bg-slate-500/5'
                  }`}>{e.status}</span>
                </div>
              </div>
            ))}
          </div>
        </PageWrapper>

        {/* PAGE 3: SOCIAL & PRISONERS */}
        <PageWrapper pageNum={3}>
          <div className="grid grid-cols-2 gap-12 mb-12">
            <div>
              <SectionHeader title="SOCIAL INTELLIGENCE" />
              <div className="space-y-4">
                {[
                  { label: 'Protest Events (30d)', value: String(data.social?.protest_events_30d || 23), status: (data.social?.protest_events_30d || 23) > 20 ? 'HIGH' : 'OK' },
                  { label: 'UGTT Mobilisation', value: data.social?.ugtt_mobilisation_level || 'ELEVATED', status: data.social?.ugtt_mobilisation_level === 'HIGH' ? 'CRITICAL' : 'WARNING' },
                  { label: 'Decree 54 Charged', value: String(data.social?.decree54_charged || 14), status: 'ACTIVE' },
                  { label: 'Water Crisis Govs', value: String(data.social?.water_crisis_govs || 6), status: (data.social?.water_crisis_govs || 6) > 5 ? 'WARNING' : 'OK' },
                  { label: 'Strike Count 2025', value: String(data.social?.ugtt_strike_count_2025 || 847), status: 'ELEVATED' },
                ].map((s) => (
                  <div key={s.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{s.label}</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold text-on-surface">{s.value}</span>
                      <span className="text-[8px] font-mono text-slate-500">{s.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <SectionHeader title="ACTIVE THRESHOLD BREACHES" />
              <div className="grid grid-cols-2 gap-2">
                {(rriState.threshold_breaches && rriState.threshold_breaches.length > 0 ? rriState.threshold_breaches : thresholds).slice(0, 14).map((t: string, index: number) => (
                  <div key={`${t}-${index}`} className="flex items-center space-x-2 bg-red-500/5 border border-red-500/20 px-2 py-1.5 rounded">
                    <div className="w-1 h-3 bg-red-500" />
                    <span className="text-[9px] font-mono text-red-400 font-bold tracking-widest">⚠ {t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SectionHeader title="POLITICAL PRISONERS — DETENTION TRACKER" />
          <div className="w-full border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-[9px] font-mono text-[#00F5FF] uppercase tracking-widest">Name</th>
                  <th className="px-4 py-3 text-[9px] font-mono text-[#00F5FF] uppercase tracking-widest">Role</th>
                  <th className="px-4 py-3 text-[9px] font-mono text-[#00F5FF] uppercase tracking-widest">Charge</th>
                  <th className="px-4 py-3 text-[9px] font-mono text-[#00F5FF] uppercase tracking-widest text-right">Detention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(data.prisoners && data.prisoners.length > 0 ? data.prisoners : prisoners).map((p: any) => (
                  <tr key={p[0]} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-[10px] font-bold text-on-surface">{p[0]}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-400">{p[1]}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{p[2]}</td>
                    <td className="px-4 py-3 text-[10px] font-bold text-red-500 text-right">{p[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PageWrapper>

        {/* PAGE 4: THRESHOLDS & GEOPOLITICAL */}
        <PageWrapper pageNum={4}>
          <div className="mb-12">
            <SectionHeader title="ACTIVE THRESHOLD BREACHES (CONTINUED)" />
            <div className="grid grid-cols-4 gap-3">
              {(rriState.threshold_breaches && rriState.threshold_breaches.length > 14 ? rriState.threshold_breaches : thresholds).slice(14).map((t: string, index: number) => (
                <div key={`${t}-${index}`} className="flex items-center space-x-2 bg-red-500/5 border border-red-500/20 px-3 py-2 rounded">
                  <div className="w-1 h-4 bg-red-500" />
                  <span className="text-[10px] font-mono text-red-400 font-bold tracking-widest">⚠ {t}</span>
                </div>
              ))}
              <div className="col-span-4 mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Technical Note</div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-light">
                  Delta (Δ) indicators represent algorithmic breach points where current volatility exceeds 2-sigma historical standard deviation. 
                  Concentration in ΔA (Economic) and ΔB (Social) clusters suggests a structural decoupling of institutional stability from street-level sentiment.
                  Current R(t) is {rriState.rri.toFixed(4)} with a compound stress of {(rriState.compound_stress || 0).toFixed(3)}.
                </p>
              </div>
            </div>
          </div>

          <SectionHeader title="GEOPOLITICAL INTELLIGENCE" />
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-8">
              {[
                { label: 'IMF Deal Probability', value: `${data.geopolitical?.imf_deal_probability || 31}%`, status: (data.geopolitical?.imf_deal_probability || 31) < 40 ? 'LOW' : 'OK', desc: 'Stalled negotiations over subsidy reform' },
                { label: 'EU Relations', value: data.geopolitical?.eu_relations || 'STRAINED', status: 'WARNING', desc: 'Migration deal friction and human rights concerns' },
                { label: 'Regional Stability', value: 'VOLATILE', status: 'WARNING', desc: 'Libyan border tensions and sub-Saharan migration' },
                { label: 'US Security Aid', value: 'STABLE', status: 'OK', desc: 'Counter-terrorism cooperation remains active' },
              ].map((g) => (
                <div key={g.label} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{g.label}</div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                      g.status === 'LOW' || g.status === 'WARNING' ? 'border-amber-500/30 text-amber-500 bg-amber-500/5' : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                    }`}>{g.status}</span>
                  </div>
                  <div className="text-2xl font-bold text-on-surface mb-2">{g.value}</div>
                  <div className="text-[10px] text-slate-400 font-light">{g.desc}</div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-[#00F5FF]/5 border border-[#00F5FF]/20 rounded-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="w-5 h-5 text-[#00F5FF]" />
                <div className="text-[11px] font-mono text-[#00F5FF] uppercase tracking-widest">Strategic Outlook</div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-light">
                Tunisia's geopolitical leverage remains tied to its role as a Mediterranean migration buffer. 
                Internal economic deterioration is outpacing external support mechanisms. 
                Current R(t) velocity of {(rriState.velocity || 0).toFixed(3)} suggests {rriState.velocity > 0.1 ? 'mounting pressure' : 'a period of relative stagnation'}.
              </p>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 5: METHODOLOGY */}
        <PageWrapper pageNum={5}>
          <div className="flex-1 flex flex-col">
            <SectionHeader title="DISCLAIMER & METHODOLOGY" />
            
            <div className="space-y-8 max-w-2xl">
              <div className="space-y-3">
                <div className="text-[11px] font-mono text-on-surface uppercase tracking-widest flex items-center space-x-2">
                  <Zap className="w-3 h-3 text-[#FFB300]" />
                  <span>Intelligence Methodology</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  The Revolutionary Risk Index (RRI) is a proprietary algorithmic model developed by TUNISIAINTEL. 
                  It synthesizes high-frequency data across four primary domains: Macro-Economic Volatility, 
                  Social Mobilisation Velocity, Institutional Fragmentation, and Geopolitical Pressure. 
                  The model utilizes pattern-matching against historical revolutionary cascades (e.g., 2011, 2021) 
                  to assign a real-time risk coefficient.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-mono text-on-surface uppercase tracking-widest flex items-center space-x-2">
                  <Lock className="w-3 h-3 text-[#00F5FF]" />
                  <span>Confidentiality Notice</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  This document is a premium intelligence product intended for the exclusive use of the subscriber. 
                  Reproduction, redistribution, or unauthorized disclosure of this report, in whole or in part, 
                  is strictly prohibited. The information contained herein is derived from open-source intelligence (OSINT) 
                  and proprietary analysis. While every effort is made to ensure accuracy, TUNISIAINTEL provides no 
                  warranties regarding the predictive outcomes described.
                </p>
              </div>

              <div className="space-y-3">
                <div className="text-[11px] font-mono text-on-surface uppercase tracking-widest flex items-center space-x-2">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span>Risk Warning</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  Political risk is inherently non-linear. Small events can trigger disproportionate systemic responses. 
                  Analysts should maintain high situational awareness of "black swan" triggers not captured by 
                  statistical models, including sudden health crises of key political actors or localized security incidents.
                </p>
              </div>

              <div className="mt-auto pt-12 flex flex-col items-center text-center">
                <Logo />
                <div className="mt-6 text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em]">
                  TUNISIAINTEL STRATEGIC INTELLIGENCE UNIT
                </div>
                <div className="text-[8px] font-mono text-slate-600 mt-2">
                  EST. 2024 • TUNIS / LONDON / GENEVA
                </div>
              </div>
            </div>
          </div>
        </PageWrapper>
      </div>
    </div>
  );
};

export default PremiumReport;

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
