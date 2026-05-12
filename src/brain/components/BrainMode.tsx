import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import ConstellationView from './ConstellationView';
import ProjectionView from './ProjectionView';
import TerrainView from './TerrainView';
import AudioBriefing from './AudioBriefing';
import SimulationView from './SimulationView';
import NarrativeWarfareView from './NarrativeWarfareView';
import ShockPropagationView from './ShockPropagationView';
import MobileFallbackView from './MobileFallbackView';
import OnboardingFlow from './OnboardingFlow';

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
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0f', position: 'relative' }}>
      {/* Space Toggle Selector */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onClick={() => setActiveSpace('constellation')}
          style={{ background: activeSpace === 'constellation' ? '#4f46e5' : '#374151', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Constellation
        </button>
        <button
          onClick={() => setActiveSpace('projection')}
          style={{ background: activeSpace === 'projection' ? '#4f46e5' : '#374151', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Projection
        </button>
        <button
          onClick={() => setActiveSpace('terrain')}
          style={{ background: activeSpace === 'terrain' ? '#4f46e5' : '#374151', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Terrain
        </button>
        <button
          onClick={() => setActiveSpace('simulation')}
          style={{ background: activeSpace === 'simulation' ? '#4f46e5' : '#374151', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Simulation
        </button>
        <button
          onClick={() => setActiveSpace('narrative-warfare')}
          style={{ background: activeSpace === 'narrative-warfare' ? '#4f46e5' : '#374151', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Narrative Warfare
        </button>
        <button
          onClick={() => setActiveSpace('shock-propagation')}
          style={{ background: activeSpace === 'shock-propagation' ? '#4f46e5' : '#374151', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
        >
          Shock Propagation
        </button>
      </div>

      <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 100, color: 'white', fontFamily: 'monospace' }}>
        Brain Mode Controls
      </div>

      {/* Render Active Space */}
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
      ) : activeSpace === 'simulation' ? (
        <SimulationView />
      ) : activeSpace === 'narrative-warfare' ? (
        <NarrativeWarfareView />
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
