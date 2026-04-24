import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning } from 'lucide-react';

export const WeatherMini: React.FC = () => {
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number>(0);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const targetUrl = 'https://api.open-meteo.com/v1/forecast?latitude=36.8065&longitude=10.1815&current_weather=true';
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
        const res = await fetch(proxyUrl);
        const data = await res.json();
        setTemp(Math.round(data.current_weather.temperature));
        setCode(data.current_weather.weathercode);
      } catch (error) {
        console.error('Weather fetch failed', error);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000);
    return () => clearInterval(interval);
  }, []);

  if (temp === null) return null;

  const getIcon = (c: number) => {
    if (c === 0) return <Sun className="w-3.5 h-3.5 text-intel-cyan" />;
    if (c <= 3) return <Cloud className="w-3.5 h-3.5 text-intel-cyan" />;
    if (c <= 82) return <CloudRain className="w-3.5 h-3.5 text-intel-cyan" />;
    return <CloudLightning className="w-3.5 h-3.5 text-intel-cyan" />;
  };

  return (
    <div className="flex items-center space-x-2 bg-white/5 border border-intel-border/30 px-2 py-1 rounded-lg">
      {getIcon(code)}
      <span className="text-[10px] font-mono font-bold text-white">{temp}°C</span>
    </div>
  );
};
