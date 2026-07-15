import { buildDerivedRegistries } from './derived';
import {
  loadHistoricalEvents,
  loadImages,
  loadSources,
  loadStatistics,
  loadTags,
  loadWildlife,
} from './entities';
import { loadAllCountries } from './countries';
import {
  loadBridges,
  loadCanals,
  loadIslands,
  loadMaritimeRoutes,
  loadPorts,
  loadTunnels,
} from './maritime';
import { connectedWaterBodyNames, slugifyName } from './derived';
import { loadAllStraits } from './loader';
import { loadAllWaterBodies } from './water-bodies';
import {
  entityId,
  type EntityRef,
  type HistoricalEvent,
  type Image,
  type Source,
  type Bridge,
  type Canal,
  type Country,
  type Island,
  type MaritimeRoute,
  type Port,
  type Statistic,
  type Tunnel,
  type Strait,
  type Tag,
  type WaterBody,
  type Wildlife,
} from './schema';

/** Every collection the integrity checker validates, injectable for tests. */
export interface AtlasDataset {
  straits: readonly Strait[];
  waterBodies: readonly WaterBody[];
  countries: readonly Country[];
  ports: readonly Port[];
  canals: readonly Canal[];
  bridges: readonly Bridge[];
  tunnels: readonly Tunnel[];
  islands: readonly Island[];
  maritimeRoutes: readonly MaritimeRoute[];
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
    waterBodies: loadAllWaterBodies(),
    countries: loadAllCountries(),
    ports: loadPorts(),
    canals: loadCanals(),
    bridges: loadBridges(),
    tunnels: loadTunnels(),
    islands: loadIslands(),
    maritimeRoutes: loadMaritimeRoutes(),
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
    country: new Set(dataset.countries.map((c) => c.id)),
    'water-body': new Set(dataset.waterBodies.map((wb) => wb.id)),
    region: new Set(derived.regionsById.keys()),
    port: new Set(dataset.ports.map((p) => p.id)),
    canal: new Set(dataset.canals.map((c) => c.id)),
    bridge: new Set(dataset.bridges.map((b) => b.id)),
    tunnel: new Set(dataset.tunnels.map((t) => t.id)),
    island: new Set(dataset.islands.map((i) => i.id)),
    'maritime-route': new Set(dataset.maritimeRoutes.map((r) => r.id)),
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
    for (const name of connectedWaterBodyNames(strait)) {
      checkRef(from, 'connects', { type: 'water-body', id: slugifyName(name) });
    }
    for (const name of strait.countries) {
      checkRef(from, 'countries', { type: 'country', id: slugifyName(name) });
    }
  }

  for (const country of dataset.countries) {
    checkIds(entityId('country', country.id), 'sourceIds', 'source', country.sourceIds);
    if (country.coastline) {
      checkIds(
        entityId('country', country.id),
        'coastline.sourceIds',
        'source',
        country.coastline.sourceIds,
      );
    }
  }

  for (const waterBody of dataset.waterBodies) {
    const from = entityId('water-body', waterBody.id);
    if (waterBody.parentId !== undefined) {
      checkRef(from, 'parentId', { type: 'water-body', id: waterBody.parentId });
    }
    checkIds(from, 'sourceIds', 'source', waterBody.sourceIds);
  }

  for (const port of dataset.ports) {
    const from = entityId('port', port.id);
    checkRef(from, 'countryId', { type: 'country', id: port.countryId });
    checkRef(from, 'opensOnto', port.opensOnto);
    if (port.islandId) checkRef(from, 'islandId', { type: 'island', id: port.islandId });
    checkIds(from, 'sourceIds', 'source', port.sourceIds);
  }

  for (const canal of dataset.canals) {
    const from = entityId('canal', canal.id);
    for (const ref of canal.connects) checkRef(from, 'connects', ref);
    checkIds(from, 'countryIds', 'country', canal.countryIds);
    checkIds(from, 'sourceIds', 'source', canal.sourceIds);
  }

  for (const crossing of [...dataset.bridges, ...dataset.tunnels]) {
    const type = dataset.bridges.some((b) => b === crossing) ? 'bridge' : 'tunnel';
    const from = entityId(type, crossing.id);
    checkRef(from, 'crosses', crossing.crosses);
    for (const ref of crossing.connects) checkRef(from, 'connects', ref);
    checkIds(from, 'sourceIds', 'source', crossing.sourceIds);
  }

  for (const island of dataset.islands) {
    const from = entityId('island', island.id);
    checkRef(from, 'waterBodyId', { type: 'water-body', id: island.waterBodyId });
    if (island.countryId) checkRef(from, 'countryId', { type: 'country', id: island.countryId });
    checkIds(from, 'flanksStraitIds', 'strait', island.flanksStraitIds);
    checkIds(from, 'sourceIds', 'source', island.sourceIds);
  }

  for (const route of dataset.maritimeRoutes) {
    const from = entityId('maritime-route', route.id);
    for (const ref of route.waypoints) checkRef(from, 'waypoints', ref);
    checkIds(from, 'sourceIds', 'source', route.sourceIds);
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
