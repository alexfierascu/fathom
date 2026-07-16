import type { Journey } from './journeys';
import { resolveWaypoint } from './journeys';
import courses from './journey-courses.json';

/**
 * Precision journey courses.
 *
 * `journey-courses.json` holds precomputed sea-lane geometry for every
 * leg of the starter journeys: shortest maritime routes over the MARNET
 * shipping-lane network (Oak Ridge Global Shipping Lane Network),
 * computed with the MIT-licensed `searoute` package
 * (github.com/genthalili/searoute-py) at authoring time.
 *
 * To regenerate after changing a journey's stops: dump each journey's
 * located stops (id, lat, lon per stop index), run
 * `searoute([lonA, latA], [lonB, latB])` for each consecutive pair, and
 * store [lat, lon] point lists keyed by journey id with from/to stop
 * indices — ends anchored exactly on the stops.
 *
 * The geometry is cartographic drawing data, not an atlas fact: it shows
 * a plausible shipping lane, not a navigational product.
 */

interface CourseLeg {
  from: number;
  to: number;
  points: [number, number][] | null;
  km?: number;
}

// JSON infers number[][] for the point pairs; narrow through unknown.
const COURSES = courses as unknown as Record<string, CourseLeg[]>;

export interface CoursePoint {
  lat: number;
  lon: number;
  /** Present when the point is a numbered stop, not a lane point. */
  stopIndex?: number;
  name?: string;
}

interface LocatedStop {
  stopIndex: number;
  lat: number;
  lon: number;
  name: string;
}

function locatedStopsOf(journey: Journey): LocatedStop[] {
  return journey.waypoints.flatMap((waypoint, stopIndex) => {
    const node = resolveWaypoint(waypoint);
    return node?.lat !== undefined && node.lon !== undefined
      ? [{ stopIndex, lat: node.lat, lon: node.lon, name: node.name }]
      : [];
  });
}

/** Unwraps longitudes so antimeridian crossings draw as one line. */
function unwrap(points: CoursePoint[]): CoursePoint[] {
  let previous: number | null = null;
  return points.map((point) => {
    let lon = point.lon;
    if (previous !== null) {
      while (lon - previous > 180) lon -= 360;
      while (lon - previous < -180) lon += 360;
    }
    previous = lon;
    return { ...point, lon };
  });
}

/**
 * The full drawable course of a journey: precise MARNET lane geometry
 * where it was precomputed, the waypoints' authored via points where it
 * was not (generated journeys), stops always anchored and tagged.
 */
export function journeyCourse(journey: Journey): readonly CoursePoint[] {
  const stops = locatedStopsOf(journey);
  if (stops.length === 0) return [];
  const legs = COURSES[journey.id] ?? [];
  const legByPair = new Map(legs.map((leg) => [`${String(leg.from)}-${String(leg.to)}`, leg]));

  const first = stops[0];
  if (!first) return [];
  const path: CoursePoint[] = [
    { lat: first.lat, lon: first.lon, stopIndex: first.stopIndex, name: first.name },
  ];

  for (let i = 1; i < stops.length; i += 1) {
    const from = stops[i - 1];
    const to = stops[i];
    if (!from || !to) continue;
    const leg = legByPair.get(`${String(from.stopIndex)}-${String(to.stopIndex)}`);
    if (leg?.points && leg.points.length >= 2) {
      // Skip the first point (it is the previous stop, already pushed).
      for (let p = 1; p < leg.points.length - 1; p += 1) {
        const point = leg.points[p];
        if (point) path.push({ lat: point[0], lon: point[1] });
      }
    } else {
      // Fallback: the leg's authored sea-lane bends.
      for (const bend of journey.waypoints[to.stopIndex]?.via ?? []) {
        path.push({ lat: bend.lat, lon: bend.lon });
      }
    }
    path.push({ lat: to.lat, lon: to.lon, stopIndex: to.stopIndex, name: to.name });
  }

  return unwrap(path);
}

/** Total charted length of a journey's precomputed course, in km. */
export function courseLengthKm(journeyId: string): number | null {
  const legs = COURSES[journeyId];
  if (!legs || legs.some((leg) => !leg.points)) return null;
  return legs.reduce((sum, leg) => sum + (leg.km ?? 0), 0);
}
