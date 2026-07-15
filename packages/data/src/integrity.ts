import { buildDerivedRegistries } from './derived';
import {
  loadHistoricalEvents,
  loadImages,
  loadSources,
  loadStatistics,
  loadTags,
  loadWildlife,
} from './entities';
import { loadAllStraits } from './loader';
import {
  entityId,
  type EntityRef,
  type HistoricalEvent,
  type Image,
  type Source,
  type Statistic,
  type Strait,
  type Tag,
  type Wildlife,
} from './schema';

/** Every collection the integrity checker validates, injectable for tests. */
export interface AtlasDataset {
  straits: readonly Strait[];
  sources: readonly Source[];
  images: readonly Image[];
  events: readonly HistoricalEvent[];
  wildlife: readonly Wildlife[];
  statistics: readonly Statistic[];
  tags: readonly Tag[];
}

export function loadAtlasDataset(): AtlasDataset {
  return {
    straits: loadAllStraits(),
    sources: loadSources(),
    images: loadImages(),
    events: loadHistoricalEvents(),
    wildlife: loadWildlife(),
    statistics: loadStatistics(),
    tags: loadTags(),
  };
}

export interface BrokenReference {
  /** Canonical id of the entity holding the reference. */
  from: string;
  /** Field the reference sits in (`sourceIds`, `depicts`, …). */
  field: string;
  /** Canonical id of the referenced entity. */
  ref: string;
  /** unknown-id: the type is known but no entity has this id.
   *  unresolvable-type: no collection exists for this type yet. */
  reason: 'unknown-id' | 'unresolvable-type';
}

/**
 * Scans every reference in the dataset and reports the ones that do not
 * resolve. The scan is a flat pass over the collections — it never follows
 * references recursively, so circular references (events relating to each
 * other, tags relating to tags) are handled safely by construction.
 */
export function findBrokenReferences(
  dataset: AtlasDataset = loadAtlasDataset(),
): readonly BrokenReference[] {
  const broken: BrokenReference[] = [];
  const derived = buildDerivedRegistries(dataset.straits);

  const known: Partial<Record<EntityRef['type'], ReadonlySet<string>>> = {
    strait: new Set(dataset.straits.map((s) => s.id)),
    country: new Set(derived.countriesById.keys()),
    'water-body': new Set(derived.waterBodiesById.keys()),
    region: new Set(derived.regionsById.keys()),
    source: new Set(dataset.sources.map((s) => s.id)),
    image: new Set(dataset.images.map((i) => i.id)),
    'historical-event': new Set(dataset.events.map((e) => e.id)),
    wildlife: new Set(dataset.wildlife.map((w) => w.id)),
    tag: new Set(dataset.tags.map((t) => t.id)),
  };

  const checkRef = (from: string, field: string, ref: EntityRef) => {
    const ids = known[ref.type];
    if (!ids) {
      broken.push({ from, field, ref: entityId(ref.type, ref.id), reason: 'unresolvable-type' });
    } else if (!ids.has(ref.id)) {
      broken.push({ from, field, ref: entityId(ref.type, ref.id), reason: 'unknown-id' });
    }
  };

  const checkIds = (
    from: string,
    field: string,
    type: EntityRef['type'],
    ids?: readonly string[],
  ) => {
    for (const id of ids ?? []) checkRef(from, field, { type, id });
  };

  for (const strait of dataset.straits) {
    const from = entityId('strait', strait.id);
    for (const ref of strait.connectsWaterBodies ?? []) checkRef(from, 'connectsWaterBodies', ref);
    for (const ref of strait.separates ?? []) checkRef(from, 'separates', ref);
    for (const ref of strait.borderedBy ?? []) checkRef(from, 'borderedBy', ref);
    checkIds(from, 'sourceIds', 'source', strait.sourceIds);
    checkIds(from, 'imageIds', 'image', strait.imageIds);
    checkIds(from, 'eventIds', 'historical-event', strait.eventIds);
    checkIds(from, 'wildlifeIds', 'wildlife', strait.wildlifeIds);
    checkIds(from, 'tagIds', 'tag', strait.tagIds);
    for (const [dimension, measurement] of Object.entries(strait.dimensions ?? {})) {
      checkIds(from, `dimensions.${dimension}.sourceIds`, 'source', measurement.sourceIds);
    }
  }

  for (const image of dataset.images) {
    const from = entityId('image', image.id);
    for (const ref of image.depicts) checkRef(from, 'depicts', ref);
    checkIds(from, 'sourceId', 'source', image.sourceId ? [image.sourceId] : []);
  }

  for (const event of dataset.events) {
    const from = entityId('historical-event', event.id);
    for (const ref of event.involves) checkRef(from, 'involves', ref);
    checkIds(from, 'relatedEventIds', 'historical-event', event.relatedEventIds);
    checkIds(from, 'sourceIds', 'source', event.sourceIds);
  }

  for (const species of dataset.wildlife) {
    const from = entityId('wildlife', species.id);
    for (const ref of species.habitats) checkRef(from, 'habitats', ref);
    checkIds(from, 'sourceIds', 'source', species.sourceIds);
  }

  for (const statistic of dataset.statistics) {
    const from = `statistic about ${entityId(statistic.subject.type, statistic.subject.id)}`;
    checkRef(from, 'subject', statistic.subject);
    checkIds(from, 'sourceIds', 'source', statistic.sourceIds);
  }

  for (const tag of dataset.tags) {
    checkIds(entityId('tag', tag.id), 'relatedTagIds', 'tag', tag.relatedTagIds);
  }

  return broken;
}
