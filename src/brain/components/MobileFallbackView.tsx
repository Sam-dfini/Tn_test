import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MobileFallbackView: React.FC = () => {
  const [activeSpace, setActiveSpace] = useState('constellation');

  // Mock data for mobile fallback
  const spaces = [
    { id: 'constellation', name: 'Constellation', description: 'View entities as a force-directed network.' },
    { id: 'projection', name: 'Projection', description: 'Explore hierarchical layers of strategic data.' },
    { id: 'terrain', name: 'Terrain', description: 'Visualize events on a 3D map of Tunisia.' },
    { id: 'simulation', name: 'Simulation', description: 'Adjust parameters to project risk cascades.' },
    { id: 'narrative-warfare', name: 'Narrative Warfare', description: 'Analyze competing narratives as gravitational fields.' },
    { id: 'shock-propagation', name: 'Shock Propagation', description: 'Monitor real-time event animations.' },
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#0a0a0f', color: 'white', minHeight: '100vh' }}>
      <h2 style={{ color: '#a78bfa', marginBottom: '20px' }}>Brain Mode (Mobile)</h2>

      {/* Space Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>Select Space:</label>
        <select
          value={activeSpace}
          onChange={(e) => setActiveSpace(e.target.value)}
          style={{ padding: '10px', background: '#1f2937', color: 'white', border: 'none', borderRadius: '4px', width: '100%' }}
        >
          {spaces.map(space => (
            <option key={space.id} value={space.id}>{space.name}</option>
          ))}
        </select>
      </div>

      {/* Space Description */}
      <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>{spaces.find(s => s.id === activeSpace)?.name}</h3>
        <p>{spaces.find(s => s.id === activeSpace)?.description}</p>
      </div>

      {/* Visual Representation */}
      <div style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
        <p>This is a mobile-friendly representation of the {spaces.find(s => s.id === activeSpace)?.name} space.</p>
        <div style={{ margin: '20px 0', height: '200px', background: 'rgba(100, 100, 200, 0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#a78bfa' }}>Visualization Placeholder</p>
        </div>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>For the full 3D experience, please use a desktop device.</p>
      </div>
    </div>
  );
};

export default MobileFallbackView;
