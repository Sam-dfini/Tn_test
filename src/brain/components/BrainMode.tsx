import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import {
  Star, TrendingUp, Globe, FlaskConical, Radio, Zap, Activity, MessageCircle, Shield, Heart, Crosshair,
  BrainCircuit, Home, ChevronLeft,
} from 'lucide-react';
import ConstellationView from './ConstellationView';
import ProjectionView from './ProjectionView';
import TerrainView from './TerrainView';
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

const ICON_SIZE = 20;

const views = [
  { id: 'constellation',     icon: Star,          label: 'Constellation' },
  { id: 'projection',        icon: TrendingUp,     label: 'Projection' },
  { id: 'terrain',           icon: Globe,          label: 'Terrain' },
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

// Loading component for BrainMode
const LoadingScreen = () => (
  <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0f', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', color: 'white' }}>
    <div style={{ fontFamily: 'monospace', fontSize: '14px', marginBottom: '20px' }}>LOADING BRAIN MODE</div>
    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(167, 139, 250, 0.3)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
  </div>
);

// BrainMode component
const BrainMode = ({ onOpenAI, onOpenPipeline, onGoHome, onOpenReport }) => {
  const [activeSpace, setActiveSpace] = useState('constellation');
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
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0f', display: 'flex' }}>
      {/* Sidebar */}
      <div style={sx}>
        {/* Brand */}
        <div style={{ marginBottom: 8, padding: '4px 0' }}>
          <BrainCircuit size={22} color="#a78bfa" />
        </div>

        <div style={{ width: 28, height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0 8px' }} />

        {/* Nav items */}
        {views.map(v => {
          const active = activeSpace === v.id;
          return (
            <button key={v.id} title={v.label} onClick={() => setActiveSpace(v.id)}
              style={{
                ...btnBase,
                background: active ? 'rgba(167,139,250,0.15)' : 'transparent',
                color: active ? '#a78bfa' : 'rgba(255,255,255,0.35)',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}}
            >
              <v.icon size={ICON_SIZE} />
              {active && <div style={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, borderRadius: 2, background: '#a78bfa' }} />}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* Exit */}
        <button title="Exit Brain Mode" onClick={onGoHome}
          style={{ ...btnBase, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}
          onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <ChevronLeft size={ICON_SIZE} />
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activeSpace === 'constellation' ? (
          <Suspense fallback={<LoadingScreen />}>
            <Canvas camera={{ position: [0, 0, 5] }}>
              <OrbitControls />
              <Environment preset="city" />
              <ConstellationView />
            </Canvas>
          </Suspense>
        ) : activeSpace === 'projection' ? (
          <ProjectionView />
        ) : activeSpace === 'terrain' ? (
          <TerrainView />
        ) : activeSpace === 'telegram' ? (
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
        ) : (
          <ShockPropagationView />
        )}

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
