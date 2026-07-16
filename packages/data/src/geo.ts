import { loadAllStraits } from './loader';
import type { Strait } from './schema';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two coordinates, in kilometres. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * The charted straits nearest to a coordinate — straits are the atlas's
 * central node, so every located entity can surface its neighbors.
 */
export function nearestStraits(
  lat: number,
  lon: number,
  options?: { limit?: number; excludeId?: string },
): readonly Strait[] {
  const limit = options?.limit ?? 5;
  return loadAllStraits()
    .filter((strait) => strait.id !== options?.excludeId)
    .map((strait) => ({ strait, distance: distanceKm(lat, lon, strait.lat, strait.lon) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((entry) => entry.strait);
}
