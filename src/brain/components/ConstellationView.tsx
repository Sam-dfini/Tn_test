import React, { useState, useEffect } from 'react';
import { Line } from '@react-three/drei';
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
      {nodes.map((node) => (
        <group key={node.id} position={node.position}>
          <mesh>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.7} />
          </mesh>
        </group>
      ))}

      {links.map((link) => {
        const sourceNode = nodes.find((n) => n.id === link.source);
        const targetNode = nodes.find((n) => n.id === link.target);
        if (!sourceNode || !targetNode) return null;

        return (
          <Line
            key={`${link.source}-${link.target}`}
            points={[sourceNode.position, targetNode.position]}
            color="#666666"
            lineWidth={1}
          />
        );
      })}
    </>
  );
};

export default ConstellationView;