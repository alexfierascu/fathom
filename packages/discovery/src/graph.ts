import {
  distanceKm,
  entityId,
  loadAllCountries,
  loadAllStraits,
  loadAllWaterBodies,
  loadBridges,
  loadCanals,
  loadHistoricalEvents,
  loadIslands,
  loadMaritimeRoutes,
  loadPorts,
  loadTunnels,
  slugifyName,
  type EntityType,
} from '@fathom/data';

/**
 * The maritime graph: every atlas entity as a node, every relationship as
 * a typed, directed edge. The graph is GENERATED from the documents in
 * @fathom/data — nothing here is stored twice; rebuilding the graph after
 * a data change reproduces it exactly.
 *
 * Edge derivations:
 * - `connected_to`  strait ↔ the water bodies it joins; canal ↔ waters;
 *                   port ↔ what it opens onto
 * - `borders`       strait ↔ its shore countries
 * - `flows_into`    water body → its parent water body (sea → ocean)
 * - `contains`      the inverse: parent water body → child
 * - `crosses`       bridge/tunnel ↔ what it spans; maritime route ↔ the
 *                   straits it threads
 * - `belongs_to`    strait → region; island/port → country
 * - `part_of`       route waypoint → its maritime route
 * - `adjacent_to`   two waters joined by a strait or canal; countries
 *                   sharing a strait; islands flanking a strait
 * - `nearby`        each strait ↔ its K nearest straits (great-circle)
 */

export const EDGE_KINDS = [
  'connected_to',
  'borders',
  'flows_into',
  'contains',
  'crosses',
  'belongs_to',
  'part_of',
  'adjacent_to',
  'nearby',
] as const;
export type EdgeKind = (typeof EDGE_KINDS)[number];

export interface GraphNode {
  /** Canonical id (`strait:gibraltar`). */
  entityId: string;
  type: EntityType;
  id: string;
  name: string;
  /** Coordinates, for entities that have them (straits today). */
  lat?: number;
  lon?: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  kind: EdgeKind;
}

export interface MaritimeGraph {
  nodes: ReadonlyMap<string, GraphNode>;
  /** Outgoing edges per node id. */
  edges: ReadonlyMap<string, readonly GraphEdge[]>;
}

const NEARBY_LIMIT = 5;

export function buildMaritimeGraph(): MaritimeGraph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge[]>();

  const addNode = (node: GraphNode) => {
    if (!nodes.has(node.entityId)) nodes.set(node.entityId, node);
  };
  const addEdge = (from: string, to: string, kind: EdgeKind) => {
    if (from === to) return;
    const list = edges.get(from) ?? [];
    if (!list.some((edge) => edge.to === to && edge.kind === kind)) {
      list.push({ from, to, kind });
      edges.set(from, list);
    }
  };
  const link = (a: string, b: string, kind: EdgeKind, inverse: EdgeKind = kind) => {
    // Dangling references must not add edges; integrity checking reports
    // them, the graph simply skips them.
    if (!nodes.has(a) || !nodes.has(b)) return;
    addEdge(a, b, kind);
    addEdge(b, a, inverse);
  };

  const straits = loadAllStraits();
  const waterBodies = loadAllWaterBodies();
  const countries = loadAllCountries();
  const waterIds = new Set(waterBodies.map((body) => body.id));
  const countryIds = new Set(countries.map((country) => country.id));

  // --- Nodes -------------------------------------------------------------
  for (const strait of straits) {
    addNode({
      entityId: entityId('strait', strait.id),
      type: 'strait',
      id: strait.id,
      name: strait.name,
      lat: strait.lat,
      lon: strait.lon,
    });
  }
  for (const body of waterBodies) {
    addNode({
      entityId: entityId('water-body', body.id),
      type: 'water-body',
      id: body.id,
      name: body.name,
    });
  }
  for (const country of countries) {
    addNode({
      entityId: entityId('country', country.id),
      type: 'country',
      id: country.id,
      name: country.name,
    });
  }
  const regionsSeen = new Set<string>();
  for (const strait of straits) {
    const regionId = slugifyName(strait.region);
    if (!regionsSeen.has(regionId)) {
      regionsSeen.add(regionId);
      addNode({
        entityId: entityId('region', regionId),
        type: 'region',
        id: regionId,
        name: strait.region,
      });
    }
  }
  for (const port of loadPorts()) {
    addNode({ entityId: entityId('port', port.id), type: 'port', id: port.id, name: port.name });
  }
  for (const canal of loadCanals()) {
    addNode({
      entityId: entityId('canal', canal.id),
      type: 'canal',
      id: canal.id,
      name: canal.name,
    });
  }
  for (const bridge of loadBridges()) {
    addNode({
      entityId: entityId('bridge', bridge.id),
      type: 'bridge',
      id: bridge.id,
      name: bridge.name,
    });
  }
  for (const tunnel of loadTunnels()) {
    addNode({
      entityId: entityId('tunnel', tunnel.id),
      type: 'tunnel',
      id: tunnel.id,
      name: tunnel.name,
    });
  }
  for (const island of loadIslands()) {
    addNode({
      entityId: entityId('island', island.id),
      type: 'island',
      id: island.id,
      name: island.name,
    });
  }
  for (const route of loadMaritimeRoutes()) {
    addNode({
      entityId: entityId('maritime-route', route.id),
      type: 'maritime-route',
      id: route.id,
      name: route.name,
    });
  }

  // --- Edges ---------------------------------------------------------------
  for (const strait of straits) {
    const straitId = entityId('strait', strait.id);

    // strait ↔ waters it connects; the two waters become adjacent
    const connected = strait.connects
      .split(' ↔ ')
      .map((name) => slugifyName(name))
      .filter((id) => waterIds.has(id));
    for (const waterId of connected) {
      link(straitId, entityId('water-body', waterId), 'connected_to');
    }
    if (connected.length === 2) {
      const [a, b] = connected;
      if (a !== undefined && b !== undefined) {
        link(entityId('water-body', a), entityId('water-body', b), 'adjacent_to');
      }
    }

    // strait ↔ shore countries; the shores become adjacent to each other
    const shoreIds = strait.countries
      .map((name) => slugifyName(name))
      .filter((id) => countryIds.has(id));
    for (const countryId of shoreIds) {
      link(straitId, entityId('country', countryId), 'borders');
    }
    for (const a of shoreIds) {
      for (const b of shoreIds) {
        if (a < b) link(entityId('country', a), entityId('country', b), 'adjacent_to');
      }
    }

    // strait → region
    link(straitId, entityId('region', slugifyName(strait.region)), 'belongs_to', 'contains');
  }

  // water-body hierarchy: sea flows into its parent; parent contains it
  for (const body of waterBodies) {
    if (body.parentId !== undefined && waterIds.has(body.parentId)) {
      link(
        entityId('water-body', body.id),
        entityId('water-body', body.parentId),
        'flows_into',
        'contains',
      );
    }
  }

  // canals join waters like straits do
  for (const canal of loadCanals()) {
    const canalId = entityId('canal', canal.id);
    const joined = canal.connects.filter(
      (ref) => ref.type === 'water-body' && waterIds.has(ref.id),
    );
    for (const ref of joined) {
      link(canalId, entityId('water-body', ref.id), 'connected_to');
    }
    if (joined.length === 2 && joined[0] && joined[1]) {
      link(
        entityId('water-body', joined[0].id),
        entityId('water-body', joined[1].id),
        'adjacent_to',
      );
    }
    for (const countryId of canal.countryIds) {
      if (countryIds.has(countryId))
        link(canalId, entityId('country', countryId), 'belongs_to', 'contains');
    }
  }

  // crossings span straits
  for (const bridge of loadBridges()) {
    link(
      entityId('bridge', bridge.id),
      entityId(bridge.crosses.type, bridge.crosses.id),
      'crosses',
    );
  }
  for (const tunnel of loadTunnels()) {
    link(
      entityId('tunnel', tunnel.id),
      entityId(tunnel.crosses.type, tunnel.crosses.id),
      'crosses',
    );
  }

  // ports open onto straits or waters, and belong to countries
  for (const port of loadPorts()) {
    const portId = entityId('port', port.id);
    link(portId, entityId(port.opensOnto.type, port.opensOnto.id), 'connected_to');
    if (countryIds.has(port.countryId)) {
      link(portId, entityId('country', port.countryId), 'belongs_to', 'contains');
    }
  }

  // islands sit in waters, belong to countries, and flank straits
  for (const island of loadIslands()) {
    const islandId = entityId('island', island.id);
    if (waterIds.has(island.waterBodyId)) {
      link(islandId, entityId('water-body', island.waterBodyId), 'part_of', 'contains');
    }
    if (island.countryId !== undefined && countryIds.has(island.countryId)) {
      link(islandId, entityId('country', island.countryId), 'belongs_to', 'contains');
    }
    for (const straitId of island.flanksStraitIds ?? []) {
      link(islandId, entityId('strait', straitId), 'adjacent_to');
    }
  }

  // maritime routes thread their waypoints in order
  for (const route of loadMaritimeRoutes()) {
    const routeId = entityId('maritime-route', route.id);
    for (const waypoint of route.waypoints) {
      const waypointId = entityId(waypoint.type, waypoint.id);
      if (!nodes.has(waypointId)) continue;
      link(waypointId, routeId, 'part_of', 'contains');
      if (waypoint.type === 'strait') addEdge(routeId, waypointId, 'crosses');
    }
  }

  // events involve entities — surfaced through similarity, but the edge is
  // useful for traversal too: entities sharing an event become adjacent.
  for (const event of loadHistoricalEvents()) {
    const involved = event.involves
      .map((ref) => entityId(ref.type, ref.id))
      .filter((id) => nodes.has(id));
    for (const a of involved) {
      for (const b of involved) {
        if (a < b) link(a, b, 'adjacent_to');
      }
    }
  }

  // each strait ↔ its K nearest straits
  for (const strait of straits) {
    const nearest = straits
      .filter((other) => other.id !== strait.id)
      .map((other) => ({
        other,
        distance: distanceKm(strait.lat, strait.lon, other.lat, other.lon),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, NEARBY_LIMIT);
    for (const { other } of nearest) {
      link(entityId('strait', strait.id), entityId('strait', other.id), 'nearby');
    }
  }

  return { nodes, edges };
}

let cached: MaritimeGraph | null = null;

/** The graph for the loaded dataset, built once and memoized. */
export function getMaritimeGraph(): MaritimeGraph {
  cached ??= buildMaritimeGraph();
  return cached;
}

/** Outgoing neighbors, optionally restricted to edge kinds or node types. */
export function neighbors(
  graph: MaritimeGraph,
  from: string,
  options?: { kinds?: readonly EdgeKind[]; types?: readonly EntityType[] },
): readonly { node: GraphNode; edge: GraphEdge }[] {
  const out = graph.edges.get(from) ?? [];
  const results: { node: GraphNode; edge: GraphEdge }[] = [];
  for (const edge of out) {
    if (options?.kinds && !options.kinds.includes(edge.kind)) continue;
    const node = graph.nodes.get(edge.to);
    if (!node) continue;
    if (options?.types && !options.types.includes(node.type)) continue;
    results.push({ node, edge });
  }
  return results;
}

export interface TraversalVisit {
  node: GraphNode;
  depth: number;
  /** Node ids from the start (exclusive) to this node (inclusive). */
  path: readonly string[];
}

/**
 * Breadth-first traversal from a node. Visits each node once, nearest
 * first; the start node itself is not reported.
 */
export function traverse(
  graph: MaritimeGraph,
  start: string,
  options?: { maxDepth?: number; kinds?: readonly EdgeKind[]; types?: readonly EntityType[] },
): readonly TraversalVisit[] {
  const maxDepth = options?.maxDepth ?? 2;
  const visited = new Set<string>([start]);
  const visits: TraversalVisit[] = [];
  let frontier: { id: string; path: readonly string[] }[] = [{ id: start, path: [] }];

  for (let depth = 1; depth <= maxDepth && frontier.length > 0; depth += 1) {
    const next: { id: string; path: readonly string[] }[] = [];
    for (const { id, path } of frontier) {
      for (const { node } of neighbors(graph, id, { kinds: options?.kinds })) {
        if (visited.has(node.entityId)) continue;
        visited.add(node.entityId);
        const nodePath = [...path, node.entityId];
        if (!options?.types || options.types.includes(node.type)) {
          visits.push({ node, depth, path: nodePath });
        }
        next.push({ id: node.entityId, path: nodePath });
      }
    }
    frontier = next;
  }
  return visits;
}

/**
 * Shortest path between two nodes (BFS, unweighted), as node ids from
 * `from` to `to` inclusive. Null when unreachable.
 */
export function shortestPath(
  graph: MaritimeGraph,
  from: string,
  to: string,
  options?: { kinds?: readonly EdgeKind[] },
): readonly string[] | null {
  if (from === to) return [from];
  if (!graph.nodes.has(from) || !graph.nodes.has(to)) return null;
  const previous = new Map<string, string>();
  const visited = new Set<string>([from]);
  let frontier = [from];

  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const { node } of neighbors(graph, id, { kinds: options?.kinds })) {
        if (visited.has(node.entityId)) continue;
        visited.add(node.entityId);
        previous.set(node.entityId, id);
        if (node.entityId === to) {
          const path = [to];
          let cursor = to;
          while (cursor !== from) {
            const prev = previous.get(cursor);
            if (prev === undefined) return null;
            path.unshift(prev);
            cursor = prev;
          }
          return path;
        }
        next.push(node.entityId);
      }
    }
    frontier = next;
  }
  return null;
}

/** Degree of a node — a cheap importance signal. */
export function degree(graph: MaritimeGraph, id: string): number {
  return graph.edges.get(id)?.length ?? 0;
}
