import { supabase } from '../lib/supabase';

export interface GraphNode {
  id: string;
  label: string;
  type: 'variable' | 'event' | 'source' | 'region';
  category?: string;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  value?: number;
  metadata?: any;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
  description?: string;
  type?: string;
}

export interface IntelligenceGraph {
  nodes: GraphNode[];
  links: GraphLink[];
}

class IntelligenceGraphService {
  /**
   * Fetches the current intelligence graph from Supabase.
   * Merges variables, events, and their relationships.
   */
  async getGraph(): Promise<IntelligenceGraph> {
    try {
      // 1. Fetch Variables as nodes
      const { data: variables, error: varError } = await supabase
        .from('variables')
        .select('*')
        .limit(50);
      
      if (varError) throw varError;

      // 2. Fetch Recent Events as nodes
      const { data: events, error: eventError } = await supabase
        .from('events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);

      if (eventError) throw eventError;

      // 3. Fetch Relationships as links
      const { data: relationships, error: relError } = await supabase
        .from('relationships')
        .select('*')
        .limit(100);

      if (relError) throw relError;

      const nodes: GraphNode[] = [];
      const links: GraphLink[] = [];

      // Add variables to nodes
      variables?.forEach(v => {
        nodes.push({
          id: v.id,
          label: v.label,
          type: 'variable',
          category: v.category,
          value: v.current_value,
          metadata: v.metadata
        });
      });

      // Add events to nodes
      events?.forEach(e => {
        nodes.push({
          id: e.id,
          label: e.event_type,
          type: 'event',
          risk: e.severity as any,
          metadata: { description: e.description, location: e.location }
        });
      });

      // Add explicit relationships to links
      relationships?.forEach(r => {
        links.push({
          source: r.source_id,
          target: r.target_id,
          weight: r.influence_weight || 0.5,
          description: r.description
        });
      });

      // Create implicit links between events and variables if they share keywords or metadata
      // (This is a simplified entity resolution)
      events?.forEach(e => {
        variables?.forEach(v => {
          if (e.description.toLowerCase().includes(v.label.toLowerCase())) {
            links.push({
              source: e.id,
              target: v.id,
              weight: 0.8,
              description: 'Semantic Correlation'
            });
          }
        });
      });

      // Deduplicate links
      const uniqueLinks = Array.from(new Map(links.map(l => [`${l.source}-${l.target}`, l])).values());

      return {
        nodes,
        links: uniqueLinks
      };
    } catch (error) {
      console.error('Error fetching intelligence graph:', error);
      // Fallback to basic graph if DB fails or is empty
      return { nodes: [], links: [] };
    }
  }

  /**
   * Real-time subscription to graph changes
   */
  subscribeToGraph(callback: (event: any) => void) {
    return supabase
      .channel('graph_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'relationships' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'variables' }, callback)
      .subscribe();
  }
}

export const intelligenceGraph = new IntelligenceGraphService();
