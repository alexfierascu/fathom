import {
  distanceKm,
  entityId,
  loadAllStraits,
  loadHistoricalEvents,
  loadMaritimeRoutes,
  loadTags,
  slugifyName,
  type Strait,
} from '@fathom/data';

import { degree, getMaritimeGraph } from './graph';

/**
 * The similarity engine: ranks straits against a subject strait using
 * weighted, explainable signals. Every result carries the reasons that
 * produced its score, so the UI never has to guess why something was
 * recommended.
 */

export interface SimilarityReason {
  signal:
    | 'shared-water'
    | 'shared-country'
    | 'same-region'
    | 'shared-tag'
    | 'shared-route'
    | 'shared-event'
    | 'proximity'
    | 'importance';
  detail: string;
  weight: number;
}

export interface SimilarStrait {
  entityId: string;
  id: string;
  name: string;
  score: number;
  reasons: readonly SimilarityReason[];
}

const WEIGHTS = {
  sharedWater: 3,
  sharedCountry: 2,
  sameRegion: 1.5,
  sharedTag: 2.5,
  sharedRoute: 3,
  sharedEvent: 2,
  proximityMax: 2,
  importancePerDegree: 0.02,
};

/** Distance beyond which proximity contributes nothing. */
const PROXIMITY_HORIZON_KM = 4000;

interface StraitSignals {
  strait: Strait;
  waters: ReadonlySet<string>;
  countries: ReadonlySet<string>;
  tags: ReadonlySet<string>;
  routes: ReadonlySet<string>;
  events: ReadonlySet<string>;
}

let signalCache: Map<string, StraitSignals> | null = null;

function signalsByStraitId(): Map<string, StraitSignals> {
  if (signalCache) return signalCache;
  const routes = loadMaritimeRoutes();
  const events = loadHistoricalEvents();
  signalCache = new Map(
    loadAllStraits().map((strait) => [
      strait.id,
      {
        strait,
        waters: new Set(strait.connects.split(' ↔ ').map((name) => slugifyName(name))),
        countries: new Set(strait.countries.map((name) => slugifyName(name))),
        tags: new Set(strait.tagIds ?? []),
        routes: new Set(
          routes
            .filter((route) =>
              route.waypoints.some((w) => w.type === 'strait' && w.id === strait.id),
            )
            .map((route) => route.id),
        ),
        events: new Set(
          events
            .filter((event) =>
              event.involves.some((ref) => ref.type === 'strait' && ref.id === strait.id),
            )
            .map((event) => event.id),
        ),
      },
    ]),
  );
  return signalCache;
}

const intersect = (a: ReadonlySet<string>, b: ReadonlySet<string>): string[] =>
  [...a].filter((value) => b.has(value));

const displayName = (values: readonly string[], lookup: (id: string) => string | undefined) =>
  values.map((value) => lookup(value) ?? value).join(', ');

/** Scores one candidate against the subject. Exported for tests. */
export function similarityBetween(subject: Strait, candidate: Strait): SimilarStrait {
  const signals = signalsByStraitId();
  const a = signals.get(subject.id);
  const b = signals.get(candidate.id);
  const reasons: SimilarityReason[] = [];

  if (a && b) {
    const graph = getMaritimeGraph();
    const waterName = (id: string) => graph.nodes.get(entityId('water-body', id))?.name;
    const countryName = (id: string) => graph.nodes.get(entityId('country', id))?.name;

    const waters = intersect(a.waters, b.waters);
    if (waters.length > 0) {
      reasons.push({
        signal: 'shared-water',
        detail: `Both open onto the ${displayName(waters, waterName)}`,
        weight: Math.min(waters.length, 2) * WEIGHTS.sharedWater,
      });
    }

    const countries = intersect(a.countries, b.countries);
    if (countries.length > 0) {
      reasons.push({
        signal: 'shared-country',
        detail: `Both border ${displayName(countries, countryName)}`,
        weight: Math.min(countries.length, 2) * WEIGHTS.sharedCountry,
      });
    }

    if (subject.region === candidate.region) {
      reasons.push({
        signal: 'same-region',
        detail: `Both in ${subject.region}`,
        weight: WEIGHTS.sameRegion,
      });
    }

    const tags = intersect(a.tags, b.tags);
    if (tags.length > 0) {
      const tagLabel = (id: string) => loadTags().find((tag) => tag.id === id)?.label;
      reasons.push({
        signal: 'shared-tag',
        detail: `Both ${displayName(tags, (id) => tagLabel(id)?.toLowerCase())} straits`,
        weight: tags.length * WEIGHTS.sharedTag,
      });
    }

    const routes = intersect(a.routes, b.routes);
    if (routes.length > 0) {
      const routeName = (id: string) => graph.nodes.get(entityId('maritime-route', id))?.name;
      reasons.push({
        signal: 'shared-route',
        detail: `Both on the ${displayName(routes, routeName)}`,
        weight: routes.length * WEIGHTS.sharedRoute,
      });
    }

    const events = intersect(a.events, b.events);
    if (events.length > 0) {
      const eventName = (id: string) =>
        loadHistoricalEvents().find((event) => event.id === id)?.name;
      reasons.push({
        signal: 'shared-event',
        detail: `Linked by the ${displayName(events, eventName)}`,
        weight: events.length * WEIGHTS.sharedEvent,
      });
    }

    const km = distanceKm(subject.lat, subject.lon, candidate.lat, candidate.lon);
    const proximity = Math.max(0, 1 - km / PROXIMITY_HORIZON_KM) * WEIGHTS.proximityMax;
    if (proximity > 0.1) {
      reasons.push({
        signal: 'proximity',
        detail: `About ${String(Math.round(km))} km away`,
        weight: proximity,
      });
    }

    const importance =
      degree(graph, entityId('strait', candidate.id)) * WEIGHTS.importancePerDegree;
    if (importance > 0) {
      reasons.push({
        signal: 'importance',
        detail: 'A well-connected strait',
        weight: importance,
      });
    }
  }

  return {
    entityId: entityId('strait', candidate.id),
    id: candidate.id,
    name: candidate.name,
    score: reasons.reduce((sum, reason) => sum + reason.weight, 0),
    reasons,
  };
}

/**
 * The straits most similar to the subject, ranked by weighted signals.
 * Results with nothing in common beyond mere importance are dropped.
 */
export function similarStraits(subject: Strait, limit = 6): readonly SimilarStrait[] {
  return loadAllStraits()
    .filter((candidate) => candidate.id !== subject.id)
    .map((candidate) => similarityBetween(subject, candidate))
    .filter((result) => result.reasons.some((reason) => reason.signal !== 'importance'))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
