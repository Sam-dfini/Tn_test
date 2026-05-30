import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line } from '@react-three/drei';
import * as THREE from 'three';

interface Layer {
  id: number;
  name: string;
  color: string;
  nodes: Array<{
    id: string;
    name: string;
    position: [number, number, number];
    connections: string[];
  }>;
}

const ProjectionView: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);

  useEffect(() => {
    const mockLayers: Layer[] = [
      {
        id: 0,
        name: 'Strategic',
        color: '#00f2ff',
        nodes: [
          { id: 'node-0-1', name: 'National Strategy', position: [0, 5, 0], connections: ['node-1-1'] },
          { id: 'node-0-2', name: 'Economic Vision', position: [3, 5, 0], connections: ['node-1-2'] },
        ],
      },
      {
        id: 1,
        name: 'Sectoral',
        color: '#00c8c8',
        nodes: [
          { id: 'node-1-1', name: 'Energy Sector', position: [0, 3, 0], connections: ['node-2-1'] },
          { id: 'node-1-2', name: 'Agriculture Sector', position: [3, 3, 0], connections: ['node-2-2'] },
        ],
      },
      {
        id: 2,
        name: 'Operational',
        color: '#00a8a8',
        nodes: [
          { id: 'node-2-1', name: 'Oil Production', position: [0, 1, 0], connections: ['node-3-1'] },
          { id: 'node-2-2', name: 'Crop Yield', position: [3, 1, 0], connections: ['node-3-2'] },
        ],
      },
      {
        id: 3,
        name: 'Tactical',
        color: '#008888',
        nodes: [
          { id: 'node-3-1', name: 'Refinery A', position: [0, -1, 0], connections: [] },
          { id: 'node-3-2', name: 'Farm B', position: [3, -1, 0], connections: [] },
        ],
      },
    ];
    setLayers(mockLayers);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#040609', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />

        {layers.map((layer) => (
          <group key={layer.id}>
            {layer.nodes.map((node) => (
              <group key={node.id} position={node.position}>
                {/* Glow ring */}
                <mesh scale={1.5}>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshBasicMaterial color={layer.color} transparent opacity={0.2} />
                </mesh>
                <mesh>
                  <sphereGeometry args={[0.5, 16, 16]} />
                  <meshStandardMaterial color={layer.color} emissive={layer.color} emissiveIntensity={0.5} />
                </mesh>
              </group>
            ))}

            {layer.nodes.map((node) =>
              node.connections.map((targetId) => {
                const targetNode = layers.flatMap(l => l.nodes).find(n => n.id === targetId);
                if (!targetNode) return null;
                return (
                  <Line
                    key={`${node.id}-${targetId}`}
                    points={[node.position, targetNode.position]}
                    color={layer.color}
                    lineWidth={1}
                    opacity={0.5}
                    transparent
                  />
                );
              })
            )}
          </group>
        ))}
      </Canvas>
    </div>
  );
};

export default ProjectionView;