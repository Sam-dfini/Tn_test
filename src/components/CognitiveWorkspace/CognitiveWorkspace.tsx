import React, { useState, useCallback, useEffect } from 'react';
import { Brain } from 'lucide-react';
import { CornerAccent, BackgroundGrid } from '../shared/ProfessionalShared';
import { ConversationPanel } from './ConversationPanel';
import { IntelligenceCanvas } from './IntelligenceCanvas';
import {
  createInvestigation,
  queryInvestigationStream,
  runQuickMacro,
} from '../../services/backendClient';
import { useAlerts } from '../../context/AlertContext';
import './CognitiveWorkspace.css';

interface Message {
  role: string;
  query_text?: string;
  content?: string;
  narrative?: string;
  key_finding?: string;
  confidence?: number;
  confidence_rationale?: string;
  citations?: any[];
  follow_up_actions?: string[];
  blocks_rendered?: any[];
  timestamp?: string;
  isError?: boolean;
}

const MACRO_BUTTONS = [
  { id: 'morning_brief', label: 'MORNING BRIEF' },
  { id: 'escalation_watch', label: 'ESCALATION WATCH' },
  { id: 'economic_snapshot', label: 'ECONOMIC SNAPSHOT' },
];

function generateDemoData(): { messages: Message[] } {
  const blocks = [
    {
      block_id: 'rri-gauge',
      confidence: 0.82,
      parameters: { current_rri: 3.42, p_revolution: 0.48, state_phase: 'acute_crisis', velocity: 0.0123 },
      data_snapshot: { snapshot_rri: 3.15 },
    },
    {
      block_id: 'governorate-heatmap',
      confidence: 0.79,
      parameters: {
        vectors: [
          { name: 'Tunis', stress: 0.72 }, { name: 'Sfax', stress: 0.45 },
          { name: 'Kasserine', stress: 0.88 }, { name: 'Gabes', stress: 0.61 },
          { name: 'Nabeul', stress: 0.53 }, { name: 'Sousse', stress: 0.39 },
          { name: 'Kairouan', stress: 0.67 }, { name: 'Medenine', stress: 0.28 },
        ],
      },
    },
    {
      block_id: 'actor-timeline',
      confidence: 0.71,
      parameters: {
        time_range_days: 90,
        actors: [
          { entity_id: 'UGTT', posture: 'aggressive' },
          { entity_id: 'Ennahda', posture: 'defensive' },
          { entity_id: 'Saied', posture: 'aggressive' },
          { entity_id: 'UTICA', posture: 'negotiating' },
        ],
      },
    },
    {
      block_id: 'economic-stress',
      confidence: 0.85,
      parameters: { inflation: 7.2, fx_reserves_days: 85, parallel_market_premium: 18.5, debt_to_gdp: 79.4 },
    },
    {
      block_id: 'protest-sir',
      confidence: 0.74,
      parameters: { current_r0: 1.34, current_cases: 287, governorate_vectors: [{ gov: 'Tunis', cases: 98 }, { gov: 'Sfax', cases: 54 }, { gov: 'Kasserine', cases: 142 }] },
    },
    {
      block_id: 'confidence-meter',
      confidence: 0.76,
      parameters: { overall_confidence: 0.76, uncertainty_breakdown: { data: 0.8, model: 0.65, structural: 0.5, epistemic: 0.3 }, rag_chunks_used: 12 },
    },
  ];

  return {
    messages: [
      {
        role: 'user',
        query_text: 'Assess the current protest risk and political stability in Tunisia for the next 60 days.',
        timestamp: new Date().toISOString(),
      },
      {
        role: 'assistant',
        narrative: 'Tunisia faces an acute crisis phase with RRI at 3.42, driven by labor unrest centered on the UGTT and escalating tensions in the Kasserine corridor. Economic stress indicators are flashing red: inflation at 7.2%, parallel market premium at 18.5% (above the 15% threshold), and debt-to-GDP at 79.4%. The protest SIR model shows R0 of 1.34 with 287 active cases — above critical threshold, suggesting contagion risk remains elevated. The governmentate heatmap identifies Kasserine (0.88), Tunis (0.72), and Kairouan (0.67) as the highest-stress regions. Actor analysis shows the UGTT in aggressive posture while Ennahda has shifted defensive — coalition dynamics remain fluid. Overall confidence: 76%, with data confidence (0.80) the strongest pillar and epistemic uncertainty (0.30) the primary limitation. Recommend monitoring the Kasserine-Tunis protest corridor and UGTT-Ennahda coalition signaling over the next 14 days.',
        key_finding: 'Tunisia is in an acute crisis phase with RRI 3.42 — Kasserine corridor and UGTT posture pose the highest near-term escalation risk.',
        confidence: 0.76,
        confidence_rationale: 'Data quality is strong (0.80) but structural uncertainty from shifting coalition dynamics (0.50) tempers overall confidence.',
        citations: [
          { title: 'RRI Phase Classification — Internal Note', source: 'RRI Engine v2.1', text: 'Acute crisis threshold at RRI > 3.0 with velocity > 0.01' },
          { title: 'UGTT Strike Calendar — Q2 2026', source: 'Labor Monitoring Desk', text: 'UGTT scheduled general strike for week 23 — posture upgraded to aggressive' },
          { title: 'IMF Tunisia Article IV — 2026', source: 'IMF Country Report', text: 'Debt sustainability at risk above 80% GDP threshold' },
        ],
        follow_up_actions: [
          'Drill down: Kasserine protest network structure',
          'Simulate: UGTT general strike impact on RRI',
          'Monitor: Ennahda coalition realignment signals',
        ],
        blocks_rendered: blocks,
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export const CognitiveWorkspace: React.FC = () => {
  const { addAlert } = useAlerts();
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamedNarrative, setStreamedNarrative] = useState('');
  const [activeMacro, setActiveMacro] = useState<string | null>(null);

  const addErrorMessage = useCallback((message: string, query?: string) => {
    setMessages(prev => {
      const msgs = query ? [...prev, { role: 'user', query_text: query, timestamp: new Date().toISOString() }] : prev;
      return [...msgs, { role: 'assistant', content: `⚠️ ${message}`, isError: true, timestamp: new Date().toISOString() }];
    });
  }, []);

  const ensureInvestigation = useCallback(async (suppressError?: boolean) => {
    if (investigationId) return investigationId;
    const inv = await createInvestigation('Cognitive Workspace Session');
    if (inv?.investigation_id) {
      setInvestigationId(inv.investigation_id);
      return inv.investigation_id;
    }
    if (!suppressError) {
      addErrorMessage('Backend not reachable — server may be offline or RAG engine not configured.');
    }
    return null;
  }, [investigationId, addErrorMessage]);

  useEffect(() => {
    ensureInvestigation(true);
  }, [ensureInvestigation]);

  const handleQuery = useCallback(async (query: string) => {
    setIsProcessing(true);
    setStreamedNarrative('');

    setMessages(prev => [...prev, {
      role: 'user',
      query_text: query,
      timestamp: new Date().toISOString(),
    }]);

    const invId = await ensureInvestigation(true);
    if (!invId) {
      addErrorMessage('Backend not reachable — server may be offline or RAG engine not configured.');
      setIsProcessing(false);
      return;
    }

    let fullNarrative = '';
    queryInvestigationStream(
      invId,
      query,
      (token) => {
        fullNarrative += token;
        setStreamedNarrative(fullNarrative);
      },
      (envelope) => {
        setMessages(prev => [...prev, {
          role: 'assistant',
          narrative: envelope.response?.narrative || fullNarrative,
          key_finding: envelope.response?.key_finding,
          confidence: envelope.response?.confidence,
          confidence_rationale: envelope.response?.confidence_rationale,
          citations: envelope.response?.citations,
          follow_up_actions: envelope.response?.follow_up_actions,
          blocks_rendered: envelope.blocks,
          timestamp: envelope.timestamp,
        }]);
        setStreamedNarrative('');
        setIsProcessing(false);
        setActiveMacro(null);
      },
      (error) => {
        addErrorMessage(`Query failed: ${error}`);
        setIsProcessing(false);
        setActiveMacro(null);
      }
    );
  }, [ensureInvestigation, addErrorMessage]);

  const handleMacro = useCallback(async (macroId: string) => {
    setActiveMacro(macroId);
    setIsProcessing(true);
    setStreamedNarrative('');

    const result = await runQuickMacro(macroId);
    if (result) {
      if (result.investigation_id) setInvestigationId(result.investigation_id);
      setMessages(prev => [...prev.filter(m => m.role !== 'assistant'), {
        role: 'assistant',
        narrative: result.response?.narrative || '',
        key_finding: result.response?.key_finding,
        confidence: result.response?.confidence,
        confidence_rationale: result.response?.confidence_rationale,
        citations: result.response?.citations,
        follow_up_actions: result.response?.follow_up_actions,
        blocks_rendered: result.blocks,
        timestamp: result.timestamp,
      }]);
    } else {
      addErrorMessage(`Macro "${macroId}" failed — engine not responding or not configured.`);
    }
    setIsProcessing(false);
    setActiveMacro(null);
  }, [addErrorMessage]);

  const handleDemo = useCallback(() => {
    const data = generateDemoData();
    setInvestigationId('demo-investigation');
    setMessages(data.messages);
    addAlert({
      title: 'CRITICAL RRI BREACH — 3.42',
      message: 'National RRI has crossed the 3.0 threshold (Current: 3.42). Kasserine corridor and UGTT posture driving escalation. Immediate executive review required.',
      severity: 'STRATEGIC',
      domain: 'SYSTEM',
      source: 'RRI Engine v2.1',
      affectedEquations: ['EQ.1', 'EQ.19'],
    });
    addAlert({
      title: 'Kasserine Protest Cluster — 142 Active Cases',
      message: 'SIR model shows protest contagion accelerating in Kasserine governorate (142 cases, R0: 1.34). Risk of spillover into Tunis and Sfax corridors.',
      severity: 'OPERATIONAL',
      domain: 'SOCIAL',
      source: 'Protest SIR Model',
      governorates: ['Kasserine', 'Tunis', 'Sfax'],
    });
    addAlert({
      title: 'UGTT General Strike — Week 23',
      message: 'UGTT posture upgraded to aggressive. Scheduled general strike for week 23 with potential for nationwide disruption across transport and public sectors.',
      severity: 'TACTICAL',
      domain: 'LABOR',
      source: 'Labor Monitoring Desk',
      governorates: ['Tunis', 'Sfax', 'Gabes'],
    });
    addAlert({
      title: 'Parallel Market Premium Exceeds 15% Threshold',
      message: 'Parallel market premium at 18.5% (threshold: 15%). FX reserves at 85 days. Debt-to-GDP at 79.4%. Economic stress indicators in critical zone.',
      severity: 'OPERATIONAL',
      domain: 'ECONOMIC',
      source: 'Economic Stress Monitor',
    });
  }, [addAlert]);

  const handleFollowUp = useCallback((action: string) => {
    const query = action.replace(/^(Drill down|Simulate|Monitor):\s*/i, '');
    handleQuery(query || action);
  }, [handleQuery]);

  return (
    <div className="cognitive-workspace">
      <BackgroundGrid />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 px-6 pt-4 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-intel-cyan">
            <div className="w-1.5 h-1.5 bg-intel-cyan rounded-full animate-pulse" />
            <span className="text-[8px] md:text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
              Intelligence Node: WORKSPACE-01 // STATUS: {investigationId ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center space-x-3">
            <Brain className="w-6 h-6 text-intel-cyan" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">INTELLIGENCE WORKSPACE</span>
          </h2>
          <p className="text-slate-500 text-[10px] md:text-xs uppercase font-mono tracking-wider">
            Cognitive Investigation & Multi-Block Synthesis Engine
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="workspace-macros" style={{ display: 'flex', gap: 6 }}>
            {MACRO_BUTTONS.map(m => (
              <button
                key={m.id}
                className={`macro-btn ${activeMacro === m.id ? 'loading' : ''}`}
                onClick={() => handleMacro(m.id)}
                disabled={isProcessing}
              >
                {activeMacro === m.id ? '...' : m.label}
              </button>
            ))}
            <button
              className="macro-btn demo-btn"
              onClick={handleDemo}
              disabled={isProcessing}
            >
              DEMO
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-body flex-1 min-h-0">
        <div className="conversation-panel flex flex-col min-h-0">
          <CornerAccent position="tl" />
          <CornerAccent position="bl" />
          <ConversationPanel
            messages={messages}
            isProcessing={isProcessing}
            streamedNarrative={streamedNarrative}
            onQuery={handleQuery}
            onFollowUp={handleFollowUp}
          />
        </div>
        <div className="intelligence-canvas flex flex-col min-h-0">
          <CornerAccent position="tr" />
          <CornerAccent position="br" />
          <IntelligenceCanvas
            messages={messages}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};

export default CognitiveWorkspace;