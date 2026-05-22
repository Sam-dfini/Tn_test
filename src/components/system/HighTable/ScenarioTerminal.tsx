import React, { useState } from 'react';

const QUICK_SCENARIOS = [
  { id: 'SCN-E01', label: 'Subsidy Removal' },
  { id: 'SCN-C01', label: 'Perfect Storm' },
  { id: 'SCN-C02', label: 'Regime Threshold' },
  { id: 'SCN-B01', label: 'Black Swan' },
];

interface QuickScenario {
  id: string;
  label: string;
}

interface Props {
  onRun: (scenario: QuickScenario | { custom: string }) => void;
  onModeSwitch: (mode: 'live' | 'simulation') => void;
  mode: 'live' | 'simulation';
}

export const ScenarioTerminal: React.FC<Props> = ({ onRun, onModeSwitch, mode }) => {
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = () => {
    if (isRunning) return;
    setIsRunning(true);
    if (input.trim()) {
      onRun({ custom: input.trim() });
    }
    setTimeout(() => setIsRunning(false), 2000);
  };

  return (
    <div className="scenario-terminal">
      <span className="terminal-prompt">SCENARIO</span>

      <div className="quick-scenarios">
        {QUICK_SCENARIOS.map(s => (
          <button
            key={s.id}
            className="quick-btn"
            onClick={() => {
              setIsRunning(true);
              onRun(s);
              setTimeout(() => setIsRunning(false), 2000);
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <input
        className="terminal-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Describe scenario or inject shock..."
        onKeyDown={e => e.key === 'Enter' && handleRun()}
      />

      <button
        className={`run-btn ${isRunning ? 'running' : ''}`}
        onClick={handleRun}
        disabled={isRunning}
      >
        {isRunning ? 'RUNNING' : 'RUN'}
      </button>

      <button
        className={`mode-btn ${mode === 'simulation' ? 'simulation' : ''}`}
        onClick={() => onModeSwitch(mode === 'live' ? 'simulation' : 'live')}
      >
        {mode === 'live' ? 'SIMULATION MODE' : 'LIVE MODE'}
      </button>
    </div>
  );
};
