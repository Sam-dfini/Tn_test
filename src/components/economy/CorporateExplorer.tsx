/**
 * CorporateExplorer.tsx
 * TunisiaIntel — Entity Resolution & Relationship Discovery
 *
 * Visualizes companies, organizations, and people derived from live data streams.
 * Uses D3 force-directed graph for relationship mapping.
 */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  User, 
  Link2, 
  Search, 
  Zap, 
  Info, 
  ChevronRight,
  Maximize2,
  RefreshCw,
  Filter,
  Share2
} from 'lucide-react';
import { useAIAnalysis } from '../../context/AIAnalysisContext';
import { EntityNode, EntityLink, EntityType } from '../../services/entityResolution';
import { cn } from '../../utils/cn';

const TYPE_CONFIG: Record<EntityType, { icon: any, color: string, label: string }> = {
  COMPANY: { icon: Building2, color: '#00f2ff', label: 'Company' },
  ORGANIZATION: { icon: Users, color: '#f97316', label: 'Org' },
  PERSON: { icon: User, color: '#a855f7', label: 'Person' },
  SECTOR: { icon: Zap, color: '#10b981', label: 'Sector' },
};

export const CorporateExplorer: React.FC = () => {
  const { entityNetwork } = useAIAnalysis();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<EntityNode | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNodes = useMemo(() => {
    if (!entityNetwork) return [];
    if (!searchTerm) return entityNetwork.nodes;
    return entityNetwork.nodes.filter(n => 
      n.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [entityNetwork, searchTerm]);

  useEffect(() => {
    if (!svgRef.current || !entityNetwork || !filteredNodes.length) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = 500;

    const svg = select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Zoom behavior
    const zoom = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Forces
    const simulation = forceSimulation<any>(filteredNodes)
      .force('link', forceLink<any, any>(entityNetwork.links)
        .id(d => d.id)
        .distance(120)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collision', forceCollide().radius(50));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(entityNetwork.links)
      .join('line')
      .attr('stroke', '#ffffff10')
      .attr('stroke-width', d => d.weight * 3)
      .attr('stroke-dasharray', d => d.type === 'CONFLICT' ? '4,4' : 'none');

    // Nodes
    const node = g.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .join('g')
      .attr('cursor', 'pointer')
      .on('click', (event, d) => {
        setSelectedEntity(d);
        event.stopPropagation();
      })
      .on('mouseover', (event, d) => setHoveredEntity(d.id))
      .on('mouseout', () => setHoveredEntity(null));

    // Node circles
    node.append('circle')
      .attr('r', d => 25 + (d.mentions || 0) * 2)
      .attr('fill', d => `${TYPE_CONFIG[d.type].color}15`)
      .attr('stroke', d => TYPE_CONFIG[d.type].color)
      .attr('stroke-width', 1.5);

    // Node labels
    node.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 40)
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold');

    // Update positions
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [filteredNodes, entityNetwork]);

  return (
    <div className="flex flex-col h-[600px] bg-[#0a0c10] border border-white/5 rounded-2xl overflow-hidden relative" ref={containerRef}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-intel-cyan/10 rounded-lg">
            <Share2 className="w-4 h-4 text-intel-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Entity Resolution Explorer</h3>
            <p className="text-[9px] text-white/30 font-mono">Live mapping of company and institutional relationships</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input 
              type="text" 
              placeholder="Filter entities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-intel-cyan/50 transition-all w-48"
            />
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-3 glass border border-white/5 rounded-xl space-y-2 z-10">
          {Object.entries(TYPE_CONFIG).map(([type, config]) => (
            <div key={type} className="flex items-center gap-2 text-[9px] font-mono">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
              <span className="text-white/40 uppercase tracking-tighter">{config.label}</span>
            </div>
          ))}
        </div>

        {/* Selected Entity Card */}
        <AnimatePresence>
          {selectedEntity && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="absolute top-4 right-4 w-64 glass border border-white/10 rounded-2xl p-5 z-30 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${TYPE_CONFIG[selectedEntity.type].color}20` }}>
                    {React.createElement(TYPE_CONFIG[selectedEntity.type].icon, { 
                      className: "w-4 h-4", 
                      style: { color: TYPE_CONFIG[selectedEntity.type].color } 
                    })}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase font-mono">{selectedEntity.label}</h4>
                    <span className="text-[8px] font-mono opacity-40 uppercase tracking-widest">{selectedEntity.type}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedEntity(null)} className="text-white/20 hover:text-white transition-all">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <div className="text-[7px] font-mono text-white/20 uppercase mb-1">Mentions</div>
                    <div className="text-sm font-bold font-mono text-intel-cyan">{selectedEntity.mentions}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                    <div className="text-[7px] font-mono text-white/20 uppercase mb-1">Sentiment</div>
                    <div className={cn(
                      "text-sm font-bold font-mono",
                      selectedEntity.sentiment > 0 ? "text-emerald-400" : selectedEntity.sentiment < 0 ? "text-intel-red" : "text-intel-cyan"
                    )}>
                      {selectedEntity.sentiment > 0 ? '+' : ''}{selectedEntity.sentiment.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[8px] font-mono text-white/20 uppercase px-1">Network Connections</div>
                  <div className="max-h-32 overflow-y-auto space-y-1 no-scrollbar">
                    {entityNetwork?.links.filter(l => l.source.id === selectedEntity.id || l.target.id === selectedEntity.id).map((l, i) => {
                      const other = l.source.id === selectedEntity.id ? l.target : l.source;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 text-[9px] font-mono">
                          <span className="text-white/60">{other.label}</span>
                          <span className="text-white/20 italic">{l.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-mono text-white/60 hover:text-white transition-all flex items-center justify-center gap-2">
                    <Info className="w-3 h-3" />
                    Deep Entity Investigation
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
