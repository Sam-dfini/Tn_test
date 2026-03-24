import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Globe,
  Briefcase
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePipeline } from '../../context/PipelineContext';

const parties = [
  {
    id: 'ennahda',
    name: 'Ennahda Movement',
    arabicName: 'حركة النهضة',
    leader: 'Rached Ghannouchi',
    leaderStatus: 'DETAINED',
    founded: 1981,
    ideology: 'Conservative / Political Islam',
    alignment: 'OPPOSITION',
    status: 'DISMANTLING',
    strength: 15,
    peakStrength: 42,
    base: 'Urban working class, rural south, diaspora',
    coalition: 'National Salvation Front',
    parliamentSeats: 0,
    color: '#ff9f0a',
    rriContribution: '+0.08',
    recentEvents: [
      'Ghannouchi arrested Apr 2023 — terrorism charges',
      'HQ raided and closed',
      'Deputy leaders detained',
      'International bureau operating from abroad',
    ],
    analysis: 'Once the dominant political force with 42% in 2011 elections. Now systematically dismantled. Leadership in exile or prison. Grassroots network intact but unable to organize publicly. Remains the regime\'s primary political enemy.',
    threatLevel: 'HIGH',
    internationalLinks: ['Turkey (AKP)', 'Qatar', 'Muslim Brotherhood network'],
  },
  {
    id: 'pdl',
    name: 'Free Destourian Party (PDL)',
    arabicName: 'الحزب الدستوري الحر',
    leader: 'Abir Moussi',
    leaderStatus: 'DETAINED',
    founded: 2013,
    ideology: 'Secular / Destourian Nationalist',
    alignment: 'OPPOSITION',
    status: 'SUPPRESSED',
    strength: 12,
    peakStrength: 20,
    base: 'Coastal regions, former RCD base, secular middle class',
    coalition: 'Independent',
    parliamentSeats: 0,
    color: '#ff453a',
    rriContribution: '+0.03',
    recentEvents: [
      'Abir Moussi detained Oct 2023',
      'Party activities suspended',
      'Ben Ali legacy base fragmenting',
    ],
    analysis: 'Pro-Ben Ali legacy party that paradoxically became an opposition force against Saied. Moussi\'s detention removed their most charismatic voice. Base is ideologically opposed to both the regime and Ennahda — in political limbo.',
    threatLevel: 'MEDIUM',
    internationalLinks: ['France (Parti des Français)', 'Destourian diaspora'],
  },
  {
    id: 'echaab',
    name: 'Echaab Movement',
    arabicName: 'حركة الشعب',
    leader: 'Zouhair Maghzaoui',
    leaderStatus: 'ACTIVE',
    founded: 2012,
    ideology: 'Arab Nationalist / Left-Populist',
    alignment: 'CRITICAL SUPPORT',
    status: 'ACTIVE',
    strength: 8,
    peakStrength: 12,
    base: 'Public sector workers, unionists, Arab nationalists',
    coalition: 'National Council for Freedoms support',
    parliamentSeats: 22,
    color: '#30d158',
    rriContribution: '-0.02',
    recentEvents: [
      'Parliamentary bloc active',
      'Increasingly critical of economic management',
      'UGTT relationship maintained',
    ],
    analysis: 'Initially supported Saied\'s July 25 move. Now increasingly uncomfortable with economic deterioration and authoritarian drift. A potential pivot point — if Echaab withdraws support, regime loses its nationalist credibility.',
    threatLevel: 'MONITOR',
    internationalLinks: ['Algeria (FLN)', 'Arab League contacts'],
  },
  {
    id: 'nsf',
    name: 'National Salvation Front (NSF)',
    arabicName: 'جبهة الخلاص الوطني',
    leader: 'Ahmed Nejib Chebbi',
    leaderStatus: 'ACTIVE',
    founded: 2022,
    ideology: 'Opposition Coalition / Pro-Democracy',
    alignment: 'OPPOSITION',
    status: 'CONSTRAINED',
    strength: 18,
    peakStrength: 18,
    base: 'Urban educated class, civil society, diaspora',
    coalition: 'Includes Ennahda, PDL elements, independents',
    parliamentSeats: 0,
    color: '#0a84ff',
    rriContribution: '+0.04',
    recentEvents: [
      'Regular press conferences demanding elections',
      'International lobbying in EU and US',
      'Internal tensions between secular and Islamist factions',
      'Unable to organize public demonstrations without arrests',
    ],
    analysis: 'The main organized opposition coalition. Broad but fragile — secular and Islamist factions have deep mutual distrust. Effective at international advocacy but limited domestic mobilization capacity under Decree 54 pressure.',
    threatLevel: 'MEDIUM',
    internationalLinks: ['EU Parliament contacts', 'US State Department', 'NED funding'],
  },
  {
    id: 'ugtt_political',
    name: 'UGTT (Political Dimension)',
    arabicName: 'الاتحاد العام التونسي للشغل',
    leader: 'Noureddine Taboubi',
    leaderStatus: 'ACTIVE',
    founded: 1944,
    ideology: 'Labor / Social Democratic',
    alignment: 'INDEPENDENT / OPPOSITION-LEANING',
    status: 'ACTIVE',
    strength: 35,
    peakStrength: 40,
    base: 'Public sector workers, teachers, transport, health, CPG',
    coalition: 'Independent but aligned with NSF on key issues',
    parliamentSeats: 0,
    color: '#bf5af2',
    rriContribution: '+0.12',
    recentEvents: [
      'General strike threat — 64% probability',
      'CPG wage arrears dispute ongoing',
      'Formal break with Saied administration',
      'Paris rally — 8,000 diaspora participants',
    ],
    analysis: 'The most organizationally powerful entity in Tunisian civil society. 700,000+ members. Has brought down governments before (1978, 2013). Current mobilization level is the highest since 2013. A general strike would be the single most significant destabilization event possible.',
    threatLevel: 'CRITICAL',
    internationalLinks: ['ITUC (global union federation)', 'European trade unions', 'ILO'],
  },
  {
    id: 'saied_bloc',
    name: 'Presidential Bloc (Informal)',
    arabicName: 'كتلة الرئاسة',
    leader: 'Kais Saied',
    leaderStatus: 'ACTIVE',
    founded: 2021,
    ideology: 'Presidential / Populist / Anti-Party',
    alignment: 'REGIME',
    status: 'DOMINANT',
    strength: 45,
    peakStrength: 72,
    base: 'Security apparatus, some civil servants, rural conservatives',
    coalition: 'Echaab (wavering), some independent MPs',
    parliamentSeats: 130,
    color: '#00d4ff',
    rriContribution: '-0.15',
    recentEvents: [
      'Constitutional dominance maintained',
      'Approval rating declining — now 35%',
      'Economic management under increasing pressure',
      'International isolation deepening',
    ],
    analysis: 'Controls all formal institutions but legitimacy is eroding. No organized political party — relies on personal authority. Vulnerability: if military loyalty shifts or economic crisis becomes acute, no institutional base to fall back on. The strength IS the weakness.',
    threatLevel: 'DOMINANT',
    internationalLinks: ['Gulf states (financial support)', 'EU (migration deal)', 'Russia (informal)'],
  },
];

export const PartyDossier: React.FC = () => {
  const { rriState } = usePipeline();
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alignmentFilter, setAlignmentFilter] = useState('ALL');

  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.arabicName.includes(searchQuery) ||
                          p.leader.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAlignment = alignmentFilter === 'ALL' || p.alignment === alignmentFilter;
    return matchesSearch && matchesAlignment;
  });

  const stats = [
    { label: 'Active Parties Tracked', value: parties.length, icon: Users, color: 'text-intel-cyan' },
    { label: 'Opposition Strength', value: parties.filter(p => p.alignment === 'OPPOSITION').reduce((acc, p) => acc + p.strength, 0) + '%', icon: Activity, color: 'text-intel-red' },
    { label: 'Regime Support', value: parties.find(p => p.id === 'saied_bloc')?.strength + '%', icon: TrendingUp, color: 'text-intel-cyan' },
    { label: 'Critical Threat Actors', value: parties.filter(p => p.threatLevel === 'CRITICAL').length, icon: ShieldAlert, color: 'text-intel-red', badge: true }
  ];

  const alignments = ['ALL', 'REGIME', 'OPPOSITION', 'CRITICAL SUPPORT', 'INDEPENDENT'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="intel-card p-6 rounded-2xl border border-intel-border flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{stat.label}</span>
                <div className={cn("text-2xl font-bold font-mono", stat.color)}>
                  {stat.value}
                  {stat.badge && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="w-2 h-2 rounded-full bg-intel-red animate-pulse mr-1.5" />
                    </span>
                  )}
                </div>
              </div>
              <stat.icon className={cn("w-5 h-5 opacity-20", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between glass p-4 rounded-2xl border border-intel-border">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search parties, leaders, ideologies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-mono text-white focus:outline-none focus:border-intel-cyan/50 transition-all"
          />
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {alignments.map(a => (
            <button 
              key={a}
              onClick={() => setAlignmentFilter(a)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-widest transition-all whitespace-nowrap border ${
                alignmentFilter === a 
                  ? 'bg-intel-cyan/10 text-intel-cyan border-intel-cyan/40 font-bold' 
                  : 'bg-white/5 text-slate-500 border-white/5 hover:text-slate-300'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Party Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filteredParties.map((party) => (
          <div key={party.id} className="intel-card rounded-3xl border border-intel-border overflow-hidden flex flex-col">
            <div className="p-8 space-y-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{party.name}</h3>
                    <span className="text-xs font-mono text-slate-500">{party.arabicName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-300">{party.leader}</span>
                    <span className={cn(
                      "text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase font-bold",
                      party.leaderStatus === 'DETAINED' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : "bg-intel-green/10 text-intel-green border-intel-green/20"
                    )}>
                      {party.leaderStatus}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span className={cn(
                    "text-[8px] font-mono px-2 py-1 rounded border uppercase font-bold",
                    party.alignment === 'REGIME' ? "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20" :
                    party.alignment === 'OPPOSITION' ? "bg-intel-red/10 text-intel-red border-intel-red/20" :
                    "bg-intel-orange/10 text-intel-orange border-intel-orange/20"
                  )}>
                    {party.alignment}
                  </span>
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Status: {party.status}</span>
                </div>
              </div>

              {/* Strength Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">Influence Strength</span>
                  <div className="space-x-2">
                    <span className="text-white font-bold">{party.strength}%</span>
                    <span className="text-slate-600">Peak: {party.peakStrength}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ width: `${party.strength}%`, backgroundColor: party.color }} 
                  />
                  <div 
                    className="absolute top-0 h-full border-r border-dashed border-slate-500 opacity-50" 
                    style={{ left: `${party.peakStrength}%` }} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">Ideology</div>
                  <div className="text-[10px] text-slate-300 font-bold">{party.ideology}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="text-[8px] font-mono text-slate-500 uppercase mb-1">RRI Contribution</div>
                  <div className={cn(
                    "text-[10px] font-mono font-bold",
                    party.rriContribution.startsWith('+') ? "text-intel-red" : "text-intel-green"
                  )}>{party.rriContribution}</div>
                </div>
              </div>

              {/* Recent Events (Collapsed) */}
              <div className="space-y-2">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Recent Intelligence</div>
                <div className="space-y-1">
                  {party.recentEvents.slice(0, 2).map((event, i) => (
                    <div key={i} className="flex items-start space-x-2 text-[10px] text-slate-400">
                      <div className="w-1 h-1 rounded-full bg-intel-cyan mt-1.5 shrink-0" />
                      <p className="leading-tight">{event}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 border-t border-intel-border">
              <button 
                onClick={() => setSelectedParty(selectedParty === party.id ? null : party.id)}
                className="w-full py-2 flex items-center justify-center space-x-2 text-[10px] font-mono text-intel-cyan uppercase tracking-widest hover:bg-intel-cyan/10 transition-all rounded-xl"
              >
                <span>{selectedParty === party.id ? 'Close Dossier' : 'View Full Dossier'}</span>
                {selectedParty === party.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Expanded Dossier */}
            <AnimatePresence>
              {selectedParty === party.id && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black/40 border-t border-intel-border"
                >
                  <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest">Strategic Analysis</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{party.analysis}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest">Base & Constituency</h4>
                          <p className="text-xs text-slate-400">{party.base}</p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-intel-cyan uppercase tracking-widest">Coalition Alignment</h4>
                          <p className="text-xs text-slate-400">{party.coalition}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <div className="p-4 bg-intel-red/5 border border-intel-red/20 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-intel-red uppercase tracking-widest">Threat Assessment</h4>
                            <span className="px-2 py-0.5 bg-intel-red/10 text-intel-red border border-intel-red/20 rounded text-[8px] font-mono uppercase font-bold">{party.threatLevel}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic">"High probability of continued suppression. Organizational resilience remains the key variable for Q3 2026."</div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">International Links</h4>
                          <div className="flex flex-wrap gap-2">
                            {party.internationalLinks.map(link => (
                              <span key={link} className="flex items-center space-x-1 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] text-slate-400">
                                <Globe className="w-3 h-3" />
                                <span>{link}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pipeline', { detail: { tab: 'political', subTab: 'powermap' }}))}
                          className="w-full py-3 bg-intel-cyan/10 border border-intel-cyan/30 rounded-xl text-[10px] font-mono text-intel-cyan uppercase tracking-widest hover:bg-intel-cyan hover:text-black transition-all flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>View in Power Map</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Coalition Map Visualization */}
      <div className="intel-card p-8 rounded-3xl border border-intel-border space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Coalition Landscape — Q1 2026</h3>
          <Briefcase className="w-5 h-5 text-intel-cyan opacity-20" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: 'National Salvation Front', color: 'border-intel-red/30 bg-intel-red/5', parties: ['Ennahda', 'PDL Elements', 'Independents'] },
            { name: 'Regime Bloc', color: 'border-intel-cyan/30 bg-intel-cyan/5', parties: ['Presidential Bloc', 'Echaab (wavering)'] },
            { name: 'Isolated', color: 'border-slate-700 bg-slate-900/50', parties: ['PDL (Main)'] },
            { name: 'Independent', color: 'border-intel-purple/30 bg-intel-purple/5', parties: ['UGTT'] },
          ].map((coalition, i) => (
            <div key={i} className={cn("p-4 rounded-2xl border space-y-3", coalition.color)}>
              <div className="text-[10px] font-bold text-white uppercase tracking-wider">{coalition.name}</div>
              <div className="flex flex-wrap gap-1.5">
                {coalition.parties.map(p => (
                  <span key={p} className="text-[8px] font-mono px-1.5 py-0.5 bg-black/40 text-slate-400 border border-white/5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
