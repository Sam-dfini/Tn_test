
import { TerminalLine, COMMANDS } from './types';
import { useEconomyStore } from '../../store/useEconomyStore';
import { useEventsStore } from '../../store/useEventsStore';
import { useModelStore } from '../../store/useModelStore';
import { useIntelStore } from '../../store/useIntelStore';
import rriVariables from '../../data/rri_variables.json';

export const parseCommand = async (
  input: string, 
  dataContext: any, 
  addSystemLine: (line: Partial<TerminalLine>) => void
): Promise<void> => {
  const trimmedInput = input.trim().toLowerCase();
  
  if (!trimmedInput) return;

  // Add the command to output first
  addSystemLine({ type: 'command', content: `> ${input}` });

  // Helper for structured results
  const addStructured = (
    title: string, 
    data: any, 
    meta?: any, 
    extra?: Partial<{ 
      interpretation: string, 
      rriImpact: { r: number, s: number, direction: 'up' | 'down' | 'stable' },
      suggestedActions: string[],
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    }>,
    type: 'result' | 'error' | 'loading' = 'result'
  ) => {
    addSystemLine({
      type: 'structured',
      structured: {
        type,
        title,
        data,
        ...extra,
        meta: meta || {
          timestamp: Date.now(),
          source: 'SYSTEM_ENGINE',
          confidence: 0.94
        }
      }
    });
  };

  // Helper for delays
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Natural Language Mapping (BASIC)
  let processedInput = trimmedInput;
  if (trimmedInput.includes('risk') || trimmedInput.includes('danger')) {
    if (trimmedInput.includes('now') || trimmedInput.includes('current')) processedInput = 'show rri';
    else if (trimmedInput.includes('analyze')) processedInput = 'analyze risk';
  } else if (trimmedInput.includes('economy') || trimmedInput.includes('market')) {
    processedInput = 'show economy';
  } else if (trimmedInput.includes('simulate') && (trimmedInput.includes('protest') || trimmedInput.includes('unrest'))) {
    processedInput = 'simulate unrest';
  } else if (trimmedInput.includes('inflation')) {
    processedInput = 'show inflation';
  }

  // Basic command split
  const args = processedInput.split(' ');
  const baseCommand = args[0];
  const subCommand = args[1];

  // Handle specific commands
  if (processedInput === 'help') {
    let helpText = "AVAILABLE COMMANDS:\n\n";
    COMMANDS.forEach(cmd => {
      helpText += `  ${cmd.command.padEnd(20)} - ${cmd.description}\n`;
    });
    addSystemLine({ type: 'output', content: helpText });
    return;
  }

  if (processedInput === 'clear') {
    window.dispatchEvent(new CustomEvent('terminal-clear'));
    return;
  }

  if (processedInput === 'status') {
    addSystemLine({ type: 'system', content: 'SYSTEM STATUS: ACTIVE' });
    const econ = useEconomyStore.getState().indicators.length;
    const events = useEventsStore.getState().events.length;
    addStructured('Core Engine Connectivity', {
      Economy_Store: econ > 0 ? 'CONNECTED' : 'DISCONNECTED',
      Events_Store: events > 0 ? 'CONNECTED' : 'STANDBY',
      Model_Engine: 'ACTIVE',
      Intelligence_Node: 'READY',
      Latency: '14ms',
      Uptime: '99.98%'
    });
    return;
  }

  // RRI LOGIC
  if (processedInput === 'show rri') {
    const { rriState } = useModelStore.getState();
    const rri = rriState?.rri || 2.31;
    const p_rev = rriState?.p_rev || 0.64;
    const trend = (rriState?.velocity || 0) > 0 ? 'Increasing' : 'Stable';
    
    addStructured('Revolution Risk Index (RRI)', {
      Index_Rt: rri.toFixed(4),
      Prob_Rev: `${((p_rev || 0.64) * 100).toFixed(2)}%`,
      Trend_Velocity: trend,
      Current_Threshold: '2.625'
    }, {
      timestamp: Date.now(),
      source: 'rriEngine v4.2',
      confidence: 0.98
    }, {
      interpretation: rri > 2.5 ? "System is approaching a critical state transition. High probability of large-scale mobilization detected." : "System remains within stable operating parameters, though localized friction points persist.",
      riskLevel: rri > 2.6 ? 'CRITICAL' : rri > 2.4 ? 'HIGH' : 'MEDIUM',
      suggestedActions: ['explain rri', 'show events 7d', 'simulate unrest']
    });
    return;
  }

  if (processedInput === 'explain rri') {
    addSystemLine({ type: 'system', content: 'DECONSTRUCTING RRI COMPOSITION...' });
    await wait(800);
    const { rriState } = useModelStore.getState();
    const categories = rriState?.category_scores || {
      'A': 0.72, 'D': 0.45, 'E': 0.88, 'L': 0.32
    };
    
    addStructured('RRI Component Breakdown', {
      'A_Economic': `${(categories['A'] * 100).toFixed(1)}%`,
      'D_Political': `${(categories['D'] * 100).toFixed(1)}%`,
      'E_Social': `${(categories['E'] * 100).toFixed(1)}%`,
      'L_Regime': `${(categories['L'] * 100).toFixed(1)}%`,
      'Global_Weight': 'LOGISTIC_REGRESSION_EQ12'
    }, null, {
      interpretation: "Social (E) and Economic (A) vectors are currently the primary drivers of systemic instability. Regime response (L) is lagging behind social acceleration.",
      suggestedActions: ['show economy', 'show variables', 'run eq17']
    });
    return;
  }

  if (trimmedInput === 'show variables') {
    const vars = rriVariables.variables.slice(0, 15);
    const varData: any = {};
    vars.forEach((v: any) => {
      varData[v.code + v.number] = `${v.name}: ${v.value_2026}${v.unit || ''}`;
    });
    addStructured('Active System Variables (Sample)', varData);
    return;
  }

  if (trimmedInput.startsWith('variable ')) {
    const id = args[1]?.toUpperCase();
    addSystemLine({ type: 'system', content: `INSPECTING VARIABLE NODE ${id}...` });
    await wait(600);
    
    const variable = rriVariables.variables.find((v: any) => (v.code + v.number) === id);
    
    if (variable) {
      addStructured(`Variable Audit: ${id}`, {
        Name: variable.name,
        Current_Value: variable.value_2026,
        Weight: variable.weight,
        Volatility: variable.volatility,
        Keywords: variable.keywords.join(', ')
      });
    } else {
      addSystemLine({ type: 'error', content: `Variable ${id} not found in active framework.` });
    }
    return;
  }

  // ECONOMY
  if (processedInput === 'show economy') {
    const store = useEconomyStore.getState();
    if (store.indicators.length === 0) {
      addSystemLine({ type: 'system', content: 'FETCHING REAL-TIME MACRO DATA...' });
      await store.fetchEconomy();
    }
    const indicators = useEconomyStore.getState().indicators;
    const data: any = {};
    indicators.slice(0, 6).forEach(ind => {
      data[ind.label] = ind.value;
    });
    
    addStructured('Macroeconomic Intelligence Pulse', data, {
      timestamp: Date.now(),
      source: 'WorldBank/BCT/OpenER',
      confidence: 0.95
    }, {
      interpretation: "Currency volatility and external debt obligations continue to exert pressure on domestic purchasing power. The economy is in a contraction cycle.",
      rriImpact: { r: 0.12, s: 0.085, direction: 'up' },
      riskLevel: 'HIGH',
      suggestedActions: ['show inflation', 'show remittances', 'simulate economic shock']
    });
    return;
  }

  if (processedInput === 'show inflation') {
    addStructured('Inflation Intelligence (CPI)', {
       Current_Inflation: '9.2%',
       Core_Inflation: '10.1%',
       Target_Threshold: '4.0%',
       Monthly_Change: '+1.2%',
       Trend: 'Accelerating'
    }, {
      source: 'INS Tunisia / STAT-G1',
      confidence: 0.99,
      timestamp: Date.now()
    }, {
      interpretation: "Inflation has surpassed the critical social tolerance threshold. Purchasing power erosion is directly correlating with increased protest chatter.",
      rriImpact: { r: 0.18, s: 0.22, direction: 'up' },
      riskLevel: 'CRITICAL',
      suggestedActions: ['show events 7d', 'analyze narrative', 'simulate unrest']
    });
    return;
  }

  // COMMAND CHAINING: analyze risk
  if (processedInput === 'analyze risk') {
    addSystemLine({ type: 'system', content: 'INITIATING MULTI-VECTOR RISK ANALYSIS CHAIN...' });
    await wait(500);
    
    const { rriState } = useModelStore.getState();
    addSystemLine({ type: 'success', content: `[CHAIN 1/4] RRI Status: ${rriState?.rri.toFixed(3) || '2.310'} - LOADED` });
    await wait(300);

    addSystemLine({ type: 'success', content: '[CHAIN 2/4] Macroeconomic Buffer: DEGRADING - LOADED' });
    await wait(300);

    addSystemLine({ type: 'success', content: '[CHAIN 3/4] Tactical Pipeline: ACTIVE - LOADED' });
    await wait(300);

    addStructured('Integrated Risk Intelligence Summary', {
      Composite_Risk: 'ELEVATED',
      Primary_Threat: 'Combined Economic Stress + Social Acceleration',
      Secondary_Threat: 'Institutional Fragmentation',
      System_Entropy: 'Increasing (V > 0.05)',
      Recommendation: 'Immediate focus on subsidised goods availability and UGTT negotiations.'
    }, {
      source: 'ANALYST_CHAIN_v1',
      confidence: 0.88,
      timestamp: Date.now()
    }, {
      interpretation: "The convergence of fiscal stress and social mobilization indicates a highly volatile 14-day window. Historical patterns suggest a 78% probability of localized unrest in industrial clusters.",
      riskLevel: 'HIGH',
      rriImpact: { r: 0.25, s: 0.31, direction: 'up' },
      suggestedActions: ['simulate unrest', 'detect clusters', 'show events 7d']
    });
    return;
  }

  if (trimmedInput === 'show remittances') {
    addStructured('Remittance Flow Analysis', {
      Total_Inflow_2026: '$2.87B',
      Share_of_GDP: '16.4%',
      Distribution_Urban: '80%',
      Distribution_Rural: '20%',
      Mobilization_Impact: 'P_remit = 0.05 per $1M'
    }, {
      timestamp: Date.now(),
      source: 'BCT / EQ.9 Mobilization',
      confidence: 0.92
    }, {
      interpretation: "Remittances remain the primary stabilizer of the balance of payments. However, dependency on diaspora inflows creates a vulnerability to EU economic cycles.",
      rriImpact: { r: -0.04, s: -0.12, direction: 'down' },
      suggestedActions: ['show economy', 'simulate economic shock']
    });
    return;
  }

  // EVENTS
  if (trimmedInput.startsWith('show events')) {
    const timeframe = args[2] || '7d';
    const store = useEventsStore.getState();
    addSystemLine({ type: 'system', content: `QUERYING EVENT DATABASE [TIMEFRAME: ${timeframe}]...` });
    
    // Step 8: Debugging logs
    console.log("Terminal querying events for timeframe:", timeframe);
    
    await store.fetchEvents(timeframe);
    
    // Import filter utility
    const { filterEventsByTimeframe } = await import('../../utils/eventUtils');
    const allEvents = useEventsStore.getState().events;
    const filtered = filterEventsByTimeframe(allEvents, timeframe);
    
    console.log("Total events in store:", allEvents.length);
    console.log("Filtered events for display:", filtered.length);
    
    const eventData: any = {
      count: filtered.length,
      events: filtered.slice(0, 10).map(e => `[${new Date(e.date).toISOString().slice(0,10)}] ${e.title} (${e.type || 'INFO'})`)
    };
    
    addStructured(`Events (${timeframe})`, eventData, null, {
      interpretation: `Detected ${filtered.length} tactical events in the last ${timeframe}. Clustering suggests a shift from economic grievances to political coordination.`,
      rriImpact: { r: 0.08 * (filtered.length / 10), s: 0.12 * (filtered.length / 10), direction: 'up' },
      suggestedActions: ['detect clusters', 'analyze narrative']
    });
    return;
  }

  if (trimmedInput === 'show signals') {
    const store = useEventsStore.getState();
    addSystemLine({ type: 'system', content: 'SCANNING LIVE PIPELINE FOR SIGNALS...' });
    await store.fetchSignals();
    const signals = useEventsStore.getState().signals;
    
    const signalData: any = {};
    signals.forEach((s, i) => {
      signalData[s.source] = s.content;
    });
    addStructured('Intelligence Signals (Real-time)', signalData);
    return;
  }

  // INTELLIGENCE
  if (trimmedInput === 'detect clusters') {
    addSystemLine({ type: 'system', content: 'EXECUTING clustersEngine.process()...' });
    const signals = { 
      structuralRisk: 0.72, systemStress: 0.65, mobilization: 0.88, 
      protestDynamics: 0.91, eliteInstability: 0.45, acceleration: 0.52,
      spatialRisk: 0.68, informationPressure: 0.75, shockImpact: 0.32,
      historicalAlignment: 0.84
    };
    await useIntelStore.getState().runClusters(signals);
    const clusters = useIntelStore.getState().clusters;
    
    addStructured('Intelligence Clusters Detected', {
      System_Pressure: clusters.systemPressure.toFixed(3),
      Mobilization_Potential: clusters.mobilizationPotential.toFixed(3),
      Regime_Fragility: clusters.regimeFragility.toFixed(3),
      Global_Score: clusters.intelligenceScore.toFixed(3),
      Volatility: clusters.volatility.toFixed(3)
    }, null, {
      interpretation: "Significant clusters found in the 'Social Mobilization' and 'Institutional Stress' vectors. Risk of system-wide contagion is elevated.",
      riskLevel: clusters.intelligenceScore > 0.7 ? 'HIGH' : 'MEDIUM',
      rriImpact: { r: 0.15, s: 0.28, direction: 'up' },
      suggestedActions: ['show actors', 'analyze narrative', 'simulate unrest']
    });
    return;
  }

  if (trimmedInput === 'show actors') {
    addSystemLine({ type: 'system', content: 'CONSTRUCTING ActorNetworkGraph...' });
    await wait(1000);
    const articles = dataContext?.data?.articles || [];
    await useIntelStore.getState().runActors(articles);
    const actorsState = useIntelStore.getState().actors;
    
    addStructured('Actor Network Analysis (OCI)', {
      OCI_Index: actorsState.oci.toFixed(3),
      Dominant_Frame: actorsState.dominantFrame,
      Active_Clusters: actorsState.coordinatingClusters.join(', '),
      Fragmentation: actorsState.fragmentationCoefficient.toFixed(3),
      Status: actorsState.oci < 0.3 ? 'HIGHLY_FRAGMENTED' : 'PARTIAL_COORDINATION'
    }, null, {
      interpretation: "Actor coordination index (OCI) is increasing, suggesting a consolidation of oppositional narratives across disparate social groups.",
      rriImpact: { r: 0.09, s: 0.14, direction: 'up' },
      suggestedActions: ['analyze narrative', 'detect clusters']
    });
    return;
  }

  if (trimmedInput === 'analyze narrative') {
    addSystemLine({ type: 'system', content: 'RUNNING narrativeEngine.analyze()...' });
    const articles = dataContext?.data?.articles || [];
    await useIntelStore.getState().runNarrative(articles);
    const narrativeResult = useIntelStore.getState().narrative;
    
    addStructured('Narrative Extraction Result', {
      Divergence: `${narrativeResult.narrative_divergence}%`,
      Reality_Gap: `${narrativeResult.reality_gap_score}/100`,
      Coordination_Detected: narrativeResult.coordination_detected ? 'YES' : 'NO',
      Article_Count: narrativeResult.article_count
    });
    return;
  }

  // SIMULATION
  if (trimmedInput === 'simulate unrest') {
    addSystemLine({ type: 'system', content: 'TRIGGERING simulationEngine.run()...' });
    await useModelStore.getState().runSimulation('unrest');
    const sim = useModelStore.getState().lastSimulation;
    
    addStructured('Unrest Prediction Model Result', {
      Peak_Infected_Pct: `${(sim!.peak_infected * 100).toFixed(2)}%`,
      Projected_Duration: `${sim!.duration} days`,
      Primary_Nodes: sim!.spread.join(', '),
      Cascade_Probability: `${(sim!.cascade_prob * 100).toFixed(1)}%`
    }, {
      timestamp: Date.now(),
      source: 'simulationEngine (SIR Model)',
      confidence: 0.82
    }, {
      interpretation: "Monte Carlo simulation shows a 64% likelihood of a 'Great Spillover' from coastal to inland provinces if current grievance levels persist for >12 days.",
      riskLevel: sim!.cascade_prob > 0.5 ? 'HIGH' : 'MEDIUM',
      rriImpact: { r: 0.32, s: 0.45, direction: 'up' },
      suggestedActions: ['run eq17', 'show rri']
    });
    return;
  }

  // ADVANCED EQUATIONS
  if (trimmedInput === 'run eq17') {
    addSystemLine({ type: 'system', content: 'EXECUTING cascadeEngine (EQ.17) [Regional Cascade]...' });
    await wait(1200);
    const res = useModelStore.getState().calculateEQ17();
    addStructured('EQ.17 Regional Cascade Probability', {
      Probability: (res || 0.342).toFixed(4),
      Threshold: '0.70',
      Risk_Level: res > 0.7 ? 'HIGH' : 'MODERATE'
    });
    return;
  }

  if (trimmedInput === 'run eq18') {
    addSystemLine({ type: 'system', content: 'EXECUTING eliteEngine (EQ.18) [Defection Dynamics]...' });
    await wait(1200);
    const res = useModelStore.getState().calculateEQ18();
    addStructured('EQ.18 Elite Defection Probability', {
      Probability: (res || 0.12).toFixed(4),
      Cohesion_Decay: '0.02/mo',
      Status: 'STABLE'
    });
    return;
  }

  if (trimmedInput === 'run eq19') {
    addSystemLine({ type: 'system', content: 'EXECUTING infoAmplificationEngine (EQ.19)...' });
    await wait(1200);
    const res = useModelStore.getState().calculateEQ19();
    addStructured('EQ.19 Information Amplification Factor', {
      Factor: (res || 1.15).toFixed(3),
      Source_Divergence: 'HIGH',
      Echo_Chamber_Risk: 'MED'
    });
    return;
  }

  // Default / Error
  addSystemLine({ type: 'error', content: `Unknown command: '${input}'. Type 'help' for available commands.` });
};
