import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { motion, AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import { 
  RotateCcw, 
  Zap, 
  AlertTriangle, 
  Info,
  Clock,
  TrendingUp,
  Activity,
  Globe
} from 'lucide-react';

const Equation: React.FC<{
  latex: string;
  display?: boolean;
  className?: string;
}> = ({ latex, display = true, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode: display,
          throwOnError: false,
          errorColor: '#ff453a',
          output: 'html',
        });
      } catch (e) {
        if (ref.current) {
          ref.current.textContent = latex;
        }
      }
    }
  }, [latex, display]);

  return (
    <div
      ref={ref}
      className={`katex-container overflow-x-auto ${className}`}
    />
  );
};

const EquationCard: React.FC<{
  number: string;
  title: string;
  latex: string;
  description?: string;
  currentOutput?: string;
  source?: 'paper' | 'extension';
  className?: string;
}> = ({ number, title, latex, description, currentOutput, source = 'paper', className = '' }) => (
  <div className={`rounded-2xl border p-4 md:p-6 space-y-4 ${
    source === 'extension'
      ? 'border-intel-orange/30 bg-intel-orange/5'
      : 'border-intel-cyan/20 bg-black/30'
  } ${className}`}>
    <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
      <div className="space-y-1">
        <div className="flex items-center space-x-3">
          <span className={`text-[10px] md:text-xs font-mono font-bold px-1.5 md:px-2 py-0.5 rounded border uppercase ${
            source === 'extension'
              ? 'text-intel-orange border-intel-orange/30 bg-intel-orange/10'
              : 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10'
          }`}>
            EQ.{number}
          </span>
          {source === 'extension' && (
            <span className="text-[8px] md:text-[9px] font-mono text-intel-orange border border-intel-orange/20 px-1.5 md:px-2 py-0.5 rounded">
              TUNISIAINTEL EXTENSION
            </span>
          )}
        </div>
        <h3 className="text-white font-bold text-xs md:text-sm uppercase tracking-wider">{title}</h3>
      </div>
      {currentOutput && (
        <div className="text-left sm:text-right">
          <div className="text-[8px] md:text-[9px] font-mono text-slate-500 uppercase">
            Current Output
          </div>
          <div className={`text-lg md:text-xl font-mono font-bold ${
            source === 'extension' ? 'text-intel-orange' : 'text-intel-cyan'
          }`}>
            {currentOutput}
          </div>
        </div>
      )}
    </div>
    <div className="py-2">
      <Equation 
        latex={latex} 
        className={source === 'extension' ? 'text-intel-orange' : 'text-intel-cyan'}
      />
    </div>
    {description && (
      <p className="text-[11px] text-slate-400 leading-relaxed">
        {description}
      </p>
    )}
  </div>
);

const CYCLES = {
  c1: {
    label: '1-Year Cycle', weight: 0.15,
    phases: [
      { id:'jan_feb',  label:'Winter Stress',   months:[1,2],   risk:0.65, color:'#6898be',
        note:'Unemployment peaks, energy bills, post-holiday pressure' },
      { id:'mar_apr',  label:'Ramadan Window',  months:[3,4],   risk:0.80, color:'#ff9f0a',
        note:'Consumption pressure, food price sensitivity, political mobilization high' },
      { id:'may_jun',  label:'Pre-Summer',      months:[5,6],   risk:0.55, color:'#ffd60a',
        note:'Labor disputes, university exams, protest activity rises' },
      { id:'jul_aug',  label:'Summer Peak',     months:[7,8],   risk:0.85, color:'#ff2d55',
        note:'Water stress maximum, heat events, interior protests' },
      { id:'sep_oct',  label:'Budget Season',   months:[9,10],  risk:0.70, color:'#ff9f0a',
        note:'Subsidy reform signals, UGTT wage negotiations' },
      { id:'nov_dec',  label:'Year-End',        months:[11,12], risk:0.50, color:'#2fd158',
        note:'Diplomatic season, lower protest density, calendar reset' },
    ],
  },
  c30: {
    label: '30-Year Leadership Cycle', weight: 0.35,
    cycle_start_year: 2011, length_years: 30,
    phases: [
      { id:'formation',  label:'Crisis Formation',   years:[0,5],   risk:0.40, color:'#2fd158',
        note:'New leadership from crisis. Selection pressure high.' },
      { id:'expansion',  label:'Expansion',          years:[5,12],  risk:0.30, color:'#00d4ff',
        note:'System builds capacity. Institutional development.' },
      { id:'peak',       label:'Peak & Complacency', years:[12,18], risk:0.55, color:'#ffd60a',
        note:'Complacency begins. Selection pressure drops. Patronage rises.' },
      { id:'fragility',  label:'Fragility',          years:[18,24], risk:0.78, color:'#ff9f0a',
        note:'Elite networks ossify. Institutional entropy. Disconnect grows.' },
      { id:'terminal',   label:'Terminal Decline',   years:[24,30], risk:0.92, color:'#ff2d55',
        note:'Rapid institutional decay. System approaches reset.' },
    ],
  },
  c120: {
    label: '120-Year Regime Cycle', weight: 0.35,
    cycle_start_year: 1956, length_years: 120,
    phases: [
      { id:'founding',      label:'Founding',            pct:[0,15],   risk:0.25, color:'#2fd158',
        note:'New paradigm established. Strong ideological cohesion.' },
      { id:'consolidation', label:'Consolidation',       pct:[15,35],  risk:0.30, color:'#00d4ff',
        note:'State-building. Economic model established.' },
      { id:'expansion',     label:'Peak Expansion',      pct:[35,55],  risk:0.40, color:'#ffd60a',
        note:'Maximum reach. Soft power peaks. Cracks appear.' },
      { id:'rigidity',      label:'Structural Rigidity', pct:[55,75],  risk:0.65, color:'#ff9f0a',
        note:'Bureaucratic ossification. Elite capture accelerates.' },
      { id:'capture',       label:'Elite Capture',       pct:[75,90],  risk:0.82, color:'#ff2d55',
        note:'Rent-seeking dominates. Legitimacy collapses.' },
      { id:'terminal',      label:'Terminal / Reset',    pct:[90,100], risk:0.95, color:'#ff2d55',
        note:'System non-functional. Shock triggers change.' },
    ],
  },
  c500: {
    label: '500-Year Civilizational Cycle', weight: 0.15,
    phases: [
      { id:'ottoman',    label:'Ottoman Integration', years:[1500,1881], color:'#6898be',
        note:'North Africa in Ottoman system. Trans-Saharan trade. Islamic institutions.' },
      { id:'colonial',   label:'Colonial Period',     years:[1881,1956], color:'#bf5af2',
        note:'French protectorate. Extraction model. Nationalist counter-movement.' },
      { id:'national',   label:'National State',      years:[1956,2011], color:'#ffd60a',
        note:'Post-colonial state-building. Bourguibist authoritarian modernization.' },
      { id:'transition', label:'Transition / Crisis', years:[2011,2050], color:'#ff9f0a',
        note:'Post-authoritarian transition. Unresolved identity and economic model.' },
      { id:'future',     label:'Future Configuration',years:[2050,2100], color:'#2fd158',
        note:'Projected: digital economy, climate adaptation, new regional order.' },
    ],
  },
};

export const CycleAnalysisTab: React.FC = () => {
  const { rriState, fullData: data } = useRiskMetrics();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'c1' | 'c30' | 'c120' | 'c500' | 'accel'>('overview');

  const cycleData = useMemo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentYear = 2026; // As per user context

    // C1
    const c1ph = CYCLES.c1.phases.find(p => p.months.includes(month)) || CYCLES.c1.phases[0];
    const C1t = c1ph.risk;

    // C30
    const yearsIn30 = currentYear - CYCLES.c30.cycle_start_year;
    const c30ph = CYCLES.c30.phases.find(p => yearsIn30 >= p.years[0] && yearsIn30 < p.years[1]) || CYCLES.c30.phases[3];
    const pos30 = (yearsIn30 - c30ph.years[0]) / (c30ph.years[1] - c30ph.years[0]);
    const C30t = Math.min(1, c30ph.risk + pos30 * 0.08);

    // C120
    const yearsIn120 = currentYear - CYCLES.c120.cycle_start_year;
    const pct120 = (yearsIn120 / 120) * 100;
    const c120ph = CYCLES.c120.phases.find(p => pct120 >= p.pct[0] && pct120 < p.pct[1]) || CYCLES.c120.phases[3];
    const pos120 = (pct120 - c120ph.pct[0]) / (c120ph.pct[1] - c120ph.pct[0]);
    const C120t = Math.min(1, c120ph.risk + pos120 * 0.05);

    // C500
    const C500t = 0.62;

    const CPI = 0.15 * C1t + 0.35 * C30t + 0.35 * C120t + 0.15 * C500t;

    return {
      CPI, C1t, C30t, C120t, C500t,
      currentPhase1: c1ph,
      currentPhase30: c30ph,
      currentPhase120: c120ph,
      yearsIn30, yearsIn120,
      pct30: (yearsIn30 / 30 * 100),
      pct120: pct120
    };
  }, []);

  const accelData = useMemo(() => {
    // Mock time series data since it's not in PlatformData
    const series = [
      { rri: 2.1, month: '2025-06' },
      { rri: 2.15, month: '2025-07' },
      { rri: 2.2, month: '2025-08' },
      { rri: 2.22, month: '2025-09' },
      { rri: 2.28, month: '2025-10' },
      { rri: 2.31, month: '2025-11', note: 'Budget protests' },
    ];
    
    const recent = series.slice(-6);
    const n = recent.length;
    const rVals = recent.map(d => d.rri);

    let sx=0, sy=0, sxy=0, sx2=0;
    rVals.forEach((y, i) => { sx += i; sy += y; sxy += i * y; sx2 += i * i; });
    const dRdt = (n * sxy - sx * sy) / (n * sx2 - sx * sx);

    const vels: number[] = [];
    for (let i = 1; i < rVals.length; i++) vels.push(rVals[i] - rVals[i - 1]);
    let dVdt = 0;
    if (vels.length >= 2) {
      const vs: number[] = [];
      for (let i = 1; i < vels.length; i++) vs.push(vels[i] - vels[i - 1]);
      dVdt = vs.reduce((a, b) => a + b, 0) / vs.length;
    }

    const shockDensity = recent.filter(d => d.note && d.note.length > 0).length / n;
    const At = Math.max(0, Math.min(1, 3.0 * Math.max(0, dRdt) + 5.0 * Math.max(0, dVdt) + 0.4 * shockDensity));
    const label = At >= 0.70 ? 'CRITICAL' : At >= 0.50 ? 'HIGH' : At >= 0.30 ? 'MODERATE' : At >= 0.15 ? 'LOW' : 'STABLE';
    const color = At >= 0.70 ? '#ff2d55' : At >= 0.50 ? '#ff9f0a' : At >= 0.30 ? '#ffd60a' : '#2fd158';
    const feedback = 0.08 + shockDensity * 0.12;
    const At_next = Math.min(1, At * (1 + feedback));
    const R = rriState.rri;
    const controlCapacity = Math.max(0, 1 - (R - 1.5) / 3.5);
    const losingControl = At > controlCapacity;
    const interpretation = losingControl
      ? `Acceleration (${At.toFixed(2)}) exceeds state control capacity (${controlCapacity.toFixed(2)}). Non-linear tipping point risk elevated.`
      : `Control capacity (${controlCapacity.toFixed(2)}) still exceeds acceleration (${At.toFixed(2)}). Deterioration manageable.`;

    return { At, At_next, dRdt, dVdt, shockDensity, feedback, controlCapacity, losingControl, label, color, interpretation };
  }, [data, rriState.rri]);

  const uplift = useMemo(() => {
    return (cycleData.CPI > 0.70 && accelData.At > 0.40) ? Math.min(0.08, (cycleData.CPI - 0.70) * 0.3 + (accelData.At - 0.40) * 0.15) : 0;
  }, [cycleData.CPI, accelData.At]);

  const cpiCol = cycleData.CPI >= 0.75 ? '#ff2d55' : cycleData.CPI >= 0.60 ? '#ff9f0a' : '#ffd60a';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Tab Explanation Title */}
      <div className="space-y-3 pb-4 border-b border-white/5">
        <div className="flex items-center space-x-3">
          <RotateCcw className="w-6 h-6 text-intel-cyan" />
          <h2 className="text-xl font-bold text-white uppercase tracking-widest">Temporal Cycle Analysis</h2>
        </div>
        <p className="text-slate-400 text-xs leading-relaxed max-w-4xl">
          The RRI model utilizes a multi-temporal approach to risk assessment. History does not repeat, but it rhymes through predictable institutional and social cycles. By mapping 1-year seasonal stress, 30-year leadership dynamics, 120-year regime patterns, and 500-year civilizational shifts, we identify points of maximum structural convergence.
        </p>
      </div>

      {/* Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">CPI(t) — EQ.22</div>
            <div className="text-2xl font-bold font-mono" style={{ color: cpiCol }}>{cycleData.CPI.toFixed(3)}</div>
          </div>
          <RotateCcw className="w-8 h-8 opacity-20" style={{ color: cpiCol }} />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">A(t) — EQ.23</div>
            <div className="text-2xl font-bold font-mono" style={{ color: accelData.color }}>{accelData.At.toFixed(3)}</div>
            <div className="text-[10px] font-bold" style={{ color: accelData.color }}>{accelData.label}</div>
          </div>
          <Zap className="w-8 h-8 opacity-20" style={{ color: accelData.color }} />
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">P_rev Adjusted</div>
            <div className="text-2xl font-bold font-mono" style={{ color: uplift > 0.03 ? '#ff9f0a' : '#2fd158' }}>
              {Math.min(99, Math.round(rriState.p_rev * 100 + uplift * 100))}%
            </div>
            <div className="text-[10px] text-slate-500">+{ (uplift * 100).toFixed(1) }% cycle uplift</div>
          </div>
          <AlertTriangle className="w-8 h-8 opacity-20" style={{ color: uplift > 0.03 ? '#ff9f0a' : '#2fd158' }} />
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl border border-white/10 w-fit overflow-x-auto max-w-full">
        {[
          { id: 'overview', label: 'Overview', icon: Globe },
          { id: 'c1', label: '1-Year', icon: Clock },
          { id: 'c30', label: '30-Year', icon: TrendingUp },
          { id: 'c120', label: '120-Year', icon: Activity },
          { id: 'c500', label: '500-Year', icon: RotateCcw },
          { id: 'accel', label: 'Acceleration', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'bg-white/10 text-white shadow-lg' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeSubTab === 'overview' && <OverviewTab cycle={cycleData} accel={accelData} uplift={uplift} p_rev={rriState.p_rev} />}
            {activeSubTab === 'c1' && <C1Tab cycle={cycleData} />}
            {activeSubTab === 'c30' && <C30Tab cycle={cycleData} />}
            {activeSubTab === 'c120' && <C120Tab cycle={cycleData} />}
            {activeSubTab === 'c500' && <C500Tab />}
            {activeSubTab === 'accel' && <AccelTab accel={accelData} data={data} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const OverviewTab = ({ cycle, accel, uplift, p_rev }: any) => {
  const cpiCol = cycle.CPI >= 0.75 ? '#ff2d55' : cycle.CPI >= 0.60 ? '#ff9f0a' : '#ffd60a';
  const rows = [
    { label:'1-Year Seasonal',    val:cycle.C1t,   phase:cycle.currentPhase1.label,   color:cycle.currentPhase1.color },
    { label:'30-Year Leadership', val:cycle.C30t,  phase:cycle.currentPhase30.label,  color:cycle.currentPhase30.color },
    { label:'120-Year Regime',    val:cycle.C120t, phase:cycle.currentPhase120.label, color:cycle.currentPhase120.color },
    { label:'500-Year Civiliz.',  val:cycle.C500t, phase:'Transition / Crisis',       color:'#ff9f0a' },
  ];

  const W=600, H=360, pad={t:50,b:60,l:180,r:40};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  const rowH = Math.floor(cH/4);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquationCard 
          number="22"
          title="Cycle Position Index"
          source="extension"
          latex="CPI(t) = 0.15 \cdot C_1(t) + 0.35 \cdot C_{30}(t) + 0.35 \cdot C_{120}(t) + 0.15 \cdot C_{500}(t)"
          currentOutput={cycle.CPI.toFixed(3)}
          description="Calculates the aggregate temporal risk by weighting seasonal, leadership, regime, and civilizational cycles."
        />

        <EquationCard 
          number="23"
          title="Acceleration Index"
          source="extension"
          latex="A(t) = 3.0 \cdot \frac{dR}{dt} + 5.0 \cdot \frac{dV}{dt} + 0.4 \cdot Shock(t)"
          currentOutput={`${accel.At.toFixed(3)} — ${accel.label}`}
          description="Measures the second derivative of risk, identifying non-linear tipping points where deterioration exceeds state control capacity."
        />
      </div>

      <div className="bg-black/40 border border-white/5 rounded-2xl p-8 md:p-10">
        <div className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-10 text-center">Cycle Risk Pressure — All Scales (Normalized)</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block font-mono">
          <rect x={pad.l} y={pad.t} width={cW} height={cH} fill="#030d1a" rx="6"/>
          {[0,25,50,75,100].map(v => (
            <React.Fragment key={v}>
              <line x1={pad.l+v/100*cW} y1={pad.t} x2={pad.l+v/100*cW} y2={pad.t+cH} stroke="#0d1e36" strokeWidth="2"/>
              <text x={pad.l+v/100*cW} y={H-24} textAnchor="middle" fontSize="14" fill="#475569" fontWeight="bold">{v}%</text>
            </React.Fragment>
          ))}
          {rows.map((r, i) => {
            const y = pad.t + i*rowH + rowH*0.15;
            const bH = rowH*0.7;
            const fillW = r.val * cW;
            return (
              <React.Fragment key={r.label}>
                <text x={pad.l-20} y={y+bH*0.6} textAnchor="end" fontSize="14" fill="#94a3b8" fontWeight="700">{r.label}</text>
                <rect x={pad.l} y={y} width={cW} height={bH} fill="#0c1830" rx="4"/>
                <rect x={pad.l} y={y} width={fillW} height={bH} fill={r.color} opacity="0.85" rx="4">
                  <animate attributeName="width" from="0" to={fillW} dur="1.5s" fill="freeze" />
                </rect>
                <text x={pad.l + fillW + 10} y={y+bH*0.65} fontSize="16" fill={r.color} fontWeight="900">{Math.round(r.val*100)}%</text>
                <text x={pad.l + cW - 8} y={y+bH*0.65} textAnchor="end" fontSize="11" fill={`${r.color}cc`} fontWeight="600">{r.phase}</text>
              </React.Fragment>
            );
          })}
          <line x1={pad.l+cW*0.70} y1={pad.t-10} x2={pad.l+cW*0.70} y2={pad.t+cH+10} stroke="#ffd60a" strokeWidth="2" strokeDasharray="6,6" opacity="0.6"/>
          <text x={pad.l+cW*0.70+8} y={pad.t-15} fontSize="12" fill="#ffd60a" fontWeight="bold">70% CRITICAL THRESHOLD</text>
          <line x1={pad.l + cycle.CPI*cW} y1={pad.t-20} x2={pad.l + cycle.CPI*cW} y2={pad.t+cH+20} stroke={cpiCol} strokeWidth="5" opacity="1"/>
          <text x={pad.l + cycle.CPI*cW} y={pad.t-25} textAnchor="middle" fontSize="16" fill={cpiCol} fontWeight="900">CPI = {cycle.CPI.toFixed(3)}</text>
        </svg>
      </div>

      <div className={`p-4 rounded-xl border ${uplift > 0.03 ? 'bg-intel-red/5 border-intel-red/20' : 'bg-white/5 border-white/10'}`}>
        <div className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center">
          <Activity className="w-4 h-4 mr-2" /> Combined Assessment
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          {uplift > 0.03
            ? `⚠ CPI (${cycle.CPI.toFixed(2)}) × A(t) (${accel.At.toFixed(2)}) exceed combined threshold. Cycle pressure adds +${(uplift*100).toFixed(1)}% to P_rev → adjusted ${Math.min(99,Math.round(p_rev*100+uplift*100))}% vs baseline ${Math.round(p_rev*100)}%.`
            : `Cycle pressure below uplift threshold. P_rev baseline ${Math.round(p_rev*100)}% holds. Monitor summer stress + C30 fragility deepening.`}
        </div>
      </div>
    </div>
  );
};

const C1Tab = ({ cycle }: any) => {
  const phases = CYCLES.c1.phases;
  const curMonth = new Date().getMonth() + 1;
  const W=360, cx=180, cy=160, r1=110, r2=75, r3=48;

  const segs = phases.map((p, i) => {
    const startDeg = -90 + i*60;
    const endDeg   = startDeg + 60;
    const rad = (a: number) => a * Math.PI / 180;
    const x1o = cx + r1*Math.cos(rad(startDeg)), y1o = cy + r1*Math.sin(rad(startDeg));
    const x2o = cx + r1*Math.cos(rad(endDeg)),   y2o = cy + r1*Math.sin(rad(endDeg));
    const x1i = cx + r2*Math.cos(rad(startDeg)), y1i = cy + r2*Math.sin(rad(startDeg));
    const x2i = cx + r2*Math.cos(rad(endDeg)),   y2i = cy + r2*Math.sin(rad(endDeg));
    const isCur = p.months.includes(curMonth);
    const riskR = r2 + (r1-r2)*p.risk;
    const midDeg = startDeg+30;
    const riskX = cx + riskR*Math.cos(rad(midDeg)), riskY = cy + riskR*Math.sin(rad(midDeg));

    return { p, isCur, startDeg, endDeg, rad, x1o,y1o,x2o,y2o,x1i,y1i,x2i,y2i,riskX,riskY,midDeg };
  });

  const curPhase = segs.find(s=>s.isCur);
  const curRisk = curPhase ? Math.round(curPhase.p.risk*100) : 0;

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400 leading-relaxed max-w-2xl">
        The seasonal stress cycle is operationally actionable. Protest density, food price sensitivity, and institutional response all vary predictably across Tunisia's calendar.
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl p-6">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">
          Seasonal Risk Clock — Current: {curPhase?.p.label.toUpperCase()} ({curRisk}% Risk)
        </div>
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <svg width="360" height="320" viewBox="0 0 360 320" className="shrink-0 font-mono">
            <circle cx={cx} cy={cy} r={r1+16} fill="#030d1a" stroke="#0d1e36" strokeWidth="1"/>
            {segs.map((s, i) => {
              const d = `M${s.x1i},${s.y1i} L${s.x1o},${s.y1o} A${r1},${r1} 0 0,1 ${s.x2o},${s.y2o} L${s.x2i},${s.y2i} A${r2},${r2} 0 0,0 ${s.x1i},${s.y1i} Z`;
              return (
                <React.Fragment key={s.p.id}>
                  <path d={d} fill={s.p.color} opacity={s.isCur?'0.85':'0.28'} stroke="#020810" strokeWidth="1.5"/>
                  {s.isCur && <path d={d} fill="none" stroke={s.p.color} strokeWidth="2" opacity="0.9"/>}
                </React.Fragment>
              );
            })}
            <circle cx={cx} cy={cy} r={r3} fill="#020810" stroke="#0d1e36" strokeWidth="1"/>
            <text x={cx} y={cy-8} textAnchor="middle" fontSize="7" fill="#132030">SEASONAL</text>
            <text x={cx} y={cy+4} textAnchor="middle" fontSize="7" fill="#132030">RISK</text>
            <text x={cx} y={cy+16} textAnchor="middle" fontSize="9" fill={curPhase?.p.color || '#fff'} fontWeight="700">{curRisk}%</text>
            {['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((name, i) => {
              if (i === 0) return null;
              const deg = -90 + (i-1)*30;
              const mx = cx + (r1+14)*Math.cos(deg*Math.PI/180);
              const my = cy + (r1+14)*Math.sin(deg*Math.PI/180);
              const isCurM = i === curMonth;
              return <text key={name} x={mx} y={my+3} textAnchor="middle" fontSize={isCurM?8:6} fill={isCurM?'#fff':'#1c3654'} fontWeight={isCurM?700:400}>{name}</text>;
            })}
            {segs.map(s => {
              const labelR = r2 - 12;
              const lx2 = cx + labelR*Math.cos(s.rad(s.midDeg));
              const ly2 = cy + labelR*Math.sin(s.rad(s.midDeg));
              return <text key={s.p.id} x={lx2} y={ly2+3} textAnchor="middle" fontSize="5.5" fill={`${s.p.color}${s.isCur?'ff':'88'}`}>{s.p.label.split(' ')[0]}</text>;
            })}
            {(() => {
              const curDeg = -90 + (curMonth-1)*30 + 15;
              const nx = cx + (r2-8)*Math.cos(curDeg*Math.PI/180);
              const ny = cy + (r2-8)*Math.sin(curDeg*Math.PI/180);
              return <circle cx={nx} cy={ny} r="5" fill={curPhase?.p.color || '#fff'} stroke="#020810" strokeWidth="2"/>;
            })()}
          </svg>

          <div className="flex-1 space-y-2 w-full">
            {phases.map(p => {
              const isCur = p.months.includes(curMonth);
              return (
                <div key={p.id} className={`p-3 rounded-lg border-l-4 transition-all ${isCur ? 'bg-white/5 border-l-intel-cyan' : 'bg-white/2 border-l-white/10'}`} style={{ borderLeftColor: p.color }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: p.color }}>{p.label}</span>
                    <span className="text-[10px] font-mono font-bold" style={{ color: p.color }}>{Math.round(p.risk*100)}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full mb-2 overflow-hidden">
                    <div className="h-full" style={{ width: `${p.risk*100}%`, backgroundColor: p.color }} />
                  </div>
                  <div className="text-[9px] text-slate-500 leading-relaxed">{p.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const C30Tab = ({ cycle }: any) => {
  const phases = CYCLES.c30.phases;
  const yearsIn = cycle.yearsIn30;
  const W=600, H=280, pad={t:50,b:60,l:30,r:30};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;

  const riskPts: string[] = [];
  for (let y=0; y<=30; y++) {
    const ph = phases.find(p => y>=p.years[0] && y<p.years[1]) || phases[phases.length-1];
    const pos = (y - ph.years[0]) / (ph.years[1] - ph.years[0]);
    const risk = Math.min(1, ph.risk + pos*0.06);
    const x = pad.l + (y/30)*cW;
    const yPos = pad.t + (1-risk)*cH;
    riskPts.push(`${x.toFixed(1)},${yPos.toFixed(1)}`);
  }

  const areaPath = `M${riskPts[0]} ` + riskPts.slice(1).map(p=>`L${p}`).join(' ') + ` L${(pad.l+cW).toFixed(1)},${pad.t+cH} L${pad.l},${pad.t+cH} Z`;

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400 leading-relaxed max-w-2xl">
        The 30-year cycle encodes the elite selection feedback loop. Tunisia is currently 15 years in — at the transition between Peak and Fragility phases.
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl p-6 overflow-x-auto">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">30-Year Leadership Cycle — Tunisia 2026 (Year {yearsIn})</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block font-mono min-w-[500px]">
          <rect x={pad.l} y={pad.t} width={cW} height={cH} fill="#030d1a" rx="2"/>
          {phases.map(p => {
            const x1 = pad.l + (p.years[0]/30)*cW;
            const x2 = pad.l + (p.years[1]/30)*cW;
            const midX = (x1+x2)/2;
            return (
              <React.Fragment key={p.id}>
                <rect x={x1} y={pad.t} width={x2-x1} height={cH} fill={p.color} opacity="0.06"/>
                <line x1={x2} y1={pad.t} x2={x2} y2={pad.t+cH} stroke={p.color} strokeWidth="0.5" opacity="0.3"/>
                <text x={midX} y={pad.t+cH+14} textAnchor="middle" fontSize="6" fill={`${p.color}88`}>{p.label}</text>
              </React.Fragment>
            );
          })}
          {[0,25,50,75,100].map(v=>(
            <React.Fragment key={v}>
              <line x1={pad.l} x2={pad.l+cW} y1={pad.t+(1-v/100)*cH} y2={pad.t+(1-v/100)*cH} stroke="#0d1e36" strokeWidth="1"/>
              <text x={pad.l-4} y={pad.t+(1-v/100)*cH+3} textAnchor="end" fontSize="6" fill="#1e3d55">{v}%</text>
            </React.Fragment>
          ))}
          {[0,5,10,15,20,25,30].map(y=>(
            <text key={y} x={pad.l+(y/30)*cW} y={H-10} textAnchor="middle" fontSize="6" fill="#1e3d55">{y}y</text>
          ))}
          <path d={areaPath} fill="#ff9f0a" opacity="0.06"/>
          <polyline points={riskPts.join(' ')} fill="none" stroke="#ff9f0a" strokeWidth="2" opacity="0.9"/>
          
          {[
            { y:0,  label:'Revolution 2011', color:'#ff2d55' },
            { y:3,  label:'New Constitution', color:'#2fd158' },
            { y:9,  label:'Saied elected 2019', color:'#ffd60a' },
            { y:10.5,label:'Coup July 2021', color:'#ff2d55' },
            { y:15, label:'NOW 2026', color:'#00d4ff', current:true },
          ].map(e => {
            const ex = pad.l + (e.y/30)*cW;
            const ph = phases.find(p => e.y>=p.years[0] && e.y<p.years[1]) || phases[phases.length-1];
            const ey = pad.t + (1-ph.risk)*cH - 8;
            return (
              <React.Fragment key={e.label}>
                <line x1={ex} x2={ex} y1={ey} y2={pad.t+cH} stroke={e.color} strokeWidth={e.current?2:0.8} strokeDasharray={e.current?'':'3,3'} opacity="0.7"/>
                <circle cx={ex} cy={ey} r={e.current?5:3} fill={e.color} stroke="#020810" strokeWidth="1.5"/>
                <text x={ex} y={ey-8} textAnchor="middle" fontSize={e.current?7:5.5} fill={e.color} fontWeight={e.current?700:400}>{e.label}</text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const C120Tab = ({ cycle }: any) => {
  const phases = CYCLES.c120.phases;
  const pct = cycle.pct120;
  const yearsIn = cycle.yearsIn120;
  const W=600, H=260, pad={t:45,b:55,l:30,r:30};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;

  const riskPts: string[] = [];
  for (let p2=0; p2<=100; p2++) {
    const ph = phases.find(ph => p2>=ph.pct[0] && p2<ph.pct[1]) || phases[phases.length-1];
    const pos = (p2 - ph.pct[0]) / (ph.pct[1] - ph.pct[0]);
    const risk = Math.min(1, ph.risk + pos*0.04);
    riskPts.push(`${(pad.l+p2/100*cW).toFixed(1)},${(pad.t+(1-risk)*cH).toFixed(1)}`);
  }

  const areaPath = `M${riskPts[0]} ` + riskPts.slice(1).map(p=>`L${p}`).join(' ') + ` L${(pad.l+cW).toFixed(1)},${pad.t+cH} L${pad.l},${pad.t+cH} Z`;

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400 leading-relaxed max-w-2xl">
        The 120-year regime cycle tracks Tunisia's modern state arc from independence (1956). At 70 years in (58% of cycle), Tunisia is entering Structural Rigidity.
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl p-6 overflow-x-auto">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">120-Year Regime Cycle — Tunisia at Year {yearsIn} ({pct.toFixed(0)}%)</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block font-mono min-w-[500px]">
          <rect x={pad.l} y={pad.t} width={cW} height={cH} fill="#030d1a" rx="2"/>
          {phases.map(p => {
            const x1 = pad.l + p.pct[0]/100*cW;
            const x2 = pad.l + p.pct[1]/100*cW;
            const midX = (x1+x2)/2;
            return (
              <React.Fragment key={p.id}>
                <rect x={x1} y={pad.t} width={x2-x1} height={cH} fill={p.color} opacity="0.07"/>
                <line x1={x2} y1={pad.t} x2={x2} y2={pad.t+cH} stroke={p.color} strokeWidth="0.5" opacity="0.3"/>
                <text x={midX} y={pad.t+cH+14} textAnchor="middle" fontSize="5.5" fill={`${p.color}88`}>{p.label.split(' ')[0]}</text>
              </React.Fragment>
            );
          })}
          {[0,25,50,75,100].map(v=>(
            <React.Fragment key={v}>
              <line x1={pad.l} x2={pad.l+cW} y1={pad.t+(1-v/100)*cH} y2={pad.t+(1-v/100)*cH} stroke="#0d1e36" strokeWidth="1"/>
              <text x={pad.l-4} y={pad.t+(1-v/100)*cH+3} textAnchor="end" fontSize="6" fill="#1e3d55">{v}%</text>
            </React.Fragment>
          ))}
          {[1956,1970,1990,2010,2026,2076].map(yr=>{
            const xPct = (yr-1956)/120*100;
            if (xPct < 0 || xPct > 105) return null;
            return <text key={yr} x={pad.l+xPct/100*cW} y={H-8} textAnchor="middle" fontSize="6.5" fill={yr===2026?'#00d4ff':'#1e3d55'} fontWeight={yr===2026?700:400}>{yr}</text>;
          })}
          <path d={areaPath} fill="#bf5af2" opacity="0.05"/>
          <polyline points={riskPts.join(' ')} fill="none" stroke="#bf5af2" strokeWidth="2" opacity="0.9"/>
          {[
            { yr:1956, label:'Independence', color:'#2fd158' },
            { yr:1987, label:'Ben Ali coup', color:'#ff9f0a' },
            { yr:2011, label:'Revolution',   color:'#ff2d55' },
            { yr:2026, label:'NOW',          color:'#00d4ff', current:true },
          ].map(e => {
            const xPct2 = (e.yr-1956)/120*100;
            const ex = pad.l + xPct2/100*cW;
            const ph = phases.find(p => xPct2>=p.pct[0] && xPct2<p.pct[1]) || phases[phases.length-1];
            const ey = pad.t + (1-ph.risk)*cH - 6;
            return (
              <React.Fragment key={e.label}>
                <line x1={ex} x2={ex} y1={ey} y2={pad.t+cH} stroke={e.color} strokeWidth={e.current?2:0.8} strokeDasharray={e.current?'':'3,3'} opacity="0.8"/>
                <circle cx={ex} cy={ey} r={e.current?5:3} fill={e.color} stroke="#020810" strokeWidth="1.5"/>
                <text x={ex} y={ey-7} textAnchor="middle" fontSize={e.current?7:5.5} fill={e.color} fontWeight={e.current?700:400}>{e.label}</text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

const C500Tab = () => {
  const phases = CYCLES.c500.phases;
  const W=600, H=180, pad={t:30,b:50,l:30,r:30};
  const cW=W-pad.l-pad.r, totalYrs=600, startYr=1500;
  const nowX = pad.l + ((2026-startYr)/totalYrs)*cW;

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400 leading-relaxed max-w-2xl">
        The 500-year cycle is a strategic baseline. The current "Transition/Crisis" phase reflects an unresolved identity and economic model following the breakdown of the Bourguibist synthesis.
      </div>

      <div className="bg-black/40 border border-white/5 rounded-xl p-6 overflow-x-auto">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6">500-Year Civilizational Arc — North Africa / Tunisia</div>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block font-mono min-w-[500px]">
          <rect x={pad.l} y={pad.t} width={cW} height={H-pad.t-pad.b} fill="#030d1a" rx="2"/>
          {[1500,1600,1700,1800,1900,2000,2100].map(yr => {
            const tx = pad.l + ((yr-startYr)/totalYrs)*cW;
            return (
              <React.Fragment key={yr}>
                <line x1={tx} y1={pad.t} x2={tx} y2={H-pad.b} stroke="#0d1e36" strokeWidth="1"/>
                <text x={tx} y={H-12} textAnchor="middle" fontSize="6.5" fill="#1e3d55">{yr}</text>
              </React.Fragment>
            );
          })}
          {phases.map(p => {
            const x1 = pad.l + ((p.years[0]-startYr)/totalYrs)*cW;
            const x2 = pad.l + ((p.years[1]-startYr)/totalYrs)*cW;
            const spanW = x2-x1;
            const midX = (x1+x2)/2;
            const isCur = p.years[0]<=2026 && p.years[1]>=2026;
            return (
              <React.Fragment key={p.id}>
                <rect x={x1} y={pad.t} width={spanW} height={H-pad.t-pad.b} fill={p.color} opacity={isCur?0.15:0.07} rx="2" stroke={p.color} strokeWidth={isCur?1.5:0.5} strokeOpacity={isCur?0.6:0.2}/>
                <text x={midX} y={pad.t+14} textAnchor="middle" fontSize={isCur?8:6} fill={`${p.color}${isCur?'':'88'}`} fontWeight={isCur?700:400}>{p.label}</text>
                <text x={midX} y={pad.t+26} textAnchor="middle" fontSize="5.5" fill={`${p.color}66`}>{p.years[0]}–{p.years[1]}</text>
              </React.Fragment>
            );
          })}
          <line x1={nowX} y1={pad.t-4} x2={nowX} y2={H-pad.b} stroke="#00d4ff" strokeWidth="2.5" opacity="0.9"/>
          <text x={nowX} y={pad.t-8} textAnchor="middle" fontSize="7.5" fill="#00d4ff" fontWeight="700">2026</text>
        </svg>
      </div>
    </div>
  );
};

const AccelTab = ({ accel, data }: any) => {
  const series = (data?.time_series?.data || []).slice(-12);
  const W=580, H=200, pad={t:20,b:36,l:46,r:20};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;

  const gaugeW=280, gaugeH=28;
  const fillW=accel.At*gaugeW;
  const ctrlW=accel.controlCapacity*gaugeW;

  return (
    <div className="space-y-8">
      <div className="text-sm text-slate-400 leading-relaxed max-w-2xl">
        The Acceleration Index measures not just where the system is, but how fast it is moving toward its breaking point.
      </div>

      <EquationCard 
        number="23"
        title="Acceleration Index"
        source="extension"
        latex="A(t) = \alpha \cdot \frac{dR}{dt} + \beta \cdot \frac{dV}{dt} + \gamma \cdot Shock_{density}(t)"
        currentOutput={`${accel.At.toFixed(3)} — ${accel.label}`}
        description="Quantifies the non-linear speed of risk accumulation by combining the first derivative (velocity) and second derivative (acceleration) of the RRI score."
      />

      <div className="bg-black/40 border border-white/5 rounded-xl p-6">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">Acceleration vs Control Capacity</div>
        <div className="max-w-md">
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-2">
            <span>Acceleration A(t)</span>
            <span style={{ color: accel.color }}>{accel.At.toFixed(3)}</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${gaugeW} ${gaugeH}`} height={gaugeH} className="block">
            <rect x="0" y="4" width={gaugeW} height="16" fill="#0c1830" rx="3"/>
            <rect x="0" y="4" width={fillW} height="16" fill={accel.color} opacity="0.8" rx="3"/>
            <line x1={ctrlW} y1="0" x2={ctrlW} y2={gaugeH} stroke="#00d4ff" strokeWidth="2"/>
            <text x={ctrlW+3} y="10" fontSize="6" fill="#00d4ff">Control cap {(accel.controlCapacity*100).toFixed(0)}%</text>
          </svg>
        </div>
        <div className={`mt-4 p-3 rounded-lg border ${accel.losingControl ? 'bg-intel-red/5 border-intel-red/20' : 'bg-white/5 border-white/10'}`}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accel.losingControl ? '#ff2d55' : '#00d4ff' }}>
            {accel.losingControl ? '⚠ Control Capacity Exceeded' : 'Control Capacity Maintained'}
          </div>
          <div className="text-[10px] text-slate-400 leading-relaxed mb-2">{accel.interpretation}</div>
          <div className="text-[9px] font-mono text-slate-500">
            Feedback: A(t+1) = {accel.At.toFixed(3)} × (1+{accel.feedback.toFixed(3)}) = <span className="font-bold text-white">{accel.At_next.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {series.length >= 3 && (
        <div className="bg-black/40 border border-white/5 rounded-xl p-6 overflow-x-auto">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">R(t) Trend — Last {series.length} Months (● = shock event)</div>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block font-mono min-w-[500px]">
            {(() => {
              const maxR=Math.max(...series.map((d:any)=>d.rri),2.5);
              const minR=Math.min(...series.map((d:any)=>d.rri),2.0);
              const n=series.length;
              const xS=(i:number)=>(pad.l+(i/(n-1))*cW);
              const yR=(v:number)=>(pad.t+(1-(v-minR)/(maxR-minR))*cH);
              const threshY=yR(2.31);
              const Rpts=series.map((d:any,i:number)=>`${xS(i)},${yR(d.rri)}`);
              const areaPath=`M${Rpts[0]} `+Rpts.slice(1).map(p=>`L${p}`).join(' ')+` L${xS(n-1)},${pad.t+cH} L${pad.l},${pad.t+cH} Z`;

              return (
                <React.Fragment>
                  <rect x={pad.l} y={pad.t} width={cW} height={cH} fill="#030d1a" rx="2"/>
                  {[2.0,2.2,2.4,2.6].map(v=>(
                    <React.Fragment key={v}>
                      <line x1={pad.l} x2={pad.l+cW} y1={yR(v)} y2={yR(v)} stroke="#0d1e36" strokeWidth="0.8"/>
                      <text x={pad.l-4} y={yR(v)+3} textAnchor="end" fontSize="6" fill="#1e3d55">{v.toFixed(1)}</text>
                    </React.Fragment>
                  ))}
                  <path d={areaPath} fill="#ff9f0a" opacity="0.06"/>
                  <polyline points={Rpts.join(' ')} fill="none" stroke="#ff9f0a" strokeWidth="2" opacity="0.9"/>
                  <line x1={pad.l} x2={pad.l+cW} y1={threshY} y2={threshY} stroke="#ffd60a" strokeWidth="1" strokeDasharray="5,4" opacity="0.5"/>
                  <text x={pad.l+4} y={threshY-3} fontSize="6" fill="#ffd60a">2.31 THRESHOLD</text>
                  {series.map((d:any,i:number)=>d.note && <circle key={`shock-${i}`} cx={xS(i)} cy={yR(d.rri)} r="3.5" fill="none" stroke="#ffd60a" strokeWidth="1.2" opacity="0.9"/>)}
                  <circle cx={xS(n-1)} cy={yR(series[n-1].rri)} r="4" fill="#ff9f0a" stroke="#020810" strokeWidth="1.5"/>
                  {series.map((d:any,i:number)=>i%2===0 && <text key={`month-${i}`} x={xS(i)} y={H-6} textAnchor="middle" fontSize="6" fill="#1e3d55">{d.month.slice(5)}</text>)}
                </React.Fragment>
              );
            })()}
          </svg>
        </div>
      )}
    </div>
  );
};
