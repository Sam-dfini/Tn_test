import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Filter, Download, Search, AlertCircle, ChevronUp, ChevronDown, MapPin, User, ExternalLink } from 'lucide-react';
import { usePipeline } from '../context/PipelineContext';

const timelineEvents = [
  {
    id: 'T001', date: '2026-03-15', title: 'Sfax Water Protest — Day 4',
    summary: 'Ongoing water supply cuts in Sfax entering fourth consecutive day. Residents blockade municipality entrance. Security forces deployed.',
    type: 'protest', severity: 4, gov: 'Sfax',
    source: 'Nawaat', actors: ['UGTT', 'Civil Society'],
    rri_impact: '+0.03', urgent: true
  },
  {
    id: 'T002', date: '2026-03-12', title: 'IMF Negotiations — No Q1 Agreement',
    summary: 'IMF mission departs Tunis without agreement. Q3 2026 debt repayment deadline unchanged. BCT FX reserves at 84 days import cover.',
    type: 'economic', severity: 4, gov: 'Tunis',
    source: 'Business News', actors: ['BCT', 'IMF'],
    rri_impact: '+0.04', urgent: true
  },
  {
    id: 'T003', date: '2026-03-10', title: 'Journalist Detained Under Decree 54',
    summary: 'Investigative journalist detained for publishing report on BCT reserve levels. Decree 54 charge: spreading false information.',
    type: 'arrest', severity: 4, gov: 'Tunis',
    source: 'RSF', actors: ['Security Forces'],
    rri_impact: '+0.02', urgent: true
  },
  {
    id: 'T004', date: '2026-03-05', title: 'NSF Press Conference — Election Demands',
    summary: 'National Salvation Front holds press conference demanding free elections and release of political prisoners. No official response.',
    type: 'political', severity: 2, gov: 'Tunis',
    source: 'Inkyfada', actors: ['NSF', 'Opposition'],
    rri_impact: '+0.01', urgent: false
  },
  {
    id: 'T005', date: '2026-02-28', title: 'CPG Workers Blockade Mine Entrance',
    summary: 'Compagnie des Phosphates de Gafsa workers blockade Metlaoui mine entrance demanding unpaid wage arrears of 3 months.',
    type: 'protest', severity: 3, gov: 'Gafsa',
    source: 'UGTT Press', actors: ['UGTT', 'CPG Workers'],
    rri_impact: '+0.02', urgent: false
  },
  {
    id: 'T006', date: '2026-02-20', title: 'EU Migration Pact Review Meeting',
    summary: 'EU delegation meets Interior Ministry to review MOU implementation. Coast Guard interceptions up 340% since June 2023 deal.',
    type: 'diplomatic', severity: 2, gov: 'Tunis',
    source: 'TAP', actors: ['EU Delegation', 'Interior Ministry'],
    rri_impact: '0.00', urgent: false
  },
  {
    id: 'T007', date: '2026-02-15', title: 'Decree 54 Charges — 3 New Activists',
    summary: 'Three civil society activists charged under Decree 54 for social media posts criticizing water management policy.',
    type: 'arrest', severity: 3, gov: 'Tunis',
    source: 'FTDES', actors: ['Security Forces'],
    rri_impact: '+0.02', urgent: false
  },
  {
    id: 'T008', date: '2026-02-10', title: 'BCT: FX Reserves Fall to 84 Days',
    summary: 'BCT monthly bulletin confirms FX reserves at 84 days import cover. Below 90-day warning threshold. Decline from 91 days in January.',
    type: 'economic', severity: 4, gov: 'Tunis',
    source: 'BCT', actors: ['BCT'],
    rri_impact: '+0.05', urgent: true
  },
  {
    id: 'T009', date: '2026-01-28', title: 'UGTT Escalation — Strike Warning Issued',
    summary: 'UGTT secretariat issues formal strike warning covering public sector. 72-hour notice period begins. General strike probability 64%.',
    type: 'labor', severity: 4, gov: 'Tunis',
    source: 'UGTT', actors: ['UGTT', 'Taboubi'],
    rri_impact: '+0.04', urgent: true
  },
  {
    id: 'T010', date: '2026-01-15', title: 'Kasserine Youth Protest — Unemployment',
    summary: 'Youth demonstration in Kasserine city center against unemployment. 200+ participants. One arrested. Police dispersal.',
    type: 'protest', severity: 3, gov: 'Kasserine',
    source: 'Nawaat', actors: ['Youth Movement'],
    rri_impact: '+0.02', urgent: false
  },
  {
    id: 'T011', date: '2025-12-20', title: 'Internet Throttling — VPN Blocking Attempt',
    summary: 'ATI implements VPN blocking attempt lasting 48 hours. Popular VPN services disrupted. Workarounds widely shared on social media.',
    type: 'censorship', severity: 3, gov: 'National',
    source: 'OONI/Nawaat', actors: ['ATI', 'Ministry of Interior'],
    rri_impact: '+0.03', urgent: false
  },
  {
    id: 'T012', date: '2025-12-05', title: 'Ghannouchi — Day 600 in Detention',
    summary: 'Rached Ghannouchi marks 600 days in pre-trial detention. No trial date set. International criticism from EU Parliament.',
    type: 'detention', severity: 3, gov: 'Tunis',
    source: 'CPJ/HRW', actors: ['Rached Ghannouchi', 'Ennahda'],
    rri_impact: '+0.01', urgent: false
  },
  {
    id: 'T013', date: '2025-11-18', title: 'Sfax Water Cuts — 18 Hours/Day',
    summary: 'SONEDE confirms Sfax water supply reduced to 6 hours/day. Infrastructure failure cited. Opposition disputes explanation.',
    type: 'infrastructure', severity: 4, gov: 'Sfax',
    source: 'SONEDE/Nawaat', actors: ['SONEDE', 'Municipal Council'],
    rri_impact: '+0.04', urgent: true
  },
  {
    id: 'T014', date: '2025-10-30', title: 'Parallel Market TND Premium Reaches 18%',
    summary: 'Tunisian dinar parallel market premium reaches 18% above official BCT rate. Capital flight indicator at warning level.',
    type: 'economic', severity: 3, gov: 'National',
    source: 'Forex monitors', actors: ['BCT'],
    rri_impact: '+0.03', urgent: false
  },
  {
    id: 'T015', date: '2025-09-12', title: 'RSF Ranks Tunisia 118th — Press Freedom',
    summary: 'Reporters Without Borders annual index ranks Tunisia 118th globally. Down 27 places since 2021. Self-censorship at 74%.',
    type: 'rights', severity: 3, gov: 'National',
    source: 'RSF', actors: ['Government'],
    rri_impact: '+0.02', urgent: false
  },
  {
    id: 'T016', date: '2025-08-20', title: 'Gabes Chemical Pollution Protest',
    summary: 'Residents protest ongoing industrial pollution from Gabes chemical complex. 500+ participants. Health ministry denies toxic levels.',
    type: 'protest', severity: 3, gov: 'Gabes',
    source: 'Inkyfada', actors: ['Environmental Groups'],
    rri_impact: '+0.01', urgent: false
  },
  {
    id: 'T017', date: '2025-07-25', title: '4th Anniversary of Presidential Power Grab',
    summary: 'Opposition marks July 25 with protests. Regime celebrates. Security deployment heavy across Tunis. 12 arrests reported.',
    type: 'political', severity: 3, gov: 'Tunis',
    source: 'Multiple', actors: ['Opposition', 'NSF', 'Security Forces'],
    rri_impact: '+0.02', urgent: false
  },
  {
    id: 'T018', date: '2025-06-10', title: 'STEG Power Cuts — Debt Crisis',
    summary: 'STEG announces rolling power cuts in interior regions due to infrastructure debt. 7 governorates affected. Protest in Sidi Bouzid.',
    type: 'infrastructure', severity: 3, gov: 'Sidi Bouzid',
    source: 'STEG/Nawaat', actors: ['STEG'],
    rri_impact: '+0.03', urgent: false
  },
  {
    id: 'T019', date: '2025-04-17', title: 'Ghannouchi Arrest — Day 1',
    summary: 'Rached Ghannouchi arrested on terrorism charges. Ennahda headquarters raided. Mass international condemnation. Protests in Paris.',
    type: 'arrest', severity: 5, gov: 'Tunis',
    source: 'Multiple', actors: ['Rached Ghannouchi', 'Security Forces', 'Ennahda'],
    rri_impact: '+0.08', urgent: true
  },
  {
    id: 'T020', date: '2025-03-01', title: 'Decree 54 Charges Reach 50',
    summary: 'Total Decree 54 charges reach 50 individuals. 18 journalists, 22 activists, 10 business figures. Amnesty International condemns.',
    type: 'censorship', severity: 4, gov: 'National',
    source: 'Amnesty International', actors: ['Government'],
    rri_impact: '+0.03', urgent: false
  },
];

const typeColors: Record<string, string> = {
  protest: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  arrest: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  economic: 'text-intel-green border-intel-green/30 bg-intel-green/10',
  political: 'text-intel-cyan border-intel-cyan/30 bg-intel-cyan/10',
  diplomatic: 'text-intel-purple border-intel-purple/30 bg-intel-purple/10',
  labor: 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10',
  censorship: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  detention: 'text-intel-red border-intel-red/30 bg-intel-red/10',
  infrastructure: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
  rights: 'text-intel-orange border-intel-orange/30 bg-intel-orange/10',
};

const governorates = ['all', 'Tunis', 'Sfax', 'Gafsa', 'Kasserine', 'Gabes', 'Sidi Bouzid', 'National'];
const eventTypes = ['all', 'protest', 'arrest', 'economic', 'political', 'labor', 'censorship', 'detention', 'infrastructure', 'rights'];

export const Timeline: React.FC = () => {
  const { rriState } = usePipeline();
  const [filter, setFilter] = useState('all');
  const [govFilter, setGovFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredEvents = timelineEvents
    .filter(e => filter === 'all' || e.type === filter)
    .filter(e => govFilter === 'all' || e.gov === govFilter || e.gov === 'National')
    .filter(e => actorFilter === '' || e.actors.some(a => a.toLowerCase().includes(actorFilter.toLowerCase())))
    .filter(e => searchQuery === '' || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => sortOrder === 'desc'
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  const stats = {
    total: timelineEvents.length,
    last30: timelineEvents.filter(e => {
      const d = new Date(e.date);
      const now = new Date();
      return (now.getTime() - d.getTime()) < (30 * 24 * 60 * 60 * 1000);
    }).length,
    highSeverity: timelineEvents.filter(e => e.severity >= 4).length,
    rriEvents: timelineEvents.filter(e => e.rri_impact !== '0.00').length
  };

  const getRecencyColor = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = (now.getTime() - d.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays < 7) return 'text-intel-red border-intel-red/30 bg-intel-red/10';
    if (diffDays < 30) return 'text-intel-orange border-intel-orange/30 bg-intel-orange/10';
    return 'text-slate-500 border-white/10 bg-white/5';
  };

  return (
    <div className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: stats.total, color: 'text-white' },
          { label: 'Last 30 Days', value: stats.last30, color: 'text-intel-cyan' },
          { label: 'High Severity', value: stats.highSeverity, color: 'text-intel-red' },
          { label: 'RRI Impacting', value: stats.rriEvents, color: 'text-intel-orange' },
        ].map(stat => (
          <div key={stat.label} className="glass p-4 rounded-xl border border-intel-border flex flex-col items-center">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</div>
            <div className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center text-center space-y-4">
        <div>
          <h2 className="text-2xl tracking-tight">Intelligence Timeline</h2>
          <p className="text-slate-500 text-sm mt-1">Chronological event database with type and severity classification</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass p-6 rounded-2xl border border-intel-border space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search intelligence database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
            />
          </div>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center space-x-2"
          >
            <Clock className="w-4 h-4" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
            {sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-mono uppercase tracking-widest text-slate-400 hover:text-white transition-all flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {eventTypes.map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all whitespace-nowrap border ${
                filter === t 
                  ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/40 font-bold' 
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Governorate</label>
            <select 
              value={govFilter}
              onChange={(e) => setGovFilter(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-xs font-mono text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
            >
              {governorates.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Actor Search</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Filter by actor (e.g. UGTT)..."
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-intel-cyan/50 before:via-intel-border before:to-transparent">
        <AnimatePresence mode="popLayout">
          {filteredEvents.map((event, i) => (
            <motion.div 
              key={event.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
            >
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-intel-border bg-intel-bg text-intel-cyan shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-transform group-hover:scale-110">
                <Clock className="w-5 h-5" />
              </div>
              
              {/* Content */}
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-6 rounded-2xl border border-intel-border hover:border-intel-cyan/30 transition-all group/card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase tracking-tighter ${getRecencyColor(event.date)}`}>
                      {event.date}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border uppercase tracking-tighter ${typeColors[event.type] || 'text-slate-400 border-white/10'}`}>
                      {event.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold border ${
                      event.severity >= 4 ? 'bg-intel-red/10 text-intel-red border-intel-red/20' :
                      event.severity >= 3 ? 'bg-intel-orange/10 text-intel-orange border-intel-orange/20' :
                      'bg-intel-green/10 text-intel-green border-intel-green/20'
                    }`}>
                      LVL {event.severity}
                    </span>
                    {event.urgent && <AlertCircle className="w-3 h-3 text-intel-red animate-pulse" />}
                  </div>
                </div>

                <div className="text-sm font-bold text-white uppercase tracking-tight mb-2 group-hover/card:text-intel-cyan transition-colors">{event.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{event.summary}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {event.actors.map(actor => (
                    <span key={actor} className="text-[8px] font-mono px-2 py-0.5 bg-white/5 text-slate-500 border border-white/10 rounded">
                      {actor}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-intel-border/50">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span className="text-[8px] font-mono text-white uppercase font-bold">{event.gov}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold">{event.source}</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded border ${
                    event.rri_impact.startsWith('+') ? 'bg-intel-red/10 border-intel-red/20 text-intel-red' : 'bg-intel-cyan/10 border-intel-cyan/20 text-intel-cyan'
                  }`}>
                    <span className="text-[8px] font-mono uppercase tracking-tighter">RRI Impact</span>
                    <span className="text-[8px] font-mono font-bold">{event.rri_impact}</span>
                  </div>
                </div>

                {event.severity >= 4 && (
                  <button 
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'pipeline' } }))}
                    className="mt-4 w-full py-2 bg-intel-cyan/5 border border-intel-cyan/20 rounded-xl text-[9px] font-mono text-intel-cyan uppercase tracking-widest hover:bg-intel-cyan hover:text-black transition-all"
                  >
                    → View in Pipeline
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
