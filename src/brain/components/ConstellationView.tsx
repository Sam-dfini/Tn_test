import React, { useState, useEffect } from 'react';
import { Line, Html } from '@react-three/drei';
import { supabase } from '../../lib/supabase';

const mockNodes = [
  { id: 'node-0', name: 'Entity 1', position: [-3, 0, 0], color: '#4488ff' },
  { id: 'node-1', name: 'Entity 2', position: [0, 3, 0], color: '#4488ff' },
  { id: 'node-2', name: 'Entity 3', position: [3, 0, 0], color: '#4488ff' },
  { id: 'node-3', name: 'Entity 4', position: [0, -3, 0], color: '#4488ff' },
  { id: 'node-4', name: 'Entity 5', position: [0, 0, 3], color: '#4488ff' },
];

const mockLinks = [
  { source: 'node-0', target: 'node-1' },
  { source: 'node-1', target: 'node-2' },
  { source: 'node-2', target: 'node-3' },
  { source: 'node-3', target: 'node-4' },
];

// Pyramid SVG component
const PyramidSVG = () => (
  <Html distanceFactor={15} position={[0, -0.5, 0]}>
    <div style={{
      width: 200, height: 180,
      background: 'rgba(4,6,9,0.85)',
      border: '1px solid rgba(0,180,180,0.28)',
      borderRadius: 4,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Animated scanline */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(0,200,200,0.5), transparent)',
        boxShadow: '0 0 10px rgba(0,200,200,0.6)',
        animation: 'scan 4s linear infinite',
      }} />
      
      <svg viewBox="0 0 200 180" style={{ width: '100%', height: '100%' }}>
        {/* Connection lines */}
        <g opacity="0.25">
          <path d="M100,20 L100,60" stroke="#00f2ff" strokeWidth="1" fill="none" />
          <path d="M100,60 L60,100" stroke="#00f2ff" strokeWidth="1" fill="none" />
          <path d="M100,60 L140,100" stroke="#00f2ff" strokeWidth="1" fill="none" />
          <path d="M60,100 L30,140" stroke="#00f2ff" strokeWidth="1" fill="none" />
          <path d="M60,100 L90,140" stroke="#00f2ff" strokeWidth="1" fill="none" />
          <path d="M140,100 L110,140" stroke="#00f2ff" strokeWidth="1" fill="none" />
          <path d="M140,100 L170,140" stroke="#00f2ff" strokeWidth="1" fill="none" />
        </g>

        {/* Tier 1 - Strategic */}
        <path d="M100,10 L130,90 L70,90 Z" fill="none" stroke="#00f2ff" strokeWidth="2" />
        <circle cx="100" cy="10" r="3" fill="#00f2ff" />
        <text x="100" y="105" textAnchor="middle" fontSize="8" fill="#00f2ff" fontWeight="bold" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>STRATEGIC</text>

        {/* Tier 2 - Operational */}
        <path d="M60,50 L85,95 L35,95 Z" fill="none" stroke="#00c8c8" strokeWidth="1.5" opacity="0.8" />
        <path d="M140,50 L165,95 L115,95 Z" fill="none" stroke="#00c8c8" strokeWidth="1.5" opacity="0.8" />
        <circle cx="60" cy="50" r="2" fill="#00c8c8" />
        <circle cx="140" cy="50" r="2" fill="#00c8c8" />
        <text x="60" y="105" textAnchor="middle" fontSize="7" fill="#00c8c8" opacity="0.7" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>OPS-A</text>
        <text x="140" y="105" textAnchor="middle" fontSize="7" fill="#00c8c8" opacity="0.7" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>OPS-B</text>

        {/* Tier 3 - Tactical */}
        <path d="M30,90 L45,115 L15,115 Z" fill="none" stroke="#00a8a8" strokeWidth="1" opacity="0.6" />
        <path d="M90,90 L105,115 L75,115 Z" fill="none" stroke="#00a8a8" strokeWidth="1" opacity="0.6" />
        <path d="M110,90 L125,115 L95,115 Z" fill="none" stroke="#00a8a8" strokeWidth="1" opacity="0.6" />
        <path d="M170,90 L185,115 L155,115 Z" fill="none" stroke="#00a8a8" strokeWidth="1" opacity="0.6" />
        <circle cx="30" cy="90" r="1.5" fill="#00a8a8" />
        <circle cx="90" cy="90" r="1.5" fill="#00a8a8" />
        <circle cx="110" cy="90" r="1.5" fill="#00a8a8" />
        <circle cx="170" cy="90" r="1.5" fill="#00a8a8" />

        {/* Tier 4 - Data Clusters */}
        <circle cx="20" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="40" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="60" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="80" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="100" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="120" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="140" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="160" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
        <circle cx="180" cy="130" r="1" fill="#00c8c8" opacity="0.5" />
      </svg>

      {/* Labels */}
      <div style={{
        position: 'absolute', left: 4, top: 20, fontSize: 6, fontFamily: 'IBM Plex Mono, monospace',
        color: 'rgba(0,200,200,0.6)', borderLeft: '1px solid rgba(0,200,200,0.3)', paddingLeft: 4
      }}>
        <div>STRATEGIC HIGHEST ECHELON</div>
        <div style={{ opacity: 0.7 }}>OPERATIONAL BRANCHES</div>
        <div style={{ opacity: 0.7 }}>TACTICAL ACTORS</div>
        <div style={{ opacity: 0.7 }}>DATA CLUSTERS</div>
      </div>
    </div>
  </Html>
);

const ConstellationView = () => {
  const [nodes] = useState(mockNodes);
  const [links] = useState(mockLinks);

  useEffect(() => {
    const channel = supabase
      .channel('governorate_risk_scores')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'governorate_risk_scores' },
        (payload) => console.log('Data changed:', payload)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <>
      {/* Pyramid SVG in center */}
      <PyramidSVG />

      {/* Nodes */}
      {nodes.map((node) => (
        <group key={node.id} position={node.position}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.7} />
          </mesh>
          {/* Glow ring */}
          <mesh scale={1.5}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshBasicMaterial color="#00f2ff" transparent opacity={0.15} />
          </mesh>
        </group>
      ))}

      {/* Links */}
      {links.map((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return null;

        return (
          <Line
            key={`${link.source}-${link.target}`}
            points={[sourceNode.position, targetNode.position]}
            color="#00f2ff"
            lineWidth={1}
            opacity={0.4}
            transparent
          />
        );
      })}
    </>
  );
};

export default ConstellationView;
