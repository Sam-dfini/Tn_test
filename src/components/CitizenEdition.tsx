import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Zap, 
  Droplets, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Volume2, 
  VolumeX,
  Flame,
  Users,
  Smile,
  Frown,
  DollarSign,
  Activity,
  Navigation,
  Clock,
  Globe,
  Languages,
  Download,
  Home
} from 'lucide-react';
import { Map } from './Map';
import { Governorate, IntelEvent } from '../types/intel';
import { getRiskTier } from '../utils/rriEngine';

interface CitizenEditionProps {
  governorates: Governorate[];
  events: IntelEvent[];
  rri: number;
  pRev: number;
  onOpenAI: () => void;
  onGoHome: () => void;
  data: any;
}

const GaugeWidget = ({ 
  label, 
  value, 
  min = 0, 
  max = 100, 
  unit = '%', 
  icon: Icon, 
  color = 'text-intel-cyan',
  description
}: { 
  label: string; 
  value: number; 
  min?: number; 
  max?: number; 
  unit?: string; 
  icon: any; 
  color?: string;
  description?: string;
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = (percentage / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="glass p-6 rounded-3xl border border-intel-border flex flex-col items-center justify-center relative overflow-hidden group hover:border-intel-cyan/30 transition-all">
      <div className="absolute top-4 left-4">
        <Icon className={`w-5 h-5 ${color} opacity-50`} />
      </div>
      
      <div className="relative w-32 h-16 mt-4 overflow-hidden">
        {/* Gauge Background */}
        <div className="absolute top-0 left-0 w-32 h-32 border-[12px] border-white/5 rounded-full"></div>
        {/* Gauge Active Fill */}
        <div 
          className={`absolute top-0 left-0 w-32 h-32 border-[12px] border-current rounded-full ${color} opacity-20`}
          style={{ 
            clipPath: `polygon(50% 50%, -50% -50%, ${percentage > 50 ? '150% -50%' : '50% -50%'}, ${percentage > 50 ? '150% 150%' : '150% 50%'}, 50% 50%)`,
            transform: 'rotate(-90deg)'
          }}
        ></div>
        
        {/* Needle */}
        <motion.div 
          className="absolute bottom-0 left-1/2 w-1 h-14 bg-white origin-bottom -translate-x-1/2 rounded-full z-10"
          initial={{ rotate: -90 }}
          animate={{ rotate: rotation }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
        </motion.div>
        
        {/* Center Point */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-intel-bg border-2 border-white rounded-full z-20"></div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-bold text-white font-mono">
          {value.toFixed(1)}{unit}
        </div>
        {description && (
          <div className="text-[8px] font-mono text-slate-600 uppercase mt-1 max-w-[120px] mx-auto leading-tight">
            {description}
          </div>
        )}
      </div>
    </div>
  );
};

export const CitizenEdition: React.FC<CitizenEditionProps> = ({ governorates, events, rri, pRev, onOpenAI, onGoHome, data }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentLang, setCurrentLang] = useState<'ar' | 'fr' | 'en'>('en');
  
  const newsItems = [
    { 
      ar: "احتجاجات في صفاقس بسبب انقطاع المياه المتكرر", 
      fr: "Protestations à Sfax suite aux coupures d'eau répétées", 
      en: "Protests in Sfax following repeated water cuts",
      impact: "HIGH"
    },
    { 
      ar: "ارتفاع أسعار المواد الأساسية يثير قلق المواطنين", 
      fr: "La hausse des prix des produits de base inquiète les citoyens", 
      en: "Rising basic commodity prices worry citizens",
      impact: "CRITICAL"
    },
    { 
      ar: "هدوء حذر في العاصمة تونس بعد مسيرة ليلية", 
      fr: "Calme précaire à Tunis après une marche nocturne", 
      en: "Cautious calm in Tunis after a night march",
      impact: "MEDIUM"
    },
    { 
      ar: "تحسن طفيف في احتياطي العملة الصعبة", 
      fr: "Légère amélioration des réserves de change", 
      en: "Slight improvement in foreign exchange reserves",
      impact: "GOOD"
    }
  ];

  const speakSummary = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const summary = {
      en: `Current Situation Summary: Revolution risk is at ${(pRev * 100).toFixed(1)} percent. Public safety is stable but price strikes are increasing. Water security remains critical in central regions. Overall mood is cautious.`,
      fr: `Résumé de la situation : Le risque de révolution est de ${(pRev * 100).toFixed(1)} pour cent. La sécurité publique est stable mais les grèves sur les prix augmentent. La sécurité hydrique reste critique dans les régions centrales. L'humeur générale est prudente.`,
      ar: `ملخص الوضع الحالي: خطر الثورة بنسبة ${(pRev * 100).toFixed(1)} بالمائة. الأمن العام مستقر لكن الإضرابات عن الأسعار في تزايد. الأمن المائي لا يزال حرجاً في المناطق الوسطى. المزاج العام حذر.`
    };

    const utterance = new SpeechSynthesisUtterance(summary[currentLang]);
    utterance.lang = currentLang === 'ar' ? 'ar-SA' : currentLang === 'fr' ? 'fr-FR' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const hotSpots = [
    { lat: 34.74, lon: 10.76, intensity: 0.9, label: 'Sfax: Water Protests', risk: 'CRITICAL' },
    { lat: 36.8, lon: 10.18, intensity: 0.7, label: 'Tunis: Price Strike', risk: 'HIGH' },
    { lat: 34.43, lon: 8.78, intensity: 0.8, label: 'Gafsa: Mining Blockade', risk: 'HIGH' },
    { lat: 33.13, lon: 11.21, intensity: 0.6, label: 'Ben Guerdane: Trade Tension', risk: 'MEDIUM' },
  ];

  return (
    <div className="min-h-screen bg-intel-bg text-slate-300 p-4 md:p-8 space-y-8 pb-48">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-intel-cyan">
            <div className="w-2 h-2 bg-intel-cyan rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Citizen Edition // Live Status</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">TUNISIA <span className="text-intel-cyan">INTEL</span></h1>
          <p className="text-slate-500 text-xs uppercase font-mono tracking-wider italic">"Quick. Clear. No noise."</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {(['en', 'fr', 'ar'] as const).map(lang => (
              <button 
                key={lang}
                onClick={() => setCurrentLang(lang)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all ${
                  currentLang === lang ? 'bg-intel-cyan text-intel-bg' : 'text-slate-500 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          
          <button 
            onClick={speakSummary}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all ${
              isSpeaking 
                ? 'bg-intel-red/10 border-intel-red/40 text-intel-red glow-red' 
                : 'bg-intel-cyan/10 border-intel-cyan/40 text-intel-cyan glow-cyan'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isSpeaking ? 'Stop Audio' : 'Voice Summary'}
            </span>
          </button>

          <button 
            onClick={onGoHome}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/40 transition-all"
            title="Go to Home Screen"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
          </button>

          <button 
            onClick={onOpenAI}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl border bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/40 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">AI Analyst</span>
          </button>

          <button 
            onClick={() => {
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `tunisiaintel_export_${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="p-2 rounded-xl border bg-intel-card border-intel-border text-slate-500 hover:text-intel-cyan hover:border-intel-cyan/40 transition-all"
            title="Export Intel Data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Map Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-intel-cyan" />
              <h3 className="text-xs font-bold text-white uppercase tracking-widest">Hot Spots Today</h3>
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase">Updated 2m ago</div>
          </div>
          <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-intel-border relative group">
            <Map 
              governorates={governorates} 
              events={events} 
              activeLayer="Citizen" 
              heatmapPoints={hotSpots}
            />
            {/* Quick Map Legend Overlay */}
            <div className="absolute bottom-6 right-6 z-[1000] glass p-4 rounded-2xl border border-intel-border space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-intel-red animate-pulse"></div>
                <span className="text-[10px] font-mono text-white uppercase">Critical Alert</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-intel-orange"></div>
                <span className="text-[10px] font-mono text-white uppercase">High Tension</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gauges Section */}
        <div className="grid grid-cols-2 gap-4">
          <GaugeWidget 
            label="Revolution Risk" 
            value={pRev * 100} 
            icon={Flame} 
            color="text-intel-red"
            description="Probability of major unrest"
          />
          <GaugeWidget 
            label="Youth Mood" 
            value={42.5} 
            icon={Smile} 
            color="text-intel-orange"
            description="Happiness & optimism index"
          />
          <GaugeWidget 
            label="Water & Power" 
            value={68.2} 
            icon={Droplets} 
            color="text-intel-cyan"
            description="Supply stability across regions"
          />
          <GaugeWidget 
            label="Price Pressure" 
            value={84.1} 
            icon={DollarSign} 
            color="text-intel-red"
            description="Inflation & shortage impact"
          />
          <GaugeWidget 
            label="Public Safety" 
            value={72.4} 
            icon={ShieldAlert} 
            color="text-intel-green"
            description="Security & crime monitoring"
          />
          <GaugeWidget 
            label="Money Reserves" 
            value={35.8} 
            icon={Activity} 
            color="text-intel-orange"
            description="National forex & gold status"
          />
        </div>
      </div>

      {/* Multilingual News Ticker */}
      <div className="fixed bottom-16 left-0 right-0 bg-intel-bg/95 backdrop-blur-xl border-t border-intel-border py-4 overflow-hidden z-[100]">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...newsItems, ...newsItems].map((item, i) => (
            <div key={i} className="flex items-center space-x-12 mx-12">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  item.impact === 'CRITICAL' ? 'bg-intel-red' : 
                  item.impact === 'HIGH' ? 'bg-intel-orange' : 'bg-intel-cyan'
                } animate-pulse`} />
                
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white tracking-tight">{item[currentLang]}</span>
                  <div className="flex items-center space-x-4 text-[8px] font-mono text-slate-500 uppercase">
                    <span>{item.en}</span>
                    <span>•</span>
                    <span>{item.fr}</span>
                    <span>•</span>
                    <span className="font-arabic">{item.ar}</span>
                  </div>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
