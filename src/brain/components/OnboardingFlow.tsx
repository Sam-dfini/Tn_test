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
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      color: 'white',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '600px', textAlign: 'center' }}>
        <h2 style={{ color: '#a78bfa', marginBottom: '20px' }}>{onboardingSteps[currentStep - 1].title}</h2>
        <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '30px' }}>
          {onboardingSteps[currentStep - 1].description}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
          <button
            onClick={handleSkip}
            style={{ padding: '10px 20px', background: 'transparent', color: 'white', border: '1px solid #4f46e5', borderRadius: '4px', cursor: 'pointer' }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {currentStep === onboardingSteps.length ? 'Finish' : 'Next'}
          </button>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: currentStep >= step.id ? '#4f46e5' : '#374151',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
