import { loadAllStraits, loadMaritimeRoutes, parseEntityId, type EntityRef } from '@fathom/data';

import { getMaritimeGraph, shortestPath, type GraphNode } from './graph';

/**
 * The Journey model: an ordered voyage through existing atlas entities.
 * Journeys carry no facts of their own — waypoint summaries frame the
 * trip, while each stop's substance (notes, connections, sources) is
 * rendered from the entity's own document.
 */

export type JourneyDifficulty = 'easy' | 'moderate' | 'demanding';

export interface JourneyQuiz {
  prompt: string;
  options: readonly string[];
  answer: string;
}

export interface JourneyWaypoint {
  entity: EntityRef;
  /** Editorial framing for this leg — why the voyage calls here. */
  summary: string;
  note?: string;
  /** A small task for the traveller ("find X on the map"). */
  challenge?: string;
  quiz?: JourneyQuiz;
  /**
   * Cartographic bend points for the leg ARRIVING at this stop, in
   * travel order — chosen so the drawn course keeps to sea lanes
   * instead of cutting across land. Pure drawing data, not facts.
   */
  via?: readonly { lat: number; lon: number }[];
}

export interface Journey {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  difficulty: JourneyDifficulty;
  estimatedMinutes: number;
  coverImageId?: string;
  tags: readonly string[];
  waypoints: readonly JourneyWaypoint[];
}

/** Reading pace used for duration estimates. */
const MINUTES_PER_STOP = 4;

export function estimateMinutes(stopCount: number): number {
  return stopCount * MINUTES_PER_STOP;
}

export function difficultyFor(stopCount: number): JourneyDifficulty {
  if (stopCount <= 5) return 'easy';
  if (stopCount <= 8) return 'moderate';
  return 'demanding';
}

/** Resolves a waypoint to its graph node; null when the entity is unknown. */
export function resolveWaypoint(waypoint: JourneyWaypoint): GraphNode | null {
  return getMaritimeGraph().nodes.get(`${waypoint.entity.type}:${waypoint.entity.id}`) ?? null;
}

export interface JourneyIssue {
  journeyId: string;
  problem: string;
}

/** Every waypoint must resolve; ids and stops must not repeat. */
export function validateJourney(journey: Journey): readonly JourneyIssue[] {
  const issues: JourneyIssue[] = [];
  if (journey.waypoints.length < 2) {
    issues.push({ journeyId: journey.id, problem: 'A journey needs at least two stops' });
  }
  const seen = new Set<string>();
  for (const waypoint of journey.waypoints) {
    const key = `${waypoint.entity.type}:${waypoint.entity.id}`;
    if (seen.has(key)) issues.push({ journeyId: journey.id, problem: `Duplicate stop ${key}` });
    seen.add(key);
    if (!resolveWaypoint(waypoint)) {
      issues.push({ journeyId: journey.id, problem: `Unresolvable stop ${key}` });
    }
    if (waypoint.quiz && !waypoint.quiz.options.includes(waypoint.quiz.answer)) {
      issues.push({ journeyId: journey.id, problem: `Quiz for ${key} omits its answer` });
    }
  }
  return issues;
}

/**
 * A data-grounded quiz for a strait stop: the question and answer come
 * straight from the strait's own `connects` field, distractors from other
 * charted straits — nothing is invented.
 */
export function straitQuiz(
  straitId: string,
  random: () => number = Math.random,
): JourneyQuiz | null {
  const straits = loadAllStraits();
  const subject = straits.find((strait) => strait.id === straitId);
  if (!subject) return null;
  const [from, to] = subject.connects.split(' ↔ ');
  if (!from || !to) return null;
  const distractors: string[] = [];
  const pool = straits.filter(
    (other) => other.id !== subject.id && other.connects !== subject.connects,
  );
  while (distractors.length < 3 && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    const candidate = pool.splice(index, 1)[0];
    if (candidate && !distractors.includes(candidate.name)) distractors.push(candidate.name);
  }
  if (distractors.length < 3) return null;
  const options = [...distractors];
  options.splice(Math.floor(random() * (options.length + 1)), 0, subject.name);
  return {
    prompt: `Which strait joins the ${from} with the ${to}?`,
    options,
    answer: subject.name,
  };
}

/**
 * Journey generation from a charted maritime route: the route's waypoints
 * become stops, each summarized by its own document. (Route generation —
 * finding the stops — happened when the route was charted.)
 */
export function journeyFromRoute(routeId: string): Journey | null {
  const route = loadMaritimeRoutes().find((candidate) => candidate.id === routeId);
  if (!route) return null;
  const graph = getMaritimeGraph();
  const waypoints: JourneyWaypoint[] = [];
  for (const ref of route.waypoints) {
    const node = graph.nodes.get(`${ref.type}:${ref.id}`);
    if (!node) continue;
    waypoints.push({
      entity: { type: ref.type, id: ref.id },
      summary:
        ref.type === 'strait' ? `The route threads the ${node.name}.` : `Through the ${node.name}.`,
    });
  }
  if (waypoints.length < 2) return null;
  return {
    id: `route-${route.id}`,
    title: route.name,
    subtitle: route.summary,
    description: route.summary,
    difficulty: difficultyFor(waypoints.length),
    estimatedMinutes: estimateMinutes(waypoints.length),
    tags: [],
    waypoints,
  };
}

/**
 * Route + journey generation between two straits: the shortest chain of
 * straits, seas, and canals connecting them in the maritime graph.
 */
export function journeyBetween(fromStraitId: string, toStraitId: string): Journey | null {
  const graph = getMaritimeGraph();
  const path = shortestPath(graph, `strait:${fromStraitId}`, `strait:${toStraitId}`, {
    kinds: ['connected_to', 'adjacent_to', 'flows_into', 'contains'],
  });
  if (!path || path.length < 2) return null;
  const nodes = path
    .map((id) => graph.nodes.get(id))
    .filter((node): node is GraphNode => node !== undefined);
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (!first || !last) return null;
  const waypoints = nodes.map((node, index) => ({
    entity: { type: node.type, id: node.id },
    summary:
      index === 0
        ? `The voyage begins at the ${node.name}.`
        : index === nodes.length - 1
          ? `Journey's end: the ${node.name}.`
          : `Onward through the ${node.name}.`,
  }));
  return {
    id: `between-${fromStraitId}-and-${toStraitId}`,
    title: `${first.name} to ${last.name}`,
    subtitle: `A generated passage in ${String(waypoints.length)} legs`,
    description: `The shortest charted chain of waters linking the ${first.name} and the ${last.name}.`,
    difficulty: difficultyFor(waypoints.length),
    estimatedMinutes: estimateMinutes(waypoints.length),
    tags: [],
    waypoints,
  };
}

/** Journeys sharing stops or tags with the subject, most-overlapping first. */
export function relatedJourneys(
  subject: Journey,
  all: readonly Journey[],
  limit = 3,
): readonly Journey[] {
  const stops = new Set(subject.waypoints.map((w) => `${w.entity.type}:${w.entity.id}`));
  const tags = new Set(subject.tags);
  return all
    .filter((candidate) => candidate.id !== subject.id)
    .map((candidate) => {
      const sharedStops = candidate.waypoints.filter((w) =>
        stops.has(`${w.entity.type}:${w.entity.id}`),
      ).length;
      const sharedTags = candidate.tags.filter((tag) => tags.has(tag)).length;
      return { candidate, overlap: sharedStops * 2 + sharedTags };
    })
    .filter((entry) => entry.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/** Stops that can be plotted (straits carry coordinates today). */
export function locatedStops(
  journey: Journey,
): readonly { waypoint: JourneyWaypoint; node: GraphNode; lat: number; lon: number }[] {
  return journey.waypoints.flatMap((waypoint) => {
    const node = resolveWaypoint(waypoint);
    return node?.lat !== undefined && node.lon !== undefined
      ? [{ waypoint, node, lat: node.lat, lon: node.lon }]
      : [];
  });
}

/** True when a canonical entity id appears as a stop on the journey. */
export function journeyVisits(journey: Journey, canonicalId: string): boolean {
  const parsed = parseEntityId(canonicalId);
  if (!parsed) return false;
  return journey.waypoints.some(
    (waypoint) => waypoint.entity.type === parsed.type && waypoint.entity.id === parsed.token,
  );
}
