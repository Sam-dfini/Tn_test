import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface ShockEvent {
  id: string;
  position: [number, number, number];
  intensity: number;
  timestamp: number;
  color: string;
}

const ShockPropagationView: React.FC = () => {
  const [shockEvents, setShockEvents] = useState<ShockEvent[]>([]);

  useEffect(() => {
    const events: ShockEvent[] = [
      {
        id: 'event-1',
        position: [0, 0, 0],
        intensity: 0.8,
        timestamp: Date.now(),
        color: '#ef4444',
      },
      {
        id: 'event-2',
        position: [5, 0, 0],
        intensity: 0.6,
        timestamp: Date.now(),
        color: '#f59e0b',
      },
    ];
    setShockEvents(events);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: ShockEvent = {
          id: `event-${Date.now()}`,
          position: [
            (Math.random() - 0.5) * 10,
            0,
            (Math.random() - 0.5) * 10,
          ],
          intensity: Math.random() * 0.7 + 0.3,
          timestamp: Date.now(),
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        };
        setShockEvents(prev => [...prev, newEvent]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0a0a0f' }}>
      <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />

        {shockEvents.map((event) => (
          <group key={event.id} position={event.position}>
            <mesh>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial color={event.color} emissive={event.color} emissiveIntensity={0.7} />
            </mesh>
          </group>
        ))}
      </Canvas>
    </div>
  );
};

export default ShockPropagationView;