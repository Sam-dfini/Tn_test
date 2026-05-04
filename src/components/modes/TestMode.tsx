import React, { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { ArrowLeft } from 'lucide-react';

interface TestModeProps {
  onGoHome: () => void;
}

export const TestMode: React.FC<TestModeProps> = ({ onGoHome }) => {
  const [init, setInit] = useState(false);

  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: any) => {
    // Removed console.log of container to avoid circular structure error
  };

  const options = {
    fpsLimit: 120,
    background: {
      color: "#0d1b2a"
    },
    detectRetina: true,
    fullScreen: { enable: false },
    particles: {
      number: {
        value: 80,
        density: { enable: true, area: 800 }
      },
      color: {
        value: "#00ffff"
      },
      shape: {
        type: "triangle"
      },
      stroke: {
        enable: true,
        color: "#00ffff",
        width: 1
      },
      opacity: {
        value: 0.8,
        random: true,
        animation: {
          enable: true, speed: 0.5, minimumValue: 0.1, sync: false
        }
      },
      size: {
        value: 5,
        random: true
      },
      move: {
        enable: true,
        speed: 1.5,
        direction: "none" as const,
        random: false,
        straight: false,
        outModes: {
          default: "out" as const
        },
      },
      links: {
        enable: true,
        distance: 120,
        color: "#00ffff",
        opacity: 0.4,
        width: 1,
        triangles: {
          enable: false
        }
      }
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "grab"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 180,
          links: {
            opacity: 0.8
          }
        }
      }
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {init && (
        <Particles
          id="tsparticles"
          className="absolute inset-0"
          particlesLoaded={particlesLoaded}
          options={options as any}
        />
      )}
      
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <button
          onClick={onGoHome}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-intel-bg/80 border border-intel-cyan/30 text-intel-cyan rounded-md hover:bg-intel-cyan/10 transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Test Mode</span>
        </button>
        
        <div className="pointer-events-auto text-right">
          <h1 className="text-2xl font-bold text-intel-cyan tracking-tighter uppercase">Plexus Triangle Network</h1>
          <p className="text-slate-400 text-sm font-mono">EXPERIMENTAL VISUALIZATION MODE</p>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <div className="px-6 py-3 bg-black/40 border border-white/10 rounded-full backdrop-blur-md">
          <p className="text-white/60 text-sm">Interactive Particle Mesh Engine Active</p>
        </div>
      </div>
    </div>
  );
};
