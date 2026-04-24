import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Wind, Thermometer, Droplets, Navigation } from 'lucide-react';
import { cn } from '../../utils/cn';

interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
  forecast: { day: string; temp: number; icon: any }[];
}

export const WeatherWidget: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          // Default to Tunis coordinates
          const lat = 36.8065;
          const lon = 10.1815;
          
          const targetUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`;
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
          
          const res = await fetch(proxyUrl);
          if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
          const data = await res.json();
          
          const current = data.current_weather;
          
          // Map WMO code to condition string and icon
          const getCondition = (code: number) => {
            if (code === 0) return { label: 'Clear', icon: Sun };
            if (code <= 3) return { label: 'Partly Cloudy', icon: Cloud };
            if (code <= 48) return { label: 'Foggy', icon: Cloud };
            if (code <= 67) return { label: 'Rainy', icon: CloudRain };
            if (code <= 77) return { label: 'Snowy', icon: Cloud };
            if (code <= 82) return { label: 'Showers', icon: CloudRain };
            if (code <= 99) return { label: 'Stormy', icon: CloudLightning };
            return { label: 'Unknown', icon: Cloud };
          };

          const condition = getCondition(current.weathercode);

          setWeather({
            temp: Math.round(current.temperature),
            condition: condition.label,
            humidity: data.hourly.relativehumidity_2m[0],
            windSpeed: current.windspeed,
            location: 'Tunis, TN',
            forecast: [
              { day: 'MON', temp: 22, icon: Sun },
              { day: 'TUE', temp: 21, icon: Cloud },
              { day: 'WED', temp: 19, icon: CloudRain },
              { day: 'THU', temp: 23, icon: Sun },
            ]
          });
          setLoading(false);
          return; // Success
        } catch (error) {
          console.error(`Weather fetch attempt ${i + 1} failed:`, error);
          if (i < retries) {
            await new Promise(r => setTimeout(r, 2000));
          }
        }
      }
      setLoading(false);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000); // 30 mins
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass p-4 rounded-lg border border-intel-border animate-pulse flex items-center justify-center h-32">
        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Syncing Weather Satellites...</span>
      </div>
    );
  }

  if (!weather) return null;

  const ConditionIcon = weather.condition === 'Clear' ? Sun : 
                        weather.condition === 'Rainy' ? CloudRain :
                        weather.condition === 'Stormy' ? CloudLightning : Cloud;

  return (
    <div className={cn(
      "glass rounded-lg border border-intel-border overflow-hidden flex flex-col",
      compact ? "p-3 space-y-3" : "p-4 space-y-4"
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="w-3 h-3 text-intel-cyan" />
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Meteorological Intel</h3>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 rounded-full bg-intel-green animate-pulse" />
          <span className="text-[8px] font-mono text-intel-green uppercase">Live Sat</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <ConditionIcon className={cn("text-intel-cyan", compact ? "w-8 h-8" : "w-12 h-12")} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-intel-cyan/20 rounded-full blur-sm" />
          </div>
          <div>
            <div className={cn("font-bold text-white font-mono leading-none", compact ? "text-2xl" : "text-4xl")}>
              {weather.temp}°C
            </div>
            <div className="text-[10px] font-mono text-intel-cyan uppercase tracking-widest mt-1">
              {weather.condition}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-white uppercase">{weather.location}</div>
          <div className="text-[8px] font-mono text-slate-500 uppercase mt-0.5">36.8065°N 10.1815°E</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5">
        <div className="flex flex-col items-center">
          <Wind className="w-3 h-3 text-slate-500 mb-1" />
          <span className="text-[8px] font-mono text-slate-500 uppercase">Wind</span>
          <span className="text-[10px] font-bold text-white font-mono">{weather.windSpeed} km/h</span>
        </div>
        <div className="flex flex-col items-center border-x border-white/5">
          <Droplets className="w-3 h-3 text-slate-500 mb-1" />
          <span className="text-[8px] font-mono text-slate-500 uppercase">Humid</span>
          <span className="text-[10px] font-bold text-white font-mono">{weather.humidity}%</span>
        </div>
        <div className="flex flex-col items-center">
          <Navigation className="w-3 h-3 text-slate-500 mb-1" />
          <span className="text-[8px] font-mono text-slate-500 uppercase">Visib</span>
          <span className="text-[10px] font-bold text-white font-mono">10 km</span>
        </div>
      </div>

      {!compact && (
        <div className="space-y-3">
          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">72H Tactical Forecast</div>
          <div className="grid grid-cols-4 gap-2">
            {weather.forecast.map((f, i) => (
              <div key={`forecast-${f.day}-${i}`} className="p-2 bg-white/5 rounded border border-white/5 flex flex-col items-center space-y-1">
                <span className="text-[8px] font-mono text-slate-500">{f.day}</span>
                <f.icon className="w-3 h-3 text-intel-cyan" />
                <span className="text-[10px] font-bold text-white font-mono">{f.temp}°</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-2 flex items-center justify-between opacity-50">
        <div className="flex items-center space-x-1">
          <Thermometer className="w-2 h-2 text-slate-500" />
          <span className="text-[7px] font-mono text-slate-500 uppercase">Ground Temp: {weather.temp + 2}°C</span>
        </div>
        <span className="text-[7px] font-mono text-slate-500 uppercase">Source: Open-Meteo</span>
      </div>
    </div>
  );
};
