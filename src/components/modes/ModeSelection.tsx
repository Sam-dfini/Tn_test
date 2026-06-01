import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, Shield, Terminal, Globe, Lock, LogOut, Activity, User } from 'lucide-react';
import { usePipeline } from '../../context/PipelineContext';
import { NotificationBell } from '../shared/NotificationPanel';

// ── CSS ────────────────────────────────────────────────────────
let _css = false;
function injectCSS() {
  if (_css) return; _css = true;
  const s = document.createElement('style');
  s.textContent = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');
.ti-ms * { box-sizing: border-box; font-family: 'IBM Plex Mono', monospace; }
@keyframes ti-blink { 0%,100% { opacity: 1; } 50% { opacity: 0.15; } }
@keyframes ti-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
.ti-card {
  background: rgba(4,6,9,0.7);
  border: 1px solid rgba(0,190,190,0.12);
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.ti-card:hover {
  border-color: rgba(0,210,210,0.35);
  background: rgba(0,190,190,0.04);
  box-shadow: 0 0 24px rgba(0,242,255,0.06), inset 0 0 20px rgba(0,242,255,0.03);
}
.ti-card-purple {
  border-color: rgba(167,139,250,0.12);
}
.ti-card-purple:hover {
  border-color: rgba(167,139,250,0.35);
  background: rgba(167,139,250,0.04);
  box-shadow: 0 0 24px rgba(167,139,250,0.06), inset 0 0 20px rgba(167,139,250,0.03);
}
.ti-initiate {
  background: transparent;
  border: 1px solid rgba(0,190,190,0.3);
  color: rgba(0,210,210,0.85);
  padding: 8px 16px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  cursor: pointer;
  text-transform: uppercase;
  transition: background 0.2s, border-color 0.2s;
  font-family: 'IBM Plex Mono', monospace;
}
.ti-initiate:hover {
  background: rgba(0,190,190,0.07);
  border-color: rgba(0,210,210,0.6);
}
.ti-initiate-purple {
  border-color: rgba(167,139,250,0.3);
  color: rgba(167,139,250,0.85);
}
.ti-initiate-purple:hover {
  background: rgba(167,139,250,0.07);
  border-color: rgba(167,139,250,0.6);
}
`;
  document.head.appendChild(s);
}

// ── Data ───────────────────────────────────────────────────────
interface ModeCard {
  id: 'advanced' | 'professional' | 'terminal' | 'brain';
  node: string;
  label: string;
  description: string;
  icon: React.ElementType;
  tier: string;
  tierColor: string;
  accent: string;
  cardClass: string;
  btnClass: string;
}

const MODES: ModeCard[] = [
  {
    id: 'professional',
    node: 'INTEL_NODE_01',
    label: 'PROFESSIONAL INTEL',
    description: 'High-fidelity geopolitical telemetry. Strategic foresight with predictive ledger, RBAC access tiers, and live RRI engine.',
    icon: Shield,
    tier: 'ANALYST',
    tierColor: 'rgba(0,200,200,0.7)',
    accent: 'rgba(0,242,255,0.8)',
    cardClass: 'ti-card',
    btnClass: 'ti-initiate',
  },
  {
    id: 'advanced',
    node: 'INTEL_NODE_02',
    label: 'TACTICAL OSINT',
    description: 'Real-time open-source reconnaissance. Global social signals, satellite imagery, and localized transmission clusters.',
    icon: Eye,
    tier: 'PUBLIC',
    tierColor: 'rgba(74,222,128,0.7)',
    accent: 'rgba(0,242,255,0.8)',
    cardClass: 'ti-card',
    btnClass: 'ti-initiate',
  },
  {
    id: 'terminal',
    node: 'INTEL_NODE_05',
    label: 'TUNISIA TERMINAL',
    description: 'High-density intelligence terminal. Real-time RRI, macroeconomic indicators, and tactical intel feed in a data-dense interface.',
    icon: Terminal,
    tier: 'ANALYST',
    tierColor: 'rgba(0,200,200,0.7)',
    accent: 'rgba(0,242,255,0.8)',
    cardClass: 'ti-card',
    btnClass: 'ti-initiate',
  },
  {
    id: 'brain',
    node: 'BRAIN_NODE_09',
    label: 'BRAIN MODE',
    description: 'Cognitive interface. Immersive 3D visualization of Tunisia\'s political, economic, and social dynamics as a living neural network.',
    icon: Globe,
    tier: 'CLASSIFIED',
    tierColor: 'rgba(167,139,250,0.7)',
    accent: 'rgba(167,139,250,0.9)',
    cardClass: 'ti-card ti-card-purple',
    btnClass: 'ti-initiate ti-initiate-purple',
  },
];

// ── Component ──────────────────────────────────────────────────
interface ModeSelectionProps {
  onSelect: (mode: 'advanced' | 'professional' | 'terminal' | 'brain') => void;
  onLogoff: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = React.memo(({ onSelect, onLogoff }) => {
  const { rriState, data } = usePipeline();

  useEffect(() => { injectCSS(); }, []);

  const utc = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const rriCol = rriState.rri > 2.7 ? '#ef4444' : rriState.rri > 2.3 ? '#d68910' : '#00c8c8';
  const threatLabel = rriState.rri > 2.7 ? 'CRITICAL' : rriState.rri > 2.3 ? 'ELEVATED' : 'MODERATE';
  const threatCol = rriState.rri > 2.7 ? '#ef4444' : '#d68910';

  const ticker = [
    { label: 'RRI', value: rriState.rri.toFixed(3), color: rriCol },
    { label: 'P(REV)', value: `${(rriState.p_rev * 100).toFixed(1)}%`, color: '#d68910' },
    { label: 'VELOCITY', value: (rriState.velocity > 0 ? '+' : '') + rriState.velocity.toFixed(3), color: rriState.velocity > 0.1 ? '#ef4444' : 'rgba(148,163,184,0.6)' },
    { label: 'FX', value: `${data.economy.fx_reserves}d`, color: data.economy.fx_reserves < 90 ? '#d68910' : '#4ade80' },
    { label: 'INFLATION', value: `${data.economy.inflation}%`, color: data.economy.inflation > 8 ? '#d68910' : 'rgba(148,163,184,0.6)' },
    { label: 'CASCADE', value: `${(rriState.cascade_probability * 100).toFixed(0)}%`, color: rriState.cascade_probability > 0.5 ? '#ef4444' : 'rgba(148,163,184,0.6)' },
  ];

  return (
    <div className="ti-ms" style={{
      position: 'fixed', inset: 0,
      background: '#040609',
      overflow: 'hidden',
      color: '#94a3b8',
    }}>

      {/* Dot grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.9) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(4,6,9,0.88) 100%)',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(4,6,9,0.65)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 100 100">
            <path d="M50 15 L85 85 L15 85 Z" fill="none" stroke="#00f2ff" strokeWidth="3"
              style={{ filter: 'drop-shadow(0 0 4px rgba(0,242,255,0.7))' }} />
            <path d="M50 30 L76 78 L24 78 Z" fill="none" stroke="#00f2ff" strokeWidth="1.5" opacity="0.5" />
          </svg>
          <div style={{ fontSize: 12, letterSpacing: '0.25em', color: 'rgba(0,200,200,0.75)', fontWeight: 700 }}>
            TUNISIA<span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>INTEL</span>
          </div>
        </div>
        <div style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', letterSpacing: '0.15em' }}>
          {utc}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'rgba(0,200,200,0.85)',
              boxShadow: '0 0 5px rgba(0,200,200,0.6)',
              animation: 'ti-blink 2.2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(0,200,200,0.5)' }}>
              SECURE UPLINK
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-system-command'))}
              title="System Command Center"
              style={{
                background: 'transparent', border: '1px solid rgba(148,163,184,0.15)',
                color: 'rgba(148,163,184,0.45)', padding: 6, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s, color 0.2s', borderRadius: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,210,210,0.35)'; e.currentTarget.style.color = 'rgba(0,210,210,0.85)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)'; e.currentTarget.style.color = 'rgba(148,163,184,0.45)'; }}
            >
              <Shield size={12} />
            </button>
            <button
              title="Profile"
              style={{
                background: 'transparent', border: '1px solid rgba(148,163,184,0.15)',
                color: 'rgba(148,163,184,0.45)', padding: 6, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'border-color 0.2s, color 0.2s', borderRadius: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(148,163,184,0.15)'; e.currentTarget.style.color = 'rgba(148,163,184,0.45)'; }}
            >
              <User size={12} />
            </button>
            <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)' }} />
            <button onClick={onLogoff} style={{
              background: 'transparent',
              border: '1px solid rgba(239,68,68,0.25)',
              color: 'rgba(239,68,68,0.7)',
              padding: '5px 10px',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.18em',
              cursor: 'pointer',
              textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'border-color 0.2s, color 0.2s',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)'; e.currentTarget.style.color = 'rgba(239,68,68,1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; }}
            >
              <LogOut size={10} />
              LOGOUT
            </button>
          </div>
        </div>
      </div>

      {/* Corner brackets */}
      {[
        { top: 52, left: 20,  bt: true, bl: true  },
        { top: 52, right: 20, bt: true, br: true  },
        { bot: 40, left: 20,  bb: true, bl: true  },
        { bot: 40, right: 20, bb: true, br: true  },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: 18, height: 18, zIndex: 20,
          top: (c as any).top, bottom: (c as any).bot,
          left: (c as any).left, right: (c as any).right,
          borderTop:    c.bt ? '1px solid rgba(0,180,180,0.28)' : 'none',
          borderBottom: c.bb ? '1px solid rgba(0,180,180,0.28)' : 'none',
          borderLeft:   c.bl ? '1px solid rgba(0,180,180,0.28)' : 'none',
          borderRight:  c.br ? '1px solid rgba(0,180,180,0.28)' : 'none',
        }} />
      ))}

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(4,6,9,0.65)', backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(148,163,184,0.22)' }}>
            NODE: TUNIS_01 // NORTH_AFRICA_CLUSTER
          </span>
          <span style={{ fontSize: 8, letterSpacing: '0.12em', color: 'rgba(148,163,184,0.18)' }}>
            RRI ENGINE v4.2 // 250 VARIABLES
          </span>
        </div>
        <span style={{ fontSize: 8, letterSpacing: '0.18em', color: threatCol, opacity: 0.65 }}>
          THREAT: {threatLabel}
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{
        position: 'absolute', top: 44, bottom: 32, left: 0, right: 0,
        overflowY: 'auto', zIndex: 10,
        padding: '32px 40px 24px',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 28 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
              {/* Triangle logo — small */}
              <svg width="28" height="28" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
                <path d="M50 15 L85 85 L15 85 Z" fill="none" stroke="#00f2ff" strokeWidth="3"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0,242,255,0.7))' }} />
                <path d="M50 30 L76 78 L24 78 Z" fill="none" stroke="#00f2ff" strokeWidth="1.5" opacity="0.5" />
              </svg>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '0.3em', color: 'rgba(0,200,200,0.5)', marginBottom: 3 }}>
                  // SYSTEM ACCESS GATEWAY
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(241,245,249,0.88)' }}>
                  TUNISIA<span style={{ color: 'rgba(0,200,200,0.75)' }}>INTEL</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 8, letterSpacing: '0.25em', color: 'rgba(148,163,184,0.28)', marginLeft: 42 }}>
              SELECT OPERATIONAL INTERFACE // AUTHORIZED PERSONNEL ONLY
            </div>
          </motion.div>

          {/* Live intelligence ticker */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{
              marginBottom: 28,
              border: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.015)',
              padding: '8px 16px',
              display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 12, flexShrink: 0 }}>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#4ade80',
                animation: 'ti-blink 1.8s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(148,163,184,0.35)' }}>
                LIVE INTEL
              </span>
            </div>
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.07)', marginRight: 12 }} />
            {ticker.map((t, i) => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 16 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(148,163,184,0.3)' }}>{t.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: t.color, letterSpacing: '0.05em' }}>{t.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Mode cards grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}>
            {MODES.map((m, i) => {
              const Icon = m.id === 'brain' ? Lock : m.icon;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.15 + i * 0.07 }}
                  className={m.cardClass}
                  onClick={() => onSelect(m.id)}
                  style={{ padding: '18px 18px 16px', borderRadius: 1 }}
                >
                  {/* Top row: icon + node + tier */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 30, height: 30,
                        border: `1px solid ${m.accent.replace('0.8', '0.2').replace('0.9', '0.2')}`,
                        background: m.accent.replace('0.8', '0.08').replace('0.9', '0.08'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 2,
                      }}>
                        <Icon size={13} style={{ color: m.accent }} />
                      </div>
                      <span style={{ fontSize: 8, letterSpacing: '0.1em', color: 'rgba(148,163,184,0.3)' }}>
                        {m.node}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 8, letterSpacing: '0.15em', fontWeight: 600,
                      color: m.tierColor,
                      border: `1px solid ${m.tierColor.replace('0.7', '0.2')}`,
                      background: m.tierColor.replace('0.7', '0.06'),
                      padding: '2px 6px',
                      borderRadius: 1,
                    }}>
                      {m.tier}
                    </span>
                  </div>

                  {/* Label */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
                    color: 'rgba(241,245,249,0.85)',
                    marginBottom: 8,
                    textShadow: `0 0 16px ${m.accent.replace('0.8', '0.3').replace('0.9', '0.3')}`,
                  }}>
                    {m.label}
                  </div>

                  {/* Description */}
                  <div style={{
                    fontSize: 10, lineHeight: 1.6,
                    color: 'rgba(148,163,184,0.45)',
                    marginBottom: 16,
                  }}>
                    {m.description}
                  </div>

                  {/* Initiate button */}
                  <button className={m.btnClass} onClick={e => { e.stopPropagation(); onSelect(m.id); }}>
                    {m.id === 'brain' ? '[ RESTRICTED ACCESS ]' : '[ INITIATE ]'}
                  </button>

                  {/* Corner accent */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 40, height: 40,
                    background: `linear-gradient(225deg, ${m.accent.replace('0.8', '0.06').replace('0.9', '0.06')} 0%, transparent 60%)`,
                    pointerEvents: 'none',
                  }} />
                </motion.div>
              );
            })}
          </div>

          {/* Footer status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={9} style={{ color: 'rgba(0,200,200,0.4)' }} />
                <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(148,163,184,0.22)' }}>PIPELINE ACTIVE</span>
              </div>
              <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(148,163,184,0.15)' }}>
                KERNEL v4.2.0-stable
              </span>
            </div>
            <div style={{ fontSize: 8, letterSpacing: '0.15em', color: 'rgba(148,163,184,0.18)' }}>
              REGION: NORTH AFRICA // TUNISIA
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
});
