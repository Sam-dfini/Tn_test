import React, { useState, useEffect } from 'react';
import { useDashboardStore } from './index';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Map as MapIcon, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

// Example geojson just for rendering, in a real app this would be loaded
const TUNISIA_BOUNDS: [number, number][] = [[30.2, 7.5], [37.5, 11.6]];

function MapUpdater({ selectedGov }: { selectedGov: string | null }) {
  const map = useMap();
  useEffect(() => {
    // In a real app, zoom to bounds of selected gov
    if (selectedGov) {
      // Dummy animation
      map.flyTo([35.6, 9.8], 8, { duration: 1.5 });
    } else {
      map.fitBounds(TUNISIA_BOUNDS as any);
    }
  }, [selectedGov, map]);
  return null;
}

export default function TacticalMap() {
  const { selectedGovernorate, setSelectedGovernorate, activeLayers, toggleLayer } = useDashboardStore();
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to avoid SSR issues if any, and load geojson
    fetch('https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions/bzh/communes-bzh.geojson') // REPLACE WITH TUNISIA GEOJSON IN PROD
      .then(res => res.json())
      .then(data => {
         // using dummy data for compilation sake until tunisia_governorates.geojson is available
         setGeoData(data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="relative flex h-full min-h-[500px] w-full flex-col overflow-hidden rounded-lg border border-[#1e3a5f] bg-[#111827]">
      {/* Map Header */}
      <div className="absolute left-0 top-0 z-10 flex w-full items-center justify-between bg-gradient-to-b from-[#111827]/90 to-transparent p-4">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-[#f1f5f9]">
          <MapIcon className="h-4 w-4 text-[#3b82f6]" />
          <span>TACTICAL MAP</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-[#0a0f1a]">
        <MapContainer 
          bounds={TUNISIA_BOUNDS as any} 
          zoomControl={false}
          className="h-full w-full z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {geoData && (
             <GeoJSON data={geoData} style={{ color: '#1e3a5f', weight: 1, fillOpacity: 0.1 }} />
          )}
          <MapUpdater selectedGov={selectedGovernorate} />
        </MapContainer>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <div className="flex flex-col gap-1 rounded-lg border border-[#1e3a5f] bg-[#111827]/90 p-2 backdrop-blur-md">
          <div className="mb-1 border-b border-[#1e3a5f] pb-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
            Layers
          </div>
          <button 
            onClick={() => toggleLayer('ndvi')}
            className={clsx("flex items-center gap-2 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[#1a2332]", activeLayers.includes('ndvi') ? "text-[#06b6d4]" : "text-[#94a3b8]")}
          >
            <div className={clsx("h-2 w-2 rounded-full", activeLayers.includes('ndvi') ? "bg-[#06b6d4]" : "bg-transparent border border-[#94a3b8]")} />
            NDVI Heatmap
          </button>
          <button 
            onClick={() => toggleLayer('rainfall')}
            className={clsx("flex items-center gap-2 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[#1a2332]", activeLayers.includes('rainfall') ? "text-[#3b82f6]" : "text-[#94a3b8]")}
          >
            <div className={clsx("h-2 w-2 rounded-full", activeLayers.includes('rainfall') ? "bg-[#3b82f6]" : "bg-transparent border border-[#94a3b8]")} />
            Rainfall Anomaly
          </button>
          <button 
            onClick={() => toggleLayer('alerts')}
            className={clsx("flex items-center gap-2 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[#1a2332]", activeLayers.includes('alerts') ? "text-[#ef4444]" : "text-[#94a3b8]")}
          >
            <div className={clsx("h-2 w-2 rounded-full", activeLayers.includes('alerts') ? "bg-[#ef4444]" : "bg-transparent border border-[#94a3b8]")} />
            Alert Markers
          </button>
        </div>
        
        <button 
          onClick={() => setSelectedGovernorate(null)}
          className="flex w-fit items-center gap-2 rounded-lg border border-[#1e3a5f] bg-[#111827]/90 px-3 py-2 text-xs font-medium text-[#f1f5f9] backdrop-blur-md transition-colors hover:bg-[#1a2332]"
        >
          <RotateCcw className="h-4 w-4" />
          Reset View
        </button>
      </div>

      {/* Mocking a click for development since GeoJSON is empty/wrong */}
      <button 
         className="absolute right-4 top-4 z-10 rounded bg-[#3b82f6] px-3 py-1 text-xs font-bold text-white opacity-20 hover:opacity-100"
         onClick={() => setSelectedGovernorate('KAIROUAN')}
      >
        DEV: Select Kairouan
      </button>
    </div>
  );
}
