/**
 * FinanceLawPanel.tsx
 * Finance Law (قانون المالية) ingestion panel for DataPipeline.
 *
 * Pre-loads all extracted Finance Law 2026 data as a structured
 * review queue — analyst approves/rejects each field before
 * it pushes to the live pipeline via pushApprovedChanges().
 *
 * Architecture:
 *   - Static seed data from Finance Law No. 17/2025
 *   - Each field shows: article reference, Arabic source quote,
 *     current platform value, extracted value, confidence
 *   - Approved fields go to pushApprovedChanges()
 *   - No new API calls — data was extracted from the PDF
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, Zap, Info,
  TrendingUp, TrendingDown, Minus, Check, X,
  BookOpen, Scale, Leaf, Users, DollarSign, Shield,
} from 'lucide-react';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';

// ── Finance Law field definitions ──────────────────────────────────────────

interface FinanceLawField {
  id:          string;
  field:       string;          // dot-path for pushApprovedChanges
  label:       string;
  value:       number | boolean | string;
  unit:        string;
  article:     string;          // e.g. "Art. 7"
  sourceQuote: string;          // Arabic quote from law
  sourceQuoteEn: string;        // English translation
  confidence:  'HIGH' | 'MEDIUM' | 'LOW';
  category:    string;
  rriImpact:   'RISK_UP' | 'RISK_DOWN' | 'NEUTRAL';
  rriNote:     string;
}

interface FinanceLawSection {
  id:      string;
  label:   string;
  icon:    React.ElementType;
  color:   string;
  fields:  FinanceLawField[];
}

// ── All extracted fields from Finance Law No. 17/2025 ─────────────────────

const FINANCE_LAW_SECTIONS: FinanceLawSection[] = [
  {
    id: 'macro', label: 'Macroeconomic Indicators', icon: DollarSign, color: '#ff9f0a',
    fields: [
      {
        id: 'fl_revenues', field: 'economy.budget_revenues_tnd',
        label: 'State Budget Revenues 2026', value: 52560000000, unit: 'TND',
        article: 'Art. 1 & 2',
        sourceQuote: 'مداخيل ميزانية الدولة: 52.560.000.000 دينار',
        sourceQuoteEn: 'State budget revenues: 52,560,000,000 TND',
        confidence: 'HIGH', category: 'Macro', rriImpact: 'NEUTRAL',
        rriNote: 'Reference value for deficit calculation',
      },
      {
        id: 'fl_expenditures', field: 'economy.budget_expenditures_tnd',
        label: 'State Budget Expenditures 2026', value: 63575000000, unit: 'TND',
        article: 'Art. 1 & 5',
        sourceQuote: 'نفقات ميزانية الدولة: 63.575.000.000 دينار',
        sourceQuoteEn: 'State budget expenditures: 63,575,000,000 TND',
        confidence: 'HIGH', category: 'Macro', rriImpact: 'RISK_UP',
        rriNote: '11B TND deficit → domestic monetization pressure → A01 inflation',
      },
      {
        id: 'fl_domestic_borrowing', field: 'economy.domestic_borrowing_tnd',
        label: 'Domestic Borrowing 2026', value: 19056000000, unit: 'TND',
        article: 'Art. 7',
        sourceQuote: 'موارد الاقتراض الداخلي: 19.056.000.000',
        sourceQuoteEn: 'Domestic borrowing resources: 19,056,000,000 TND',
        confidence: 'HIGH', category: 'Macro', rriImpact: 'RISK_UP',
        rriNote: 'Crowding out private credit. Feeds A_FX variable.',
      },
      {
        id: 'fl_foreign_borrowing', field: 'economy.foreign_borrowing_tnd',
        label: 'Foreign Borrowing 2026', value: 6808000000, unit: 'TND',
        article: 'Art. 7',
        sourceQuote: 'موارد الاقتراض الخارجي: 6.808.000.000',
        sourceQuoteEn: 'External borrowing resources: 6,808,000,000 TND',
        confidence: 'HIGH', category: 'Macro', rriImpact: 'RISK_UP',
        rriNote: 'External debt dependency. Maps to K-category (IMF/external).',
      },
      {
        id: 'fl_bct_credit', field: 'economy.bct_monetization_limit_tnd',
        label: 'BCT Credit to Treasury (Max)', value: 11000000000, unit: 'TND',
        article: 'Art. 12',
        sourceQuote: 'يرخص للبنك المركزي التونسي في منح تسهيلات للخزينة في حدود مبلغ أقصاه 11000 مليون دينار',
        sourceQuoteEn: 'BCT authorized to grant Treasury facilities up to 11,000 million TND, interest-free, 15-year term, 3-year grace',
        confidence: 'HIGH', category: 'Macro', rriImpact: 'RISK_UP',
        rriNote: 'CRITICAL: Overrides BCT founding statute. Direct monetary financing = inflation amplifier. Highest RRI signal in the law.',
      },
      {
        id: 'fl_public_employees', field: 'economy.public_employees',
        label: 'Authorized Public Employees 2026', value: 687000, unit: 'persons',
        article: 'Art. 9',
        sourceQuote: 'يبلغ العدد الجملي للأعوان المرخص فيهم بعنوان سنة 2026 ... 687.000 عونا',
        sourceQuoteEn: 'Total authorized public agents for 2026: 687,000',
        confidence: 'HIGH', category: 'Macro', rriImpact: 'NEUTRAL',
        rriNote: 'Wage bill reference. Maps to fiscal stress calculation.',
      },
      {
        id: 'fl_public_debt', field: 'economy.public_debt',
        label: 'Public Debt / GDP (est. 2026)', value: 84.5, unit: '% GDP',
        article: 'Art. 7 (derived)',
        sourceQuote: 'جملة مصادر التمويل: 27.064.000.000 دينار',
        sourceQuoteEn: 'Total financing sources 27.064B TND — derived debt/GDP estimate',
        confidence: 'MEDIUM', category: 'Macro', rriImpact: 'RISK_UP',
        rriNote: 'Derived from borrowing volumes. Feeds A-category.',
      },
    ],
  },
  {
    id: 'fiscal', label: 'Fiscal & Business Climate', icon: Scale, color: '#bf5af2',
    fields: [
      {
        id: 'fl_special_levy', field: 'economy.special_levy_rate_pct',
        label: '4% Special Contribution (Banks/Telecom)', value: 4, unit: '%',
        article: 'Art. 20 §7',
        sourceQuote: 'تحتسب المساهمة المذكورة بنسبة 4% من الأرباح المعتمدة لاحتساب الضريبة على الشركات مع حد أدنى بـ 10.000 دينار',
        sourceQuoteEn: '4% of corporate tax base; min 10,000 TND; non-deductible; applies to banks, insurance, telecom, car dealers from Jan 2026',
        confidence: 'HIGH', category: 'Fiscal', rriImpact: 'RISK_UP',
        rriNote: 'Non-deductible levy on financial sector → B-category (elite economic interests). Potential FDI deterrent.',
      },
      {
        id: 'fl_sme_credit_total', field: 'economy.sme_credit_new_m_tnd',
        label: 'New SME/Regional Credit Lines (Total)', value: 118, unit: 'M TND',
        article: 'Arts. 23-28, 34, 37',
        sourceQuote: 'خطوط تمويل: 15م + 35م + 10م + 23م + 10م + 5م + 20م = 118 مليون دينار',
        sourceQuoteEn: 'Total new credit lines: 118M TND across 8 articles for SMEs, farmers, civic companies, micro-enterprises, vulnerable families',
        confidence: 'HIGH', category: 'Fiscal', rriImpact: 'RISK_DOWN',
        rriNote: 'Direct economic activation in underdeveloped regions. Moderate impact on A-category.',
      },
      {
        id: 'fl_sme_credit_pct', field: 'economy.sme_credit_access_pct',
        label: 'SME Credit Access (revised est.)', value: 21, unit: '%',
        article: 'Arts. 25-28 (derived)',
        sourceQuote: 'خط تمويل بمبلغ 10 مليون دينار ... للمؤسسات الصغرى والمتوسطة',
        sourceQuoteEn: 'Derived: new SME credit lines + interest subsidy scheme improve access estimate from 18% to 21%',
        confidence: 'LOW', category: 'Fiscal', rriImpact: 'RISK_DOWN',
        rriNote: 'Conservative estimate. Actual impact depends on BTS/BFPME uptake.',
      },
    ],
  },
  {
    id: 'social', label: 'Social Stability & Labor', icon: Users, color: '#00d4ff',
    fields: [
      {
        id: 'fl_graduate_incentive', field: 'social.graduate_employment_incentive',
        label: 'Graduate Employment Incentive Active', value: true, unit: 'boolean',
        article: 'Art. 13',
        sourceQuote: 'تتكفل الدولة بمساهمة الأعراف في النظام القانوني للضمان الاجتماعي ... السنة الأولى 100% ... السنة الخامسة 20%',
        sourceQuoteEn: 'State covers employer social security: Yr1 100%, Yr2 80%, Yr3 60%, Yr4 40%, Yr5 20% — for private sector hiring graduates from Jan 2026',
        confidence: 'HIGH', category: 'Social', rriImpact: 'RISK_DOWN',
        rriNote: 'Targets youth unemployment (37.8%). If uptake significant → H-category (brain drain) improvement.',
      },
      {
        id: 'fl_wage_mandate', field: 'social.wage_increase_mandate_active',
        label: 'Wage Increase Mandate 2026-2028', value: true, unit: 'boolean',
        article: 'Art. 15',
        sourceQuote: 'يتم الترفيع في الأجور والمرتبات في القطاعين العام والخاص بعنوان سنوات 2026 و2027 و2028',
        sourceQuoteEn: 'Wage increases in public AND private sector for 2026, 2027, 2028. Extends to pensions. Amount set by executive decree.',
        confidence: 'HIGH', category: 'Social', rriImpact: 'RISK_DOWN',
        rriNote: 'UGTT credibility signal. Amount left to decree = political flexibility. Key M_UGTT driver.',
      },
      {
        id: 'fl_autism_stipend', field: 'social.autism_stipend_tnd',
        label: 'Autism Spectrum Stipend (monthly)', value: 150, unit: 'TND/month',
        article: 'Art. 81',
        sourceQuote: 'تسند لأبناء العائلات الفقيرة المصابين بطيف التوحد منحة مالية شهرية تبلغ 150 دينار',
        sourceQuoteEn: '150 TND/month for autistic children from AMAN program families (poor/low-income)',
        confidence: 'HIGH', category: 'Social', rriImpact: 'RISK_DOWN',
        rriNote: 'Targeted safety net expansion. Marginal E-category stabilizer.',
      },
      {
        id: 'fl_diabetes_stipend', field: 'social.diabetes_stipend_tnd',
        label: 'Diabetes Children Stipend (monthly)', value: 150, unit: 'TND/month',
        article: 'Art. 71',
        sourceQuote: 'تُسند للأطفال المصابين بمرض السكري من العائلات الفقيرة منحة مالية تبلغ 150 دينار',
        sourceQuoteEn: '150 TND/month for diabetic children from AMAN program families, for glucose meter costs',
        confidence: 'HIGH', category: 'Social', rriImpact: 'RISK_DOWN',
        rriNote: 'New targeted transfer. SEI food/health stress buffer.',
      },
      {
        id: 'fl_celiac_stipend', field: 'social.celiac_stipend_tnd',
        label: 'Celiac Disease Stipend (monthly)', value: 130, unit: 'TND/month',
        article: 'Art. 35 §2',
        sourceQuote: 'تسند لمرضى حساسية دابوق القمح من العائلات الفقيرة منحة مالية شهرية بـ 130 دينار',
        sourceQuoteEn: '130 TND/month for celiac disease patients from AMAN program families',
        confidence: 'HIGH', category: 'Social', rriImpact: 'RISK_DOWN',
        rriNote: 'Food allergy support — SEI food stress adjacent.',
      },
      {
        id: 'fl_xeroderma_stipend', field: 'social.xeroderma_stipend_tnd',
        label: 'Xeroderma Pigmentosum Stipend (monthly)', value: 130, unit: 'TND/month',
        article: 'Art. 35 §1',
        sourceQuote: 'تسند للأشخاص المصابين بمرض "كزرودرم بقمنتوزم" منحة مالية شهرية بـ 130 دينار',
        sourceQuoteEn: '130 TND/month for Xeroderma Pigmentosum patients for protective equipment costs',
        confidence: 'HIGH', category: 'Social', rriImpact: 'NEUTRAL',
        rriNote: 'Targeted rare disease support. Minimal macro impact.',
      },
    ],
  },
  {
    id: 'climate', label: 'Agriculture & Climate', icon: Leaf, color: '#2fd158',
    fields: [
      {
        id: 'fl_agri_relief', field: 'social.agri_debt_relief_active',
        label: 'Agricultural Debt Relief Active', value: true, unit: 'boolean',
        article: 'Art. 59',
        sourceQuote: 'تلتزم البنوك بتسوية الديون الفلاحية ... التخلي الكلي على فوائض التأخير ... جدولة أصل الدين على فترة أقصاها 10 سنوات',
        sourceQuoteEn: 'Banks must restructure agricultural NPLs ≤10,000 TND (Class 4&5 as of June 2025): full late-interest waiver, 10-year repayment, 1-year grace, no downpayment',
        confidence: 'HIGH', category: 'Climate', rriImpact: 'RISK_DOWN',
        rriNote: 'Direct SEI_A01 (food stress) mitigation. Reduces cascade risk from agricultural distress.',
      },
      {
        id: 'fl_drought_exemption', field: 'social.drought_lease_exemption_active',
        label: 'Drought Lease Fee Exemption Active', value: true, unit: 'boolean',
        article: 'Art. 58',
        sourceQuote: 'الإعفاء من معاليم الكراء المستوجبة بعنوان سنوات الإجاحة السابقة وعدم التزويد بمياه الري',
        sourceQuoteEn: 'Full exemption from lease fees for drought-affected years; late penalties waived; 5-year repayment schedule for remaining debt',
        confidence: 'HIGH', category: 'Climate', rriImpact: 'RISK_DOWN',
        rriNote: 'B21 (water stress) adjacent. Reduces interior governorate distress.',
      },
      {
        id: 'fl_water_fund', field: 'social.water_fund_created',
        label: 'Water Fund Established', value: true, unit: 'boolean',
        article: 'Art. 65',
        sourceQuote: 'يحدث صندوق يطلق عليه "صندوق المياه"، موارده: يرفع معلوم سعر الماء بالنسبة لشركات التعليب من 50 م/م3 إلى 100 م/م3',
        sourceQuoteEn: 'Water Fund created. Funded by doubling bottling company water tariff (50→100 millimes/m³). Purpose: fund water associations in unconnected areas, extend network coverage.',
        confidence: 'HIGH', category: 'Climate', rriImpact: 'RISK_DOWN',
        rriNote: 'Institutional mechanism for B21 (water stress). Long-term impact; short-term funding scale limited.',
      },
      {
        id: 'fl_water_crisis_govs', field: 'social.water_crisis_govs',
        label: 'Water Crisis Governorates (est. revised)', value: 8, unit: 'governorates',
        article: 'Art. 65 (context)',
        sourceQuote: 'يمول الصندوق تدخلات المجامع المائية في كامل المناطق التي تفتقر إلى الربط مع الشركة الوطنية لاستغلال وتوزيع المياه',
        sourceQuoteEn: 'Fund targets areas not connected to SONEDE national water network. Estimate: 8 governorates remain in critical zone for 2026.',
        confidence: 'MEDIUM', category: 'Climate', rriImpact: 'NEUTRAL',
        rriNote: 'No change yet — Water Fund implementation will take time.',
      },
    ],
  },
  {
    id: 'green', label: 'Green Economy & EV', icon: Shield, color: '#34d058',
    fields: [
      {
        id: 'fl_ev_incentive', field: 'economy.ev_tax_incentive_active',
        label: 'EV/Hybrid Tax Incentives Active', value: true, unit: 'boolean',
        article: 'Art. 47',
        sourceQuote: 'تخفض إلى 10% نسب المعاليم الديوانية وإلى 7% نسبة الأداء على القيمة المضافة الموظفة على أجهزة شحن السيارات الكهربائية ... إلى غاية 31 ديسمبر 2028',
        sourceQuoteEn: 'EV charging stations: 10% customs + 7% VAT until Dec 2028. Hybrid vehicles: 0% customs duty. Plug-in hybrids: exempt from consumption tax. 50% reduction for mild hybrids.',
        confidence: 'HIGH', category: 'Green', rriImpact: 'RISK_DOWN',
        rriNote: 'EU alignment signal (K-category). Energy import dependency reduction potential.',
      },
      {
        id: 'fl_lithium_incentive', field: 'economy.lithium_battery_customs_exempt',
        label: 'Lithium Battery Input Exemptions Active', value: true, unit: 'boolean',
        article: 'Art. 46',
        sourceQuote: 'تعفى من المعاليم الديوانية وتخفض نسبة الأداء على القيمة المضافة إلى 7% المطبقة على المدخلات الضرورية لتصنيع بطاريات الليثيوم',
        sourceQuoteEn: 'Full customs exemption + VAT reduced to 7% on all inputs for lithium battery manufacturing',
        confidence: 'HIGH', category: 'Green', rriImpact: 'RISK_DOWN',
        rriNote: 'Industrial policy signal. Attracts battery manufacturing investment.',
      },
    ],
  },
];

// ── Impact badge ────────────────────────────────────────────────────────────

const ImpactBadge: React.FC<{ impact: FinanceLawField['rriImpact'] }> = ({ impact }) => {
  if (impact === 'RISK_UP')   return <span className="inline-flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded"
    style={{ background: '#ff2d5518', color: '#ff2d55', border: '1px solid #ff2d5533' }}>
    <TrendingUp className="w-2.5 h-2.5" /> RISK ↑
  </span>;
  if (impact === 'RISK_DOWN') return <span className="inline-flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded"
    style={{ background: '#2fd15818', color: '#2fd158', border: '1px solid #2fd15833' }}>
    <TrendingDown className="w-2.5 h-2.5" /> RISK ↓
  </span>;
  return <span className="inline-flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded"
    style={{ background: '#ffffff10', color: '#888', border: '1px solid #ffffff15' }}>
    <Minus className="w-2.5 h-2.5" /> NEUTRAL
  </span>;
};

const ConfBadge: React.FC<{ conf: FinanceLawField['confidence'] }> = ({ conf }) => {
  const c = conf === 'HIGH' ? '#2fd158' : conf === 'MEDIUM' ? '#ff9f0a' : '#888';
  return <span className="text-[7px] font-mono px-1 py-0.5 rounded"
    style={{ color: c, border: `1px solid ${c}44`, background: `${c}10` }}>
    {conf}
  </span>;
};

// ── Main panel ──────────────────────────────────────────────────────────────

export const FinanceLawPanel: React.FC = () => {
  const { fullData: data, pushApprovedChanges, recalculateRRI } = useRiskMetrics();

  // Per-field state: 'pending' | 'approved' | 'rejected'
  const allFields = useMemo(() =>
    FINANCE_LAW_SECTIONS.flatMap(s => s.fields.map(f => ({ ...f, section: s.id }))),
    []
  );
  const [fieldState, setFieldState] = useState<Record<string, 'pending' | 'approved' | 'rejected'>>(() =>
    Object.fromEntries(allFields.map(f => [f.id, 'pending']))
  );
  const [expandedSection, setExpandedSection] = useState<string | null>('macro');
  const [expandedField,   setExpandedField]   = useState<string | null>(null);
  const [pushed, setPushed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const approved  = allFields.filter(f => fieldState[f.id] === 'approved');
  const pending   = allFields.filter(f => fieldState[f.id] === 'pending');
  const rejected  = allFields.filter(f => fieldState[f.id] === 'rejected');
  const riskUp    = allFields.filter(f => f.rriImpact === 'RISK_UP').length;
  const riskDown  = allFields.filter(f => f.rriImpact === 'RISK_DOWN').length;

  const approve = (id: string) => setFieldState(p => ({ ...p, [id]: 'approved' }));
  const reject  = (id: string) => setFieldState(p => ({ ...p, [id]: 'rejected' }));
  const restore = (id: string) => setFieldState(p => ({ ...p, [id]: 'pending'  }));

  const approveAll = () => {
    const next: Record<string, 'pending' | 'approved' | 'rejected'> = { ...fieldState };
    allFields.forEach(f => { if (next[f.id] === 'pending') next[f.id] = 'approved'; });
    setFieldState(next);
  };

  const handlePushToLive = () => {
    const changes = approved.map(f => ({
      field:      f.field,
      value:      f.value,
      oldValue:   getNestedValue(data, f.field),
      source:     `Finance Law No. 17/2025 — ${f.article}`,
      label:      f.label,
      approvedAt: new Date().toISOString(),
    }));
    pushApprovedChanges(changes);
    setTimeout(() => recalculateRRI(), 200);
    setPushed(true);
    window.dispatchEvent(new CustomEvent('rri-recalculate'));
  };

  function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }

  function formatValue(v: any, unit: string): string {
    if (typeof v === 'boolean') return v ? 'YES' : 'NO';
    if (typeof v === 'number' && unit === 'TND' && v > 1_000_000)
      return `${(v / 1_000_000_000).toFixed(3)}B`;
    if (typeof v === 'number' && unit === 'M TND') return `${v}M`;
    if (typeof v === 'number') return v.toLocaleString();
    return String(v);
  }

  return (
    <div className="space-y-6">

      {/* Law header */}
      <div className="glass p-5 rounded-2xl border border-intel-orange/20 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-intel-orange/10 border border-intel-orange/20
              flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-intel-orange" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-intel-orange uppercase tracking-widest">
                Official Document Ingestion
              </div>
              <div className="text-sm font-bold text-white">
                قانون المالية لسنة 2026 — Finance Law No. 17/2025
              </div>
              <div className="text-[10px] text-slate-500">
                Official Gazette No. 148 · 12 December 2025 · 101 pages · Arabic RTL
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-mono text-slate-500">EXTRACTION STATUS</div>
            <div className="text-[11px] font-mono font-bold text-intel-cyan">COMPLETE</div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-5 gap-3 pt-2 border-t border-white/5">
          {[
            { l: 'Total Fields', v: allFields.length, c: '#888' },
            { l: 'Pending', v: pending.length, c: '#ff9f0a' },
            { l: 'Approved', v: approved.length, c: '#2fd158' },
            { l: 'Risk ↑', v: riskUp, c: '#ff2d55' },
            { l: 'Risk ↓', v: riskDown, c: '#2fd158' },
          ].map(s => (
            <div key={s.l} className="text-center">
              <div className="text-xl font-bold font-mono" style={{ color: s.c }}>{s.v}</div>
              <div className="text-[8px] font-mono text-slate-600 uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between">
        {/* Filter pills */}
        <div className="flex gap-2">
          {(['all','pending','approved','rejected'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-lg text-[9px] font-mono uppercase transition-all"
              style={{
                background: filter === f ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${filter === f ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                color: filter === f ? '#00d4ff' : '#64748b',
              }}>
              {f} {f !== 'all' && `(${f === 'pending' ? pending.length : f === 'approved' ? approved.length : rejected.length})`}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={approveAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all"
            style={{ background: '#2fd15812', border: '1px solid #2fd15833', color: '#2fd158' }}>
            <CheckCircle2 className="w-3 h-3" />
            Approve All Pending
          </button>
          <button onClick={handlePushToLive} disabled={approved.length === 0 || pushed}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all disabled:opacity-40"
            style={{ background: approved.length > 0 && !pushed ? '#ff9f0a' : '#ff9f0a33',
              color: '#000', border: '1px solid #ff9f0a' }}>
            <Zap className="w-3 h-3" />
            {pushed ? 'PUSHED TO LIVE' : `Push ${approved.length} to Live`}
          </button>
        </div>
      </div>

      {pushed && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border border-intel-cyan/30 bg-intel-cyan/5">
          <div className="flex items-center gap-2 text-[11px] font-mono text-intel-cyan">
            <CheckCircle2 className="w-4 h-4" />
            {approved.length} fields pushed to live pipeline. RRI recalculation triggered.
            Reload the Risk Model tab to see updated scores.
          </div>
        </motion.div>
      )}

      {/* Sections */}
      {FINANCE_LAW_SECTIONS.map(section => {
        const Icon = section.icon;
        const sectionFields = section.fields.filter(f => {
          if (filter === 'all') return true;
          return fieldState[f.id] === filter;
        });
        if (sectionFields.length === 0 && filter !== 'all') return null;

        const isOpen = expandedSection === section.id;

        return (
          <div key={section.id} className="glass rounded-2xl border border-intel-border/40 overflow-hidden">
            {/* Section header */}
            <button
              onClick={() => setExpandedSection(isOpen ? null : section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${section.color}15`, border: `1px solid ${section.color}33` }}>
                  <Icon className="w-4 h-4" style={{ color: section.color }} />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: section.color }}>{section.label}</span>
                <span className="text-[9px] font-mono text-slate-500">
                  {section.fields.filter(f => fieldState[f.id] === 'approved').length}/
                  {section.fields.length} approved
                </span>
              </div>
              {isOpen
                ? <ChevronDown className="w-4 h-4 text-slate-500" />
                : <ChevronRight className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Fields */}
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                  exit={{ height: 0 }} className="overflow-hidden">
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {sectionFields.map(field => {
                      const state    = fieldState[field.id];
                      const current  = getNestedValue(data, field.field);
                      const isExpanded = expandedField === field.id;

                      return (
                        <div key={field.id}
                          className="px-4 py-3 transition-colors"
                          style={{
                            background: state === 'approved' ? 'rgba(47,209,88,0.04)'
                              : state === 'rejected'  ? 'rgba(255,45,85,0.04)'
                              : 'transparent',
                          }}>

                          {/* Row */}
                          <div className="flex items-center gap-3">
                            {/* Status dot */}
                            <div className="w-2 h-2 rounded-full shrink-0"
                              style={{
                                background: state === 'approved' ? '#2fd158'
                                  : state === 'rejected' ? '#ff2d55' : '#ff9f0a',
                              }} />

                            {/* Label + badges */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-white truncate">{field.label}</span>
                                <span className="text-[8px] font-mono text-slate-500">{field.article}</span>
                                <ConfBadge conf={field.confidence} />
                                <ImpactBadge impact={field.rriImpact} />
                              </div>
                              <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                                {field.field}
                              </div>
                            </div>

                            {/* Values */}
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="text-right">
                                <div className="text-[7px] text-slate-600 font-mono">CURRENT</div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  {current !== undefined ? formatValue(current, field.unit) : '—'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[7px] text-slate-600 font-mono">EXTRACTED</div>
                                <div className="text-[11px] font-bold font-mono"
                                  style={{ color: field.rriImpact === 'RISK_UP' ? '#ff9f0a' : field.rriImpact === 'RISK_DOWN' ? '#2fd158' : '#00d4ff' }}>
                                  {formatValue(field.value, field.unit)}
                                  {field.unit !== 'boolean' && field.unit !== 'TND' && field.unit !== 'M TND'
                                    ? ` ${field.unit}` : ''}
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setExpandedField(isExpanded ? null : field.id)}
                                className="p-1.5 rounded hover:bg-white/5 transition-colors">
                                <Info className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                              {state === 'pending' && (
                                <>
                                  <button onClick={() => approve(field.id)}
                                    className="p-1.5 rounded hover:bg-intel-green/10 transition-colors">
                                    <Check className="w-3.5 h-3.5 text-intel-green" />
                                  </button>
                                  <button onClick={() => reject(field.id)}
                                    className="p-1.5 rounded hover:bg-intel-red/10 transition-colors">
                                    <X className="w-3.5 h-3.5 text-intel-red" />
                                  </button>
                                </>
                              )}
                              {state !== 'pending' && (
                                <button onClick={() => restore(field.id)}
                                  className="text-[8px] font-mono text-slate-500 hover:text-white px-2 transition-colors">
                                  UNDO
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-2 overflow-hidden">
                                <div className="p-3 rounded-xl border border-white/5 bg-black/30 space-y-2">
                                  <div>
                                    <div className="text-[7px] font-mono text-slate-500 uppercase mb-1">
                                      Arabic source (Official Gazette No. 148)
                                    </div>
                                    <div className="text-[10px] text-slate-300 leading-relaxed font-mono"
                                      dir="rtl" style={{ fontFamily: 'serif' }}>
                                      {field.sourceQuote}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[7px] font-mono text-slate-500 uppercase mb-1">
                                      English translation
                                    </div>
                                    <div className="text-[10px] text-slate-400 leading-relaxed">
                                      {field.sourceQuoteEn}
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                                    <AlertTriangle className="w-3 h-3 text-intel-orange shrink-0 mt-0.5" />
                                    <div>
                                      <div className="text-[7px] font-mono text-intel-orange uppercase mb-0.5">
                                        RRI Model Impact
                                      </div>
                                      <div className="text-[9px] text-slate-400">{field.rriNote}</div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

    </div>
  );
};
