import type { EntityType } from '@fathom/data';

import { getMaritimeGraph, neighbors, type GraphNode, type MaritimeGraph } from './graph';

/**
 * Random exploration: uniform picks and drifting walks across the graph.
 * Callers may pass their own `random` (seeded) for determinism; the
 * default is Math.random.
 */

/** Entity types that have their own pages — sensible random destinations. */
export const EXPLORABLE_TYPES: readonly EntityType[] = [
  'strait',
  'water-body',
  'country',
  'region',
  'port',
  'canal',
  'bridge',
  'tunnel',
  'island',
  'maritime-route',
];

export function randomEntity(
  options?: {
    types?: readonly EntityType[];
    excludeId?: string;
    random?: () => number;
  },
  graph: MaritimeGraph = getMaritimeGraph(),
): GraphNode | null {
  const random = options?.random ?? Math.random;
  const types = options?.types ?? EXPLORABLE_TYPES;
  const pool = [...graph.nodes.values()].filter(
    (node) => types.includes(node.type) && node.entityId !== options?.excludeId,
  );
  if (pool.length === 0) return null;
  return pool[Math.floor(random() * pool.length)] ?? null;
}

/**
 * A drifting walk: from a start node, repeatedly hop to a random neighbor.
 * Returns the nodes visited (start excluded), never revisiting one. Ends
 * early at a dead end.
 */
export function randomWalk(
  start: string,
  steps: number,
  options?: { random?: () => number },
  graph: MaritimeGraph = getMaritimeGraph(),
): readonly GraphNode[] {
  const random = options?.random ?? Math.random;
  const visited = new Set<string>([start]);
  const path: GraphNode[] = [];
  let current = start;

  for (let step = 0; step < steps; step += 1) {
    const candidates = neighbors(graph, current).filter(({ node }) => !visited.has(node.entityId));
    const pick = candidates[Math.floor(random() * candidates.length)];
    if (!pick) break;
    visited.add(pick.node.entityId);
    path.push(pick.node);
    current = pick.node.entityId;
  }
  return path;
}
