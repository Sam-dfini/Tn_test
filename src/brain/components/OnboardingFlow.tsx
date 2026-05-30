import React, { useState } from 'react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  image?: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Brain Mode',
    description: 'Experience Tunisia’s political, economic, and social dynamics in a living 3D environment.',
  },
  {
    id: 2,
    title: 'Constellation View',
    description: 'Explore entities as a force-directed network with dynamic connections.',
  },
  {
    id: 3,
    title: 'Projection View',
    description: 'Navigate hierarchical layers from strategic to tactical levels.',
  },
  {
    id: 4,
    title: 'Terrain View',
    description: 'Visualize events propagating across Tunisia’s geography.',
  },
  {
    id: 5,
    title: 'Simulation Mode',
    description: 'Adjust parameters to project risk cascades and scenarios.',
  },
  {
    id: 6,
    title: 'Narrative Warfare',
    description: 'Analyze competing narratives as gravitational fields.',
  },
  {
    id: 7,
    title: 'Shock Propagation',
    description: 'Monitor real-time event animations and alerts.',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const OnboardingFlow: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(4, 6, 9, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      color: 'white',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h2 style={{ color: '#00f2ff', marginBottom: '20px', textShadow: '0 0 20px rgba(0,242,255,0.4)' }}>{onboardingSteps[currentStep - 1].title}</h2>
        <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '30px', color: 'rgba(148,163,184,0.7)', letterSpacing: '0.05em' }}>
          {onboardingSteps[currentStep - 1].description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          <button
            onClick={handleSkip}
            style={{ padding: '10px 20px', background: 'transparent', color: 'rgba(200,220,220,0.6)', border: '1px solid rgba(0,180,180,0.35)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00f2ff'; e.currentTarget.style.color = '#00f2ff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,180,180,0.35)'; e.currentTarget.style.color = 'rgba(200,220,220,0.6)'; }}
          >
            SKIP
          </button>
          <button
            onClick={handleNext}
            style={{ padding: '10px 20px', background: 'rgba(0,242,255,0.15)', color: '#00f2ff', border: '1px solid rgba(0,242,255,0.45)', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em', boxShadow: '0 0 15px rgba(0,242,255,0.15)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,242,255,0.25)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,242,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,242,255,0.15)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,242,255,0.15)'; }}
          >
            {currentStep === onboardingSteps.length ? 'FINISH' : 'NEXT'}
          </button>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              style={{
                width: currentStep === step.id ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                backgroundColor: currentStep >= step.id ? '#00f2ff' : 'rgba(0,180,180,0.2)',
                boxShadow: currentStep === step.id ? '0 0 8px rgba(0,242,255,0.5)' : 'none',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
