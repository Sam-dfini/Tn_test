import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Calendar, Clock,
  AlertTriangle, Shield, Users, Gavel, Radio,
  ExternalLink, Filter, Search, BarChart3,
  TrendingUp, X, Info, Download, Eye,
  UserX, Lock, Unlock, FileText, Globe,
  Activity, Zap
} from 'lucide-react';
import { BackgroundGrid, ModuleHeader } from '../shared/ProfessionalShared';
import { useRiskMetrics } from '../../hooks/usePipelineDomains';
import { assertKey, getRenderKey, prepareList } from '../../lib/keyUtils';

type EventType =
  | 'protest'
  | 'arrest'
  | 'trial'
  | 'release'
  | 'economic'
  | 'political'
  | 'diplomatic'
  | 'decree'
  | 'anniversary'
  | 'deadline';

type PrisonerStatus = 'DETAINED' | 'RELEASED' | 'ACQUITTED' | 'FLED';
type ChargeCategory = 'TERRORISM' | 'DECREE54' | 'DISORDER' | 'CONSPIRACY' | 'OTHER';
type RealReason =
  | 'FACEBOOK_POST'
  | 'WHATSAPP_MESSAGE'
  | 'PROTEST_ATTENDANCE'
  | 'POLITICAL_OPPOSITION'
  | 'JOURNALISM'
  | 'LEGAL_DEFENSE'
  | 'UNION_ACTIVITY'
  | 'HUMAN_RIGHTS'
  | 'PETITION';

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  titleAr?: string;
  type: EventType;
  severity: 1 | 2 | 3 | 4 | 5;
  description: string;
  source: string;
  governorate?: string;
  actors?: string[];
  rriImpact?: string;
  rriVariable?: string;
  trialId?: string; // links to trial
  prisonerId?: string; // links to prisoner
  upcoming?: boolean;
  predicted?: boolean;
  predictionProbability?: number;
  internationalAttention?: boolean;
}

interface PoliticalPrisoner {
  id: string;
  name: string;
  nameAr?: string;
  role: string;
  affiliation: string;
  status: PrisonerStatus;
  // Detention
  arrestDate: string; // YYYY-MM-DD
  releaseDate?: string;
  detentionFacility?: string;
  // Legal
  officialCharge: string;
  chargeCategory: ChargeCategory;
  realReason: RealReason;
  realReasonDescription: string;
  gapScore: number; // 0-100, how weaponized is the charge
  // Trial
  trialStatus: string;
  lastHearing?: string;
  nextHearing?: string;
  lawyer?: string;
  lawyerDetained?: boolean;
  // Context
  internationalAttention: string[]; // HRW, Amnesty, EU, etc.
  sources: string[];
  notes?: string;
  // Health
  healthConcerns?: string;
  // RRI
  rriVariables: string[];
  significance: string;
}

import { supabase } from '../../lib/supabase';

// ... (keep existing types)

const getDaysSince = (dateStr: string): number => {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
};

const getLiveDetentionClock = (dateStr: string): string => {
  const days = getDaysSince(dateStr);
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)) % 24;
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60)) % 60;
  return `${days}d ${hours}h ${minutes}m`;
};

const getGapScoreLabel = (score: number): string => {
  if (score >= 95) return 'EXTREME WEAPONIZATION';
  if (score >= 80) return 'SEVERE WEAPONIZATION';
  if (score >= 65) return 'HIGH WEAPONIZATION';
  if (score >= 50) return 'MODERATE WEAPONIZATION';
  return 'LOW';
};

const getGapScoreColor = (score: number): string => {
  if (score >= 95) return 'text-intel-red';
  if (score >= 80) return 'text-intel-orange';
  if (score >= 65) return 'text-yellow-500';
  return 'text-slate-400';
};

const EVENT_COLORS: Record<EventType, string> = {
  protest: '#ff9f0a',
  arrest: '#ff453a',
  trial: '#bf5af2',
  release: '#30d158',
  economic: '#00d4ff',
  political: '#0a84ff',
  diplomatic: '#64748b',
  decree: '#ff453a',
  anniversary: '#ff9f0a',
  deadline: '#ff453a',
};

const REAL_REASON_LABELS: Record<RealReason, string> = {
  FACEBOOK_POST: 'Facebook post',
  WHATSAPP_MESSAGE: 'WhatsApp message',
  PROTEST_ATTENDANCE: 'Attending a protest',
  POLITICAL_OPPOSITION: 'Political opposition',
  JOURNALISM: 'Journalism',
  LEGAL_DEFENSE: 'Legal defense',
  UNION_ACTIVITY: 'Union activity',
  HUMAN_RIGHTS: 'Human rights work',
  PETITION: 'Signing a petition',
};

const DetentionClock: React.FC<{
  arrestDate: string;
  size?: 'sm' | 'lg';
}> = ({ arrestDate, size = 'sm' }) => {
  const [clock, setClock] = useState(getLiveDetentionClock(arrestDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setClock(getLiveDetentionClock(arrestDate));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [arrestDate]);

  if (size === 'lg') {
    return (
      <div className="text-center space-y-1">
        <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">In Detention</div>
        <div className="text-3xl font-bold font-mono text-intel-red tabular-nums">{clock}</div>
        <div className="text-[9px] font-mono text-slate-600">
          Since {new Date(arrestDate).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5">
      <Clock className="w-3 h-3 text-intel-red shrink-0" />
      <span className="text-[10px] font-mono font-bold text-intel-red tabular-nums">{clock}</span>
    </div>
  );
};

const GapScoreBar: React.FC<{
  score: number;
  officialCharge: string;
  realReason: RealReason;
}> = ({ score, officialCharge, realReason }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-[9px] font-mono">
      <span className="text-slate-500 uppercase tracking-widest">
        Judicial Weaponization Index
      </span>
      <span className={`font-bold ${getGapScoreColor(score)}`}>
        {score}/100 — {getGapScoreLabel(score)}
      </span>
    </div>
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, type: 'spring' }}
        className={`h-full rounded-full ${
          score >= 95 ? 'bg-intel-red' :
          score >= 80 ? 'bg-intel-orange' :
          score >= 65 ? 'bg-yellow-500' : 'bg-intel-cyan'
        }`}
      />
    </div>
    <div className="grid grid-cols-2 gap-2 text-[9px]">
      <div className="space-y-0.5">
        <div className="text-slate-600 uppercase text-[8px]">
          Official charge
        </div>
        <div className="text-intel-red font-mono">
          {officialCharge.slice(0, 40)}
          {officialCharge.length > 40 ? '...' : ''}
        </div>
      </div>
      <div className="space-y-0.5">
        <div className="text-slate-600 uppercase text-[8px]">
          Actual act
        </div>
        <div className="text-intel-green font-mono">
          {REAL_REASON_LABELS[realReason]}
        </div>
      </div>
    </div>
  </div>
);

const PrisonerCard: React.FC<{
  prisoner: PoliticalPrisoner;
  compact?: boolean;
  onClick?: () => void;
}> = ({ prisoner, compact = false, onClick }) => {
  const days = getDaysSince(prisoner.arrestDate);

  if (compact) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.01 }}
        className="flex items-center justify-between p-3 rounded-xl border border-intel-border/40 bg-black/20 cursor-pointer hover:border-intel-red/30 transition-all group"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            prisoner.status === 'DETAINED'
              ? 'bg-intel-red animate-pulse'
              : 'bg-intel-green'
          }`} />
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate group-hover:text-intel-red transition-colors">
              {prisoner.name}
            </div>
            <div className="text-[9px] text-slate-600 truncate">
              {prisoner.role.slice(0, 35)}
              {prisoner.role.length > 35 ? '...' : ''}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right space-y-0.5">
          <div className="text-[10px] font-mono font-bold text-intel-red tabular-nums">{days}d</div>
          <div className="text-[8px] font-mono text-slate-700 uppercase">{prisoner.chargeCategory}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-2xl border border-intel-border space-y-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
              prisoner.status === 'DETAINED'
                ? 'text-intel-red border-intel-red/30 bg-intel-red/10'
                : 'text-intel-green border-intel-green/30 bg-intel-green/10'
            }`}>{prisoner.status}</span>
            <span className="text-[8px] font-mono text-slate-600">
              {prisoner.id}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white">
            {prisoner.name}
          </h3>
          {prisoner.nameAr && (
            <div className="text-sm text-slate-500 font-arabic" dir="rtl">{prisoner.nameAr}</div>
          )}
          <div className="text-[11px] text-slate-400">
            {prisoner.role}
          </div>
          <div className="text-[10px] font-mono text-intel-cyan">
            {prisoner.affiliation}
          </div>
        </div>

        {prisoner.status === 'DETAINED' && (
          <DetentionClock
            arrestDate={prisoner.arrestDate}
            size="lg"
          />
        )}
      </div>

      <GapScoreBar
        score={prisoner.gapScore}
        officialCharge={prisoner.officialCharge}
        realReason={prisoner.realReason}
      />

      <div className="p-4 rounded-xl bg-intel-red/5 border border-intel-red/20 space-y-1">
        <div className="text-[9px] font-mono text-intel-red uppercase tracking-widest">What they actually did</div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {prisoner.realReasonDescription}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 text-[10px]">
        <div className="space-y-1">
          <div className="text-[8px] font-mono text-slate-600 uppercase">Trial Status</div>
          <div className={`font-mono font-bold ${
            prisoner.trialStatus.includes('POSTPONED')
              ? 'text-intel-red'
              : prisoner.trialStatus.includes('CONVICTED')
              ? 'text-intel-red'
              : 'text-intel-orange'
          }`}>{prisoner.trialStatus}</div>
        </div>
        {prisoner.lastHearing && (
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Last Hearing</div>
            <div className="font-mono text-slate-300">
              {new Date(prisoner.lastHearing).toLocaleDateString('en-GB')}
            </div>
          </div>
        )}
        {prisoner.nextHearing && (
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Next Hearing</div>
            <div className="font-mono text-intel-cyan">
              {new Date(prisoner.nextHearing).toLocaleDateString('en-GB')}
            </div>
          </div>
        )}
        {prisoner.detentionFacility && (
          <div className="space-y-1">
            <div className="text-[8px] font-mono text-slate-600 uppercase">Facility</div>
            <div className="text-slate-400">{prisoner.detentionFacility}</div>
          </div>
        )}
      </div>

      {prisoner.healthConcerns && (
        <div className="flex items-start space-x-2 p-3 bg-intel-orange/5 border border-intel-orange/20 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 text-intel-orange shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-intel-orange uppercase">Health Concerns</div>
            <p className="text-[10px] text-slate-400">
              {prisoner.healthConcerns}
            </p>
          </div>
        </div>
      )}

      {prisoner.internationalAttention.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">International Attention</div>
          <div className="flex flex-wrap gap-1.5">
            {prisoner.internationalAttention.map((org, index) => (
              <span key={`${org}-${index}`} className="text-[8px] font-mono px-2 py-0.5 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20 rounded">
                {org}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">RRI Model Impact</div>
        <div className="flex flex-wrap gap-1.5">
          {prisoner.rriVariables.map((v, index) => (
            <span key={`${v}-${index}`} className="text-[8px] font-mono px-2 py-0.5 bg-intel-orange/10 text-intel-orange border border-intel-orange/20 rounded">
              {v}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-600 italic leading-snug">
          {prisoner.significance}
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-intel-border/20">
        {prisoner.sources.map((s, index) => (
          <span key={`${s}-${index}`} className="text-[8px] font-mono text-slate-700">{s}</span>
        ))}
      </div>
    </motion.div>
  );
};

export const PoliticalCalendar: React.FC = () => {
  const { rriState, fullData: data } = useRiskMetrics();
  const [prisoners, setPrisoners] = useState<PoliticalPrisoner[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch Prisoners
      const { data: prisonersData, error: prisonersError } = await supabase
        .from('political_prisoners')
        .select('*');
      
      if (prisonersError) {
        console.error('Error fetching prisoners:', prisonersError);
      } else if (prisonersData) {
        const mappedPrisoners: PoliticalPrisoner[] = prisonersData.map((p: any) => ({
          id: p.id,
          name: p.name,
          nameAr: p.name_ar,
          role: p.role,
          affiliation: p.affiliation,
          status: p.status,
          arrestDate: p.arrest_date,
          releaseDate: p.release_date,
          detentionFacility: p.detention_facility,
          officialCharge: p.official_charge,
          chargeCategory: p.charge_category,
          realReason: p.real_reason,
          realReasonDescription: p.real_reason_description,
          gapScore: p.gap_score,
          trialStatus: p.trial_status,
          lastHearing: p.last_hearing,
          nextHearing: p.next_hearing,
          lawyer: p.lawyer,
          lawyerDetained: p.lawyer_detained,
          internationalAttention: p.international_attention,
          sources: p.sources,
          notes: p.notes,
          healthConcerns: p.health_concerns,
          rriVariables: p.rri_variables,
          significance: p.significance,
        }));
        setPrisoners(mappedPrisoners);
      }

      // Fetch Calendar Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('calendar_events')
        .select('*');

      if (eventsError) {
        console.error('Error fetching calendar events:', eventsError);
      } else if (eventsData) {
        const mappedEvents: CalendarEvent[] = eventsData.map((e: any) => ({
          id: e.id,
          date: e.date,
          title: e.title,
          titleAr: e.title_ar,
          type: e.type,
          severity: e.severity,
          description: e.description,
          source: e.source,
          governorate: e.governorate,
          actors: e.actors,
          rriImpact: e.rri_impact,
          rriVariable: e.rri_variable,
          trialId: e.trial_id,
          prisonerId: e.prisoner_id,
          upcoming: e.upcoming,
          predicted: e.predicted,
          predictionProbability: e.prediction_probability,
          internationalAttention: e.international_attention,
        }));
        setCalendarEvents(mappedEvents);
      }

      setLoading(false);
    }
    fetchData();
  }, []);

  const [view, setView] = useState<'calendar' | 'prisoners' | 'trials'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2)); // March 2026
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedPrisoner, setSelectedPrisoner] = useState<PoliticalPrisoner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getDateString = (day: number) => {
    const y = currentMonth.getFullYear();
    const m = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = getDateString(day);
    return calendarEvents.filter(e => e.date === dateStr);
  };

  const detainedPrisoners = prisoners.filter(p => p.status === 'DETAINED');
  const totalDetentionDays = detainedPrisoners.reduce((sum, p) => sum + getDaysSince(p.arrestDate), 0);
  const terrorismForOpinion = prisoners.filter(
    p => p.chargeCategory === 'TERRORISM' &&
    ['POLITICAL_OPPOSITION', 'JOURNALISM', 'FACEBOOK_POST', 'WHATSAPP_MESSAGE', 'LEGAL_DEFENSE', 'PETITION'].includes(p.realReason)
  );
  const avgGapScore = prisoners.length > 0 ? Math.round(prisoners.reduce((sum, p) => sum + p.gapScore, 0) / prisoners.length) : 0;

  const filteredPrisoners = prisoners.filter(p => {
    if (!searchQuery) return true;
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.affiliation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-700 relative">
      <BackgroundGrid />
      
      <ModuleHeader 
        title="Political Calendar"
        subtitle="Events · Trials · Political Prisoners · Judicial Weaponization Index"
        icon={Calendar}
        nodeId="POL-CAL-23"
      />

      <div className="space-y-4 relative z-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-intel-cyan" />
            <div>
              <h1 className="text-xl font-bold text-white uppercase tracking-widest">Political Calendar</h1>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Events · Trials · Political Prisoners · Judicial Weaponization Index
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-black/40 border border-intel-border rounded-xl p-1">
            {[
              { id: 'calendar', label: 'Calendar', icon: Calendar },
              { id: 'prisoners', label: 'Prisoners', icon: UserX },
              { id: 'trials', label: 'Trials', icon: Gavel },
            ].map(v => {
              const Icon = v.icon;
              return (
                <button key={v.id}
                  onClick={() => setView(v.id as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all ${
                    view === v.id
                      ? 'bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/20'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Currently Detained', value: detainedPrisoners.length.toString(), color: 'text-intel-red', pulse: true },
            { label: 'Total Detention Days', value: totalDetentionDays.toLocaleString(), color: 'text-intel-red', sub: 'Accumulated across all prisoners' },
            { label: 'Terrorism for Opinions', value: terrorismForOpinion.length.toString(), color: 'text-intel-orange', sub: 'Terrorism law used for speech acts' },
            { label: 'Decree 54 Cases', value: data.social.decree54_charged.toString(), color: 'text-intel-orange' },
            { label: 'Avg Weaponization', value: avgGapScore + '/100', color: 'text-intel-red', sub: 'Judicial gap score average' },
            { label: 'Longest Detention', value: `${getDaysSince('2022-01-03')}d`, color: 'text-intel-red', sub: 'N. Bhiri — since Jan 2022' },
          ].map(stat => (
            <div key={stat.label} className="glass p-4 rounded-2xl border border-intel-border space-y-1">
              <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{stat.label}</div>
              <div className={`text-xl font-bold font-mono ${stat.color} ${stat.pulse ? 'animate-pulse' : ''}`}>
                {stat.value}
              </div>
              {stat.sub && (
                <div className="text-[8px] text-slate-700 leading-snug">
                  {stat.sub}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {view === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-bold text-white uppercase tracking-widest">
                {currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </div>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[9px] font-mono text-slate-600 uppercase py-2">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="h-16" />;
                const dateStr = getDateString(day);
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDay === dateStr;
                const isToday = dateStr === new Date().toISOString().slice(0, 10);
                const hasArrest = dayEvents.some(e => e.type === 'arrest');
                const hasTrial = dayEvents.some(e => e.type === 'trial');

                return (
                  <motion.button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                    whileHover={{ scale: 1.05 }}
                    className={`h-16 rounded-xl border p-1.5 transition-all relative flex flex-col items-start ${
                      isSelected ? 'border-intel-cyan bg-intel-cyan/10' :
                      isToday ? 'border-intel-orange/50 bg-intel-orange/5' :
                      hasArrest || hasTrial ? 'border-intel-red/30 bg-intel-red/5 hover:border-intel-red/50' :
                      dayEvents.length > 0 ? 'border-intel-border/50 bg-black/30 hover:border-intel-border' :
                      'border-transparent hover:border-intel-border/30'
                    }`}
                  >
                    <span className={`text-[11px] font-mono font-bold ${
                      isSelected ? 'text-intel-cyan' : isToday ? 'text-intel-orange' : dayEvents.length > 0 ? 'text-white' : 'text-slate-600'
                    }`}>{day}</span>
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {dayEvents.slice(0, 4).map((event, j) => (
                        <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.upcoming ? `${EVENT_COLORS[event.type]}80` : EVENT_COLORS[event.type], border: event.upcoming ? `1px dashed ${EVENT_COLORS[event.type]}` : 'none' }} />
                      ))}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {selectedDay ? (
                <motion.div key={selectedDay} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-white">{new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => setSelectedDay(null)} className="p-1.5 text-slate-600 hover:text-white transition-all"><X className="w-4 h-4" /></button>
                  </div>
                  {calendarEvents.filter(e => e.date === selectedDay).length === 0 ? (
                    <div className="text-[11px] text-slate-600 text-center py-8">No events recorded for this date.</div>
                  ) : (
                    prepareList(calendarEvents.filter(e => e.date === selectedDay)).map((event) => (
                      <div key={event.id} className={`p-4 rounded-xl border space-y-3 ${event.upcoming ? 'border-intel-cyan/20 bg-intel-cyan/5' : event.type === 'arrest' || event.type === 'decree' ? 'border-intel-red/20 bg-intel-red/5' : event.type === 'trial' ? 'border-intel-purple/20 bg-intel-purple/5' : 'border-intel-border/30 bg-black/20'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase" style={{ color: EVENT_COLORS[event.type], borderColor: `${EVENT_COLORS[event.type]}40`, backgroundColor: `${EVENT_COLORS[event.type]}15` }}>{event.type}</span>
                            </div>
                            <div className="text-[11px] font-bold text-white">{event.title}</div>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">{event.description}</p>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">Recent Prisoners</div>
                  {prepareList(detainedPrisoners.slice(0, 6)).map((p) => (
                    <PrisonerCard key={p.id} prisoner={p as any} compact onClick={() => { setSelectedPrisoner(p as any); setView('prisoners'); }} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {view === 'prisoners' && (
        <div className="space-y-6">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search prisoners..." className="w-full bg-black/40 border border-intel-border rounded-xl pl-10 pr-4 py-3 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-intel-cyan/40" />
          </div>
          <div className="space-y-6">
            <AnimatePresence>
              {prepareList(selectedPrisoner ? [selectedPrisoner] : filteredPrisoners).map((prisoner) => (
                <div key={prisoner.id}>
                  {selectedPrisoner && (
                    <button onClick={() => setSelectedPrisoner(null)} className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 hover:text-intel-cyan mb-4 transition-all">
                      <ChevronLeft className="w-3 h-3" />
                      <span>All prisoners</span>
                    </button>
                  )}
                  <PrisonerCard prisoner={prisoner as any} />
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {view === 'trials' && (
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl border border-intel-border space-y-4">
            <div className="flex items-center space-x-3 border-b border-intel-border pb-4">
              <Gavel className="w-5 h-5 text-intel-purple" />
              <div>
                <div className="text-sm font-bold text-white uppercase tracking-widest">Trial Tracker</div>
                <div className="text-[9px] text-slate-500">Upcoming and recent court hearings</div>
              </div>
            </div>
            <div className="space-y-3">
              {prepareList(prisoners.filter(p => p.nextHearing || p.lastHearing)).map((prisoner) => (
                <div key={prisoner.id} className="flex items-start justify-between p-4 rounded-xl border border-intel-border/30 bg-black/20 gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="text-[11px] font-bold text-white truncate">{prisoner.name}</div>
                    <div className="text-[10px] text-slate-500">{prisoner.trialStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
