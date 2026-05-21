import 'katex/dist/katex.min.css';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, ChevronDown, ChevronRight, AlertTriangle, Info, ExternalLink,
  Activity, Brain, Globe, Shield, TrendingUp, Users, Bell, Bot, Sparkles,
  Loader2, MessageSquare, CheckCircle, XCircle, AlertCircle, Clock,
  FileText, Zap, UserCheck, UserX, Target, BarChart3, Search,
} from 'lucide-react';
import { ModuleHeader } from '../shared/ProfessionalShared';

interface DeliberationSession {
  session_id: string;
  scenario_description: string;
  trigger_type: string;
  trigger_source?: string;
  state_version_id: string;
  is_simulation?: boolean;
  resolution_type?: string;
  confidence?: number;
  dominant_coalition?: string[];
  dissenting_actors?: string[];
  positions?: DeliberationPosition[];
  veto_active?: boolean;
  veto_actor?: string;
  veto_condition?: string;
  duration_ms?: number;
  completed_at?: string;
  started_at?: string;
  decision_output?: {
    primary_action?: string;
    primary_confidence?: number;
    secondary_action?: string | null;
    secondary_confidence?: number | null;
    full_distribution?: Record<string, number>;
  };
  conflict_map?: Record<string, any>;
  coalition_map?: Record<string, any>;
}

interface DeliberationPosition {
  entity_id: string;
  actor_name: string;
  recommendation: string;
  recommendation_confidence: number;
  reasoning_chain?: string;
  supporting_actions?: string[];
  key_fear?: string;
  doctrine_applied?: string;
  live_citations?: any[];
  doctrine_citations?: any[];
  adjusted_probabilities?: Record<string, number>;
}

const SCENARIO_PRESETS = [
  { label: 'IMF subsidy removal', scenario: 'IMF demands full subsidy removal by Q3 2027 or program suspended' },
  { label: 'Major protest wave', scenario: 'Major protest wave spreading from Kasserine to 8 governorates with P_rev crossing 0.50' },
  { label: 'Bread price spike', scenario: 'Bread prices spike 40% after global wheat supply shock, BCI enters crisis territory' },
  { label: 'Elite defection cascade', scenario: 'Multiple senior officials signal defection, elite cohesion dropping below 0.35' },
  { label: 'Water collapse', scenario: 'Dam levels below 15% nationally, water rationing imposed in 15 governorates' },
  { label: 'UGTT general strike', scenario: 'UGTT calls national general strike over wage erosion and subsidy removal plans' },
];

const RESOLUTION_COLORS: Record<string, string> = {
  consensus: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  compromise: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  deadlock: 'text-red-400 border-red-500/30 bg-red-500/10',
};

const RESOLUTION_LABELS: Record<string, string> = {
  consensus: 'Consensus',
  compromise: 'Compromise',
  deadlock: 'Deadlock',
  escalation: 'Escalation',
};

export const DeliberationPanel: React.FC = () => {
  const [sessions, setSessions] = useState<DeliberationSession[]>([]);
  const [latestSession, setLatestSession] = useState<DeliberationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [customScenario, setCustomScenario] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null);
  const [result, setResult] = useState<DeliberationSession | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/deliberation/sessions?limit=10');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {}
  };

  const fetchLatest = async () => {
    try {
      const res = await fetch('/api/deliberation/sessions/latest');
      if (res.ok) {
        const data = await res.json();
        if (data.status !== 'no_sessions_yet') {
          setLatestSession(data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
    fetchLatest();
  }, []);

  const handleRun = async () => {
    const scenario = customScenario.trim() || selectedPreset;
    if (!scenario) return;

    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/deliberation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          trigger_type: 'analyst',
        }),
      });
      if (res.ok) {
        const session: DeliberationSession = await res.json();
        setResult(session);
        setLatestSession(session);
        await fetchSessions();
      }
    } catch {}
    setRunning(false);
  };

  const getResolutionBadge = (type?: string) => {
    if (!type) return null;
    const colors = RESOLUTION_COLORS[type] || 'text-slate-400 border-slate-500/30 bg-slate-500/10';
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${colors}`}>
        {RESOLUTION_LABELS[type] || type}
      </span>
    );
  };

  const getConfidenceBar = (value: number, maxWidth = 120) => (
    <div className="flex items-center gap-2">
      <div className={`h-1.5 rounded-full bg-slate-700/50 overflow-hidden flex-1`} style={{ maxWidth }}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            value > 0.65 ? 'bg-emerald-400' : value > 0.40 ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-400 w-10 text-right">
        {(value * 100).toFixed(0)}%
      </span>
    </div>
  );

  const renderPositionCard = (pos: DeliberationPosition) => {
    const isExpanded = expandedPosition === pos.entity_id;
    return (
      <motion.div
        key={pos.entity_id}
        layout
        className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden"
      >
        <button
          onClick={() => setExpandedPosition(isExpanded ? null : pos.entity_id)}
          className="w-full p-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              pos.recommendation_confidence && pos.recommendation_confidence > 0.65
                ? 'bg-emerald-400' : pos.recommendation_confidence && pos.recommendation_confidence > 0.40
                ? 'bg-amber-400' : 'bg-red-400'
            }`} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{pos.actor_name}</div>
              <div className="text-xs font-mono text-slate-500">{pos.entity_id}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">{pos.recommendation?.replace(/_/g, ' ')}</span>
            <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </div>
        </button>
        {isExpanded && (
          <div className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
            {pos.recommendation_confidence !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Confidence</span>
                {getConfidenceBar(pos.recommendation_confidence, 160)}
              </div>
            )}
            {pos.reasoning_chain && (
              <div className="text-xs text-slate-400 leading-relaxed bg-white/[0.02] rounded p-2">
                {pos.reasoning_chain}
              </div>
            )}
            {pos.supporting_actions && pos.supporting_actions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {pos.supporting_actions.map((a, i) => (
                  <span key={i} className="text-[10px] font-mono text-slate-500 bg-white/[0.04] px-1.5 py-0.5 rounded">
                    {a}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
              {pos.live_citations && pos.live_citations.length > 0 && (
                <span>{pos.live_citations.length} live citations</span>
              )}
              {pos.doctrine_citations && pos.doctrine_citations.length > 0 && (
                <span>{pos.doctrine_citations.length} doctrine citations</span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSessionCard = (session: DeliberationSession, isLatest = false) => {
    const isExpanded = expandedSession === session.session_id;
    return (
      <motion.div
        key={session.session_id}
        layout
        className={`rounded-xl border ${
          isLatest ? 'border-intel-cyan/30 bg-intel-cyan/[0.03]' : 'border-white/5 bg-white/[0.02]'
        } overflow-hidden`}
      >
        <button
          onClick={() => setExpandedSession(isExpanded ? null : session.session_id)}
          className="w-full p-4 flex items-start justify-between hover:bg-white/[0.02] transition-colors text-left"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getResolutionBadge(session.resolution_type)}
              {session.veto_active && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 border border-red-500/30 bg-red-500/10">
                  VETO
                </span>
              )}
              {session.is_simulation && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400 border border-purple-500/30 bg-purple-500/10">
                  SIM
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-white truncate">{session.scenario_description}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-slate-500">
              <span>{session.trigger_type?.replace(/_/g, ' ')}</span>
              {session.completed_at && <span>{new Date(session.completed_at).toLocaleString()}</span>}
              {session.duration_ms && <span>{session.duration_ms}ms</span>}
              <span>{session.positions?.length || 0} actors</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-slate-500 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
            {session.decision_output && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="text-xs text-slate-500 mb-1">Primary Action</div>
                  <div className="text-sm font-bold text-white font-mono uppercase">
                    {session.decision_output.primary_action?.replace(/_/g, ' ')}
                  </div>
                  {session.decision_output.primary_confidence !== undefined && (
                    <div className="mt-1">{getConfidenceBar(session.decision_output.primary_confidence)}</div>
                  )}
                </div>
                {session.decision_output.secondary_action && (
                  <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <div className="text-xs text-slate-500 mb-1">Secondary</div>
                    <div className="text-sm font-bold text-slate-300 font-mono uppercase">
                      {session.decision_output.secondary_action.replace(/_/g, ' ')}
                    </div>
                    {session.decision_output.secondary_confidence !== undefined && (
                      <div className="mt-1">{getConfidenceBar(session.decision_output.secondary_confidence)}</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {session.veto_active && session.veto_actor && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-red-400 uppercase">Veto by {session.veto_actor}</div>
                  {session.veto_condition && (
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{session.veto_condition}</div>
                  )}
                </div>
              </div>
            )}

            {session.positions && session.positions.length > 0 && (
              <div>
                <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-2">Actor Positions</div>
                <div className="space-y-1">
                  {session.positions.map(pos => renderPositionCard(pos))}
                </div>
              </div>
            )}

            {session.dominant_coalition && session.dominant_coalition.length > 0 && (
              <div>
                <div className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mb-1">Coalitions</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase mb-1">Dominant</div>
                    {session.dominant_coalition.map(a => (
                      <div key={a} className="text-[11px] font-mono text-slate-300">{a}</div>
                    ))}
                  </div>
                  {session.dissenting_actors && session.dissenting_actors.length > 0 && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-2">
                      <div className="text-[10px] font-bold text-red-400 uppercase mb-1">Dissenting</div>
                      {session.dissenting_actors.map(a => (
                        <div key={a} className="text-[11px] font-mono text-slate-300">{a}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-8"
    >
      <ModuleHeader
        title="High Table — Deliberation Engine"
        subtitle="Structured multi-actor scenario deliberation · Conflict detection · Coalition formation · Authority-weighted resolution"
        icon={MessageSquare}
        nodeId="DELIB-01"
        statusLabel="ACTIVE"
      />

      {/* Run Deliberation */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Run Deliberation</div>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => { setSelectedPreset(p.scenario); setCustomScenario(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                selectedPreset === p.scenario
                  ? 'border-intel-cyan/50 bg-intel-cyan/10 text-intel-cyan'
                  : 'border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customScenario}
            onChange={e => { setCustomScenario(e.target.value); if (e.target.value) setSelectedPreset(''); }}
            placeholder="Or type a custom scenario..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/5 text-sm text-white placeholder:text-slate-600 font-mono outline-none focus:border-intel-cyan/30 transition-colors"
          />
          <button
            onClick={handleRun}
            disabled={running || (!customScenario.trim() && !selectedPreset)}
            className="px-5 py-2 rounded-lg bg-intel-cyan/20 border border-intel-cyan/30 text-intel-cyan font-mono text-xs font-bold uppercase tracking-wider hover:bg-intel-cyan/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {running ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Convene</>
            )}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div>
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Latest Result</div>
          {renderSessionCard(result, true)}
        </div>
      )}

      {/* Latest from store */}
      {!result && latestSession && (
        <div>
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Latest Session</div>
          {renderSessionCard(latestSession, true)}
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div>
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Session History</div>
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => renderSessionCard(s))}
          </div>
        </div>
      )}

      {!loading && sessions.length === 0 && !result && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500 font-mono">No deliberation sessions yet</p>
          <p className="text-xs text-slate-600 mt-1">Select a scenario above and click "Convene" to start</p>
        </div>
      )}
    </motion.div>
  );
};
