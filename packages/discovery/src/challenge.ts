import { distanceKm, type EntityRef } from '@fathom/data';

import { getMaritimeGraph, neighbors, type GraphNode } from './graph';

/**
 * Chart challenges: geography questions answered by clicking the map.
 * Everything derives from the graph — the correct waters are the ones the
 * strait actually joins, decoys are the nearest other anchored waters,
 * and anchor positions come from the water documents' representative
 * coordinates.
 */

export interface ChallengeTarget {
  id: string;
  label: string;
  lat: number;
  lon: number;
  correct: boolean;
}

export interface ChartChallenge {
  prompt: string;
  targets: readonly ChallengeTarget[];
}

const anchored = (node: GraphNode): node is GraphNode & { lat: number; lon: number } =>
  node.lat !== undefined && node.lon !== undefined;

/** Deterministic shuffle so a stop's challenge is stable across visits. */
function seededOrder<T>(items: T[], seedText: string): T[] {
  let seed = 0;
  for (const char of seedText) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const a = result[i];
    const b = result[j];
    if (a !== undefined && b !== undefined) {
      result[i] = b;
      result[j] = a;
    }
  }
  return result;
}

/**
 * A "find the waters" challenge for a strait: click the two waters it
 * joins, among nearby decoys. Null when the strait or its waters lack
 * chart anchors.
 */
export function chartChallengeFor(ref: EntityRef): ChartChallenge | null {
  if (ref.type !== 'strait') return null;
  const graph = getMaritimeGraph();
  const self = graph.nodes.get(`strait:${ref.id}`);
  if (!self || !anchored(self)) return null;

  const answers = neighbors(graph, self.entityId, { kinds: ['connected_to'] })
    .map(({ node }) => node)
    .filter((node) => node.type === 'water-body')
    .filter(anchored);
  if (answers.length !== 2) return null;

  const answerIds = new Set(answers.map((node) => node.id));
  const decoys = [...graph.nodes.values()]
    .filter((node) => node.type === 'water-body' && !answerIds.has(node.id))
    .filter(anchored)
    .filter((node) =>
      answers.every((answer) => distanceKm(node.lat, node.lon, answer.lat, answer.lon) > 250),
    )
    .sort(
      (a, b) =>
        distanceKm(a.lat, a.lon, self.lat, self.lon) - distanceKm(b.lat, b.lon, self.lat, self.lon),
    )
    .slice(0, 2);
  if (decoys.length === 0) return null;

  const targets = seededOrder(
    [
      ...answers.map((node) => ({
        id: node.id,
        label: node.name,
        lat: node.lat,
        lon: node.lon,
        correct: true,
      })),
      ...decoys.map((node) => ({
        id: node.id,
        label: node.name,
        lat: node.lat,
        lon: node.lon,
        correct: false,
      })),
    ],
    ref.id,
  );

  return { prompt: `On the chart, click the two waters the ${self.name} joins.`, targets };
}
