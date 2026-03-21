import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shield, 
  Globe, 
  Zap, 
  Search, 
  X, 
  ChevronRight, 
  AlertTriangle, 
  Link as LinkIcon, 
  Activity, 
  Target,
  Eye, 
  Network,
  Plus,
  Radar,
  Trash2,
  Edit2,
  Loader2,
  Check,
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { generateAnalystResponse } from '../../services/geminiService';

const INITIAL_ACTOR_DATA = {
  actors: [
    {
      id: 'saied',
      name: 'Kais Saied',
      role: 'President of Tunisia',
      alignment: 'GOV',
      influence: 95,
      threat_level: 'STATE',
      status: 'ACTIVE',
      color: '#00f2ff',
      initials: 'KS',
      description: 'President since 2019, consolidated power via July 2021 coup. Controls executive, legislative, and judicial branches. Pursuing populist-nationalist agenda.',
      last_active: '2026-03-15',
      cases: ['CASE-001', 'CASE-004'],
      narratives: ['NAR-001', 'NAR-003'],
      nx: 280, ny: 260
    },
    {
      id: 'ghannouchi',
      name: 'Rached Ghannouchi',
      role: 'Ennahda Leader (Detained)',
      alignment: 'OPP',
      influence: 72,
      threat_level: 'DETAINED',
      status: 'DETAINED',
      color: '#ef4444',
      initials: 'RG',
      description: 'Founder and leader of Ennahda party. Detained April 2023 under anti-terrorism charges. Martyrdom effect strengthening opposition narrative.',
      last_active: '2023-04-17',
      cases: ['CASE-002', 'CASE-007'],
      narratives: ['NAR-002', 'NAR-004'],
      nx: 140, ny: 140
    },
    {
      id: 'ugtt',
      name: 'Noureddine Taboubi',
      role: 'UGTT Secretary General',
      alignment: 'OPP',
      influence: 81,
      threat_level: 'HIGH',
      status: 'ACTIVE',
      color: '#f97316',
      initials: 'NT',
      description: 'Leads Tunisia\'s largest trade union (650k members). Key veto player in any economic reform. UGTT mobilisation triggers cascade risk in RRI model.',
      last_active: '2026-03-10',
      cases: ['CASE-005'],
      narratives: ['NAR-005'],
      nx: 160, ny: 380
    },
    {
      id: 'military',
      name: 'Gen. Ammar',
      role: 'Chief of Staff, Armed Forces',
      alignment: 'GOV',
      influence: 78,
      threat_level: 'MONITOR',
      status: 'ACTIVE',
      color: '#00f2ff',
      initials: 'GA',
      description: 'Commands 48,000 active personnel. Historically apolitical institution. Loyalty to Saied regime is the single most important variable in coup-proofing calculus.',
      last_active: '2026-02-28',
      cases: [],
      narratives: ['NAR-001'],
      nx: 400, ny: 140
    },
    {
      id: 'imf',
      name: 'IMF Mission',
      role: 'External Creditor / Pressure Actor',
      alignment: 'INTL',
      influence: 85,
      threat_level: 'LEVERAGE',
      status: 'ACTIVE',
      color: '#bf00ff',
      initials: 'IF',
      description: 'Tunisia owes $4.2B in external debt servicing 2024-2026. IMF deal conditions (subsidy reform, public wage freeze) are primary drivers of social protest risk.',
      last_active: '2026-03-12',
      cases: ['CASE-003'],
      narratives: ['NAR-006'],
      nx: 420, ny: 380
    },
    {
      id: 'bct',
      name: 'BCT Governor',
      role: 'Central Bank of Tunisia',
      alignment: 'GOV',
      influence: 65,
      threat_level: 'LOW',
      status: 'ACTIVE',
      color: '#00f2ff',
      initials: 'BC',
      description: 'Manages dwindling FX reserves (84 days import cover). Key counterpart in IMF negotiations. Independence compromised by presidential pressure on monetary policy.',
      last_active: '2026-03-08',
      cases: [],
      narratives: ['NAR-006'],
      nx: 420, ny: 260
    },
    {
      id: 'eu',
      name: 'European Union',
      role: 'External Actor / Migration Deal',
      alignment: 'INTL',
      influence: 70,
      threat_level: 'LEVERAGE',
      status: 'ACTIVE',
      color: '#bf00ff',
      initials: 'EU',
      description: 'Signed migration cooperation deal 2023 (€105M). Primary concern is irregular migration flows, not political reform. Muted response to democratic backsliding.',
      last_active: '2026-02-20',
      cases: [],
      narratives: ['NAR-007'],
      nx: 280, ny: 420
    },
    {
      id: 'nsf',
      name: 'National Salvation Front',
      role: 'Opposition Coalition',
      alignment: 'OPP',
      influence: 55,
      threat_level: 'MEDIUM',
      status: 'ACTIVE',
      color: '#ef4444',
      initials: 'NS',
      description: 'Broad opposition coalition including Ennahda, Qalb Tounes, and independents. Fragmented by ideological differences. Constrained by Ghannouchi detention.',
      last_active: '2026-03-05',
      cases: ['CASE-007'],
      narratives: ['NAR-002', 'NAR-004'],
      nx: 100, ny: 260
    }
  ],
  relationships: [
    { from: 'saied', to: 'military', type: 'ALLIANCE', strength: 3, label: 'Command authority' },
    { from: 'saied', to: 'bct', type: 'ALLIANCE', strength: 2, label: 'Presidential pressure' },
    { from: 'saied', to: 'imf', type: 'TENSION', strength: 3, label: 'Debt negotiation' },
    { from: 'saied', to: 'ghannouchi', type: 'RIVALRY', strength: 3, label: 'Political persecution' },
    { from: 'saied', to: 'eu', type: 'ALLIANCE', strength: 2, label: 'Migration deal' },
    { from: 'saied', to: 'nsf', type: 'RIVALRY', strength: 3, label: 'Regime vs opposition' },
    { from: 'ghannouchi', to: 'nsf', type: 'ALLIANCE', strength: 3, label: 'Coalition leadership' },
    { from: 'ugtt', to: 'nsf', type: 'ALLIANCE', strength: 2, label: 'Labor-opposition axis' },
    { from: 'ugtt', to: 'saied', type: 'TENSION', strength: 2, label: 'Wage dispute' },
    { from: 'imf', to: 'bct', type: 'ALLIANCE', strength: 3, label: 'Reform conditionality' },
    { from: 'eu', to: 'imf', type: 'ALLIANCE', strength: 2, label: 'Coordinated pressure' },
    { from: 'military', to: 'nsf', type: 'TENSION', strength: 1, label: 'Security monitoring' }
  ]
};

type Alignment = 'ALL' | 'GOV' | 'OPP' | 'INTL' | 'NEUTRAL';

export const ActorNetwork: React.FC<{ context?: any }> = ({ context }) => {
  const [actors, setActors] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [selectedActor, setSelectedActor] = useState<any | null>(null);
  const [filterAlignment, setFilterAlignment] = useState<Alignment>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabels, setShowLabels] = useState(false);
  const [hoveredActor, setHoveredActor] = useState<string | null>(null);
  
  // Modal & Review Panel State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<any | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [lastScan, setLastScan] = useState<string | null>(null);

  // Relationship Editor State
  const [newRel, setNewRel] = useState({ from: '', to: '', type: 'TENSION', strength: 2, label: '' });
  const [showRelEditor, setShowRelEditor] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    alignment: 'NEUTRAL',
    influence: 50,
    threat_level: 'LOW',
    status: 'ACTIVE',
    description: '',
    color: '#94a3b8',
    initials: ''
  });

  const [relData, setRelData] = useState({
    from: '',
    to: '',
    type: 'ALLIANCE',
    strength: 1,
    label: ''
  });

  // Load Data
  useEffect(() => {
    const savedActors = localStorage.getItem('ti_actors');
    const savedRels = localStorage.getItem('ti_relationships');
    const savedScan = localStorage.getItem('ti_last_actor_scan');

    let finalActors = [...INITIAL_ACTOR_DATA.actors];
    if (savedActors) {
      const parsed = JSON.parse(savedActors);
      parsed.forEach((a: any) => {
        const idx = finalActors.findIndex(fa => fa.id === a.id);
        if (idx > -1) finalActors[idx] = a;
        else finalActors.push(a);
      });
    }

    let finalRels = [...INITIAL_ACTOR_DATA.relationships];
    if (savedRels) {
      const parsed = JSON.parse(savedRels);
      finalRels = [...finalRels, ...parsed];
    }

    setActors(finalActors);
    setRelationships(finalRels);
    if (savedScan) setLastScan(savedScan);
  }, []);

  // Save Data
  useEffect(() => {
    if (actors.length > 0) {
      const customActors = actors.filter(a => {
        const initial = INITIAL_ACTOR_DATA.actors.find(ia => ia.id === a.id);
        return !initial || JSON.stringify(a) !== JSON.stringify(initial);
      });
      localStorage.setItem('ti_actors', JSON.stringify(customActors));
      
      // Dispatch event for tab badge
      window.dispatchEvent(new CustomEvent('ti_actors_updated', { detail: { count: actors.length } }));
    }
  }, [actors]);

  useEffect(() => {
    if (relationships.length > 0) {
      const customRels = relationships.filter(r => !INITIAL_ACTOR_DATA.relationships.find(ir => ir.from === r.from && ir.to === r.to && ir.type === r.type));
      localStorage.setItem('ti_relationships', JSON.stringify(customRels));
    }
  }, [relationships]);

  const filteredActors = useMemo(() => {
    return actors.map(actor => {
      const matchesAlignment = filterAlignment === 'ALL' || actor.alignment === filterAlignment;
      const matchesSearch = actor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           actor.role.toLowerCase().includes(searchQuery.toLowerCase());
      return {
        ...actor,
        isDimmed: !matchesAlignment || !matchesSearch
      };
    });
  }, [actors, filterAlignment, searchQuery]);

  const getActorPos = (id: string) => {
    const actor = actors.find(a => a.id === id);
    return actor ? { x: actor.nx, y: actor.ny } : { x: 0, y: 0 };
  };

  // Form Handlers
  const handleNameChange = (name: string) => {
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    setFormData(prev => ({ ...prev, name, initials }));
  };

  const handleAlignmentChange = (alignment: string) => {
    const colors: Record<string, string> = {
      GOV: '#00f2ff',
      OPP: '#ef4444',
      INTL: '#bf00ff',
      NEUTRAL: '#94a3b8'
    };
    setFormData(prev => ({ ...prev, alignment, color: colors[alignment] }));
  };

  const openAddModal = () => {
    setEditingActor(null);
    setFormData({
      name: '',
      role: '',
      alignment: 'NEUTRAL',
      influence: 50,
      threat_level: 'LOW',
      status: 'ACTIVE',
      description: '',
      color: '#94a3b8',
      initials: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (actor: any) => {
    setEditingActor(actor);
    setFormData({
      name: actor.name,
      role: actor.role,
      alignment: actor.alignment,
      influence: actor.influence,
      threat_level: actor.threat_level,
      status: actor.status,
      description: actor.description,
      color: actor.color,
      initials: actor.initials
    });
    setIsModalOpen(true);
  };

  const handleSaveActor = (e: React.FormEvent) => {
    e.preventDefault();
    const id = editingActor ? editingActor.id : formData.name.toLowerCase().replace(/\s+/g, '_');
    
    let nx = editingActor?.nx;
    let ny = editingActor?.ny;

    if (!editingActor) {
      // Find non-overlapping position
      let attempts = 0;
      while (attempts < 50) {
        const tx = Math.floor(Math.random() * 400) + 80;
        const ty = Math.floor(Math.random() * 360) + 80;
        const overlap = actors.some(a => Math.sqrt(Math.pow(a.nx - tx, 2) + Math.pow(a.ny - ty, 2)) < 60);
        if (!overlap) {
          nx = tx;
          ny = ty;
          break;
        }
        attempts++;
      }
      if (nx === undefined) { nx = 280; ny = 260; }
    }

    const newActor = {
      ...formData,
      id,
      nx,
      ny,
      last_active: new Date().toISOString().split('T')[0],
      cases: editingActor?.cases || [],
      narratives: editingActor?.narratives || []
    };

    if (editingActor) {
      setActors(prev => prev.map(a => a.id === id ? newActor : a));
      if (selectedActor?.id === id) setSelectedActor(newActor);
    } else {
      setActors(prev => [...prev, newActor]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteActor = (id: string) => {
    if (window.confirm('Are you sure you want to delete this actor? All their relationships will also be removed.')) {
      setActors(prev => prev.filter(a => a.id !== id));
      setRelationships(prev => prev.filter(r => r.from !== id && r.to !== id));
      setSelectedActor(null);
    }
  };

  const handleAddRelationship = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!relData.from || !relData.to) return;
    if (relData.from === relData.to) return;
    
    const newRel = { ...relData };
    setRelationships(prev => [...prev, newRel]);
    setRelData({ from: '', to: '', type: 'ALLIANCE', strength: 1, label: '' });
    setShowRelEditor(false);
  };

  const handleDeleteRelationship = (idx: number) => {
    setRelationships(prev => prev.filter((_, i) => i !== idx));
  };

  const handleScanActors = async () => {
    setIsScanning(true);
    const existingNames = actors.map(a => a.name);
    
    try {
      const prompt = `Based on the current Tunisia political situation in March 2026, identify up to 3 new political actors not already in this list: ${existingNames.join(', ')}.
      
      For each new actor return a JSON array with objects containing:
      id, name, role, alignment (GOV/OPP/INTL/NEUTRAL), influence (0-100), threat_level, status, description.
      
      Return ONLY valid JSON array, no other text.`;

      const response = await generateAnalystResponse(prompt, context);
      const cleaned = response.replace(/```json|```/g, '').trim();
      const newActors = JSON.parse(cleaned);
      
      const filtered = newActors.filter((na: any) => !actors.some(a => a.name.toLowerCase() === na.name.toLowerCase()));
      setSuggestions(filtered);
      
      const now = new Date().toLocaleString();
      setLastScan(now);
      localStorage.setItem('ti_last_actor_scan', now);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const addSuggestedActor = (actor: any) => {
    let nx = 280, ny = 260;
    let attempts = 0;
    while (attempts < 50) {
      const tx = Math.floor(Math.random() * 400) + 80;
      const ty = Math.floor(Math.random() * 360) + 80;
      const overlap = actors.some(a => Math.sqrt(Math.pow(a.nx - tx, 2) + Math.pow(a.ny - ty, 2)) < 60);
      if (!overlap) {
        nx = tx; ny = ty;
        break;
      }
      attempts++;
    }

    const colors: Record<string, string> = { GOV: '#00f2ff', OPP: '#ef4444', INTL: '#bf00ff', NEUTRAL: '#94a3b8' };
    const initials = actor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    const fullActor = {
      ...actor,
      nx, ny,
      color: colors[actor.alignment] || '#94a3b8',
      initials,
      last_active: new Date().toISOString().split('T')[0],
      cases: [],
      narratives: []
    };

    setActors(prev => [...prev, fullActor]);
    setSuggestions(prev => prev.filter(s => s.id !== actor.id));
  };

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 intel-card border border-intel-border rounded-xl">
        <div className="flex items-center space-x-4 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-intel-border rounded-lg py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-intel-cyan transition-colors font-mono"
            />
          </div>
          <div className="flex items-center bg-black/40 border border-intel-border rounded-lg p-1">
            {(['ALL', 'GOV', 'OPP', 'INTL'] as Alignment[]).map((align) => (
              <button
                key={align}
                onClick={() => setFilterAlignment(align)}
                className={`px-3 py-1 text-[10px] font-bold font-mono rounded-md transition-all ${
                  filterAlignment === align 
                    ? align === 'GOV' ? 'bg-intel-cyan text-black' :
                      align === 'OPP' ? 'bg-red-500 text-white' :
                      align === 'INTL' ? 'bg-purple-500 text-white' :
                      'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {align}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-end mr-2">
            <button
              onClick={handleScanActors}
              disabled={isScanning}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-all text-[10px] font-bold font-mono disabled:opacity-50"
            >
              {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radar className="w-3 h-3" />}
              <span>SCAN FOR ACTORS</span>
            </button>
            {lastScan && <span className="text-[7px] text-slate-600 font-mono mt-1 uppercase">Last: {lastScan}</span>}
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center space-x-2 px-3 py-2 bg-intel-cyan/10 text-intel-cyan border border-intel-cyan/30 rounded-lg hover:bg-intel-cyan/20 transition-all text-[10px] font-bold font-mono"
          >
            <Plus className="w-3 h-3" />
            <span>ADD ACTOR</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-3 py-2 rounded-lg border text-[10px] font-bold font-mono transition-all ${
              showLabels 
                ? 'bg-intel-cyan/10 border-intel-cyan text-intel-cyan' 
                : 'border-intel-border text-slate-500 hover:border-slate-700'
            }`}
          >
            LABELS {showLabels ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-[500px] gap-4 relative">
        {/* Network Graph */}
        <div className="flex-1 intel-card border border-intel-border rounded-2xl relative overflow-hidden bg-black/20">
          <svg viewBox="0 0 560 520" className="w-full h-full">
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Relationships */}
            {relationships.map((rel, idx) => {
              const from = getActorPos(rel.from);
              const to = getActorPos(rel.to);
              
              const isFromDimmed = filteredActors.find(a => a.id === rel.from)?.isDimmed;
              const isToDimmed = filteredActors.find(a => a.id === rel.to)?.isDimmed;
              const isDimmed = isFromDimmed || isToDimmed;

              let stroke = '#475569';
              let opacity = 0.4;
              let strokeWidth = rel.strength * 1.5;

              if (rel.type === 'ALLIANCE') {
                stroke = '#00f2ff';
              } else if (rel.type === 'TENSION') {
                stroke = '#f97316';
              } else if (rel.type === 'RIVALRY') {
                stroke = '#ef4444';
                strokeWidth = rel.strength * 2;
                opacity = 0.5;
              }

              return (
                <g key={`rel-${idx}`} opacity={isDimmed ? 0.1 : opacity}>
                  <line 
                    x1={from.x} y1={from.y} 
                    x2={to.x} y2={to.y} 
                    stroke={stroke} 
                    strokeWidth={strokeWidth}
                    className="transition-all duration-500"
                  />
                  {showLabels && (
                    <text 
                      x={(from.x + to.x) / 2} 
                      y={(from.y + to.y) / 2} 
                      fontSize="7" 
                      fill="#64748b" 
                      textAnchor="middle" 
                      dy="-4"
                      className="font-mono pointer-events-none"
                    >
                      {rel.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {filteredActors.map((actor) => {
              const r = actor.influence / 10 + 2;
              const isSelected = selectedActor?.id === actor.id;
              const isHovered = hoveredActor === actor.id;
              const isDimmed = actor.isDimmed;

              return (
                <g 
                  key={actor.id} 
                  transform={`translate(${actor.nx}, ${actor.ny})`}
                  className="cursor-pointer transition-all duration-500"
                  onClick={() => setSelectedActor(actor)}
                  onMouseEnter={() => setHoveredActor(actor.id)}
                  onMouseLeave={() => setHoveredActor(null)}
                  opacity={isDimmed ? 0.2 : 1}
                >
                  <circle r={r + 4} fill={actor.color} opacity={isSelected || isHovered ? 0.2 : 0.08} />
                  <circle r={r} fill={`${actor.color}15`} stroke={actor.color} strokeWidth={isSelected || isHovered ? 2.5 : 1.5} />
                  {isSelected && <circle r={r + 6} fill="none" stroke={actor.color} strokeWidth="1" strokeDasharray="2 2" className="animate-spin-slow" />}
                  <text fontSize="9" fontWeight="700" fill={actor.color} textAnchor="middle" dy="3" className="font-mono pointer-events-none">{actor.initials}</text>
                  <text fontSize="7" fill="#94a3b8" textAnchor="middle" dy={r + 12} className="font-mono pointer-events-none font-bold">{actor.name.toUpperCase()}</text>
                  {actor.threat_level === 'DETAINED' && <circle cx={r * 0.7} cy={-r * 0.7} r="3" fill="#ef4444" stroke="#000" strokeWidth="1" />}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-6 bg-black/60 backdrop-blur-md border border-intel-border p-3 rounded-xl">
            <div className="flex items-center space-x-2"><div className="w-6 h-0.5 bg-intel-cyan opacity-60"></div><span className="text-[8px] font-mono text-slate-400 uppercase">Alliance</span></div>
            <div className="flex items-center space-x-2"><div className="w-6 h-0.5 bg-intel-orange opacity-60"></div><span className="text-[8px] font-mono text-slate-400 uppercase">Tension</span></div>
            <div className="flex items-center space-x-2"><div className="w-6 h-0.5 bg-red-500 opacity-60"></div><span className="text-[8px] font-mono text-slate-400 uppercase">Rivalry</span></div>
            <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full border border-slate-500"></div><span className="text-[8px] font-mono text-slate-400 uppercase">Influence</span></div>
            <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-[8px] font-mono text-slate-400 uppercase">Detained</span></div>
          </div>
        </div>

        {/* Spotlight Panel */}
        <AnimatePresence>
          {selectedActor && (
            <motion.div 
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 intel-card border border-intel-border rounded-2xl flex flex-col overflow-hidden bg-black/40 backdrop-blur-xl"
            >
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="relative">
                  <div className="absolute -top-2 -right-2 flex space-x-1">
                    <button onClick={() => openEditModal(selectedActor)} className="p-2 text-slate-500 hover:text-intel-cyan transition-colors"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => handleDeleteActor(selectedActor.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                    <button onClick={() => setSelectedActor(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold font-mono border" style={{ backgroundColor: `${selectedActor.color}15`, borderColor: selectedActor.color, color: selectedActor.color }}>{selectedActor.initials}</div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">{selectedActor.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono leading-tight">{selectedActor.role}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${selectedActor.alignment === 'GOV' ? 'bg-intel-cyan/10 text-intel-cyan' : selectedActor.alignment === 'OPP' ? 'bg-red-500/10 text-red-500' : 'bg-purple-500/10 text-purple-500'}`}>{selectedActor.alignment}</span>
                        <span className="px-2 py-0.5 rounded bg-white/5 text-slate-400 text-[8px] font-bold font-mono">{selectedActor.threat_level}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-end justify-between"><span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Influence Score</span><span className="text-xl font-bold font-mono text-white">{selectedActor.influence}</span></div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} animate={{ width: `${selectedActor.influence}%` }} className="h-full bg-intel-cyan" /></div>
                </div>

                <div className="space-y-2">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Profile Summary</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-mono">{selectedActor.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-intel-border">
                  <div className="space-y-1"><span className="text-[8px] font-mono text-slate-500 uppercase">Last Active</span><div className="text-[10px] font-mono text-white">{selectedActor.last_active}</div></div>
                  <div className="space-y-1"><span className="text-[8px] font-mono text-slate-500 uppercase">Current Status</span><div className="flex items-center space-x-1.5"><div className={`w-1.5 h-1.5 rounded-full ${selectedActor.status === 'ACTIVE' ? 'bg-intel-green' : 'bg-red-500'}`} /><span className="text-[10px] font-mono text-white">{selectedActor.status}</span></div></div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Network Connections</span>
                    <button 
                      onClick={() => setShowRelEditor(!showRelEditor)}
                      className="p-1 text-intel-cyan hover:bg-intel-cyan/10 rounded transition-all"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {showRelEditor && (
                    <div className="p-3 bg-white/5 rounded-xl border border-intel-cyan/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[7px] font-mono text-slate-500 uppercase">Target Actor</label>
                          <select 
                            value={relData.to}
                            onChange={(e) => setRelData(prev => ({ ...prev, to: e.target.value, from: selectedActor.id }))}
                            className="w-full bg-black/40 border border-intel-border rounded py-1 px-2 text-[9px] text-white focus:outline-none focus:border-intel-cyan font-mono"
                          >
                            <option value="">Select...</option>
                            {actors.filter(a => a.id !== selectedActor.id).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[7px] font-mono text-slate-500 uppercase">Type</label>
                          <select 
                            value={relData.type}
                            onChange={(e) => setRelData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full bg-black/40 border border-intel-border rounded py-1 px-2 text-[9px] text-white focus:outline-none focus:border-intel-cyan font-mono"
                          >
                            <option value="ALLIANCE">ALLIANCE</option>
                            <option value="TENSION">TENSION</option>
                            <option value="RIVALRY">RIVALRY</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[7px] font-mono text-slate-500 uppercase">Relationship Label</label>
                        <input 
                          type="text"
                          placeholder="e.g. Strategic alliance"
                          value={relData.label}
                          onChange={(e) => setRelData(prev => ({ ...prev, label: e.target.value }))}
                          className="w-full bg-black/40 border border-intel-border rounded py-1 px-2 text-[9px] text-white focus:outline-none focus:border-intel-cyan font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex space-x-1">
                          {[1, 2, 3].map(s => (
                            <button
                              key={s}
                              onClick={() => setRelData(prev => ({ ...prev, strength: s }))}
                              className={`w-6 h-6 rounded border text-[8px] font-mono transition-all ${
                                relData.strength === s ? 'bg-intel-cyan/20 border-intel-cyan text-intel-cyan' : 'border-intel-border text-slate-500'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={handleAddRelationship}
                          className="px-3 py-1 bg-intel-cyan text-black rounded text-[9px] font-bold font-mono uppercase hover:bg-white transition-all"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {relationships.filter(rel => rel.from === selectedActor.id || rel.to === selectedActor.id).map((rel, idx) => {
                      const otherId = rel.from === selectedActor.id ? rel.to : rel.from;
                      const otherActor = actors.find(a => a.id === otherId);
                      const actualIdx = relationships.findIndex(r => r === rel);
                      return (
                        <div key={idx} className="group flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all">
                          <div className="flex items-center space-x-2">
                            <div className="w-1 h-4 rounded-full" style={{ backgroundColor: rel.type === 'ALLIANCE' ? '#00f2ff' : rel.type === 'TENSION' ? '#f97316' : '#ef4444' }} />
                            <span className="text-[10px] font-mono text-white">{otherActor?.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center mr-2">
                              <button 
                                onClick={() => handleDeleteRelationship(actualIdx)}
                                className="p-1 text-slate-500 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-[8px] font-mono text-slate-500 uppercase">{rel.type}</span>
                            <div className="flex space-x-0.5">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-1 h-1 rounded-full ${i < rel.strength ? 'bg-intel-cyan' : 'bg-slate-700'}`} />
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button onClick={() => console.log('Generating dossier for:', selectedActor.name)} className="w-full py-3 bg-intel-cyan/10 border border-intel-cyan/30 text-intel-cyan rounded-xl text-[10px] font-bold font-mono uppercase tracking-widest hover:bg-intel-cyan/20 transition-all flex items-center justify-center space-x-2 mt-4"><Activity className="w-3 h-3" /><span>Generate Dossier</span></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Panel */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div 
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="absolute top-0 right-0 bottom-0 w-80 intel-card border border-intel-border rounded-2xl flex flex-col overflow-hidden bg-black/60 backdrop-blur-2xl z-50"
            >
              <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center">
                    <Radar className="w-3 h-3 mr-2" />
                    Review New Actors
                  </h3>
                  <button onClick={() => setSuggestions([])} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4">
                  {suggestions.map((s) => (
                    <div key={s.id} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-white uppercase">{s.name}</div>
                        <div className="text-[8px] text-slate-500 font-mono">{s.role}</div>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight italic">"{s.description}"</p>
                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <div className="flex space-x-2">
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[7px] font-mono">{s.alignment}</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-500 text-[7px] font-mono">INF: {s.influence}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button onClick={() => setSuggestions(prev => prev.filter(x => x.id !== s.id))} className="p-1.5 text-slate-500 hover:text-red-500 transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
                          <button onClick={() => addSuggestedActor(s)} className="p-1.5 text-slate-500 hover:text-intel-green transition-colors"><CheckCircle2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl intel-card border border-intel-border rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-intel-border flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                  {editingActor ? <Edit2 className="w-4 h-4 mr-2 text-intel-cyan" /> : <Plus className="w-4 h-4 mr-2 text-intel-cyan" />}
                  {editingActor ? 'Edit Actor Profile' : 'Register New Political Actor'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                <form onSubmit={handleSaveActor} className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Full Name</label>
                      <input 
                        required
                        type="text" 
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Official Role</label>
                      <input 
                        required
                        type="text" 
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Alignment</label>
                        <select 
                          value={formData.alignment}
                          onChange={(e) => handleAlignmentChange(e.target.value)}
                          className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono"
                        >
                          <option value="GOV">GOV</option>
                          <option value="OPP">OPP</option>
                          <option value="INTL">INTL</option>
                          <option value="NEUTRAL">NEUTRAL</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Initials</label>
                        <input 
                          maxLength={2}
                          type="text" 
                          value={formData.initials}
                          onChange={(e) => setFormData(prev => ({ ...prev, initials: e.target.value.toUpperCase() }))}
                          className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Influence Score</label>
                        <span className="text-xs font-mono text-intel-cyan">{formData.influence}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100"
                        value={formData.influence}
                        onChange={(e) => setFormData(prev => ({ ...prev, influence: parseInt(e.target.value) }))}
                        className="w-full accent-intel-cyan"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Threat Level</label>
                        <select 
                          value={formData.threat_level}
                          onChange={(e) => setFormData(prev => ({ ...prev, threat_level: e.target.value }))}
                          className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono"
                        >
                          <option value="STATE">STATE</option>
                          <option value="HIGH">HIGH</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="LOW">LOW</option>
                          <option value="DETAINED">DETAINED</option>
                          <option value="MONITOR">MONITOR</option>
                          <option value="LEVERAGE">LEVERAGE</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-slate-500 uppercase">Status</label>
                        <select 
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="DETAINED">DETAINED</option>
                          <option value="INACTIVE">INACTIVE</option>
                          <option value="UNKNOWN">UNKNOWN</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-500 uppercase">Color Profile</label>
                      <div className="flex items-center space-x-3">
                        <input 
                          type="color" 
                          value={formData.color}
                          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                          className="w-8 h-8 bg-transparent border-none cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-400">{formData.color}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">Description / Intel Summary</label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-black/40 border border-intel-border rounded-lg py-2 px-3 text-xs text-white focus:outline-none focus:border-intel-cyan font-mono resize-none"
                      placeholder="Enter 2-3 sentences summarizing the actor's strategic importance..."
                    />
                  </div>

                  <div className="col-span-2 pt-2">
                    <button 
                      type="submit"
                      className="w-full py-3 bg-intel-cyan text-black rounded-xl text-xs font-bold font-mono uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)]"
                    >
                      {editingActor ? 'Update Actor Profile' : 'Register Actor'}
                    </button>
                  </div>
                </form>

                <div className="pt-8 border-t border-intel-border">
                  {/* Relationship editor moved to Spotlight Panel */}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
