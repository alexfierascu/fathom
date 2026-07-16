import {
  getRelated,
  getStraitEntity,
  loadAllStraits,
  nearestStraits,
  type Strait,
} from '@fathom/data';

/**
 * Straits related to this one: first those sharing a connected water body
 * (genuinely linked geography), topped up with the nearest by distance.
 */
export function relatedStraits(strait: Strait, limit = 3): readonly Strait[] {
  const entity = getStraitEntity(strait);
  const sharedWater = getRelated(entity, 'waterBodies')
    .flatMap((waterBody) => getRelated(waterBody, 'straits'))
    .map((node) => node.data);
  const nearby = nearestStraits(strait.lat, strait.lon, {
    limit: limit + 1,
    excludeId: strait.id,
  });

  const seen = new Set([strait.id]);
  const related: Strait[] = [];
  for (const candidate of [...sharedWater, ...nearby]) {
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    related.push(candidate);
    if (related.length >= limit) break;
  }
  return related;
}

/** Deterministic daily pick — same strait for everyone on a given day. */
export function straitOfTheDay(): Strait | undefined {
  const all = loadAllStraits();
  const day = Math.floor(Date.now() / 86_400_000);
  return all[day % all.length];
}

/** A uniformly random strait, for the Random explorer. */
export function randomStrait(): Strait | undefined {
  const all = loadAllStraits();
  return all[Math.floor(Math.random() * all.length)];
}
