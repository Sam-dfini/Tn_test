import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface SimulationParameter {
  id: string;
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

interface SimulationNode {
  id: string;
  name: string;
  position: [number, number, number];
  baselineRisk: number;
  projectedRisk: number;
}

const SimulationView: React.FC = () => {
  // Simulation parameters
  const [parameters, setParameters] = useState<SimulationParameter[]>([
    { id: 'fuel-prices', name: 'Fuel Prices', value: 1.5, min: 0.5, max: 3.0, step: 0.1 },
    { id: 'internet-shutdowns', name: 'Internet Shutdowns', value: 0, min: 0, max: 10, step: 1 },
    { id: 'unemployment-rate', name: 'Unemployment Rate', value: 15, min: 5, max: 30, step: 1 },
    { id: 'food-shortages', name: 'Food Shortages', value: 2, min: 0, max: 10, step: 0.5 },
  ]);

  // Simulation nodes (governorates)
  const [nodes, setNodes] = useState<SimulationNode[]>([
    { id: 'tunis', name: 'Tunis', position: [0, 0, 0], baselineRisk: 0.5, projectedRisk: 0.5 },
    { id: 'sfax', name: 'Sfax', position: [5, 0, 0], baselineRisk: 0.6, projectedRisk: 0.6 },
    { id: 'kasserine', name: 'Kasserine', position: [2, 3, 0], baselineRisk: 0.8, projectedRisk: 0.8 },
    { id: 'gabes', name: 'Gabes', position: [-3, 2, 0], baselineRisk: 0.7, projectedRisk: 0.7 },
    { id: 'medenine', name: 'Medenine', position: [-5, -2, 0], baselineRisk: 0.9, projectedRisk: 0.9 },
  ]);

  // Run simulation
  const runSimulation = () => {
    const newNodes = nodes.map(node => {
      // Simulate impact of parameters on projected risk
      let riskIncrease = 0;
      parameters.forEach(param => {
        if (param.id === 'fuel-prices' && param.value > 2.0) riskIncrease += 0.1;
        if (param.id === 'internet-shutdowns' && param.value > 5) riskIncrease += 0.2;
        if (param.id === 'unemployment-rate' && param.value > 20) riskIncrease += 0.3;
        if (param.id === 'food-shortages' && param.value > 5) riskIncrease += 0.2;
      });

      // Apply risk increase with some randomness
      const newProjectedRisk = Math.min(1.0, node.baselineRisk + riskIncrease + (Math.random() * 0.1));
      return { ...node, projectedRisk: newProjectedRisk };
    });

    setNodes(newNodes);
  };

  // Update parameter value
  const updateParameter = (id: string, value: number) => {
    setParameters(parameters.map(param => param.id === id ? { ...param, value } : param));
  };

  return (
    <div style={{ width: '100vw', height: '100%', backgroundColor: '#0a0a0f', display: 'flex' }}>
      {/* Parameters Panel */}
      <div style={{ width: '300px', padding: '20px', background: 'rgba(0, 0, 0, 0.7)', color: 'white' }}>
        <h3>Simulation Parameters</h3>
        {parameters.map(param => (
          <div key={param.id} style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>{param.name}: {param.value}</label>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={param.value}
              onChange={(e) => updateParameter(param.id, parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        ))}
        <button
          onClick={runSimulation}
          style={{ padding: '10px 15px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Run Simulation
        </button>
      </div>

      {/* 3D Visualization */}
      <div style={{ flex: 1, position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls />

          {/* Nodes */}
          {nodes.map(node => {
            const riskColor = new THREE.Color().setHSL(0, 1, node.projectedRisk);
            return (
              <mesh key={node.id} position={node.position}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshStandardMaterial color={riskColor} emissive={riskColor} emissiveIntensity={0.5} />
              </mesh>
            );
          })}
        </Canvas>
      </div>
    </div>
  );
};

export default SimulationView;
