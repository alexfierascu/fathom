import {
  distanceKm,
  loadAllStraits,
  loadHistoricalEvents,
  parseEntityId,
  type EntityType,
} from '@fathom/data';

import { getMaritimeGraph, neighbors, type GraphNode, type MaritimeGraph } from './graph';
import { randomEntity } from './random';
import { similarStraits } from './similarity';

/**
 * The recommendation engine behind every "Continue Exploring" section.
 * Given any entity, it assembles labeled groups of destinations, each item
 * carrying the reason it was suggested. Deterministic groups are cached
 * per entity; the Random Discovery group is drawn fresh on every call so
 * exploration never repeats itself.
 */

export interface Recommendation {
  entityId: string;
  type: EntityType;
  id: string;
  name: string;
  reason: string;
}

export interface RecommendationGroup {
  key: string;
  title: string;
  items: readonly Recommendation[];
}

const ITEM_LIMIT = 6;

const toRecommendation = (node: GraphNode, reason: string): Recommendation => ({
  entityId: node.entityId,
  type: node.type,
  id: node.id,
  name: node.name,
  reason,
});

const group = (
  key: string,
  title: string,
  items: readonly Recommendation[],
): RecommendationGroup => ({ key, title, items: items.slice(0, ITEM_LIMIT) });

function straitGroups(graph: MaritimeGraph, canonicalId: string): RecommendationGroup[] {
  const strait = loadAllStraits().find((s) => `strait:${s.id}` === canonicalId);
  if (!strait) return [];

  const waters = neighbors(graph, canonicalId, { kinds: ['connected_to'] }).filter(
    ({ node }) => node.type === 'water-body',
  );

  // Straits reached through a shared water body — genuinely linked geography.
  const connectedStraits = new Map<string, Recommendation>();
  for (const { node: water } of waters) {
    for (const { node } of neighbors(graph, water.entityId, { kinds: ['connected_to'] })) {
      if (node.type !== 'strait' || node.entityId === canonicalId) continue;
      if (!connectedStraits.has(node.entityId)) {
        connectedStraits.set(
          node.entityId,
          toRecommendation(node, `Also opens onto the ${water.name}`),
        );
      }
    }
  }

  const nearby = neighbors(graph, canonicalId, { kinds: ['nearby'] }).map(({ node }) => {
    const km =
      node.lat !== undefined && node.lon !== undefined
        ? Math.round(distanceKm(strait.lat, strait.lon, node.lat, node.lon))
        : null;
    return toRecommendation(node, km === null ? 'Close by' : `About ${String(km)} km away`);
  });

  const seas = waters.map(({ node }) => toRecommendation(node, `Joined by the ${strait.name}`));

  const countries = neighbors(graph, canonicalId, { kinds: ['borders'] }).map(({ node }) =>
    toRecommendation(node, 'On its shore'),
  );

  const similar = similarStraits(strait, ITEM_LIMIT).map((result) => ({
    entityId: result.entityId,
    type: 'strait' as const,
    id: result.id,
    name: result.name,
    reason: result.reasons[0]?.detail ?? 'A kindred strait',
  }));

  const historical: Recommendation[] = [];
  for (const event of loadHistoricalEvents()) {
    if (!event.involves.some((ref) => ref.type === 'strait' && ref.id === strait.id)) continue;
    for (const ref of event.involves) {
      const node = graph.nodes.get(`${ref.type}:${ref.id}`);
      if (!node || node.entityId === canonicalId) continue;
      historical.push(toRecommendation(node, `Linked by the ${event.name}`));
    }
  }

  const regionId = neighbors(graph, canonicalId, { kinds: ['belongs_to'] }).find(
    ({ node }) => node.type === 'region',
  )?.node;
  const sameRegion = regionId
    ? neighbors(graph, regionId.entityId, { kinds: ['contains'] })
        .filter(({ node }) => node.type === 'strait' && node.entityId !== canonicalId)
        .map(({ node }) => toRecommendation(node, `Also in ${regionId.name}`))
    : [];

  return [
    group('connected-straits', 'Connected straits', [...connectedStraits.values()]),
    group('nearby-straits', 'Nearby straits', nearby),
    group('connected-seas', 'Connected seas', seas),
    group('neighbouring-countries', 'Neighbouring countries', countries),
    group('strategically-similar', 'Strategically similar', similar),
    group('historically-related', 'Historically related', historical),
    group('same-region', 'Same region', shuffleByDegree(graph, sameRegion)),
  ];
}

/** Orders region-mates by connectivity so the best-known lead. */
function shuffleByDegree(
  graph: MaritimeGraph,
  items: readonly Recommendation[],
): readonly Recommendation[] {
  return [...items].sort(
    (a, b) =>
      (graph.edges.get(b.entityId)?.length ?? 0) - (graph.edges.get(a.entityId)?.length ?? 0),
  );
}

function waterBodyGroups(graph: MaritimeGraph, canonicalId: string): RecommendationGroup[] {
  const self = graph.nodes.get(canonicalId);
  if (!self) return [];
  const straits = neighbors(graph, canonicalId, { kinds: ['connected_to'] })
    .filter(({ node }) => node.type === 'strait')
    .map(({ node }) => toRecommendation(node, `Opens onto the ${self.name}`));
  const adjacent = neighbors(graph, canonicalId, { kinds: ['adjacent_to'] })
    .filter(({ node }) => node.type === 'water-body')
    .map(({ node }) => toRecommendation(node, 'A strait or canal joins them'));
  const hierarchy = [
    ...neighbors(graph, canonicalId, { kinds: ['flows_into'] }).map(({ node }) =>
      toRecommendation(node, `The ${self.name} belongs to it`),
    ),
    ...neighbors(graph, canonicalId, { kinds: ['contains'] })
      .filter(({ node }) => node.type === 'water-body')
      .map(({ node }) => toRecommendation(node, `Within the ${self.name}`)),
  ];
  const countries = new Map<string, Recommendation>();
  for (const { node: strait } of neighbors(graph, canonicalId, { kinds: ['connected_to'] })) {
    if (strait.type !== 'strait') continue;
    for (const { node } of neighbors(graph, strait.entityId, { kinds: ['borders'] })) {
      if (!countries.has(node.entityId)) {
        countries.set(node.entityId, toRecommendation(node, `Reached via the ${strait.name}`));
      }
    }
  }
  const routes = neighbors(graph, canonicalId, { kinds: ['part_of'] })
    .filter(({ node }) => node.type === 'maritime-route')
    .map(({ node }) => toRecommendation(node, 'Passes through these waters'));

  return [
    group('straits', 'Straits of these waters', straits),
    group('adjacent-seas', 'Adjacent waters', adjacent),
    group('hierarchy', 'Wider and inner waters', hierarchy),
    group('countries', 'Countries on these waters', [...countries.values()]),
    group('routes', 'Routes through', routes),
  ];
}

function countryGroups(graph: MaritimeGraph, canonicalId: string): RecommendationGroup[] {
  const self = graph.nodes.get(canonicalId);
  if (!self) return [];
  const straits = neighbors(graph, canonicalId, { kinds: ['borders'] }).map(({ node }) =>
    toRecommendation(node, `On the shores of ${self.name}`),
  );
  const neighboursOf = neighbors(graph, canonicalId, { kinds: ['adjacent_to'] })
    .filter(({ node }) => node.type === 'country')
    .map(({ node }) => toRecommendation(node, 'Shares a strait'));
  const waters = new Map<string, Recommendation>();
  for (const { node: strait } of neighbors(graph, canonicalId, { kinds: ['borders'] })) {
    for (const { node } of neighbors(graph, strait.entityId, { kinds: ['connected_to'] })) {
      if (node.type !== 'water-body') continue;
      if (!waters.has(node.entityId)) {
        waters.set(node.entityId, toRecommendation(node, `Reached via the ${strait.name}`));
      }
    }
  }
  const holdings = neighbors(graph, canonicalId, { kinds: ['contains'] }).map(({ node }) =>
    toRecommendation(node, `In ${self.name}`),
  );

  return [
    group('straits', 'Its straits', straits),
    group('neighbours', 'Neighbouring countries', neighboursOf),
    group('waters', 'Its waters', [...waters.values()]),
    group('holdings', 'Ports, canals, and islands', holdings),
  ];
}

function regionGroups(graph: MaritimeGraph, canonicalId: string): RecommendationGroup[] {
  const self = graph.nodes.get(canonicalId);
  if (!self) return [];
  const straits = neighbors(graph, canonicalId, { kinds: ['contains'] })
    .filter(({ node }) => node.type === 'strait')
    .map(({ node }) => toRecommendation(node, `In ${self.name}`));
  return [group('straits', 'Straits of the region', shuffleByDegree(graph, straits))];
}

/** Structures (ports, canals, crossings, islands, routes): every direct link. */
function structureGroups(graph: MaritimeGraph, canonicalId: string): RecommendationGroup[] {
  const KIND_TITLES: Record<string, string> = {
    connected_to: 'Directly connected',
    crosses: 'Crossings and crossings-over',
    borders: 'On its shores',
    belongs_to: 'Belongs to',
    part_of: 'Part of',
    contains: 'Contains',
    adjacent_to: 'Adjacent',
    flows_into: 'Flows into',
    nearby: 'Nearby',
  };
  const byKind = new Map<string, Recommendation[]>();
  for (const { node, edge } of neighbors(graph, canonicalId)) {
    const list = byKind.get(edge.kind) ?? [];
    list.push(toRecommendation(node, KIND_TITLES[edge.kind] ?? 'Connected'));
    byKind.set(edge.kind, list);
  }
  return [...byKind.entries()].map(([kind, items]) =>
    group(kind, KIND_TITLES[kind] ?? 'Connected', items),
  );
}

const cache = new Map<string, readonly RecommendationGroup[]>();

/**
 * Recommendation groups for any entity page. Deterministic groups are
 * computed once per entity and cached; Random Discovery is appended fresh
 * so it changes on every visit. Empty groups are dropped.
 */
export function recommendationsFor(
  canonicalId: string,
  options?: { random?: () => number },
): readonly RecommendationGroup[] {
  const graph = getMaritimeGraph();
  let groups = cache.get(canonicalId);
  if (!groups) {
    const parsed = parseEntityId(canonicalId);
    if (!parsed) return [];
    switch (parsed.type) {
      case 'strait':
        groups = straitGroups(graph, canonicalId);
        break;
      case 'water-body':
        groups = waterBodyGroups(graph, canonicalId);
        break;
      case 'country':
        groups = countryGroups(graph, canonicalId);
        break;
      case 'region':
        groups = regionGroups(graph, canonicalId);
        break;
      default:
        groups = structureGroups(graph, canonicalId);
    }
    groups = groups.filter((g) => g.items.length > 0);
    cache.set(canonicalId, groups);
  }

  const surprise = randomEntity({ excludeId: canonicalId, random: options?.random }, graph);
  const randomGroup: RecommendationGroup[] = surprise
    ? [
        group('random-discovery', 'Random discovery', [
          toRecommendation(surprise, 'Chart a course somewhere new'),
        ]),
      ]
    : [];
  return [...groups, ...randomGroup];
}

/** Test hook: clears the per-entity cache. */
export function clearRecommendationCache(): void {
  cache.clear();
}
