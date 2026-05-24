import React, { useEffect, useState } from 'react';
import { CircularTable } from './CircularTable';
import { ActorRegistry } from './ActorRegistry';
import { IntelligenceFeed } from './IntelligenceFeed';
import { ScenarioTerminal } from './ScenarioTerminal';
import { useDeliberation } from '../../../hooks/useDeliberation';
import { useSimulation } from '../../../hooks/useSimulation';
import { fetchLatestInterventionRun } from '../../../services/backendClient';
import './HighTable.css';

const PHASE_COLORS: Record<string, string> = {
  stable:      '#10B981',
  elevated:    '#F59E0B',
  crisis:      '#EF4444',
  acute_crisis:'#DC2626',
  transition:  '#7C3AED',
  unknown:     '#4B5563',
};

interface Snapshot {
  rri?: number;
  p_revolution?: number;
  state_phase?: string;
  governorate_vectors?: any[];
  actor_postures?: any[];
  active_shocks?: any[];
}

const DEFAULT_ACTOR_POSTURES = [
  { actor_id: 'PRES',  posture: 'defensive',   stress_level: 0.65,
    reasoning: 'Facing mounting IMF pressure and public discontent over subsidy reforms; approval at 34%' },
  { actor_id: 'UGTT',  posture: 'aggressive',   stress_level: 0.75,
    reasoning: 'Mobilizing general strike against Finance Law 2026; 847 recorded strikes in 2025' },
  { actor_id: 'ARM',   posture: 'passive',      stress_level: 0.35,
    reasoning: 'Maintaining institutional neutrality; budget allocation secured at 2.1% of GDP' },
  { actor_id: 'BCT',   posture: 'defensive',    stress_level: 0.50,
    reasoning: 'FX reserves at 84 days; parallel market premium at 18%; inflation at 7.1%' },
  { actor_id: 'INT',   posture: 'defensive',    stress_level: 0.55,
    reasoning: 'Decree-54 prosecutions up 22%; protest monitoring capacity stretched across 14 governorates' },
  { actor_id: 'DONOR', posture: 'negotiating',  stress_level: 0.40,
    reasoning: 'IMF EFF talks ongoing; EU mobility partnership conditional on migration enforcement' },
  { actor_id: 'PPL',   posture: 'aggressive',   stress_level: 0.70,
    reasoning: 'Opposition coalitions forming around anti-austerity platform; local polls show 12pt govt disapproval' },
  { actor_id: 'LPR',   posture: 'passive',      stress_level: 0.45,
    reasoning: 'Fractured along Ennahda/Heart of Tunisia lines; legislative output down 40% YoY' },
  { actor_id: 'DZA',   posture: 'negotiating',  stress_level: 0.30,
    reasoning: 'Algeria-Tunisia trade up 8%; coordinated border security under AMU framework' },
  { actor_id: 'EU',    posture: 'negotiating',  stress_level: 0.35,
    reasoning: 'EU-Tunisia MoU under review; 150M EUR budget support conditional on reform benchmarks' },
  { actor_id: 'UTICA', posture: 'defensive',    stress_level: 0.55,
    reasoning: 'Private sector credit access at 18%; informal economy at 47% eroding formal membership' },
  // Phase 10 additions — Ring 3 and Ring 4
  { actor_id: 'LTDH',  posture: 'defensive',    stress_level: 0.40,
    reasoning: 'Monitoring Decree-54 prosecutions; documented 147 civil liberties violations in 2025; Decree-54 trials intensifying' },
  { actor_id: 'KSA',   posture: 'negotiating',  stress_level: 0.25,
    reasoning: 'Evaluating BCT deposit injection; conditioning support on migration enforcement MoU with EU' },
  { actor_id: 'USA',   posture: 'passive',       stress_level: 0.20,
    reasoning: 'AFRICOM maintaining security partnerships; IMF conditionality messaging through State Dept; monitoring Decree-54' },
];

const DEFAULT_GOV_VECTORS = [
  { gov_id: 'tunis',      stress: 0.30 }, { gov_id: 'ariana',     stress: 0.25 },
  { gov_id: 'ben_arous',  stress: 0.20 }, { gov_id: 'manouba',    stress: 0.30 },
  { gov_id: 'nabeul',     stress: 0.20 }, { gov_id: 'bizerte',    stress: 0.25 },
  { gov_id: 'beja',       stress: 0.40 }, { gov_id: 'jendouba',   stress: 0.45 },
  { gov_id: 'kef',        stress: 0.50 }, { gov_id: 'siliana',    stress: 0.50 },
  { gov_id: 'zaghouan',   stress: 0.35 }, { gov_id: 'kairouan',   stress: 0.60 },
  { gov_id: 'kasserine',  stress: 0.80 }, { gov_id: 'sidi_bouzid',stress: 0.75 },
  { gov_id: 'sousse',     stress: 0.20 }, { gov_id: 'monastir',   stress: 0.15 },
  { gov_id: 'mahdia',     stress: 0.30 }, { gov_id: 'sfax',       stress: 0.25 },
  { gov_id: 'gafsa',      stress: 0.60 }, { gov_id: 'tozeur',     stress: 0.35 },
  { gov_id: 'kebili',     stress: 0.40 }, { gov_id: 'gabes',      stress: 0.45 },
  { gov_id: 'medenine',   stress: 0.30 }, { gov_id: 'tataouine',  stress: 0.35 },
];

export const HighTableRoom: React.FC<{ snapshot?: Snapshot }> = ({ snapshot: propSnapshot }) => {
  const { latestSession } = useDeliberation();
  const { latestRun, runScenario } = useSimulation();
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [feedVisible, setFeedVisible] = useState(false);
  const [mode, setMode] = useState<'live' | 'simulation'>('live');
  const [introActive, setIntroActive] = useState(true);
  const [interventionRun, setInterventionRun] = useState<any>(null);

  const handleActorSelect = (actorId: string) => {
    setSelectedActor(actorId);
    setFeedVisible(true);
  };

  // Intro orbit animation — disable after 2.8s
  useEffect(() => {
    const t = window.setTimeout(() => setIntroActive(false), 2800);
    return () => window.clearTimeout(t);
  }, []);

  // Fetch latest intervention run on mount (Phase 10 overlay)
  useEffect(() => {
    fetchLatestInterventionRun().then(run => {
      if (run && run.status !== 'no_runs_yet') {
        setInterventionRun(run);
      }
    });
  }, []);

  const now = new Date();
  const timeStr = now.toISOString().slice(11, 19) + ' UTC';

  const pRev  = propSnapshot?.p_revolution ?? 0.34;
  const rri   = propSnapshot?.rri ?? 2.14;
  const phase = propSnapshot?.state_phase ?? 'elevated';

  const snapshot = {
    rri,
    p_revolution: pRev,
    state_phase: phase,
    actor_postures: propSnapshot?.actor_postures ?? DEFAULT_ACTOR_POSTURES,
    governorate_vectors: propSnapshot?.governorate_vectors ?? DEFAULT_GOV_VECTORS,
    active_shocks: propSnapshot?.active_shocks ?? [],
  };

  const handleRunScenario = async (scenario: any) => {
    if (scenario.id) await runScenario(scenario.id);
  };

  const phaseColor = PHASE_COLORS[phase] ?? '#4B5563';

  return (
    <div className="high-table-room">
      <div className="command-header">
        <div className="header-title-group">
          <div className="header-kicker">National Command Theater</div>
          <div className="header-title">TunisiaIntel HIGH TABLE</div>
        </div>
        <div className="header-indicators">
          <div className="header-indicator">
            <div className="header-dot" style={{ background: phaseColor }} />
            <span>STATE: {phase.toUpperCase()}</span>
          </div>
          <div className="header-indicator">
            <span style={{ color: '#F9FAFB', fontWeight: 'bold' }}>
              RRI: {rri.toFixed(2)}
            </span>
          </div>
          <div className="header-indicator">
            <span style={{ color: pRev > 0.45 ? '#EF4444' : '#9CA3AF' }}>
              P(rev): {(pRev * 100).toFixed(1)}%
            </span>
          </div>
          {interventionRun && (
            <div className="header-indicator" title="Intervention analysis active">
              <span style={{ color: '#10B981', fontSize: 9, letterSpacing: '0.1em' }}>
                ⚡ INT
              </span>
            </div>
          )}
          <div className="header-time">{timeStr}</div>
        </div>
      </div>

      <div className="high-table-body">
        <ActorRegistry
          snapshot={snapshot}
          session={latestSession}
          selectedActor={selectedActor}
          onActorSelect={handleActorSelect}
        />
        <CircularTable
          snapshot={snapshot}
          session={latestSession}
          selectedActor={selectedActor}
          mode={mode}
          introActive={introActive}
          interventionRun={interventionRun}
          onActorSelect={handleActorSelect}
        />
        <div className={`feed-panel${feedVisible ? ' feed-panel--open' : ''}`}>
          <IntelligenceFeed
            snapshot={snapshot}
            session={latestSession}
            run={latestRun}
            selectedActor={selectedActor}
            onClose={() => setFeedVisible(false)}
          />
        </div>
      </div>

      <ScenarioTerminal
        onRun={handleRunScenario}
        onModeSwitch={setMode}
        mode={mode}
      />
    </div>
  );
};

export default HighTableRoom;
