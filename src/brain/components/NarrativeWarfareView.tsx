import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Narrative {
  id: string;
  name: string;
  source: string;
  strength: number;
  position: [number, number, number];
  color: string;
}

interface NarrativeField {
  id: string;
  position: [number, number, number];
  influenceRadius: number;
  color: string;
}

const NarrativeWarfareView: React.FC = () => {
  // Mock narratives
  const [narratives, setNarratives] = useState<Narrative[]>([
    {
      id: 'gov-1',
      name: 'Government Stability',
      source: 'Government',
      strength: 0.8,
      position: [0, 0, 0],
      color: '#3b82f6',
    },
    {
      id: 'opp-1',
      name: 'Opposition Reform',
      source: 'Opposition',
      strength: 0.6,
      position: [5, 0, 0],
      color: '#ef4444',
    },
    {
      id: 'rumor-1',
      name: 'Fuel Shortage Rumor',
      source: 'Unknown',
      strength: 0.4,
      position: [-3, 3, 0],
      color: '#f59e0b',
    },
  ]);

  // Narrative fields (gravitational influence)
  const [fields, setFields] = useState<NarrativeField[]>([]);

  // Simulate narrative influence fields
  useEffect(() => {
    const newFields = narratives.map(narrative => ({
      id: `${narrative.id}-field`,
      position: narrative.position,
      influenceRadius: narrative.strength * 3,
      color: narrative.color,
    }));
    setFields(newFields);
  }, [narratives]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0f' }}>
      <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />

        {/* Narrative Sources */}
        {narratives.map(narrative => (
          <group key={narrative.id} position={narrative.position}>
            <Sphere args={[0.8, 16, 16]}>
              <meshStandardMaterial color={narrative.color} emissive={narrative.color} emissiveIntensity={0.5} />
            </Sphere>
          </group>
        ))}

        {/* Narrative Fields */}
        {fields.map(field => (
          <mesh key={field.id} position={field.position}>
            <sphereGeometry args={[field.influenceRadius, 32, 32]}>
              <meshStandardMaterial color={field.color} transparent opacity={0.2} side={THREE.DoubleSide} />
            </sphereGeometry>
          </mesh>
        ))}

        {/* Rumor Injection Points */}
        <group position={[-3, 3, 0]}>
          <Sphere args={[0.5, 16, 16]}>
            <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.7} />
          </Sphere>
        </group>

        {/* Amplification Pathways */}
        <mesh>
          <tubeGeometry
            args={[
              new THREE.CatmullRomCurve3([
                new THREE.Vector3(-3, 3, 0),
                new THREE.Vector3(0, 5, 0),
                new THREE.Vector3(5, 3, 0),
              ]),
              20,
              0.1,
              8,
              false,
            ]}
          >
            <meshStandardMaterial color="#f59e0b" side={THREE.DoubleSide} />
          </tubeGeometry>
        </mesh>
      </Canvas>
    </div>
  );
};

export default NarrativeWarfareView;
