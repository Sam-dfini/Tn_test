import React, { useState, useEffect } from 'react';
import {
  FlaskConical, Radio, Zap, Activity, MessageCircle, Shield, Heart, Crosshair,
  BrainCircuit, Home, ChevronLeft, MessageSquare,
} from 'lucide-react';
import AudioBriefing from './AudioBriefing';
import SimulationView from './SimulationView';
import NarrativeWarfareView from './NarrativeWarfareView';
import ShockPropagationView from './ShockPropagationView';
import NationalStateView from './NationalStateView';
import TelegramFeedView from './TelegramFeedView';
import SCIView from './SCIView';
import EmotionalHeatmapView from './EmotionalHeatmapView';
import CalibrationDashboard from './CalibrationDashboard';
import MobileFallbackView from './MobileFallbackView';
import OnboardingFlow from './OnboardingFlow';
import CognitiveWorkspace from '../../components/CognitiveWorkspace/CognitiveWorkspace';

const ICON_SIZE = 20;

const views = [
  { id: 'cognitive-workspace', icon: MessageSquare, label: 'Workspace' },
  { id: 'telegram',          icon: MessageCircle,  label: 'Telegram' },
  { id: 'sci',               icon: Shield,         label: 'SCI' },
  { id: 'calibration',       icon: Crosshair,      label: 'Calibration' },
  { id: 'simulation',        icon: FlaskConical,   label: 'Simulation' },
  { id: 'narrative-warfare', icon: Radio,          label: 'Narrative Warfare' },
  { id: 'heatmap',           icon: Heart,          label: 'Heatmap' },
  { id: 'state-machine',     icon: Activity,       label: 'State Machine' },
  { id: 'shock-propagation', icon: Zap,            label: 'Shock Propagation' },
];

const sx: React.CSSProperties = {
  width: 56, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
  borderRight: '1px solid rgba(255,255,255,0.06)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  padding: '12px 0', zIndex: 200, gap: 2,
};

const btnBase: React.CSSProperties = {
  width: 40, height: 40, border: 'none', borderRadius: 10,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', position: 'relative', transition: 'all .15s',
};

// BrainMode component
const BrainMode = ({ onOpenAI, onOpenPipeline, onGoHome, onOpenReport }) => {
  const [activeSpace, setActiveSpace] = useState('cognitive-workspace');
  const [audioBriefing, setAudioBriefing] = useState<{ type: 'morning' | 'evening' | 'emergency'; message: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Simulate audio briefings
  useEffect(() => {
    const now = new Date();
    const hours = now.getHours();

    // Morning briefing at 8 AM
    if (hours === 8 && !audioBriefing) {
      setAudioBriefing({
        type: 'morning',
        message: 'Morning briefing: National resilience index stable. Monitor governorate risk scores for anomalies.'
      });
    }

    // Evening briefing at 6 PM
    if (hours === 18 && !audioBriefing) {
      setAudioBriefing({
        type: 'evening',
        message: 'Evening briefing: No critical alerts. Review strategic projections for tomorrow.'
      });
    }

    // Emergency briefing (simulated)
    if (Math.random() > 0.95 && !audioBriefing) {
      setAudioBriefing({
        type: 'emergency',
        message: 'EMERGENCY ALERT: Elevated risk detected in Kasserine. Activate crisis response protocol.'
      });
    }
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#040609', display: 'flex', fontFamily: '"IBM Plex Mono", monospace', overflow: 'hidden' }}>
      {/* Dot grid background */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.03, backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.9) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      
      {/* Sidebar */}
      <div style={{ ...sx, background: 'rgba(4,6,9,0.85)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(0,180,180,0.28)' }}>
        <div style={{ width: 28, height: 1, background: 'rgba(0,180,180,0.28)', margin: '52px 0 12px' }} />

        {/* Nav items */}
        {views.map(v => {
          const active = activeSpace === v.id;
          return (
            <button key={v.id} title={v.label} onClick={() => setActiveSpace(v.id)}
              style={{
                ...btnBase,
                background: active ? 'rgba(0,190,190,0.15)' : 'transparent',
                border: active ? '1px solid rgba(0,200,200,0.35)' : '1px solid rgba(0,180,180,0.15)',
                color: active ? '#00f2ff' : 'rgba(255,255,255,0.35)',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(0,190,190,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,200,200,0.35)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,180,180,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}}
            >
              <v.icon size={ICON_SIZE} />
              {active && <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 2, background: '#00f2ff', boxShadow: '0 0 8px rgba(0,242,255,0.6)' }} />}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Exit */}
        <button title="Exit Brain Mode" onClick={onGoHome}
          style={{ ...btnBase, border: '1px solid rgba(0,180,180,0.28)', color: 'rgba(255,255,255,0.25)', marginTop: 4 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(0,190,190,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,200,200,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,180,180,0.28)'; }}
        >
          <ChevronLeft size={ICON_SIZE} />
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: '100%', height: '100%', transform: 'scale(0.90)', transformOrigin: 'center center' }}>
        {activeSpace === 'telegram' ? (
          <TelegramFeedView />
        ) : activeSpace === 'sci' ? (
          <SCIView />
        ) : activeSpace === 'calibration' ? (
          <CalibrationDashboard />
        ) : activeSpace === 'simulation' ? (
          <SimulationView />
        ) : activeSpace === 'narrative-warfare' ? (
          <NarrativeWarfareView />
        ) : activeSpace === 'heatmap' ? (
          <EmotionalHeatmapView />
        ) : activeSpace === 'state-machine' ? (
          <NationalStateView />
        ) : activeSpace === 'cognitive-workspace' ? (
          <CognitiveWorkspace noChrome />
        ) : (
          <ShockPropagationView />
        )}
        </div>

        {/* Audio Briefing */}
        {audioBriefing && (
          <AudioBriefing
            briefingType={audioBriefing.type}
            message={audioBriefing.message}
            onDismiss={() => setAudioBriefing(null)}
          />
        )}

        {/* Onboarding Flow */}
        {showOnboarding && !isMobile && (
          <OnboardingFlow onComplete={() => setShowOnboarding(false)} />
        )}

        {/* Top Bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 44, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          borderBottom: '1px solid rgba(0,180,180,0.28)',
          background: 'rgba(4,6,9,0.65)', backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrainCircuit size={20} color="#00f2ff" style={{ filter: 'drop-shadow(0 0 8px rgba(0,242,255,0.6))' }} />
            <div style={{ fontSize: 12, letterSpacing: '0.25em', color: 'rgba(0,200,200,0.75)', fontWeight: 700 }}>
              TUNISIA<span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>INTEL</span>
            </div>
          </div>
          <div style={{ fontSize: 8, color: 'rgba(148,163,184,0.35)', letterSpacing: '0.15em' }}>
            {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
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

        {/* Corner Brackets */}
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

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 25%, rgba(4,6,9,0.88) 100%)',
        }}/>

        {/* Bottom Status Bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 32, zIndex: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 28px',
          borderTop: '1px solid rgba(0,180,180,0.28)',
          background: 'rgba(4,6,9,0.65)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', color: 'rgba(148,163,184,0.22)' }}>
            NODE: TUNIS_01 // NORTH_AFRICA_CLUSTER
          </div>
          <div style={{ fontSize: 8, letterSpacing: '0.18em', color: '#d68910', opacity: 0.65 }}>
            THREAT: ELEVATED
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile fallback wrapper
const BrainModeWrapper = (props: any) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices
  useEffect(() => {
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      setIsMobile(isMobileDevice);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile ? <MobileFallbackView /> : <BrainMode {...props} />;
};

export default BrainModeWrapper;
