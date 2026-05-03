import React, { useMemo } from 'react';
import { CircleMarker, Tooltip, LayerGroup } from 'react-leaflet';
import { FireData } from '../../types/intel';
import { cn } from '../../lib/utils';

interface FireLayerProps {
  fires: FireData[];
  showHeatmap?: boolean;
}

export const FireLayer: React.FC<FireLayerProps> = ({ fires, showHeatmap = false }) => {
  const processedFires = useMemo(() => {
    const now = new Date().getTime();
    
    return fires.map(fire => {
      // 1. Temporal Decay (0-1, where 1 is brand new)
      const ageInMs = now - fire.date.getTime();
      const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
      const decay = Math.max(0.2, 1 - (ageInDays / 30)); // 30 day decay window
      
      // 2. Color calculation (Yellow -> Orange -> Red)
      // brightness typically ranges 300 - 500
      const intensityNorm = Math.min(1, (fire.intensity - 300) / 200);
      let color = '#ffeb3b'; // Yellow
      if (intensityNorm > 0.4) color = '#ff9800'; // Orange
      if (intensityNorm > 0.8) color = '#f44336'; // Red
      
      // 3. Size proportional to brightness
      const size = 3 + (intensityNorm * 5) * decay;
      
      // 4. Opacity based on confidence
      let baseOpacity = 0.6;
      if (fire.confidence === 'high') baseOpacity = 0.9;
      if (fire.confidence === 'low') baseOpacity = 0.3;
      
      const finalOpacity = baseOpacity * decay;
      
      return {
        ...fire,
        visuals: {
          color,
          size,
          opacity: finalOpacity,
          decay
        }
      };
    });
  }, [fires]);

  // Performance Optimization: If thousands of points, use a optimized rendering
  // But for ~1000 CircleMarkers, react-leaflet performs okay.
  
  return (
    <LayerGroup>
      {processedFires.map((fire, idx) => (
        <CircleMarker
          key={`fire-${idx}-${fire.lat}-${fire.lon}`}
          center={[fire.lat, fire.lon]}
          radius={fire.visuals.size}
          pathOptions={{
            fillColor: fire.visuals.color,
            fillOpacity: fire.visuals.opacity,
            color: fire.visuals.color,
            weight: 1,
            opacity: fire.visuals.opacity * 0.5,
            className: 'fire-glow-marker'
          }}
        >
          <Tooltip direction="top" offset={[0, -5]} opacity={1}>
            <div className="bg-slate-900 border border-intel-cyan/30 p-2 rounded text-[10px] font-mono text-white min-w-[120px]">
              <div className="flex items-center justify-between mb-1 border-b border-white/10 pb-1">
                <span className="text-intel-orange font-bold uppercase tracking-tighter flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-intel-red mr-1 animate-pulse"></span>
                  Thermal Anomaly
                </span>
                <span className="text-slate-400 capitalize">{fire.confidence}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Intensity (K):</span>
                  <span className="text-white">{fire.intensity.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-white">{fire.date.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Decay Index:</span>
                  <span className="text-white">{(fire.visuals.decay * 100).toFixed(0)}% Signal</span>
                </div>
              </div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
      
      <style>{`
        .fire-glow-marker {
          filter: blur(2px) brightness(1.5);
          transition: opacity 0.3s ease;
        }
      `}</style>
    </LayerGroup>
  );
};
