import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Maximize2, Minimize2, Navigation, Target, 
  Crosshair, ShieldAlert, Grid3X3, MapPin, 
  Activity, Layers 
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Governorate, IntelEvent, RiskLevel } from '../../types/intel';

interface TacticalMapProps {
  governorates: Governorate[];
  events: IntelEvent[];
  onGeofenceBreach?: (alert: any) => void;
}

const GEOFENCES = [
  { id: 'gf1', name: 'SFAX_PORT_SECTOR', lat: 34.74, lon: 10.76, radius: 5000, color: '#ff3b3b' },
  { id: 'gf2', name: 'TUNIS_GOV_CENTER', lat: 36.80, lon: 10.17, radius: 3000, color: '#f59e0b' },
  { id: 'gf3', name: 'GAFSA_MINING_HUB', lat: 34.42, lon: 8.78, radius: 8000, color: '#ff3b3b' }
];

export const TacticalMap: React.FC<TacticalMapProps> = ({ governorates, events, onGeofenceBreach }) => {
  const tunisiaCenter: [number, number] = [33.8869, 9.5375];
  const zoom = 7;

  const [layers, setLayers] = useState({
    grid: true,
    events: true,
    riskZones: true,
    scanning: true,
    geofences: true
  });

  const [breachedEvents, setBreachedEvents] = useState<Set<string>>(new Set());
  const [recentBreaches, setRecentBreaches] = useState<Set<string>>(new Set());
  const alertedBreaches = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!onGeofenceBreach) return;

    const newBreaches = new Set<string>();
    
    events.forEach(event => {
      if (event.lat == null || event.lon == null) return;
      
      GEOFENCES.forEach(gf => {
        const dist = L.latLng(event.lat!, event.lon!).distanceTo(L.latLng(gf.lat, gf.lon));
        if (dist <= gf.radius) {
          const breachId = `${gf.id}-${event.id}`;
          newBreaches.add(event.id);
          
          if (!alertedBreaches.current.has(breachId)) {
            // New breach detected for this specific geofence/event combo
            alertedBreaches.current.add(breachId);
            
            setRecentBreaches(prev => {
              const next = new Set(prev);
              next.add(event.id);
              return next;
            });

            // Remove from recent breaches after 5 seconds
            setTimeout(() => {
              setRecentBreaches(prev => {
                const next = new Set(prev);
                next.delete(event.id);
                return next;
              });
            }, 5000);

            onGeofenceBreach({
              id: `gf-alert-${breachId}-${Date.now()}`, // Make it truly unique
              source: 'GEOFENCE_WATCH',
              time: new Date().toISOString().split('T')[1].slice(0, 5) + 'Z',
              type: 'GEOFENCE_BREACH',
              content: `ALERT: ${event.type} detected within ${gf.name} perimeter. Sector lockdown advised.`,
              urgent: true
            });
          }
        }
      });
    });

    setBreachedEvents(newBreaches);
  }, [events, onGeofenceBreach]);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'ALERT': return '#ff3b3b'; // Intel Red
      case 'HIGH': return '#f59e0b';  // Amber
      case 'MEDIUM': return '#00f2ff'; // Intel Cyan
      case 'LOW': return '#10b981';   // Emerald
      default: return '#00f2ff';
    }
  };

  return (
    <div className="relative h-[600px] bg-[#0a0e14] rounded-lg border border-intel-border overflow-hidden group">
      {/* Animated Red Border for Tunisia Focus */}
      <motion.div 
        animate={{ 
          opacity: [0.2, 0.5, 0.2],
          boxShadow: [
            '0 0 5px rgba(255, 59, 59, 0.1)',
            '0 0 10px rgba(255, 59, 59, 0.4)',
            '0 0 5px rgba(255, 59, 59, 0.1)'
          ]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-0 right-0 h-[1px] bg-intel-red/50 z-40 pointer-events-none"
      />
      
      {/* Tactical Overlay: Grid */}
      {layers.grid && (
        <div className="absolute inset-0 z-10 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>
      )}

      {/* Tactical Overlay: Scanning Line */}
      {layers.scanning && (
        <motion.div 
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[1px] bg-intel-cyan/30 z-20 pointer-events-none"
        />
      )}

      {/* Map Container */}
      <div className="absolute inset-0 z-0">
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
          
          {/* Geofences */}
          {layers.geofences && GEOFENCES.map(gf => (
            <Circle
              key={gf.id}
              center={[gf.lat, gf.lon]}
              radius={gf.radius}
              pathOptions={{
                color: gf.color,
                fillColor: gf.color,
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '5, 10'
              }}
            >
              <Popup className="tactical-popup">
                <div className="p-2 bg-[#0a0e14] text-intel-cyan font-mono text-[8px] uppercase">
                  GEOFENCE: {gf.name}<br/>
                  STATUS: ACTIVE MONITORING
                </div>
              </Popup>
            </Circle>
          ))}
          
          {/* Event Markers */}
          {layers.events && (events || []).filter(e => e.lat != null && e.lon != null).map(event => (
            <Marker 
              key={event.id} 
              position={[event.lat, event.lon]}
              icon={L.divIcon({
                className: 'tactical-icon',
                html: `
                  <div class="relative flex items-center justify-center">
                    <div class="absolute w-8 h-8 border border-intel-cyan/40 rounded-full animate-ping"></div>
                    <div class="absolute w-4 h-4 border border-intel-cyan/60 rounded-full"></div>
                    <div class="w-1.5 h-1.5 rounded-full ${event.urgent ? 'bg-intel-red shadow-[0_0_8px_#ff3b3b]' : 'bg-intel-cyan shadow-[0_0_8px_#00f2ff]'}"></div>
                    ${breachedEvents.has(event.id) ? `<div class="absolute -inset-2 border-2 ${recentBreaches.has(event.id) ? 'border-white scale-125 shadow-[0_0_15px_#fff]' : 'border-intel-red'} rounded-full animate-pulse transition-all duration-500"></div>` : ''}
                    <div class="absolute -top-4 left-4 whitespace-nowrap text-[6px] font-mono ${recentBreaches.has(event.id) ? 'text-white bg-intel-red' : 'text-intel-cyan bg-black/60'} px-1 border border-intel-cyan/20">
                      ${event.type} // ${event.id.slice(0, 4)} ${breachedEvents.has(event.id) ? '// BREACH' : ''}
                    </div>
                  </div>
                `,
                iconSize: [0, 0],
              })}
            >
              <Popup className="tactical-popup">
                <div className="p-3 min-w-[220px] bg-[#0a0e14] text-slate-300 border border-intel-cyan/30 rounded-none shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                  <div className="flex items-center justify-between mb-2 border-b border-intel-cyan/20 pb-1">
                    <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-tighter">
                      SIGNAL DETECTED // {event.type}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">{event.date}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase mb-1 tracking-wide">{event.title}</h4>
                  <p className="text-[9px] leading-tight text-slate-400 font-mono">{event.summary}</p>
                  <div className="mt-2 pt-2 flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <div className={`w-1 h-1 rounded-full ${event.urgent ? 'bg-intel-red' : 'bg-intel-cyan'}`}></div>
                      <span className="text-[7px] font-mono text-slate-500 uppercase">Priority: {event.urgent ? 'Critical' : 'Standard'}</span>
                    </div>
                    <button className="text-[7px] font-mono text-intel-cyan uppercase font-bold hover:bg-intel-cyan/10 px-1 border border-intel-cyan/30 transition-colors">Analyze</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Governorates as tactical circles */}
          {layers.riskZones && governorates.filter(g => g.lat != null && g.lon != null).map(gov => (
            <CircleMarker
              key={gov.id}
              center={[gov.lat, gov.lon]}
              radius={gov.risk_level === 'ALERT' ? 15 : gov.risk_level === 'HIGH' ? 12 : 8}
              pathOptions={{
                fillColor: getRiskColor(gov.risk_level),
                fillOpacity: 0.15,
                color: getRiskColor(gov.risk_level),
                weight: 1,
                dashArray: gov.risk_level === 'ALERT' ? '4, 4' : '2, 2'
              }}
            >
              <Popup className="tactical-popup">
                <div className="p-3 min-w-[180px] bg-[#0a0e14] text-slate-300 border border-intel-cyan/30 rounded-none shadow-[0_0_20px_rgba(0,242,255,0.1)]">
                  <div className="flex items-center justify-between mb-2 border-b border-intel-cyan/20 pb-1">
                    <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-tighter">
                      GOVERNORATE DATA // {gov.id}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white uppercase mb-1 tracking-wide">{gov.name.en}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">RRI Score:</span>
                    <span className={`text-xs font-bold font-mono ${gov.rri_score > 2.5 ? 'text-intel-red' : 'text-intel-cyan'}`}>
                      {gov.rri_score.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Risk Level:</span>
                    <span className={`text-[10px] font-mono uppercase font-bold ${
                      gov.risk_level === 'ALERT' ? 'text-intel-red' : 
                      gov.risk_level === 'HIGH' ? 'text-intel-orange' : 
                      'text-intel-cyan'
                    }`}>
                      {gov.risk_level}
                    </span>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Tactical Overlays: UI Elements */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {/* Corner Brackets */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-intel-cyan/40"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-intel-cyan/40"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-intel-cyan/40"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-intel-cyan/40"></div>

        {/* Crosshair Center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20">
          <Crosshair className="w-12 h-12 text-intel-cyan" />
        </div>

        {/* Side Data Bars */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-1 h-8 bg-intel-cyan/10 rounded-full overflow-hidden">
              <motion.div 
                animate={{ height: ['20%', '80%', '40%', '90%', '30%'] }}
                transition={{ duration: 2 + i, repeat: Infinity }}
                className="w-full bg-intel-cyan/40"
              />
            </div>
          ))}
        </div>

        {/* Top Status Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-8 bg-black/60 backdrop-blur-sm border border-intel-cyan/20 px-4 py-1 rounded-sm">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-intel-cyan animate-pulse"></div>
            <span className="text-[8px] font-mono text-intel-cyan uppercase tracking-widest">Geospatial Sync: Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-3 h-3 text-intel-cyan" />
            <span className="text-[8px] font-mono text-slate-400 uppercase">Focus: Tunisia Sector 01</span>
          </div>
          <div className="text-[8px] font-mono text-slate-500">
            COORD: 33.8869° N, 9.5375° E
          </div>
        </div>
      </div>

      {/* Map Controls (Interactive) */}
      <div className="absolute top-4 right-4 z-40 flex flex-col space-y-3 pointer-events-auto">
        {/* Layer Control Panel */}
        <div className="bg-black/60 backdrop-blur-md border border-intel-cyan/30 p-2 rounded-none shadow-[0_0_15px_rgba(0,242,255,0.1)] min-w-[140px]">
          <div className="flex items-center justify-between mb-2 border-b border-intel-cyan/20 pb-1">
            <div className="flex items-center space-x-1">
              <Layers className="w-3 h-3 text-intel-cyan" />
              <span className="text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-tighter">Layer Control</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-intel-cyan animate-pulse"></div>
          </div>
          
          <div className="space-y-1">
            {[
              { id: 'grid', label: 'Tactical Grid', icon: Grid3X3 },
              { id: 'scanning', label: 'Sweep Scan', icon: Activity },
              { id: 'events', label: 'Intel Signals', icon: MapPin },
              { id: 'riskZones', label: 'Risk Sectors', icon: ShieldAlert },
              { id: 'geofences', label: 'Geofences', icon: Target },
            ].map((layer) => {
              const Icon = layer.icon;
              const isActive = layers[layer.id as keyof typeof layers];
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id as keyof typeof layers)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 transition-all group ${
                    isActive ? 'bg-intel-cyan/10 border border-intel-cyan/30' : 'bg-transparent border border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-3 h-3 ${isActive ? 'text-intel-cyan' : 'text-slate-500'}`} />
                    <span className={`text-[9px] font-mono uppercase tracking-tight ${isActive ? 'text-white font-bold' : 'text-slate-500'}`}>
                      {layer.label}
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-intel-cyan shadow-[0_0_4px_#00f2ff]' : 'bg-slate-800'}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex flex-col space-y-1 bg-black/60 backdrop-blur-sm border border-intel-cyan/20 p-1">
          <button className="w-8 h-8 flex items-center justify-center text-intel-cyan hover:bg-intel-cyan/20 transition-colors border border-transparent hover:border-intel-cyan/30">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-intel-cyan hover:bg-intel-cyan/20 transition-colors border border-transparent hover:border-intel-cyan/30">
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-40 bg-black/60 backdrop-blur-sm border border-intel-cyan/20 p-2 space-y-2 pointer-events-auto">
        <div className="text-[7px] font-mono text-intel-cyan uppercase border-b border-intel-cyan/20 pb-1 mb-1">Tactical Legend</div>
        {[
          { color: 'bg-intel-red', label: 'Critical Incident' },
          { color: 'bg-intel-cyan', label: 'Standard Event' },
          { color: 'bg-intel-orange', label: 'High Risk Zone' },
        ].map(item => (
          <div key={item.label} className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
            <span className="text-[7px] font-mono text-slate-400 uppercase">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

