import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Search, Database, Shield, Activity, Eye, FileText, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { select } from 'd3-selection';
import { zoom } from 'd3-zoom';
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force';
import { drag } from 'd3-drag';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { intelligenceGraph, GraphNode, GraphLink } from '../../services/intelligenceGraph';

interface PalantirDashboardProps {
  onOpenAI: () => void;
  onOpenPipeline: () => void;
  onGoHome: () => void;
  onOpenReport: () => void;
  onOpenObservability: () => void;
  context?: any;
}

interface Node extends SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  risk?: string;
  role?: string;
  type?: string;
  category?: string;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
  label?: string;
}

const mockNodes: Node[] = [
  { id: 'Noureddine Taboubi', group: 1, label: 'Noureddine Taboubi', risk: 'HIGH', role: 'UGTT Sec-Gen', type: 'Individual' },
  { id: 'Ahmed Nejib Chebbi', group: 2, label: 'Ahmed Nejib Chebbi', risk: 'MODERATE', role: 'NSF Leader', type: 'Individual' },
  { id: 'Gafsa Phosphate Co.', group: 3, label: 'Gafsa Phosphate Co.', risk: 'HIGH', role: 'State Enterprise', type: 'Organization' },
  { id: 'UGTT Leadership', group: 1, label: 'UGTT Leadership', type: 'Organization' },
  { id: 'Opposition Figures', group: 2, label: 'Opposition Figures', type: 'Organization' },
  { id: 'Gafsa Protesters', group: 3, label: 'Gafsa Protesters', type: 'Movement' },
  { id: 'Ministry of Energy', group: 3, label: 'Ministry of Energy', type: 'Organization' },
  { id: 'Financial Anomaly Sector', group: 4, label: 'Financial Anomaly', risk: 'HIGH', type: 'Event' },
];

const mockLinks: Link[] = [
  { source: 'Noureddine Taboubi', target: 'UGTT Leadership', value: 3 },
  { source: 'Ahmed Nejib Chebbi', target: 'Opposition Figures', value: 3 },
  { source: 'UGTT Leadership', target: 'Opposition Figures', value: 1, label: 'New Connection' },
  { source: 'Gafsa Phosphate Co.', target: 'Gafsa Protesters', value: 2 },
  { source: 'Gafsa Phosphate Co.', target: 'Ministry of Energy', value: 2 },
  { source: 'Ministry of Energy', target: 'Financial Anomaly Sector', value: 1 },
];

export const PalantirDashboard: React.FC<PalantirDashboardProps> = ({
  onOpenAI,
  onOpenPipeline,
  onGoHome,
  onOpenReport,
  onOpenObservability,
  context
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<Node | null>(null);
  const [pathNodes, setPathNodes] = useState<string[]>([]);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);

  const [isComputing, setIsComputing] = useState(false);

  const fetchGraphData = async () => {
    setIsLoading(true);
    // Simulate tactical delay for hydration
    await new Promise(r => setTimeout(r, 600));
    const data = await intelligenceGraph.getGraph();
    
    if (data.nodes.length === 0) {
      // Use mock nodes only if DB is empty
      setNodes(mockNodes);
      setLinks(mockLinks);
    } else {
      // Transform incoming data to d3 format
      const d3Nodes: Node[] = data.nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        group: n.type === 'variable' ? 1 : 2,
        risk: n.risk,
        category: n.category
      }));

      const d3Links: Link[] = data.links.map(l => ({
        source: l.source,
        target: l.target,
        value: Number(l.weight) * 3,
        label: l.description
      }));

      setNodes(d3Nodes);
      setLinks(d3Links);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGraphData();

    // Subscribe to graph changes
    const channel = intelligenceGraph.subscribeToGraph(() => {
      fetchGraphData();
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    svg.attr("viewBox", [0, 0, width, height]);

    // Create a simulation with several forces
    const simulation = forceSimulation<Node>(nodes)
      .force("link", forceLink<Node, Link>(links).id(d => d.id).distance(120))
      .force("charge", forceManyBody().strength(-400))
      .force("center", forceCenter(width / 2, height / 2))
      .force("collide", forceCollide().radius(40));

    // Handle zooming
    const g = svg.append("g");
    const zoom = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom as any);

    // Color scale for groups
    const color = scaleOrdinal(schemeCategory10);

    // Filter out invalid links (missing sources/targets)
    const validLinks = links.filter(l => 
      nodes.some(n => n.id === (typeof l.source === 'string' ? l.source : l.source.id)) &&
      nodes.some(n => n.id === (typeof l.target === 'string' ? l.target : l.target.id))
    );

    // Draw links
    const link = g.append("g")
      .attr("stroke", "#4f46e5") // indigo-600
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(validLinks)
      .join("line")
      .attr("stroke-width", d => Math.max(1, Math.sqrt(d.value)));

    // Define drag behavior
    const drag = drag<SVGGElement, Node>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // Draw nodes
    const nodeGroup = g.append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("class", "node-group")
      .call(drag as any)
      .on("click", (event, d) => {
        setSelectedEntity(d);
        event.stopPropagation();
      });

    // Add pulse circle for critical/high risk nodes
    nodeGroup.filter(d => d.risk === 'CRITICAL' || d.risk === 'HIGH')
      .append("circle")
      .attr("r", 15)
      .attr("fill", "#ef4444")
      .attr("fill-opacity", 0.3)
      .attr("stroke", "none")
      .attr("class", "node-pulse")
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", "12;20;12")
      .attr("dur", "2s")
      .attr("repeatCount", "indefinite");

    // Add circles to node group
    nodeGroup.append("circle")
      .attr("r", d => d.risk === 'HIGH' || d.type === 'event' ? 12 : 8)
      .attr("fill", d => {
        if (d.risk === 'CRITICAL' || d.risk === 'HIGH') return '#ef4444'; // red-500
        if (d.risk === 'MEDIUM' || d.risk === 'MODERATE') return '#eab308'; // yellow-500
        if (d.type === 'event') return '#818cf8'; // indigo-400
        return color(d.group.toString());
      });

    // Add labels to node group
    nodeGroup.append("text")
      .attr("dx", 15)
      .attr("dy", ".35em")
      .text(d => d.label)
      .attr("fill", "#cbd5e1") // slate-300
      .attr("stroke", "none")
      .attr("font-size", "10px")
      .attr("font-family", "mono");

    // Add labels to links if exist
    const linkText = g.append("g")
      .selectAll("text")
      .data(validLinks.filter(d => d.label))
      .join("text")
      .attr("font-size", "8px")
      .attr("fill", "#818cf8") // indigo-400
      .attr("stroke", "none")
      .text(d => d.label || "");

    // Update positions on each tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x || 0)
        .attr("y1", d => (d.source as Node).y || 0)
        .attr("x2", d => (d.target as Node).x || 0)
        .attr("y2", d => (d.target as Node).y || 0);

      linkText
        .attr("x", d => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr("y", d => ((d.source as Node).y! + (d.target as Node).y!) / 2);

      nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Update highlight for causal path
    const updatePathHighlight = () => {
      nodeGroup.select("circle")
        .transition()
        .duration(500)
        .attr("stroke", d => pathNodes.includes(d.id) ? "#fbbf24" : "#fff") // yellow-400
        .attr("stroke-width", d => pathNodes.includes(d.id) ? 4 : 1.5)
        .attr("r", d => {
          if (pathNodes.includes(d.id)) return 14;
          return d.risk === 'HIGH' || d.type === 'event' ? 12 : 8;
        });

      link
        .transition()
        .duration(500)
        .attr("stroke", d => {
          const sId = typeof d.source === 'string' ? d.source : (d.source as Node).id;
          const tId = typeof d.target === 'string' ? d.target : (d.target as Node).id;
          const sIdx = pathNodes.indexOf(sId);
          const tIdx = pathNodes.indexOf(tId);
          if (sIdx !== -1 && tIdx !== -1 && Math.abs(sIdx - tIdx) === 1) {
            return "#fbbf24";
          }
          return "#4f46e5";
        })
        .attr("stroke-opacity", d => {
          const sId = typeof d.source === 'string' ? d.source : (d.source as Node).id;
          const tId = typeof d.target === 'string' ? d.target : (d.target as Node).id;
          const sIdx = pathNodes.indexOf(sId);
          const tIdx = pathNodes.indexOf(tId);
          if (sIdx !== -1 && tIdx !== -1 && Math.abs(sIdx - tIdx) === 1) {
            return 1;
          }
          return 0.6;
        })
        .attr("stroke-width", d => {
          const sId = typeof d.source === 'string' ? d.source : (d.source as Node).id;
          const tId = typeof d.target === 'string' ? d.target : (d.target as Node).id;
          const sIdx = pathNodes.indexOf(sId);
          const tIdx = pathNodes.indexOf(tId);
          if (sIdx !== -1 && tIdx !== -1 && Math.abs(sIdx - tIdx) === 1) {
            return 4;
          }
          return Math.max(1, Math.sqrt(d.value));
        });
    };

    updatePathHighlight();

    svg.on("click", () => setSelectedEntity(null));

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  const findPath = async () => {
    if (!sourceNodeId || !targetNodeId) return;
    setIsComputing(true);
    // Simulate heavy compute cycles
    await new Promise(r => setTimeout(r, 1200));
    const path = await intelligenceGraph.findCausalPath(sourceNodeId, targetNodeId);
    setPathNodes(path);
    setIsComputing(false);
  };

  const resetPath = () => {
    setPathNodes([]);
    setSourceNodeId(null);
    setTargetNodeId(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-300 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-indigo-500/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onGoHome} className="text-indigo-400 hover:text-indigo-300 transition-colors">
            <Network className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-widest uppercase">Palantir <span className="text-indigo-400">Mode</span></h1>
            <div className="text-[10px] font-mono text-indigo-400/70 uppercase">Link Analysis & Entity Resolution</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={fetchGraphData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onOpenObservability} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-bold uppercase tracking-widest">
            <Activity className="w-4 h-4" />
            Mission Control
          </button>
          <button onClick={onOpenPipeline} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
            <Database className="w-5 h-5" />
          </button>
          <button onClick={onOpenAI} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
            <Zap className="w-5 h-5" />
          </button>
          <button onClick={onOpenReport} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Entities */}
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-500/20 rounded-xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-between">
              <span className="flex items-center">
                <Search className="w-4 h-4 mr-2 text-indigo-400" />
                Causal Path Analysis
              </span>
              {pathNodes.length > 0 && (
                <button onClick={resetPath} className="text-[10px] text-red-400 hover:text-red-300">
                  RESET
                </button>
              )}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Source (Trigger)</label>
                <select 
                  value={sourceNodeId || ''} 
                  onChange={(e) => setSourceNodeId(e.target.value)}
                  className="w-full bg-[#0f172a] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Select source entity...</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Target (Outcome)</label>
                <select 
                  value={targetNodeId || ''} 
                  onChange={(e) => setTargetNodeId(e.target.value)}
                  className="w-full bg-[#0f172a] border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">Select target outcome...</option>
                  {nodes.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              </div>

              <button 
                onClick={findPath}
                disabled={!sourceNodeId || !targetNodeId || isLoading || isComputing}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                {isComputing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-200" />
                    Computing Path...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Deduce Domino Chain
                  </>
                )}
              </button>

              {pathNodes.length > 0 && (
                <div className="mt-4 p-4 bg-indigo-500/5 border border-indigo-400/20 rounded-lg">
                  <div className="text-[10px] font-mono text-indigo-400 uppercase mb-2">Inferred Causal Vector</div>
                  <div className="space-y-2">
                    {pathNodes.map((id, i) => {
                      const nodeLabel = nodes.find(n => n.id === id)?.label || id;
                      return (
                        <div key={id} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-400' : i === pathNodes.length - 1 ? 'bg-red-400' : 'bg-slate-400'}`}></div>
                          <div className="text-[11px] text-slate-200">{nodeLabel}</div>
                          {i < pathNodes.length - 1 && <div className="text-slate-600">→</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1e293b] border border-indigo-500/20 rounded-xl p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-indigo-400" />
              High-Risk Entities
            </h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {nodes.filter(n => n.risk === 'HIGH' || n.risk === 'CRITICAL').length > 0 ? (
                nodes.filter(n => n.risk === 'HIGH' || n.risk === 'CRITICAL').map((entity, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedEntity(entity)}
                    className={`p-3 rounded-lg bg-[#0f172a] border cursor-pointer transition-colors ${selectedEntity?.id === entity.id ? 'border-indigo-400 bg-indigo-500/5' : 'border-indigo-500/10 hover:border-indigo-500/30'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-bold text-white">{entity.label}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{entity.type} {entity.category ? `· ${entity.category}` : ''}</div>
                      </div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded ${entity.risk === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-400'}`}>
                        {entity.risk}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  [ NO CRITICAL ENTITIES DETECTED ]
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column - Graph Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1e293b] border border-indigo-500/20 rounded-xl p-6 h-[500px] flex flex-col relative">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center">
              <Network className="w-4 h-4 mr-2 text-indigo-400" />
              Intelligence Network Graph
            </h2>
            <div ref={containerRef} className="flex-1 bg-[#0f172a] rounded-lg border border-indigo-500/10 flex items-center justify-center relative overflow-hidden" id="palantir-graph">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-[#0f172a]/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  <div className="text-[10px] font-mono text-indigo-400 animate-pulse tracking-widest uppercase">Fetching Live Intelligence...</div>
                </div>
              )}

              <svg ref={svgRef} className="w-full h-full z-10 cursor-move" />

              {/* Selection Summary Overlay */}
              <AnimatePresence>
                {selectedEntity && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-4 right-4 z-30 w-64 bg-[#1e293b]/95 backdrop-blur-md border border-indigo-400/40 p-4 rounded-lg shadow-2xl"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Entity Context</div>
                      <button onClick={() => setSelectedEntity(null)} className="text-slate-500 hover:text-white">
                        <Activity className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-lg font-bold text-white mb-1">{selectedEntity.label}</div>
                    <div className="text-[10px] text-indigo-300 font-mono uppercase mb-4">{selectedEntity.type} · {selectedEntity.category || 'GENERAL'}</div>
                    
                    <div className="space-y-3">
                      <div className="p-2 bg-[#0f172a] rounded border border-indigo-500/10">
                        <div className="text-[9px] text-slate-500 uppercase mb-1">Risk Assessment</div>
                        <div className={`text-xs font-bold ${selectedEntity.risk === 'HIGH' || selectedEntity.risk === 'CRITICAL' ? 'text-red-400' : 'text-indigo-400'}`}>
                          {selectedEntity.risk || 'STABLE'}
                        </div>
                      </div>
                      
                      <div className="text-[10px] text-slate-400 italic">
                        Node represents a key {selectedEntity.type} within the current operational theater. Linkages suggest high-affinity influence vectors.
                      </div>
                    </div>

                    <button className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest transition-colors rounded">
                      Open Dossier
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#1e293b] border border-indigo-500/20 rounded-xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-indigo-400" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5"></div>
                  <div>
                    <div className="text-xs font-bold text-white">New Connection Detected</div>
                    <div className="text-[10px] text-slate-400">UGTT Leadership ↔ Opposition Figures</div>
                    <div className="text-[9px] text-indigo-400/70 mt-1">2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5"></div>
                  <div>
                    <div className="text-xs font-bold text-white">Risk Level Escalation</div>
                    <div className="text-[10px] text-slate-400">Gafsa Region Protests</div>
                    <div className="text-[9px] text-indigo-400/70 mt-1">5 hours ago</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b] border border-indigo-500/20 rounded-xl p-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center">
                <Eye className="w-4 h-4 mr-2 text-indigo-400" />
                Watchlist Alerts
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="text-xs font-bold text-white mb-1">Financial Anomaly</div>
                  <div className="text-[10px] text-slate-400">Unusual capital outflow detected in monitored sector.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
