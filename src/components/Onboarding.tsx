import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Zap, Map, ShieldAlert, BarChart3, Users } from 'lucide-react';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Intelligence Map",
    description: "Real-time geospatial visualization of political and security incidents across Tunisia.",
    icon: <Map className="w-8 h-8" />,
    color: "text-intel-cyan"
  },
  {
    title: "Regime Resilience Index",
    description: "Our proprietary RRI model quantifies stability using selectorate theory and real-time data.",
    icon: <ShieldAlert className="w-8 h-8" />,
    color: "text-intel-red"
  },
  {
    title: "Economic Monitoring",
    description: "Track macro indicators, inflation drivers, and debt service calendars in real-time.",
    icon: <BarChart3 className="w-8 h-8" />,
    color: "text-intel-orange"
  },
  {
    title: "Actor Network",
    description: "Monitor key political figures, their influence scores, and defection risks.",
    icon: <Users className="w-8 h-8" />,
    color: "text-intel-purple"
  },
  {
    title: "AI Analyst",
    description: "Ask natural language questions to our AI, grounded in the platform's live intelligence data.",
    icon: <Zap className="w-8 h-8" />,
    color: "text-intel-cyan"
  }
];

export const Onboarding: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-intel-bg/90 backdrop-blur-xl p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-intel-card border border-intel-border rounded-3xl overflow-hidden shadow-2xl relative"
      >
        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-12 text-center space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-white/5 flex items-center justify-center border border-intel-border ${steps[currentStep].color}`}>
                {steps[currentStep].icon}
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white uppercase tracking-widest">
                  {steps[currentStep].title}
                </h2>
                <p className="text-slate-400 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center space-x-2">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-8 bg-intel-cyan' : 'w-2 bg-intel-border'
                }`}
              ></div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button 
              onClick={prev}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 text-xs font-mono text-slate-500 hover:text-white transition-colors disabled:opacity-0"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button 
              onClick={next}
              className="flex items-center space-x-2 bg-intel-cyan text-intel-bg px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:glow-cyan transition-all"
            >
              <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
