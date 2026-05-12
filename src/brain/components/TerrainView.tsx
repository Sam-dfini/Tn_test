import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Mock data for Tunisia's governorates
const governorates = [
  { id: 'tunis', name: 'Tunis', position: [10.1815, 36.8065, 0], risk: 0.7 },
  { id: 'ariana', name: 'Ariana', position: [10.1939, 36.8625, 0], risk: 0.5 },
  { id: 'ben-arous', name: 'Ben Arous', position: [10.2238, 36.7532, 0], risk: 0.6 },
  { id: 'manouba', name: 'Manouba', position: [9.8381, 36.8061, 0], risk: 0.4 },
  { id: 'nabeul', name: 'Nabeul', position: [10.7371, 36.4523, 0], risk: 0.3 },
  { id: 'zaghouan', name: 'Zaghouan', position: [10.1486, 36.4058, 0], risk: 0.2 },
  { id: 'bizerte', name: 'Bizerte', position: [9.8767, 37.2745, 0], risk: 0.8 },
  { id: 'beja', name: 'Beja', position: [9.1817, 36.7279, 0], risk: 0.5 },
  { id: 'jendouba', name: 'Jendouba', position: [8.7817, 36.5008, 0], risk: 0.6 },
  { id: 'kef', name: 'Kef', position: [8.7081, 36.1716, 0], risk: 0.7 },
  { id: 'siliana', name: 'Siliana', position: [9.3714, 36.0875, 0], risk: 0.4 },
  { id: 'kairouan', name: 'Kairouan', position: [10.0979, 35.6789, 0], risk: 0.5 },
  { id: 'kasserine', name: 'Kasserine', position: [8.8339, 35.1674, 0], risk: 0.9 },
  { id: 'sidi-bouzid', name: 'Sidi Bouzid', position: [9.4848, 35.0386, 0], risk: 0.8 },
  { id: 'sousse', name: 'Sousse', position: [10.6376, 35.8254, 0], risk: 0.4 },
  { id: 'monastir', name: 'Monastir', position: [10.8296, 35.7771, 0], risk: 0.3 },
  { id: 'mahdia', name: 'Mahdia', position: [11.0628, 35.5023, 0], risk: 0.5 },
  { id: 'sfax', name: 'Sfax', position: [10.7606, 34.7406, 0], risk: 0.6 },
  { id: 'gabes', name: 'Gabes', position: [10.1189, 33.8814, 0], risk: 0.7 },
  { id: 'medenine', name: 'Medenine', position: [10.5075, 33.3561, 0], risk: 0.8 },
  { id: 'tataouine', name: 'Tataouine', position: [10.4478, 32.9303, 0], risk: 0.9 },
  { id: 'tozeur', name: 'Tozeur', position: [8.1342, 33.9198, 0], risk: 0.5 },
  { id: 'kebili', name: 'Kebili', position: [8.9678, 33.7053, 0], risk: 0.6 },
  { id: 'gafsa', name: 'Gafsa', position: [8.7839, 34.4254, 0], risk: 0.7 },
];

// Convert latitude and longitude to 3D coordinates
const latLongToPosition = (lat: number, long: number, altitude: number = 0): [number, number, number] => {
  const earthRadius = 10;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (long + 180) * (Math.PI / 180);
  const x = -(earthRadius) * Math.sin(phi) * Math.cos(theta);
  const y = altitude;
  const z = (earthRadius) * Math.sin(phi) * Math.sin(theta);
  return [x, y, z];
};

// TerrainView component
const TerrainView: React.FC = () => {
  const [shockWaves, setShockWaves] = useState<{ position: [number, number, number]; intensity: number; timestamp: number }[]>([]);

  // Simulate shock waves for high-risk governorates
  useEffect(() => {
    const interval = setInterval(() => {
      const highRiskGovernorates = governorates.filter(g => g.risk > 0.7);
      if (highRiskGovernorates.length > 0) {
        const randomIndex = Math.floor(Math.random() * highRiskGovernorates.length);
        const governorate = highRiskGovernorates[randomIndex];
        const position = latLongToPosition(governorate.position[1], governorate.position[0]);
        setShockWaves(prev => [...prev, { position, intensity: governorate.risk, timestamp: Date.now() }]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Clean up old shock waves
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setShockWaves(prev => prev.filter(wave => Date.now() - wave.timestamp < 5000));
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0f' }}>
      <Canvas camera={{ position: [0, 20, 30], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <Environment preset="city" />

        {/* Tunisia Terrain (simplified as a flat plane for now) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]}>
          <planeGeometry args={[40, 30]} />
          <meshStandardMaterial color="#2a5c2a" />
        </mesh>

        {/* Governorate Nodes */}
        {governorates.map((governorate) => {
          const position = latLongToPosition(governorate.position[1], governorate.position[0]);
          const riskColor = new THREE.Color().setHSL(0, 1, governorate.risk);

          return (
            <mesh key={governorate.id} position={position}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial color={riskColor} emissive={riskColor} emissiveIntensity={0.5} />
            </mesh>
          );
        })}

        {/* Shock Waves */}
        {shockWaves.map((wave, index) => (
          <mesh key={index} position={wave.position}>
            <sphereGeometry args={[wave.intensity * 3, 16, 16]} />
            <meshStandardMaterial color="red" transparent opacity={0.3} />
          </mesh>
        ))}
      </Canvas>
    </div>
  );
};

export default TerrainView;
