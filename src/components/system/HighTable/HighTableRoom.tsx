import React, { useState } from 'react';
import { CircularTable } from './CircularTable';
import { ActorRegistry } from './ActorRegistry';
import { IntelligenceFeed } from './IntelligenceFeed';
import { ScenarioTerminal } from './ScenarioTerminal';
import { useDeliberation } from '../../../hooks/useDeliberation';
import { useSimulation } from '../../../hooks/useSimulation';
import './HighTable.css';

const PHASE_COLORS: Record<string, string> = {
  stable: '#10B981',
  elevated: '#F59E0B',
  crisis: '#EF4444',
  acute_crisis: '#DC2626',
  transition: '#7C3AED',
  unknown: '#4B5563',
};

interface Snapshot {
  rri?: number;
  p_revolution?: number;
  state_phase?: string;
  governorate_vectors?: any[];
  actor_postures?: any[];
  active_shocks?: any[];
}

export const HighTableRoom: React.FC<{ snapshot?: Snapshot }> = ({ snapshot: propSnapshot }) => {
  const { latestSession } = useDeliberation();
  const { latestRun, runScenario } = useSimulation();
  const [selectedActor, setSelectedActor] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'simulation'>('live');

  const now = new Date();
  const timeStr = now.toISOString().slice(11, 19) + ' UTC';

  const pRev = propSnapshot?.p_revolution ?? 0.34;
  const rri = propSnapshot?.rri ?? 2.14;
  const phase = propSnapshot?.state_phase ?? 'elevated';

  const handleRunScenario = async (scenario: any) => {
    if (scenario.id) {
      await runScenario(scenario.id);
    }
  };

  return (
    <div className="high-table-room">
      <div className="command-header">
        <div className="header-title">
          TunisiaIntel HIGH TABLE
        </div>
        <div className="header-indicators">
          <div className="header-indicator">
            <div
              className="header-dot"
              style={{ background: PHASE_COLORS[phase] || '#4B5563' }}
            />
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
          <div className="header-time">{timeStr}</div>
        </div>
      </div>

      <div className="high-table-body">
        <ActorRegistry
          snapshot={propSnapshot}
          session={latestSession}
          onActorSelect={setSelectedActor}
        />
        <CircularTable
          snapshot={propSnapshot}
          session={latestSession}
          selectedActor={selectedActor}
          mode={mode}
          onActorSelect={setSelectedActor}
        />
        <IntelligenceFeed
          session={latestSession}
          run={latestRun}
          selectedActor={selectedActor}
        />
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
