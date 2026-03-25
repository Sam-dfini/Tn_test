import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, Navigation, Target, 
  Crosshair, AlertTriangle, Grid3X3, MapPin, 
  Activity, Layers, X, ChevronRight, BarChart3, Users,
  Droplets, Wifi, DollarSign, Heart,
  GraduationCap, Eye, TrendingUp,
  AlertTriangle as WarningIcon, Flame, Globe, Search
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Circle, Polyline, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Governorate, IntelEvent, RiskLevel } from '../../types/intel';
import { usePipeline } from '../../context/PipelineContext';
import { cn } from '../../utils/cn';

interface TacticalMapProps {
  governorates: Governorate[];
  events: IntelEvent[];
  onGeofenceBreach?: (alert: any) => void;
  activeRegion?: string;
}

const GEOFENCES = [
  { id:'gf1', name:'SFAX_PORT_SECTOR', lat:34.74, lon:10.76, radius:5000, color:'#ff3b3b', desc:'Primary migration departure zone. Coast Guard active.' },
  { id:'gf2', name:'TUNIS_GOV_CENTER', lat:36.80, lon:10.17, radius:3000, color:'#f59e0b', desc:'Presidential palace and government district.' },
  { id:'gf3', name:'GAFSA_CPG_HUB', lat:34.33, lon:8.40, radius:8000, color:'#ff3b3b', desc:'CPG phosphate mining zone. Labor unrest active.' },
  { id:'gf4', name:'KASSERINE_BORDER', lat:35.10, lon:8.50, radius:10000, color:'#ff9f0a', desc:'Interior border region. High cascade risk.' },
  { id:'gf5', name:'GABES_CHEMICAL', lat:33.88, lon:10.10, radius:6000, color:'#ff9f0a', desc:'Industrial chemical complex. Environmental protest zone.' },
  { id:'gf6', name:'BIZERTE_PORT', lat:37.27, lon:9.87, radius:4000, color:'#0a84ff', desc:'Strategic northern port. Naval base proximity.' },
  { id:'gf7', name:'KAIROUAN_RELIGIOUS', lat:35.68, lon:10.10, radius:5000, color:'#bf5af2', desc:'Religious significance. Historical protest mobilization.' },
  { id:'gf8', name:'LIBYA_BORDER_ZONE', lat:32.50, lon:11.50, radius:15000, color:'#ff3b3b', desc:'Libya border. Armed group monitoring zone.' },
];

const REGION_GOVS: Record<string, string[]> = {
  'National': [],
  'North': ['tunis','ariana','ben_arous','manouba','bizerte','beja','jendouba','siliana','zaghouan','nabeul'],
  'Sahel': ['sousse','monastir','mahdia','sfax'],
  'Central': ['kairouan','kasserine','sidi_bouzid'],
  'South': ['gabes','medenine','tataouine','sfax_sud','tozeur','kebili','gafsa'],
  'Borders': ['jendouba','beja','kasserine','gafsa','tozeur','kebili','tataouine'],
};

const MapController: React.FC<{ region: string }> = ({ region }) => {
  const map = useMap();
  const REGION_CENTERS: Record<string, [number, number]> = {
    'National': [33.8869, 9.5375],
    'North': [36.8, 9.8],
    'Sahel': [35.5, 10.5],
    'Central': [35.2, 9.2],
    'South': [33.5, 9.5],
    'Borders': [34.5, 9.0],
  };
  const REGION_ZOOM: Record<string, number> = {
    'National': 7,
    'North': 8,
    'Sahel': 8,
    'Central': 8,
    'South': 7,
    'Borders': 7,
  };
  useEffect(() => {
    const center = REGION_CENTERS[region] || [33.8869, 9.5375];
    const zoom = REGION_ZOOM[region] || 7;
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [region, map]);
  return null;
};

const CASCADE_PATHS = [
  {
    id: 'c1',
    from: [34.74, 10.76], // Sfax
    to: [35.17, 8.83],    // Kasserine
    probability: 0.71,
    label: 'Sfax → Kasserine'
  },
  {
    id: 'c2',
    from: [34.74, 10.76], // Sfax
    to: [34.43, 8.78],    // Gafsa
    probability: 0.58,
    label: 'Sfax → Gafsa'
  },
  {
    id: 'c3',
    from: [35.17, 8.83],  // Kasserine
    to: [35.04, 9.48],    // Sidi Bouzid
    probability: 0.52,
    label: 'Kasserine → Sidi Bouzid'
  },
  {
    id: 'c4',
    from: [35.68, 10.10], // Kairouan
    to: [35.17, 8.83],    // Kasserine
    probability: 0.44,
    label: 'Kairouan → Kasserine'
  },
];

const LAYER_LEGENDS: Record<string, { title: string, items: { color: string, label: string }[] }> = {
  risk: { title: 'RRI Score', items: [
    { color: 'bg-intel-red', label: '> 2.5 Critical' },
    { color: 'bg-intel-orange', label: '2.0-2.5 High' },
    { color: 'bg-yellow-500', label: '1.5-2.0 Medium' },
    { color: 'bg-intel-cyan', label: '< 1.5 Low' },
  ]},
  water: { title: 'Water Availability', items: [
    { color: 'bg-intel-red', label: '< 8h/day Critical' },
    { color: 'bg-intel-orange', label: '8-14h/day Severe' },
    { color: 'bg-yellow-500', label: '14-20h/day Moderate' },
    { color: 'bg-intel-cyan', label: '20-24h/day Normal' },
  ]},
  poverty: { title: 'Poverty Rate', items: [
    { color: 'bg-intel-red', label: '> 30% Extreme' },
    { color: 'bg-intel-orange', label: '20-30% High' },
    { color: 'bg-yellow-500', label: '10-20% Moderate' },
    { color: 'bg-intel-cyan', label: '< 10% Low' },
  ]},
  unemployment: { title: 'Unemployment', items: [
    { color: 'bg-intel-red', label: '> 35%' },
    { color: 'bg-intel-orange', label: '25-35%' },
    { color: 'bg-yellow-500', label: '15-25%' },
    { color: 'bg-intel-cyan', label: '< 15%' },
  ]},
  protests: { title: 'Protest Frequency', items: [
    { color: 'bg-intel-red', label: '> 30/month' },
    { color: 'bg-intel-orange', label: '15-30/month' },
    { color: 'bg-yellow-500', label: '5-15/month' },
    { color: 'bg-intel-cyan', label: '< 5/month' },
  ]},
  migration: { title: 'Migration Attempts', items: [
    { color: 'bg-intel-red', label: '> 10,000/yr' },
    { color: 'bg-intel-orange', label: '3-10k/yr' },
    { color: 'bg-yellow-500', label: '1-3k/yr' },
    { color: 'bg-intel-cyan', label: '< 1k/yr' },
  ]},
  cascade: { title: 'Cascade Risk', items: [
    { color: 'bg-intel-red', label: '> 60%' },
    { color: 'bg-intel-orange', label: '40-60%' },
    { color: 'bg-yellow-500', label: '20-40%' },
    { color: 'bg-intel-cyan', label: '< 20%' },
  ]},
  elections: { title: 'Election Turnout 2023', items: [
    { color: 'bg-intel-red', label: '< 6% (crisis)' },
    { color: 'bg-intel-orange', label: '6-8%' },
    { color: 'bg-yellow-500', label: '8-11%' },
    { color: 'bg-intel-cyan', label: '> 11%' },
  ]},
  security: { title: 'Security Presence', items: [
    { color: 'bg-intel-cyan', label: 'High police presence' },
    { color: 'bg-yellow-500', label: 'Medium presence' },
    { color: 'bg-intel-red', label: 'Low presence (risk)' },
  ]},
  internet: { title: 'Internet Freedom', items: [
    { color: 'bg-intel-red', label: '< 40 (restricted)' },
    { color: 'bg-intel-orange', label: '40-60' },
    { color: 'bg-yellow-500', label: '60-80' },
    { color: 'bg-intel-cyan', label: '> 80 (free)' },
  ]},
};

export const TacticalMap: React.FC<TacticalMapProps> = ({ governorates, events, onGeofenceBreach, activeRegion = 'National' }) => {
  const { data, rriState } = usePipeline();
  const tunisiaCenter: [number, number] = [33.8869, 9.5375];
  const zoom = 7;

  const filteredGovs = React.useMemo(() => 
    activeRegion && activeRegion !== 'National'
      ? governorates.filter(g =>
          REGION_GOVS[activeRegion]?.includes(g.id)
        )
      : governorates,
  [governorates, activeRegion]);

  const filteredEvents = React.useMemo(() => 
    activeRegion && activeRegion !== 'National'
      ? events.filter(e =>
          REGION_GOVS[activeRegion]?.includes(e.gov)
        )
      : events,
  [events, activeRegion]);

  const [layers, setLayers] = useState({
    grid: true,
    events: true,
    riskZones: true,
    scanning: true,
    geofences: true,
    cascade: false,
  });

  const [selectedGov, setSelectedGov] = useState<Governorate | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<IntelEvent | null>(null);
  const [activeLayer, setActiveLayer] = useState<'risk'|'water'|'poverty'|'unemployment'|'protests'|'migration'|'cascade'|'elections'|'security'|'internet'>('risk');
  const [panelOpen, setPanelOpen] = useState(false);

  const [breachedEvents, setBreachedEvents] = useState<Set<string>>(new Set());
  const [recentBreaches, setRecentBreaches] = useState<Set<string>>(new Set());
  const alertedBreaches = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!onGeofenceBreach) return;

    const newBreaches = new Set<string>();
    
    filteredEvents.forEach(event => {
      if (event.lat == null || event.lon == null) return;
      
      GEOFENCES.forEach(gf => {
        const dist = L.latLng(event.lat!, event.lon!).distanceTo(L.latLng(gf.lat, gf.lon));
        if (dist <= gf.radius) {
          const breachId = `${gf.id}-${event.id}`;
          newBreaches.add(event.id);
          
          if (!alertedBreaches.current.has(breachId)) {
            alertedBreaches.current.add(breachId);
            
            setRecentBreaches(prev => {
              const next = new Set(prev);
              next.add(event.id);
              return next;
            });

            setTimeout(() => {
              setRecentBreaches(prev => {
                const next = new Set(prev);
                next.delete(event.id);
                return next;
              });
            }, 5000);

            onGeofenceBreach({
              id: `gf-alert-${breachId}-${Date.now()}`,
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
  }, [filteredEvents, onGeofenceBreach]);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const getLayerValue = (gov: Governorate) => {
    switch(activeLayer) {
      case 'risk':        return gov.rri_score / 3;
      case 'water':       return gov.water_cut_hours / 24;
      case 'poverty':     return gov.poverty_pct / 50;
      case 'unemployment':return gov.unemp / 50;
      case 'protests':    return gov.protest_count / 40;
      case 'migration':   return (gov.migration_attempts_2025 || 0) / 25000;
      case 'cascade':     return gov.cascade_risk || 0;
      case 'elections':   return 1 - ((gov.election_turnout_2023 || 10) / 15);
      case 'security':    return gov.police_presence === 'HIGH' ? 0.3
                               : gov.police_presence === 'MEDIUM' ? 0.6 : 0.9;
      case 'internet':    return 1 - (gov.internet_score / 100);
      default:            return 0.5;
    }
  };

  const getLayerColor = (value: number) => {
    if (value > 0.75) return '#ff453a'; // intel-red
    if (value > 0.55) return '#ff9f0a'; // intel-orange
    if (value > 0.35) return '#ffd60a'; // yellow
    return '#00d4ff';                    // intel-cyan
  };

  return (
    <div className="relative h-full w-full bg-[#0a0e14] rounded-lg border border-intel-border overflow-hidden group">
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
      
      {/* Map Container */}
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
          <MapController region={activeRegion} />
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
                  STATUS: ACTIVE MONITORING<br/>
                  {gf.desc}
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Cascade Paths */}
          {layers.cascade && CASCADE_PATHS.map(path => (
            <Polyline
              key={path.id}
              positions={[path.from as [number,number], path.to as [number,number]]}
              pathOptions={{
                color: path.probability > 0.6 ? '#ff453a' : '#ff9f0a',
                weight: path.probability * 4,
                opacity: 0.7,
                dashArray: '8, 4'
              }}
            >
              <LeafletTooltip>
                <div className="bg-[#0a0e14] text-intel-cyan font-mono text-[9px] p-2 border border-intel-cyan/30">
                  {path.label}<br/>
                  Cascade P: {(path.probability*100).toFixed(0)}%
                </div>
              </LeafletTooltip>
            </Polyline>
          ))}
          
          {/* Event Markers */}
          {layers.events && (filteredEvents || []).filter(e => e.lat != null && e.lon != null).map(event => (
            <Marker 
              key={event.id} 
              position={[event.lat!, event.lon!]}
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
              eventHandlers={{
                click: () => {
                  setSelectedEvent(event);
                }
              }}
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
          {layers.riskZones && filteredGovs.filter(g => g.lat != null && g.lon != null).map(gov => (
            <CircleMarker
              key={gov.id}
              center={[gov.lat!, gov.lon!]}
              radius={8 + (getLayerValue(gov) * 12)}
              pathOptions={{
                fillColor: getLayerColor(getLayerValue(gov)),
                fillOpacity: 0.25,
                color: getLayerColor(getLayerValue(gov)),
                weight: selectedGov?.id === gov.id ? 2 : 1,
              }}
              eventHandlers={{
                click: () => {
                  setSelectedGov(gov);
                  setPanelOpen(true);
                }
              }}
            >
              <LeafletTooltip direction="top" offset={[0, -8]}>
                <div style={{
                  background: '#0a0e14',
                  border: '1px solid rgba(0,212,255,0.3)',
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: '10px',
                  padding: '6px 8px',
                }}>
                  <strong>{gov.name.en}</strong><br/>
                  RRI: {gov.rri_score.toFixed(2)} |
                  Unemp: {gov.unemp}% |
                  Water: {24-gov.water_cut_hours}h/day
                </div>
              </LeafletTooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Tactical Overlays: UI Elements */}
      <div className="absolute inset-0 z-30 pointer-events-none">
        {/* Top Status Bar (Moved to Top Left) */}
        <div className="hidden md:flex absolute top-4 left-4 flex-col space-y-2 bg-black/60 backdrop-blur-sm border border-intel-cyan/20 px-3 py-2 rounded-sm">
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

        {/* Data Layer Selector (Moved back to Top Middle) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1 bg-black/80 backdrop-blur-sm border border-intel-border rounded-none p-1 pointer-events-auto overflow-x-auto scrollbar-hide">
          <div className="flex items-center space-x-1 min-w-max">
            {[
              { id: 'risk', label: 'RRI' },
              { id: 'water', label: 'Water' },
              { id: 'poverty', label: 'Poverty' },
              { id: 'unemployment', label: 'Jobs' },
              { id: 'protests', label: 'Protests' },
              { id: 'migration', label: 'Migration' },
              { id: 'cascade', label: 'Cascade' },
              { id: 'elections', label: 'Elections' },
              { id: 'security', label: 'Security' },
              { id: 'internet', label: 'Internet' },
            ].map(layer => (
              <button
                key={layer.id}
                onClick={() => setActiveLayer(layer.id as any)}
                className={cn(
                  "px-2.5 py-1.5 rounded-none text-[9px] font-mono uppercase tracking-wider transition-all shrink-0",
                  activeLayer === layer.id
                    ? 'bg-intel-cyan/20 text-intel-cyan border border-intel-cyan/30'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corner Brackets - Hidden on mobile */}
        <div className="hidden sm:block absolute top-4 left-4 w-8 h-8 border-t border-l border-intel-cyan/40"></div>
        <div className="hidden sm:block absolute top-4 right-4 w-8 h-8 border-t border-r border-intel-cyan/40"></div>
        <div className="hidden sm:block absolute bottom-4 left-4 w-8 h-8 border-b border-l border-intel-cyan/40"></div>
        <div className="hidden sm:block absolute bottom-4 right-4 w-8 h-8 border-b border-r border-intel-cyan/40"></div>

        {/* Side Data Bars - Hidden on mobile */}
      </div>

      {/* Map Controls (Interactive) */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col space-y-3 pointer-events-auto max-w-[140px] sm:max-w-none">
        {/* Layer Control Panel */}
        <div className="bg-black/60 backdrop-blur-md border border-intel-cyan/30 p-1 sm:p-2 rounded-none shadow-[0_0_15px_rgba(0,242,255,0.1)] min-w-[100px] sm:min-w-[140px]">
          <div className="flex items-center justify-between mb-1 sm:mb-2 border-b border-intel-cyan/20 pb-1">
            <div className="flex items-center space-x-1">
              <Layers className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-intel-cyan" />
              <span className="text-[7px] sm:text-[8px] font-mono text-intel-cyan uppercase font-bold tracking-tighter">Layers</span>
            </div>
          </div>
          
          <div className="space-y-0.5 sm:space-y-1">
            {[
              { id: 'grid', label: 'Grid', icon: Grid3X3 },
              { id: 'scanning', label: 'Scan', icon: Activity },
              { id: 'events', label: 'Intel', icon: MapPin },
              { id: 'riskZones', label: 'Sectors', icon: AlertTriangle },
              { id: 'geofences', label: 'Zones', icon: Target },
              { id: 'cascade', label: 'Paths', icon: TrendingUp },
            ].map((layer) => {
              const Icon = layer.icon;
              const isActive = layers[layer.id as keyof typeof layers];
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id as keyof typeof layers)}
                  className={cn(
                    "w-full flex items-center justify-between px-1.5 py-1 sm:py-1.5 transition-all group",
                    isActive ? 'bg-intel-cyan/10 border border-intel-cyan/30' : 'bg-transparent border border-transparent hover:bg-white/5'
                  )}
                >
                  <div className="flex items-center space-x-1.5">
                    <Icon className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isActive ? 'text-intel-cyan' : 'text-slate-500'}`} />
                    <span className={`text-[8px] sm:text-[9px] font-mono uppercase tracking-tight ${isActive ? 'text-white font-bold' : 'text-slate-500'}`}>
                      {layer.label}
                    </span>
                  </div>
                  <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-intel-cyan shadow-[0_0_4px_#00f2ff]' : 'bg-slate-800'}`}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Controls (Hidden) */}
      </div>

      {/* Legend Overlay - Hidden on mobile */}
      <div className="hidden sm:block absolute bottom-4 left-4 z-40 bg-black/60 backdrop-blur-sm border border-intel-cyan/20 p-2 space-y-2 pointer-events-auto">
        <div className="text-[7px] font-mono text-intel-cyan uppercase border-b border-intel-cyan/20 pb-1 mb-1">
          {LAYER_LEGENDS[activeLayer].title}
        </div>
        {LAYER_LEGENDS[activeLayer].items.map(item => (
          <div key={item.label} className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${item.color}`}></div>
            <span className="text-[7px] font-mono text-slate-400 uppercase">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Governorate Dossier Panel */}
      <AnimatePresence>
        {panelOpen && selectedGov && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[320px] z-50 bg-[#05070a]/98 border-l border-intel-border overflow-y-auto flex flex-col pointer-events-auto"
          >
            {/* Panel Header */}
            <div className="sticky top-0 bg-[#05070a] border-b border-intel-border p-4 flex items-center justify-between z-10">
              <div className="space-y-0.5">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                  GOVERNORATE DOSSIER // {selectedGov.id.toUpperCase()}
                </div>
                <div className="text-lg font-bold text-white uppercase">
                  {selectedGov.name.en}
                </div>
                <div className="text-sm text-slate-500 font-mono">
                  {selectedGov.name.ar}
                </div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Risk Level Banner */}
            <div className={cn(
              "px-4 py-2 text-[9px] font-mono font-bold uppercase tracking-widest flex items-center justify-between",
              selectedGov.risk_level === 'ALERT' ? 'bg-intel-red/20 text-intel-red' :
              selectedGov.risk_level === 'HIGH' ? 'bg-intel-orange/20 text-intel-orange' :
              selectedGov.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-intel-cyan/20 text-intel-cyan'
            )}>
              <span>RISK: {selectedGov.risk_level}</span>
              <span>RRI: {selectedGov.rri_score.toFixed(2)}</span>
            </div>

            <div className="flex-1 p-4 space-y-4">
              {/* SECTION 1 — Core Stats */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Users, label: 'Population',
                    value: (selectedGov.pop/1000000).toFixed(2)+'M',
                    color: 'text-white' },
                  { icon: TrendingUp, label: 'Unemployment',
                    value: selectedGov.unemp+'%',
                    color: selectedGov.unemp > 30 ? 'text-intel-red' : 'text-intel-orange' },
                  { icon: DollarSign, label: 'GDP/capita',
                    value: selectedGov.gdp_pc_tnd.toLocaleString()+' TND',
                    color: 'text-white' },
                  { icon: AlertTriangle, label: 'Poverty',
                    value: selectedGov.poverty_pct+'%',
                    color: selectedGov.poverty_pct > 25 ? 'text-intel-red' : 'text-intel-orange' },
                ].map(item => (
                  <div key={item.label} className="bg-black/30 rounded-lg p-2.5 border border-intel-border/30 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <item.icon className="w-3 h-3 text-slate-500" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase">{item.label}</span>
                    </div>
                    <div className={cn("text-sm font-bold font-mono", item.color)}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* SECTION 2 — Water Crisis */}
              <div className="bg-black/30 rounded-xl border border-intel-border/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className={cn("w-3.5 h-3.5", selectedGov.water_cut_hours > 12 ? 'text-intel-red' : 'text-intel-orange')} />
                    <span className="text-[10px] font-bold text-white uppercase">Water Supply</span>
                  </div>
                  <span className={cn("text-xs font-bold font-mono", selectedGov.water_cut_hours > 12 ? 'text-intel-red' : 'text-intel-orange')}>
                    {24 - selectedGov.water_cut_hours}h/day
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      selectedGov.water_cut_hours > 12 ? 'bg-intel-red' :
                      selectedGov.water_cut_hours > 6 ? 'bg-intel-orange' : 'bg-intel-cyan'
                    )}
                    style={{ width: `${((24-selectedGov.water_cut_hours)/24)*100}%` }}
                  />
                </div>
                <div className="text-[8px] text-slate-600 font-mono uppercase tracking-tighter">
                  Source: {selectedGov.water_source}
                </div>
                {selectedGov.water_cut_hours > 12 && (
                  <div className="text-[9px] text-intel-red font-mono animate-pulse">
                    ⚠ CRITICAL — {selectedGov.water_cut_hours}h/day cuts
                  </div>
                )}
              </div>

              {/* SECTION 3 — Social Indicators */}
              <div className="space-y-2">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Social Indicators</div>
                {[
                  { label: 'Literacy', value: selectedGov.literacy_pct, max: 100, unit: '%', invert: false },
                  { label: 'Youth %', value: selectedGov.youth_pct, max: 45, unit: '%', invert: true },
                  { label: 'Rural %', value: selectedGov.rural_pct, max: 80, unit: '%', invert: true },
                  { label: 'Healthcare (beds/1k)', value: selectedGov.healthcare_beds_1k, max: 4, unit: '/1k', invert: false },
                  { label: 'Internet Score', value: selectedGov.internet_score, max: 100, unit: '/100', invert: false },
                ].map(item => {
                  const normalized = item.invert ? item.value / item.max : 1 - (item.value / item.max);
                  const color = normalized > 0.7 ? 'bg-intel-red' : normalized > 0.5 ? 'bg-intel-orange' : normalized > 0.3 ? 'bg-yellow-500' : 'bg-intel-cyan';
                  return (
                    <div key={item.label} className="space-y-0.5">
                      <div className="flex justify-between text-[9px] font-mono">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="text-white">{item.value}{item.unit}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", color)} style={{ width: `${(item.value/item.max)*100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECTION 4 — Security & Politics */}
              <div className="bg-black/30 rounded-xl border border-intel-border/30 p-3 space-y-2">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-2">Security & Politics</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[8px]">Police Presence</div>
                    <div className={cn("font-mono font-bold", selectedGov.police_presence === 'HIGH' ? 'text-intel-cyan' : selectedGov.police_presence === 'MEDIUM' ? 'text-yellow-500' : 'text-intel-red')}>
                      {selectedGov.police_presence}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[8px]">Tribal Influence</div>
                    <div className={cn("font-mono font-bold", selectedGov.tribal_influence === 'HIGH' ? 'text-intel-orange' : selectedGov.tribal_influence === 'MEDIUM' ? 'text-yellow-500' : 'text-intel-cyan')}>
                      {selectedGov.tribal_influence}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[8px]">Protest Count</div>
                    <div className={cn("font-mono font-bold", selectedGov.protest_count > 20 ? 'text-intel-red' : selectedGov.protest_count > 10 ? 'text-intel-orange' : 'text-slate-300')}>
                      {selectedGov.protest_count}/month
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[8px]">Election Turnout</div>
                    <div className="font-mono font-bold text-intel-red">{selectedGov.election_turnout_2023}%</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[8px]">Decree 54 Cases</div>
                    <div className={cn("font-mono font-bold", (selectedGov.decree54_cases || 0) > 5 ? 'text-intel-red' : 'text-intel-orange')}>
                      {selectedGov.decree54_cases || 0}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[8px]">Migration Attempts</div>
                    <div className={cn("font-mono font-bold", (selectedGov.migration_attempts_2025 || 0) > 5000 ? 'text-intel-red' : 'text-intel-orange')}>
                      {((selectedGov.migration_attempts_2025||0)/1000).toFixed(1)}k
                    </div>
                  </div>
                </div>
                {selectedGov.main_tribes.length > 0 && (
                  <div className="pt-2 border-t border-intel-border/20 space-y-1">
                    <div className="text-[8px] font-mono text-slate-500">Key tribes / groups:</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedGov.main_tribes.map(t => (
                        <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 bg-intel-orange/10 text-intel-orange border border-intel-orange/20 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5 — Risk Predictions */}
              <div className="bg-black/30 rounded-xl border border-intel-border/30 p-3 space-y-2">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Instability Forecast</div>
                {[
                  { label: '7-Day', value: selectedGov.pred_7d },
                  { label: '30-Day', value: selectedGov.pred_30d },
                  { label: '90-Day', value: selectedGov.pred_90d },
                ].map(p => (
                  <div key={p.label} className="flex items-center space-x-3">
                    <span className="text-[9px] font-mono text-slate-500 w-14">{p.label}</span>
                    <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.value > 0.75 ? 'bg-intel-red' : p.value > 0.55 ? 'bg-intel-orange' : p.value > 0.40 ? 'bg-yellow-500' : 'bg-intel-cyan'
                        )}
                        style={{ width: `${p.value * 100}%` }}
                      />
                    </div>
                    <span className={cn("text-[9px] font-mono font-bold w-10 text-right", p.value > 0.75 ? 'text-intel-red' : p.value > 0.55 ? 'text-intel-orange' : 'text-slate-400')}>
                      {(p.value * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-intel-border/20">
                  <div className="flex justify-between text-[9px] font-mono">
                    <span className="text-slate-500">Cascade Risk:</span>
                    <span className={cn("font-bold", (selectedGov.cascade_risk||0) > 0.6 ? 'text-intel-red' : (selectedGov.cascade_risk||0) > 0.4 ? 'text-intel-orange' : 'text-slate-400')}>
                      {((selectedGov.cascade_risk||0)*100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 6 — Recent Events in this governorate */}
              <div className="space-y-2">
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Recent Events</div>
                {events
                  .filter(e => e.gov === selectedGov.id)
                  .slice(0, 4)
                  .map(event => (
                  <div key={event.id} className="flex items-start space-x-2 p-2 rounded-lg bg-black/30 border border-intel-border/30">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1 shrink-0",
                      event.urgent ? 'bg-intel-red' : event.type === 'arrest' ? 'bg-intel-red' : event.type === 'economic' ? 'bg-intel-orange' : 'bg-yellow-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-slate-300 leading-snug truncate">{event.title}</div>
                      <div className="text-[8px] font-mono text-slate-600">
                        {event.date} · {event.source}
                      </div>
                    </div>
                  </div>
                ))}
                {events.filter(e => e.gov === selectedGov.id).length === 0 && (
                  <div className="text-[9px] text-slate-600 italic">No events recorded for this governorate.</div>
                )}
              </div>

              {/* SECTION 7 — Key Industry */}
              <div className="text-[9px] font-mono text-slate-500 pb-4 uppercase tracking-tighter">
                Key industry: {selectedGov.key_industry}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
