import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, RefreshCw, ChevronRight, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const BASE = 'http://localhost:8000';

interface CausalNode {
  step: number;
  concept: string;
  rri_variable: string;
  entity_ids: string[];
  propagation_weight: number;
  time_lag_days: number;
  amplifiers: any[];
  suppressors: any[];
}

interface Chain {
  chain_id: string;
  chain_name: string;
  domain: string;
  trigger_category: string;
  activation_threshold: number;
  activation_variable: string;
  causal_nodes: CausalNode[];
  local_amplifiers: any[];
  local_suppressors: any[];
  regional_sensitivity: Record<string, number>;
  doctrine_refs: any[];
  validated_events: any[];
  validation_score: number | null;
  status: string;
  confidence: number;
}

interface ActiveChainResult {
  chain_id: string;
  chain_name: string;
  domain: string;
  activation_variable: string;
  threshold_value: number;
  current_value: number;
  threshold_breached: boolean;
  propagation_estimate_hours: number;
  nodes_triggered: number;
  total_nodes: number;
  trigger_ratio: number;
  status: string;
  confidence: number;
}

interface ActivationResult {
  checked_at: string | null;
  active_chains: ActiveChainResult[];
  latent_chains: ActiveChainResult[];
}

const DOMAIN_COLORS: Record<string, string> = {
  economic: '#ffd60a',
  social: '#ff6b35',
  political: '#a78bfa',
  security: '#ef4444',
  narrative: '#3b82f6',
  environmental: '#22c55e',
  external: '#64748b',
};

const weightColor = (w: number) => w >= 0.8 ? '#00f2ff' : w >= 0.6 ? '#00c8c8' : w >= 0.4 ? '#00a0a0' : '#3a5a6a';

const OntologyView: React.FC = () => {
  const [chains, setChains] = useState<Chain[]>([]);
  const [activeResult, setActiveResult] = useState<ActivationResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState<Chain | null>(null);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const fetchChains = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/ontology/chains`);
      if (res.ok) setChains(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/ontology/active`);
      if (res.ok) setActiveResult(await res.json());
    } catch {}
  }, []);

  const fetchChain = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BASE}/api/ontology/chains/${id}`);
      if (res.ok) setSelectedChain(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchChains();
    fetchActive();
    const t = setInterval(fetchActive, 30000);
    return () => clearInterval(t);
  }, [fetchChains, fetchActive]);

  useEffect(() => {
    if (chains.length > 0 && !selectedId) {
      const firstActive = activeResult?.active_chains?.[0]?.chain_id;
      if (firstActive) {
        setSelectedId(firstActive);
        fetchChain(firstActive);
      }
    }
  }, [chains, activeResult, selectedId, fetchChain]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    fetchChain(id);
  };

  const activeIds = new Set(activeResult?.active_chains?.map(c => c.chain_id) || []);
  const activeMap = new Map(activeResult?.active_chains?.map(c => [c.chain_id, c]) || []);

  const domains = ['all', ...new Set(chains.map(c => c.trigger_category))];
  const filtered = domainFilter === 'all' ? chains : chains.filter(c => c.trigger_category === domainFilter);

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', background: '#040609', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GitBranch className={`w-6 h-6 ${prefersReducedMotion ? '' : 'animate-spin'}`} style={{ color: '#00f2ff' }} />
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: '#040609',
      display: 'flex', flexDirection: 'column',
      padding: '52px 12px 36px', gap: 8,
      fontFamily: '"IBM Plex Mono",monospace', color: '#e2e8f0', overflow: 'hidden',
      boxSizing: 'border-box', minHeight: 0,
    }}>

      {/* HEADER */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        borderBottom: '1px solid rgba(0,180,180,0.28)', paddingBottom: 8,
      }}>
        <GitBranch size={16} color="#00f2ff" />
        <span style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(0,200,200,0.6)', fontWeight: 600 }}>ONTOLOGY CHAINS</span>
        <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)' }}>
          {chains.length} chains · {activeResult?.active_chains?.length || 0} active
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
          {domains.map(d => (
            <button key={d} onClick={() => setDomainFilter(d)} style={{
              background: domainFilter === d ? 'rgba(0,242,255,0.12)' : 'transparent',
              border: `1px solid ${domainFilter === d ? 'rgba(0,242,255,0.45)' : 'rgba(0,180,180,0.28)'}`,
              color: domainFilter === d ? '#00f2ff' : 'rgba(148,163,184,0.35)',
              padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
              fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', transition: 'all .15s',
            }}>{d}</button>
          ))}
        </div>
        <button onClick={() => { fetchChains(); fetchActive(); }} style={{
          background: 'rgba(0,190,190,0.07)', border: '1px solid rgba(0,200,200,0.35)',
          borderRadius: 6, padding: '6px 14px', fontSize: 10, color: '#e2e8f0', cursor: 'pointer',
        }}>
          <RefreshCw size={10} style={{ verticalAlign: 'middle' }} />
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: 'flex', gap: 10, overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: Chain List */}
        <div style={{ width: '22%', minWidth: 180, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0 }}>
          {filtered.map(chain => {
            const isActive = activeIds.has(chain.chain_id);
            const isSel = selectedId === chain.chain_id;
            const ac = activeMap.get(chain.chain_id);
            return (
              <div key={chain.chain_id} onClick={() => handleSelect(chain.chain_id)} style={{
                background: isSel ? 'rgba(0,242,255,0.08)' : 'rgba(4,6,9,0.6)',
                border: `1px solid ${isSel ? 'rgba(0,242,255,0.4)' : isActive ? 'rgba(0,200,200,0.25)' : 'rgba(0,180,180,0.15)'}`,
                borderLeft: isActive ? '2px solid #00f2ff' : '2px solid transparent',
                borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                boxShadow: isActive ? '0 0 12px rgba(0,242,255,0.08)' : 'none',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: isSel ? '#00f2ff' : '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chain.chain_name}
                  </span>
                  {isActive ? (
                    <span style={{ fontSize: 6, color: '#00f2ff', background: 'rgba(0,242,255,0.15)', padding: '1px 5px', borderRadius: 2, letterSpacing: 0.5, flexShrink: 0 }}>ON</span>
                  ) : (
                    <span style={{ fontSize: 6, color: 'rgba(148,163,184,0.35)', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: 2, letterSpacing: 0.5, flexShrink: 0 }}>DRAFT</span>
                  )}
                </div>
                <div style={{ fontSize: 7, color: 'rgba(148,163,184,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {chain.domain}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                  <span style={{ fontSize: 7, color: DOMAIN_COLORS[chain.trigger_category] || '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chain.activation_variable}
                  </span>
                  {ac && (
                    <span style={{ fontSize: 6, color: ac.threshold_breached ? '#00f2ff' : '#ffd60a', marginLeft: 'auto', flexShrink: 0 }}>
                      {ac.current_value?.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Chain Detail */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedChain ? (
            <>
              {/* Chain Header */}
              <div style={{
                background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)',
                borderRadius: 8, padding: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{selectedChain.chain_name}</span>
                  {activeIds.has(selectedChain.chain_id) ? (
                    <span style={{ fontSize: 8, color: '#00f2ff', background: 'rgba(0,242,255,0.15)', padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>ACTIVE</span>
                  ) : (
                    <span style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 3, letterSpacing: 1 }}>DRAFT</span>
                  )}
                  <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', marginLeft: 'auto' }}>
                    CONF: {(selectedChain.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 9, color: 'rgba(148,163,184,0.35)' }}>
                  <span>DOMAIN: <span style={{ color: DOMAIN_COLORS[selectedChain.trigger_category] || '#64748b' }}>{selectedChain.domain}</span></span>
                  <span>TRIGGER: <span style={{ color: '#00f2ff' }}>{selectedChain.activation_variable} &gt; {selectedChain.activation_threshold}</span></span>
                  <span>NODES: {selectedChain.causal_nodes.length}</span>
                </div>
              </div>

              {/* Causal Flow */}
              <div style={{
                background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)',
                borderRadius: 8, padding: 12,
              }}>
                <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 8 }}>CAUSAL FLOW</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {selectedChain.causal_nodes.map((node, i) => (
                    <div key={node.step} style={{ display: 'flex', gap: 12 }}>
                      {/* Timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                          background: weightColor(node.propagation_weight),
                          boxShadow: `0 0 6px ${weightColor(node.propagation_weight)}`,
                        }} />
                        {i < selectedChain.causal_nodes.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: 'rgba(0,180,180,0.28)', minHeight: 20 }} />
                        )}
                      </div>
                      {/* Node Card */}
                      <div style={{
                        flex: 1, background: 'rgba(0,180,180,0.05)',
                        border: '1px solid rgba(0,180,180,0.15)', borderRadius: 6,
                        padding: '8px 10px', marginBottom: 6,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 7, color: 'rgba(148,163,184,0.35)', width: 16 }}>#{node.step}</span>
                          <span style={{ fontSize: 9, color: '#e2e8f0', flex: 1 }}>{node.concept}</span>
                          <span style={{ fontSize: 7, color: '#ffd60a', background: 'rgba(255,214,10,0.1)', padding: '1px 5px', borderRadius: 3 }}>
                            D+{node.time_lag_days}
                          </span>
                        </div>
                        {/* Weight bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <span style={{ fontSize: 6, color: 'rgba(148,163,184,0.35)', width: 30 }}>WEIGHT</span>
                          <div style={{ flex: 1, height: 2, background: 'rgba(0,180,180,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${node.propagation_weight * 100}%`, height: '100%', background: weightColor(node.propagation_weight), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 7, color: weightColor(node.propagation_weight), width: 26, textAlign: 'right' }}>
                            {(node.propagation_weight * 100).toFixed(0)}%
                          </span>
                        </div>
                        {/* Variable + entities */}
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 6, color: '#00b4b4', background: 'rgba(0,180,180,0.1)', padding: '1px 4px', borderRadius: 2 }}>
                            {node.rri_variable}
                          </span>
                          {node.entity_ids.map(e => (
                            <span key={e} style={{ fontSize: 6, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '1px 4px', borderRadius: 2 }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Regional Sensitivity */}
              {Object.keys(selectedChain.regional_sensitivity).length > 0 && (
                <div style={{
                  background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)',
                  borderRadius: 8, padding: 12,
                }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 8 }}>REGIONAL SENSITIVITY</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {Object.entries(selectedChain.regional_sensitivity)
                      .sort(([,a], [,b]) => b - a)
                      .map(([gov, score]) => (
                        <div key={gov} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.35)', width: 80 }}>{gov}</span>
                          <div style={{ flex: 1, height: 4, background: 'rgba(0,180,180,0.15)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{
                              width: `${score * 100}%`, height: '100%',
                              background: score >= 0.85 ? '#00f2ff' : score >= 0.7 ? '#00c8c8' : '#00a0a0',
                              borderRadius: 2,
                            }} />
                          </div>
                          <span style={{ fontSize: 8, color: '#00f2ff', width: 30, textAlign: 'right' }}>
                            {(score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Amplifiers / Suppressors */}
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedChain.local_amplifiers.length > 0 && (
                  <div style={{
                    flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)',
                    borderRadius: 8, padding: 10,
                  }}>
                    <div style={{ fontSize: 8, color: '#00f2ff', letterSpacing: 2, marginBottom: 6 }}>AMPLIFIERS</div>
                    {selectedChain.local_amplifiers.map((a: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 9 }}>
                        <span style={{ color: 'rgba(148,163,184,0.35)' }}>{a.factor}</span>
                        <span style={{ color: '#00f2ff' }}>+{((a.boost || 0) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedChain.local_suppressors.length > 0 && (
                  <div style={{
                    flex: 1, background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)',
                    borderRadius: 8, padding: 10,
                  }}>
                    <div style={{ fontSize: 8, color: '#ef4444', letterSpacing: 2, marginBottom: 6 }}>SUPPRESSORS</div>
                    {selectedChain.local_suppressors.map((s: any, i: number) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 9 }}>
                        <span style={{ color: 'rgba(148,163,184,0.35)' }}>{s.factor}</span>
                        <span style={{ color: '#ef4444' }}>{((s.reduction || 0) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctrine Refs */}
              {selectedChain.doctrine_refs.length > 0 && (
                <div style={{
                  background: 'rgba(4,6,9,0.6)', border: '1px solid rgba(0,180,180,0.28)',
                  borderRadius: 8, padding: 10,
                }}>
                  <div style={{ fontSize: 8, color: 'rgba(0,200,200,0.6)', letterSpacing: 2, marginBottom: 6 }}>DOCTRINE</div>
                  {selectedChain.doctrine_refs.map((r: any, i: number) => (
                    <div key={i} style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', marginBottom: 3 }}>
                      <span style={{ color: '#a78bfa' }}>{r.source}</span> — {r.concept}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,163,184,0.35)', fontSize: 9, letterSpacing: 2 }}>
              SELECT A CHAIN TO INSPECT
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        borderTop: '1px solid rgba(0,180,180,0.28)', paddingTop: 6,
        fontSize: 7, color: 'rgba(148,163,184,0.25)', letterSpacing: 1,
      }}>
        <span>{activeResult?.active_chains?.length || 0}/{chains.length} chains active</span>
        <span>{activeResult?.checked_at ? `Last checked: ${new Date(activeResult.checked_at).toLocaleTimeString()}` : 'No snapshot yet'}</span>
      </div>
    </div>
  );
};

export default OntologyView;
