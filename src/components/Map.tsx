import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Governorate, IntelEvent } from '../types/intel';
import { cn } from '../utils/cn';

// Fix for default marker icons in Leaflet with React
const icon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
  governorates: Governorate[];
  events: IntelEvent[];
  activeLayer: string;
  heatmapPoints?: { lat: number; lon: number; intensity: number; label?: string; risk?: string }[];
}

export const Map: React.FC<MapProps> = ({ governorates, events, activeLayer, heatmapPoints }) => {
  const tunisiaCenter: [number, number] = [33.8869, 9.5375];
  const zoom = 6;

  const getGovStyle = (feature: any) => {
    const govId = feature.properties.id;
    const gov = governorates.find(g => g.id === govId);
    
    if (!gov) return { fillColor: '#1a222d', weight: 1, color: '#334155', fillOpacity: 0.2 };

    let color = '#00f2ff'; // Default cyan
    if (gov.risk_level === 'ALERT') color = '#ff3b3b';
    else if (gov.risk_level === 'HIGH') color = '#ff9f00';
    else if (gov.risk_level === 'MEDIUM') color = '#bf00ff';

    return {
      fillColor: color,
      weight: 1,
      opacity: 1,
      color: '#334155',
      fillOpacity: 0.3,
    };
  };

  return (
    <div className="h-full w-full flex flex-col space-y-4">
      <div className="flex-1 w-full rounded-2xl overflow-hidden border border-intel-border relative group">
        <MapContainer 
          center={tunisiaCenter} 
          zoom={zoom} 
          style={{ height: '100%', width: '100%', background: '#05070a' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Heatmap Layer Simulation */}
          {heatmapPoints?.map((point, i) => (
            <React.Fragment key={`heat-${i}`}>
              <Marker 
                position={[point.lat, point.lon]}
                icon={L.divIcon({
                  className: 'heatmap-icon',
                  html: `<div class="relative">
                          <div class="absolute inset-0 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-intel-red opacity-[0.15] blur-xl animate-pulse"></div>
                          <div class="absolute inset-0 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-intel-red opacity-[0.2] blur-lg"></div>
                          <div class="w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-intel-red shadow-[0_0_10px_#ef4444]"></div>
                        </div>`,
                  iconSize: [0, 0],
                })}
              >
                <Popup className="intel-popup">
                  <div className="p-2 min-w-[150px] bg-intel-card text-slate-300 border border-intel-border rounded-lg shadow-2xl">
                    <div className="text-[8px] font-mono text-intel-red uppercase font-bold mb-1">Vulnerability Alert</div>
                    <h4 className="text-xs font-bold text-white uppercase mb-1">{point.label}</h4>
                    <div className="text-[10px] text-slate-400">Risk Factor: <span className="text-intel-orange">{point.risk}</span></div>
                    <div className="text-[10px] text-slate-400">Intensity: <span className="text-intel-red font-bold">{(point.intensity * 100).toFixed(0)}%</span></div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* We would normally load real GeoJSON here. For now, we'll use markers for events */}
          {(events || []).filter(e => e.lat != null && e.lon != null).map(event => (
            <Marker 
              key={event.id} 
              position={[event.lat, event.lon]}
              icon={L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="relative">
                        <div class="absolute inset-0 w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full ${event.urgent ? 'bg-intel-red animate-ping opacity-40' : 'bg-intel-cyan opacity-20'}"></div>
                        <div class="w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${event.urgent ? 'bg-intel-red' : 'bg-intel-cyan'}"></div>
                      </div>`,
                iconSize: [0, 0],
              })}
            >
              <Popup className="intel-popup">
                <div className="p-2 min-w-[200px] bg-intel-card text-slate-300 border border-intel-border rounded-lg shadow-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[8px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border",
                      event.urgent ? "bg-intel-red/10 text-intel-red border-intel-red/20" : "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
                    )}>
                      {event.type}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">{event.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase mb-1">{event.title}</h4>
                  <p className="text-[10px] leading-relaxed text-slate-400 line-clamp-3">{event.summary}</p>
                  <div className="mt-2 pt-2 border-t border-intel-border flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate-500 uppercase">Source: {event.source}</span>
                    <button className="text-[8px] font-mono text-intel-cyan uppercase font-bold hover:underline">View Case</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay UI */}
        <div className="absolute top-6 left-6 z-[1000] hidden md:flex flex-col space-y-2">
          <div className="glass px-4 py-2 rounded-lg flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Active Layer</span>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">{activeLayer} Intelligence</span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Legend Below Map */}
      <div className="glass p-3 rounded-xl border border-intel-border flex items-center justify-center space-x-6">
        <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest border-r border-intel-border pr-6 mr-2 hidden sm:block">Risk Legend</div>
        {[
          { label: 'Alert', color: 'bg-intel-red' },
          { label: 'High', color: 'bg-intel-orange' },
          { label: 'Medium', color: 'bg-intel-purple' },
          { label: 'Stable', color: 'bg-intel-green' },
        ].map(item => (
          <div key={item.label} className="flex items-center space-x-2">
            <div className={cn("w-2 h-2 rounded-full", item.color)}></div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
