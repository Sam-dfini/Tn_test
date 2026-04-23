import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Governorate, IntelEvent } from '../types/intel';
import { cn } from '../utils/cn';

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

// Color scale: Orange to Red based on RRI Score
const getChoroplethColor = (score: number) => {
  if (score >= 2.6) return '#991b1b'; // Dark Red
  if (score >= 2.3) return '#ef4444'; // Red
  if (score >= 2.0) return '#f97316'; // Orange
  if (score >= 1.7) return '#fb923c'; // Light Orange
  return '#fdba74'; // Pale Orange
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

export const Map: React.FC<MapProps> = ({ governorates, events, activeLayer, heatmapPoints, onSelectGovernorate, onSimulate, focusedGovId }) => {
  const tunisiaCenter: [number, number] = [34.0, 9.0]; // Centered as requested
  const zoom = 6;
  const [geoData, setGeoData] = useState<any>(null);
  const [showChoropleth, setShowChoropleth] = useState(true);

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
    
    // Match by normalized ID or English name
    const gov = governorates.find(g => 
      g.id === normalized || 
      normalizeName(g.name.en) === normalized ||
      (name && g.id === name.toLowerCase())
    );
    
    const score = gov?.rri_score || 1.5;
    
    return {
      fillColor: getChoroplethColor(score),
      weight: 1, // Thin stroke as requested
      opacity: 1,
      color: 'white', // White stroke as requested
      fillOpacity: 0.5,
    };
  }, [governorates]);

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
      
      layer.bindPopup(`
        <div class="p-3 min-w-[200px] bg-intel-card text-slate-300 border border-intel-border rounded-lg shadow-2xl font-mono">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[8px] text-slate-500 uppercase">${gov.id}</span>
            <span class="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${
              gov.risk_level === 'ALERT' ? "bg-intel-red/10 text-intel-red border-intel-red/20" : 
              gov.risk_level === 'HIGH' ? "bg-intel-orange/10 text-intel-orange border-intel-orange/20" :
              "bg-intel-cyan/10 text-intel-cyan border-intel-cyan/20"
            }">
              ${gov.risk_level}
            </span>
          </div>
          <h4 class="text-sm font-bold text-white uppercase mb-1">${gov.name.en}</h4>
          <div class="text-[10px] text-slate-400 mb-3">${gov.name.ar}</div>
          
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="p-1.5 rounded bg-white/5 border border-white/5 text-center">
              <div class="text-[7px] text-slate-500 uppercase">RRI Score</div>
              <div class="text-xs font-bold text-white">${gov.rri_score.toFixed(2)}</div>
            </div>
            <div class="p-1.5 rounded bg-white/5 border border-white/5 text-center">
              <div class="text-[7px] text-slate-500 uppercase">Unemp</div>
              <div class="text-xs font-bold text-white">${gov.unemp}%</div>
            </div>
          </div>

          ${govEvents.length > 0 ? `
            <div class="mb-3 space-y-1">
              <div class="text-[7px] text-slate-500 uppercase mb-1">Recent Events</div>
              ${govEvents.map(e => `
                <div class="text-[8px] p-1 bg-white/5 rounded border border-white/5 truncate">
                  <span class="${e.urgent ? 'text-intel-red' : 'text-intel-cyan'}">●</span> ${e.title}
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="flex flex-col gap-2">
            <button class="w-full py-1.5 bg-intel-cyan/10 hover:bg-intel-cyan/20 border border-intel-cyan/30 rounded text-[8px] font-bold text-intel-cyan transition-all uppercase">
              Analyze Region →
            </button>
          </div>
        </div>
      `, { className: 'intel-popup' });
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
        <div className="absolute top-6 left-6 z-[1000] hidden md:flex flex-col space-y-2">
          <div className="glass px-4 py-2 rounded-lg flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-slate-500 uppercase">Active Layer</span>
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">{activeLayer} Choropleth</span>
            </div>
          </div>
          
          <button 
            onClick={() => setShowChoropleth(!showChoropleth)}
            className={cn(
              "glass px-4 py-2 rounded-lg flex items-center justify-between transition-all border",
              showChoropleth ? "border-intel-cyan/50 text-intel-cyan" : "border-white/10 text-slate-500"
            )}
          >
            <span className="text-[8px] font-mono uppercase tracking-widest">Choropleth</span>
            <div className={cn(
              "w-2 h-2 rounded-full ml-3",
              showChoropleth ? "bg-intel-cyan animate-pulse" : "bg-slate-700"
            )}></div>
          </button>
        </div>
      </div>

      {/* Horizontal Legend Below Map */}
      <div className="glass p-3 rounded-xl border border-intel-border flex items-center justify-center space-x-6">
        <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest border-r border-intel-border pr-6 mr-2 hidden sm:block">RRI Risk Scale</div>
        {[
          { label: 'Critical (>2.6)', color: 'bg-[#991b1b]' },
          { label: 'High (2.3-2.6)', color: 'bg-[#ef4444]' },
          { label: 'Elevated (2.0-2.3)', color: 'bg-[#f97316]' },
          { label: 'Moderate (1.7-2.0)', color: 'bg-[#fb923c]' },
          { label: 'Stable (<1.7)', color: 'bg-[#fdba74]' },
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
