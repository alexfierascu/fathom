import {
  loadHistoricalEvents,
  loadImages,
  loadSources,
  loadStatistics,
  loadTags,
  loadWildlife,
} from './entities';
import { loadAllStraits } from './loader';
import type {
  EntityRef,
  EntityType,
  HistoricalEvent,
  Image,
  Source,
  Statistic,
  Strait,
  Tag,
  Wildlife,
} from './schema';

/** Entity kinds that currently have data collections to resolve against. */
export type ResolvedEntity = Strait | Source | Image | HistoricalEvent | Wildlife | Tag;

const LOOKUPS: Partial<Record<EntityType, (id: string) => ResolvedEntity | undefined>> = {
  strait: (id) => loadAllStraits().find((strait) => strait.id === id),
  source: (id) => loadSources().find((source) => source.id === id),
  image: (id) => loadImages().find((image) => image.id === id),
  'historical-event': (id) => loadHistoricalEvents().find((event) => event.id === id),
  wildlife: (id) => loadWildlife().find((species) => species.id === id),
  tag: (id) => loadTags().find((tag) => tag.id === id),
};

/**
 * Resolves a typed reference to its entity. Returns null when the target
 * type has no collection yet (geographic entities beyond straits) or the
 * id is unknown — a dangling reference must not crash a page.
 */
export function resolveRef(ref: EntityRef): ResolvedEntity | null {
  return LOOKUPS[ref.type]?.(ref.id) ?? null;
}

/** Resolves many references, omitting those that cannot be resolved yet. */
export function resolveRefs(refs: readonly EntityRef[]): readonly ResolvedEntity[] {
  return refs.map(resolveRef).filter((entity): entity is ResolvedEntity => entity !== null);
}

const sameRef = (a: EntityRef, b: EntityRef) => a.type === b.type && a.id === b.id;

/** The Sources an entity cites, in citation order; unknown ids are omitted. */
export function loadSourcesFor(entity: { sourceIds?: readonly string[] }): readonly Source[] {
  const ids = entity.sourceIds ?? [];
  const sources = loadSources();
  return ids.flatMap((id) => sources.find((source) => source.id === id) ?? []);
}

/** All Images depicting the referenced entity. */
export function loadImagesFor(ref: EntityRef): readonly Image[] {
  return loadImages().filter((image) => image.depicts.some((depicted) => sameRef(depicted, ref)));
}

/** All Statistics whose subject is the referenced entity. */
export function loadStatisticsFor(ref: EntityRef): readonly Statistic[] {
  return loadStatistics().filter((statistic) => sameRef(statistic.subject, ref));
}
