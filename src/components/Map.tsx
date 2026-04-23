import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Popup, CircleMarker, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Governorate, IntelEvent } from '../types/intel';
import { cn } from '../utils/cn';
import { 
  Sprout, 
  Droplets, 
  CloudRain, 
  Leaf, 
  Wind, 
  Thermometer, 
  ShieldAlert,
  ChevronDown,
  Layers,
  Activity,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Helper to normalize names for matching GeoJSON properties to data keys
const normalizeName = (name: string) => {
  if (!name) return '';
  const normalized = name.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents (Kassérine -> Kasserine)
    .replace(/ /g, '_')
    .replace(/-/g, '_')
    .trim();
    
  if (normalized === 'le_kef' || normalized === 'al_kaf' || normalized === 'lekef' || normalized === 'alkaf') return 'kef';
  return normalized;
};

// Color scales for different layers
const getChoroplethColor = (score: number, activeLayer: string) => {
  if (activeLayer === 'Wheat Stress') {
    if (score >= 2.1) return '#ff453a'; // Critical
    if (score >= 1.5) return '#ff9f0a'; // High
    if (score >= 0.9) return '#ffd60a'; // Moderate
    return '#00f2ff'; // Stable
  }
  
  if (activeLayer === 'Olive Health') {
    if (score >= 2.5) return '#064e3b'; // Excellent (Dark Green)
    if (score >= 2.0) return '#059669'; // Good
    if (score >= 1.5) return '#34d399'; // Moderate
    if (score >= 1.0) return '#fbbf24'; // Stress (Yellow)
    return '#ef4444'; // Critical (Red)
  }

  if (activeLayer === 'Rainfall Anomaly') {
    if (score >= 2.0) return '#0284c7'; // Surplus (Blue)
    if (score >= 1.5) return '#0ea5e9'; // Normal
    if (score >= 1.0) return '#f97316'; // Deficit (Orange)
    return '#991b1b'; // Severe Drought (Red)
  }

  if (activeLayer === 'Soil Moisture') {
    if (score >= 2.0) return '#1e3a8a'; // Saturated
    if (score >= 1.5) return '#3b82f6'; // Moist
    if (score >= 1.0) return '#fbbf24'; // Dry
    return '#78350f'; // Parched
  }

  if (activeLayer === 'Date Palm Health') {
    if (score >= 2.4) return '#14532d'; // Excellent — dark green
    if (score >= 1.8) return '#16a34a'; // Good — green
    if (score >= 1.2) return '#ca8a04'; // Stressed — amber
    if (score >= 0.6) return '#ea580c'; // Critical — orange
    return '#991b1b'; // Collapse risk — red
  }

  // Default RRI colors
  if (score >= 2.6) return '#991b1b';
  if (score >= 2.3) return '#ef4444';
  if (score >= 2.0) return '#f97316';
  if (score >= 1.7) return '#fb923c';
  return '#fdba74';
};

// Helper to create custom icons for the map
const createAgriIcon = (type: string, color: string) => {
  const IconComponent = type === 'wheat' ? Sprout : 
                        type === 'olive' ? Leaf : 
                        type === 'rain' ? CloudRain : Droplets;
  
  const html = renderToStaticMarkup(
    <div style={{ 
      color, 
      backgroundColor: 'rgba(0,0,0,0.4)', 
      padding: '4px', 
      borderRadius: '50%', 
      border: `1px solid ${color}44`,
      boxShadow: `0 0 10px ${color}22`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <IconComponent size={14} />
    </div>
  );

  return L.divIcon({
    html,
    className: 'custom-agri-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

interface MapProps {
  governorates: Governorate[];
  events: IntelEvent[];
  activeLayer: string;
  heatmapPoints?: { id?: string; lat: number; lon: number; intensity: number; label?: string; risk?: string }[];
  onSelectGovernorate?: (gov: Governorate) => void;
  onSimulate?: (id: string, name: string) => void;
  focusedGovId?: string | null;
}

const MapController = ({ governorates, focusedGovId }: { governorates: Governorate[], focusedGovId?: string | null }) => {
  const map = useMap();

  useEffect(() => {
    if (focusedGovId) {
      const gov = governorates.find(g => g.id === focusedGovId);
      if (gov && gov.lat && gov.lon) {
        map.flyTo([gov.lat, gov.lon], 9, {
          duration: 1.5,
          easeLinearity: 0.25
        });
      }
    }
  }, [focusedGovId, governorates, map]);

  return null;
};

export const Map: React.FC<MapProps> = ({ governorates, events, activeLayer: externalActiveLayer, heatmapPoints, onSelectGovernorate, onSimulate, focusedGovId }) => {
  const tunisiaCenter: [number, number] = [34.0, 9.0]; 
  const zoom = 6;
  const [geoData, setGeoData] = useState<any>(null);
  const [showChoropleth, setShowChoropleth] = useState(true);
  const [internalLayer, setInternalLayer] = useState<string>('Wheat Stress');
  const [showIcons, setShowIcons] = useState(true);

  const activeLayer = externalActiveLayer === 'Agricultural Stress' ? internalLayer : externalActiveLayer;

  // Fetch Tunisia ADM1 GeoJSON
  useEffect(() => {
    const loadGeoJSON = async () => {
      try {
        // Reliable source for Tunisia ADM1 boundaries
        const targetUrl = 'https://raw.githubusercontent.com/sammmeeeh/tunisia-immigration-analytics-dashboard/main/TN-gouvernorat.geojson';
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('GeoJSON fetch failed');
        const data = await response.json();
        setGeoData(data);
      } catch (error) {
        console.error('Error loading Tunisia GeoJSON:', error);
      }
    };
    loadGeoJSON();
  }, []);

  const getGovStyle = useCallback((feature: any) => {
    const name = feature.properties.name || feature.properties.NAME_1 || feature.properties.name_en || feature.properties.gouv_fr || feature.properties.ADM_GOV || '';
    const normalized = normalizeName(name);
    
    const gov = governorates.find(g => 
      g.id === normalized || 
      normalizeName(g.name.en) === normalized ||
      (name && g.id === name.toLowerCase())
    );
    
    let score = gov?.rri_score || 1.5;
    
    // Override score based on active agricultural layer
    if (gov && (gov as any).agri_metrics) {
      const metrics = (gov as any).agri_metrics;
      if (activeLayer === 'Wheat Stress') score = metrics.wheat_stress * 3;
      if (activeLayer === 'Olive Health') score = metrics.olive_health * 3;
      if (activeLayer === 'Rainfall Anomaly') score = (metrics.rainfall_anomaly + 0.5) * 2;
      if (activeLayer === 'Soil Moisture') score = metrics.soil_moisture * 3;
      if (activeLayer === 'Date Palm Health') score = (metrics.date_palm_health ?? 0.5) * 3;
    }
    
    return {
      fillColor: getChoroplethColor(score, activeLayer),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.4,
    };
  }, [governorates, activeLayer]);

  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    const name = feature.properties.name || feature.properties.NAME_1 || feature.properties.name_en || feature.properties.gouv_fr || feature.properties.ADM_GOV || '';
    const normalized = normalizeName(name);
    const gov = governorates.find(g => 
      g.id === normalized || 
      normalizeName(g.name.en) === normalized ||
      (name && g.id === name.toLowerCase())
    );

    layer.on({
      click: (e) => {
        L.DomEvent.stopPropagation(e);
        if (gov) onSelectGovernorate?.(gov);
      },
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.8,
          weight: 2,
          color: '#ffffff'
        });
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getGovStyle(feature));
      }
    });

    if (gov) {
      const govEvents = events.filter(e => e.gov === gov.id).slice(0, 3);
      const metrics = (gov as any).agri_metrics;
      
      layer.bindPopup(`
        <div class="p-4 min-w-[260px] bg-intel-card text-slate-300 border border-intel-border rounded-xl shadow-2xl font-mono animate-in fade-in zoom-in duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[8px] text-slate-500 uppercase tracking-tighter">${gov.id} // AGRI_SEC_01</span>
            <div class="flex items-center space-x-2">
              <span class="text-[8px] font-bold uppercase px-2 py-0.5 rounded border ${
                gov.risk_level === 'ALERT' ? "bg-intel-red/20 text-intel-red border-intel-red/30" : 
                gov.risk_level === 'HIGH' ? "bg-intel-orange/20 text-intel-orange border-intel-orange/30" :
                "bg-intel-cyan/20 text-intel-cyan border-intel-cyan/30"
              }">
                ${gov.risk_level}
              </span>
            </div>
          </div>
          
          <div class="mb-4">
            <h4 class="text-lg font-black text-white uppercase tracking-tight">${gov.name.en}</h4>
            <div class="text-[9px] text-intel-cyan flex items-center mt-0.5">
              <Activity size={8} class="mr-1" />
              SATELLITE TELEMETRY ACTIVE
            </div>
          </div>

          ${metrics ? `
            <div class="grid grid-cols-2 gap-2 mb-4">
              <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                <div class="text-[7px] text-slate-500 uppercase mb-1">Wheat Stress</div>
                <div class="flex items-center justify-between">
                  <div class="text-sm font-bold ${metrics.wheat_stress > 0.7 ? 'text-intel-red' : 'text-white'}">${(metrics.wheat_stress * 100).toFixed(1)}%</div>
                  <div class="w-1 h-1 rounded-full ${metrics.wheat_stress > 0.7 ? 'bg-intel-red animate-pulse' : 'bg-intel-cyan'}"></div>
                </div>
              </div>
              <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                <div class="text-[7px] text-slate-500 uppercase mb-1">Soil Moisture</div>
                <div class="text-sm font-bold text-white">${(metrics.soil_moisture * 100).toFixed(1)}%</div>
              </div>
              <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                <div class="text-[7px] text-slate-500 uppercase mb-1">Rainfall Dev</div>
                <div class="text-sm font-bold ${metrics.rainfall_anomaly < 0 ? 'text-intel-orange' : 'text-intel-cyan'}">${(metrics.rainfall_anomaly * 100).toFixed(1)}%</div>
              </div>
              <div class="p-2 rounded-lg bg-white/5 border border-white/10">
                <div class="text-[7px] text-slate-500 uppercase mb-1">NDVI Index</div>
                <div class="text-sm font-bold text-white">${metrics.ndvi.toFixed(3)}</div>
              </div>
            </div>
          ` : `
            <div class="p-3 rounded-lg bg-white/5 border border-white/10 text-center text-[10px] text-slate-500 italic mb-4">
              No agricultural telemetry available for this region
            </div>
          `}

          <div class="flex flex-col gap-2">
            <button class="w-full py-2 bg-intel-cyan text-intel-bg hover:bg-white transition-all rounded font-bold text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(0,242,255,0.3)]">
              Full Intelligence Dossier →
            </button>
          </div>
        </div>
      `, { className: 'intel-popup', maxWidth: 300 });
    }
  }, [governorates, events, getGovStyle, onSelectGovernorate]);

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
          <MapController governorates={governorates} focusedGovId={focusedGovId} />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {/* Choropleth Layer */}
          {geoData && showChoropleth && (
            <GeoJSON 
              data={geoData} 
              style={getGovStyle} 
              onEachFeature={onEachFeature}
            />
          )}

          {/* Agricultural Icons Layer */}
          {showIcons && externalActiveLayer === 'Agricultural Stress' && governorates.map(gov => {
            if (!gov.lat || !gov.lon || !(gov as any).agri_metrics) return null;
            const metrics = (gov as any).agri_metrics;
            
            // Determine icon based on current layer or default to wheat
            let type = 'wheat';
            let color = '#ff453a';
            
            if (internalLayer === 'Wheat Stress') {
              type = 'wheat';
              color = metrics.wheat_stress > 0.7 ? '#ff453a' : metrics.wheat_stress > 0.4 ? '#ff9f0a' : '#00f2ff';
            } else if (internalLayer === 'Olive Health') {
              type = 'olive';
              color = metrics.olive_health > 0.7 ? '#059669' : metrics.olive_health > 0.4 ? '#fbbf24' : '#ef4444';
            } else if (internalLayer === 'Rainfall Anomaly') {
              type = 'rain';
              color = metrics.rainfall_anomaly < -0.2 ? '#991b1b' : metrics.rainfall_anomaly < 0 ? '#f97316' : '#0ea5e9';
            } else if (internalLayer === 'Date Palm Health') {
              type = 'olive';
              const dph = metrics.date_palm_health ?? 0.5;
              color = dph > 0.7 ? '#16a34a' : dph > 0.4 ? '#ca8a04' : '#991b1b';
            } else {
              type = 'soil';
              color = metrics.soil_moisture < 0.3 ? '#78350f' : metrics.soil_moisture < 0.6 ? '#fbbf24' : '#3b82f6';
            }

            return (
              <Marker
                key={`icon-${gov.id}`}
                position={[gov.lat, gov.lon]}
                icon={createAgriIcon(type, color)}
              >
                <Popup>
                  <div className="font-mono text-[10px] text-white uppercase font-bold p-1">
                    {gov.name.en} - {internalLayer}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Red glowing dots for heatmap points */}
          {heatmapPoints && heatmapPoints.map((point, index) => (
            <React.Fragment key={`${point.id || 'point'}-${point.lat}-${point.lon}-${index}`}>
              {/* Outer Glow */}
              <CircleMarker
                center={[point.lat, point.lon]}
                radius={15}
                pathOptions={{
                  color: 'transparent',
                  fillColor: '#ff453a',
                  fillOpacity: 0.15,
                  weight: 0,
                }}
              />
              {/* Middle Glow */}
              <CircleMarker
                center={[point.lat, point.lon]}
                radius={8}
                pathOptions={{
                  color: 'transparent',
                  fillColor: '#ff453a',
                  fillOpacity: 0.3,
                  weight: 0,
                }}
              />
              {/* Core Dot */}
              <CircleMarker
                center={[point.lat, point.lon]}
                radius={4}
                className="animate-pulse"
                pathOptions={{
                  color: '#ff453a',
                  fillColor: '#ff453a',
                  fillOpacity: 1,
                  weight: 1,
                }}
              >
                <Popup>{point.label || point.risk}</Popup>
              </CircleMarker>
            </React.Fragment>
          ))}
        </MapContainer>

        {/* Overlay UI */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col space-y-3">
          <div className="glass px-4 py-3 rounded-xl flex flex-col space-y-2 border border-intel-border/50 shadow-2xl">
            <div className="flex items-center space-x-2 mb-1">
              <Layers className="w-3.5 h-3.5 text-intel-cyan" />
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Intel Layer Controller</span>
            </div>
            
            {externalActiveLayer === 'Agricultural Stress' ? (
              <div className="flex flex-col space-y-1.5">
                {[
                  { id: 'Wheat Stress', icon: Sprout, color: 'text-intel-red' },
                  { id: 'Olive Health', icon: Leaf, color: 'text-intel-green' },
                  { id: 'Rainfall Anomaly', icon: CloudRain, color: 'text-intel-blue' },
                  { id: 'Soil Moisture', icon: Droplets, color: 'text-intel-cyan' },
                  { id: 'Date Palm Health', icon: Thermometer, color: 'text-amber-400' },
                ].map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => setInternalLayer(layer.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg transition-all border text-[9px] uppercase font-bold tracking-wider",
                      internalLayer === layer.id 
                        ? "bg-intel-cyan/10 border-intel-cyan/40 text-intel-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)]" 
                        : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center">
                      <layer.icon className={cn("w-3 h-3 mr-2", internalLayer === layer.id ? "animate-pulse" : "opacity-50")} />
                      {layer.id}
                    </div>
                    {internalLayer === layer.id && <div className="w-1 h-1 rounded-full bg-intel-cyan shadow-[0_0_5px_#00f2ff]"></div>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-3 py-2 bg-intel-cyan/10 border border-intel-cyan/20 rounded-lg">
                <span className="text-[10px] text-white font-bold uppercase tracking-widest">{activeLayer}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowChoropleth(!showChoropleth)}
              className={cn(
                "glass px-4 py-2 rounded-lg flex items-center transition-all border",
                showChoropleth ? "border-intel-cyan/50 text-intel-cyan" : "border-white/10 text-slate-500"
              )}
            >
              <Activity className="w-3 h-3 mr-2" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Heatmap</span>
            </button>

            <button 
              onClick={() => setShowIcons(!showIcons)}
              className={cn(
                "glass px-4 py-2 rounded-lg flex items-center transition-all border",
                showIcons ? "border-intel-cyan/50 text-intel-cyan" : "border-white/10 text-slate-500"
              )}
            >
              <Zap className="w-3 h-3 mr-2" />
              <span className="text-[8px] font-bold uppercase tracking-widest">Telemetry Icons</span>
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Legend Below Map */}
      <div className="glass p-3 rounded-xl border border-intel-border flex items-center justify-center space-x-8">
        <div className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] border-r border-intel-border pr-8 mr-2 hidden sm:block">
          Sovereign Risk Scale
        </div>
        
        {activeLayer === 'Wheat Stress' ? (
          <LegendItems items={[
            { label: 'Critical (>70%)', color: 'bg-[#ff453a]' },
            { label: 'High (50-70%)', color: 'bg-[#ff9f0a]' },
            { label: 'Moderate (30-50%)', color: 'bg-[#ffd60a]' },
            { label: 'Optimal (<30%)', color: 'bg-[#00f2ff]' },
          ]} />
        ) : activeLayer === 'Olive Health' ? (
          <LegendItems items={[
            { label: 'Excellent', color: 'bg-[#064e3b]' },
            { label: 'Good', color: 'bg-[#059669]' },
            { label: 'Fair', color: 'bg-[#34d399]' },
            { label: 'Stressed', color: 'bg-[#fbbf24]' },
            { label: 'Dying', color: 'bg-[#ef4444]' },
          ]} />
        ) : activeLayer === 'Rainfall Anomaly' ? (
          <LegendItems items={[
            { label: 'Surplus', color: 'bg-[#0284c7]' },
            { label: 'Normal', color: 'bg-[#0ea5e9]' },
            { label: 'Deficit', color: 'bg-[#f97316]' },
            { label: 'Severe Drought', color: 'bg-[#991b1b]' },
          ]} />
        ) : activeLayer === 'Soil Moisture' ? (
          <LegendItems items={[
            { label: 'Saturated', color: 'bg-[#1e3a8a]' },
            { label: 'Moist', color: 'bg-[#3b82f6]' },
            { label: 'Dry', color: 'bg-[#fbbf24]' },
            { label: 'Parched', color: 'bg-[#78350f]' },
          ]} />
        ) : activeLayer === 'Date Palm Health' ? (
          <LegendItems items={[
            { label: 'Excellent (>80%)', color: 'bg-[#14532d]' },
            { label: 'Good (60–80%)', color: 'bg-[#16a34a]' },
            { label: 'Stressed (40–60%)', color: 'bg-[#ca8a04]' },
            { label: 'Critical (20–40%)', color: 'bg-[#ea580c]' },
            { label: 'Collapse Risk (<20%)', color: 'bg-[#991b1b]' },
          ]} />
        ) : (
          <LegendItems items={[
            { label: 'Critical', color: 'bg-[#991b1b]' },
            { label: 'High', color: 'bg-[#ef4444]' },
            { label: 'Elevated', color: 'bg-[#f97316]' },
            { label: 'Moderate', color: 'bg-[#fb923c]' },
            { label: 'Stable', color: 'bg-[#fdba74]' },
          ]} />
        )}
      </div>
    </div>
  );
};

const LegendItems = ({ items }: { items: { label: string; color: string }[] }) => (
  <div className="flex items-center space-x-6">
    {items.map(item => (
      <div key={item.label} className="flex items-center space-x-2">
        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]", item.color)}></div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
      </div>
    ))}
  </div>
);
