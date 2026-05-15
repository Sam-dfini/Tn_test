export interface Entity {
  id: string; type: string; label: string; aliases?: string[];
  first_seen?: string; last_seen?: string; confidence?: number;
  metadata?: Record<string, any>; tier?: number; domain?: string[];
  power_type?: string; color?: string; size?: number;
  resources?: Record<string, number>; goals?: string[]; constraints?: string[];
  risk_tolerance?: string; time_horizon?: string;
  fixed_x?: number | null; fixed_y?: number | null;
}

export interface Relation {
  id: string; source_id: string; target_id: string; type: string;
  weight?: number; domain?: string; description?: string;
  conditionality?: string; trend?: string;
  valid_from?: string; valid_to?: string; confidence?: number;
}

export interface GraphQuery {
  source_id: string;
  relation_type?: string;
  max_depth?: number;
}

const BASE = '/api/graph';

async function fetchJSON(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Graph API error: ${res.status}`);
  return res.json();
}

export async function fetchEntities(type?: string): Promise<Entity[]> {
  const params = type ? `?type=${type}` : '';
  return fetchJSON(`${BASE}/entities${params}`);
}

export async function fetchEntity(id: string): Promise<Entity> {
  return fetchJSON(`${BASE}/entities/${id}`);
}

export async function fetchRelations(type?: string): Promise<Relation[]> {
  const params = type ? `?type=${type}` : '';
  return fetchJSON(`${BASE}/relations${params}`);
}

export async function fetchRelationsForEntity(id: string): Promise<Relation[]> {
  return fetchJSON(`${BASE}/relations/${id}`);
}

export async function queryGraph(query: GraphQuery): Promise<any> {
  return fetchJSON(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...query, action: 'traverse' }),
  });
}

export async function fetchNeighbors(id: string): Promise<{
  entity: Entity; relations: Relation[]; neighbors: Entity[];
}> {
  return fetchJSON(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_id: id, action: 'neighbors' }),
  });
}

export async function seedGraph(): Promise<{ entities_seeded: number; relations_seeded: number }> {
  return fetchJSON(`${BASE}/seed`, { method: 'POST' });
}
