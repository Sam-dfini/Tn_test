/**
 * Authentication — TunisiaIntel sovereign login
 *
 * Interaction:
 *   Phase 1 — Center: nested triangle + title + initialize button.
 *   Phase 2 — On button click or Enter: drawer slides up from bottom.
 *             Title fades. Form is in the drawer.
 */

import React, { useState, useEffect, useRef } from 'react';
import { safeStorage } from '../../utils/storage';
import { supabase } from '../../lib/supabase';

// ── CSS ────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600;700&display=swap');

.ti-auth * { box-sizing: border-box; font-family: 'IBM Plex Mono', monospace; }

@keyframes ti-blink {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.15; }
}
@keyframes ti-spin {
  to { transform: rotate(360deg); }
}

.ti-field {
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.09);
  color: #e2e8f0;
  padding: 11px 14px;
  font-size: 12px;
  letter-spacing: 0.05em;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
  border-radius: 1px;
}
.ti-field:focus {
  border-color: rgba(0,190,190,0.45);
  background: rgba(0,190,190,0.03);
}
.ti-field::placeholder { color: rgba(148,163,184,0.35); }

.ti-btn {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(0,190,190,0.35);
  color: rgba(0,210,210,0.85);
  padding: 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  cursor: pointer;
  border-radius: 1px;
  transition: background 0.2s, border-color 0.2s;
  text-transform: uppercase;
}
.ti-btn:hover:not(:disabled) {
  background: rgba(0,190,190,0.07);
  border-color: rgba(0,210,210,0.6);
}
.ti-btn:disabled { opacity: 0.4; cursor: not-allowed; }
`;

let _css = false;
function injectCSS() {
  if (_css) return; _css = true;
  const s = document.createElement('style');
  s.textContent = CSS;
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────
export const Authentication: React.FC<{ onAuthenticate: () => void }> = ({ onAuthenticate }) => {
  const [phase, setPhase]       = useState<'map' | 'drawer'>('map');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [tick, setTick]         = useState(0);
  const emailRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    injectCSS();
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Focus email when drawer opens
  useEffect(() => {
    if (phase === 'drawer') {
      setTimeout(() => emailRef.current?.focus(), 400);
    }
  }, [phase]);

  // Global Enter key — opens drawer if on map phase
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (phase === 'map' && e.key === 'Enter') setPhase('drawer');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase]);

  const openDrawer = () => setPhase('drawer');

  const handleAuth = async () => {
    if (!email || !password) { setError('CREDENTIALS REQUIRED'); return; }
    setError('');
    setLoading(true);

    const DEMO_CODE = (import.meta as any).env?.VITE_DEMO_CODE || '';
    if (DEMO_CODE && password === DEMO_CODE) {
      safeStorage.setItem('ti_authenticated', 'true');
      onAuthenticate();
      setLoading(false);
      return;
    }

    try {
      const { error: e } = await supabase.auth.signInWithPassword({ email, password });
      if (e) throw e;
      onAuthenticate();
    } catch (err: any) {
      setError(err.message?.toUpperCase() || 'AUTHENTICATION FAILED');
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAuth();
  };

  const utc = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  const RRI = 2.31;
  const rriCol = '#d68910';
  const DRAWER_H = '100vh';

  return (
    <div className="ti-auth" style={{
      position: 'fixed', inset: 0, background: '#040609',
      overflow: 'hidden', color: '#94a3b8',
    }}>


      {/* ── DOT GRID ── */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.03,
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.9) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}/>

      {/* ── CENTER CONTENT: TRIANGLE + TITLE + BUTTON — fades when drawer opens ── */}
      <div style={{
        position: 'absolute', left: '50%', top: '45%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10, textAlign: 'center',
        transition: 'opacity 0.4s ease',
        opacity: phase === 'drawer' ? 0 : 1,
        pointerEvents: phase === 'drawer' ? 'none' : 'auto',
      }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <svg width="90" height="90" viewBox="0 0 100 100">
            <defs>
              <filter id="tri-outer">
                <feGaussianBlur stdDeviation="2" result="b"/>
                <feComposite in="SourceGraphic" in2="b" operator="over"/>
              </filter>
              <filter id="tri-mid">
                <feGaussianBlur stdDeviation="1.5" result="b"/>
                <feComposite in="SourceGraphic" in2="b" operator="over"/>
              </filter>
            </defs>
            <path d="M50 15 L85 85 L15 85 Z" fill="none" stroke="#00f2ff" strokeWidth="3" strokeLinejoin="miter"
              filter="url(#tri-outer)"
              style={{ filter: 'drop-shadow(0 0 5px rgba(0,242,255,0.8)) drop-shadow(0 0 15px rgba(0,242,255,0.4))' }}
            />
            <path d="M50 25 L78 80 L22 80 Z" fill="none" stroke="#00f2ff" strokeWidth="1.8" strokeLinejoin="miter"
              opacity="0.8" filter="url(#tri-mid)"
              style={{ filter: 'drop-shadow(0 0 3px rgba(0,242,255,0.6)) drop-shadow(0 0 8px rgba(0,242,255,0.3))' }}
            />
            <path d="M50 35 L71 75 L29 75 Z" fill="none" stroke="#00f2ff" strokeWidth="1" strokeLinejoin="miter"
              opacity="0.5"
            />
          </svg>
        </div>
        <div style={{
          fontSize: 10, letterSpacing: '0.35em',
          color: 'rgba(148,163,184,0.35)',
          marginBottom: 6,
        }}>
          // SOVEREIGN RISK INTELLIGENCE
        </div>
        <div style={{
          fontSize: 28, fontWeight: 700, letterSpacing: '0.08em',
          color: 'rgba(241,245,249,0.85)',
          marginBottom: 4,
        }}>
          TUNISIA<span style={{ color: 'rgba(0,200,200,0.75)' }}>INTEL</span>
        </div>
        <div style={{
          fontSize: 9, letterSpacing: '0.25em',
          color: rriCol, marginBottom: 20,
        }}>
          RRI {RRI} // THREAT ELEVATED
        </div>

        <button
          onClick={openDrawer}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,200,200,0.35)',
            color: 'rgba(0,210,210,0.85)',
            padding: '11px 28px',
            fontSize: 11, fontWeight: 600,
            letterSpacing: '0.25em',
            cursor: 'pointer', textTransform: 'uppercase',
            transition: 'background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(0,190,190,0.07)';
            e.currentTarget.style.borderColor = 'rgba(0,210,210,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(0,200,200,0.35)';
          }}
        >
          ▼ INITIALIZE SESSION
        </button>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(148,163,184,0.3)', marginTop: 10 }}>
          PRESS ENTER OR CLICK
        </div>
      </div>

      {/* ── TOP BAR ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 44, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(4,6,9,0.65)', backdropFilter: 'blur(10px)',
      }}>
        <div style={{ fontSize: 12, letterSpacing: '0.25em', color: 'rgba(0,200,200,0.75)', fontWeight: 700 }}>
          TUNISIA<span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>INTEL</span>
        </div>
        <div style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', letterSpacing: '0.15em' }}>
          {utc}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: 'rgba(0,200,200,0.85)',
            boxShadow: '0 0 5px rgba(0,200,200,0.6)',
            animation: 'ti-blink 2.2s ease-in-out infinite',
          }}/>
          <span style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(0,200,200,0.5)' }}>
            SECURE UPLINK
          </span>
        </div>
      </div>

      {/* ── CORNER BRACKETS — inset within top/bottom bars ── */}
      {[
        { top: 52, left: 20,   bt: true,  bl: true  },
        { top: 52, right: 20,  bt: true,  br: true  },
        { bot: 40, left: 20,   bb: true,  bl: true  },
        { bot: 40, right: 20,  bb: true,  br: true  },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: 18, height: 18, zIndex: 20,
          top: c.top, bottom: c.bot, left: c.left, right: c.right,
          borderTop:    c.bt ? '1px solid rgba(0,180,180,0.28)' : 'none',
          borderBottom: c.bb ? '1px solid rgba(0,180,180,0.28)' : 'none',
          borderLeft:   c.bl ? '1px solid rgba(0,180,180,0.28)' : 'none',
          borderRight:  c.br ? '1px solid rgba(0,180,180,0.28)' : 'none',
        }}/>
      ))}

      {/* ── VIGNETTE ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 25%, rgba(4,6,9,0.88) 100%)',
      }}/>

      {/* ── BOTTOM STATUS BAR ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        background: 'rgba(4,6,9,0.65)', backdropFilter: 'blur(8px)',
      }}>
        <div style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(148,163,184,0.22)' }}>
          NODE: TUNIS_01 // NORTH_AFRICA_CLUSTER
        </div>
        <div style={{ fontSize: 8, letterSpacing: '0.18em', color: rriCol, opacity: 0.65 }}>
          THREAT: ELEVATED
        </div>
      </div>

      {/* ── DRAWER ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: DRAWER_H,
        zIndex: 30,
        transform: phase === 'drawer' ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.65s cubic-bezier(0.16,1,0.3,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drawer top edge — glowing line */}
        <div style={{
          height: 1, flexShrink: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,200,200,0.5) 30%, rgba(0,200,200,0.5) 70%, transparent 100%)',
          boxShadow: '0 0 16px rgba(0,200,200,0.25)',
        }}/>

        {/* Drawer body */}
        <div style={{
          flex: 1, overflow: 'hidden',
          background: 'rgba(4,7,14,0.08)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Inner container — centered, max width */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px 16px',
          }}>
            <div style={{ width: '100%', maxWidth: 380 }}>

              {/* Drawer header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '0.25em', color: 'rgba(0,200,200,0.6)', marginBottom: 2 }}>
                    OPERATOR AUTHENTICATION
                  </div>
                  <div style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(148,163,184,0.3)' }}>
                    INTERNAL ANALYTICS ENVIRONMENT // BUILD 0.9.6-alpha
                  </div>
                </div>
                {/* Close drawer */}
                <button onClick={() => setPhase('map')} style={{
                  background: 'transparent', border: 'none',
                  color: 'rgba(148,163,184,0.3)', cursor: 'pointer',
                  fontSize: 14, padding: '4px 8px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(148,163,184,0.3)')}
                >
                  ✕
                </button>
              </div>

              {/* Fields row */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(148,163,184,0.38)', marginBottom: 5 }}>
                    OPERATOR EMAIL
                  </div>
                  <input
                    ref={emailRef}
                    className="ti-field"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="operator@domain.tld"
                    autoComplete="email"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8, letterSpacing: '0.2em', color: 'rgba(148,163,184,0.38)', marginBottom: 5 }}>
                    ACCESS KEY
                  </div>
                  <input
                    className="ti-field"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  fontSize: 9, color: '#c0392b', letterSpacing: '0.12em',
                  marginBottom: 10, padding: '6px 10px',
                  border: '1px solid rgba(192,57,43,0.3)',
                  background: 'rgba(192,57,43,0.05)',
                }}>
                  ⚠ {error}
                </div>
              )}

              {/* Auth button */}
              <button className="ti-btn" onClick={handleAuth} disabled={loading} style={{ marginBottom: 14 }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 9, height: 9,
                      border: '1px solid rgba(0,200,200,0.4)',
                      borderTopColor: 'rgba(0,200,200,0.9)',
                      borderRadius: '50%',
                      animation: 'ti-spin 0.7s linear infinite',
                    }}/>
                    VERIFYING
                  </span>
                ) : '[ INITIALIZE SESSION ]'}
              </button>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
