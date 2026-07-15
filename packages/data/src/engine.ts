import { derivedRegistries, slugifyName, type Country, type RegionEntity } from './derived';
import { loadHistoricalEvents, loadImages, loadSources, loadTags, loadWildlife } from './entities';
import { loadAllStraits, loadStrait } from './loader';
import { loadAllWaterBodies, loadWaterBody } from './water-bodies';
import { loadStatisticsFor } from './resolve';
import {
  entityId,
  parseEntityId,
  type EntityRef,
  type HistoricalEvent,
  type Image,
  type Source,
  type Statistic,
  type Strait,
  type Tag,
  type WaterBody,
  type Wildlife,
} from './schema';

/**
 * The relationship engine: a typed graph over the atlas. Every lookup is a
 * single hop resolved dynamically against the loaded dataset and the derived
 * registries — nothing is stored twice, and because no call recurses,
 * circular references (an event relating to an event relating back) can
 * never loop the engine.
 */

/** Entity kinds the engine can materialize as nodes today. */
export interface EntityDataMap {
  strait: Strait;
  country: Country;
  'water-body': WaterBody;
  region: RegionEntity;
  source: Source;
  image: Image;
  'historical-event': HistoricalEvent;
  wildlife: Wildlife;
  tag: Tag;
}
export type NodeType = keyof EntityDataMap;

/**
 * A graph node. Defined as a discriminated union so that checking
 * `node.type` narrows `data` and the relationships available to it.
 */
export type EntityNode<T extends NodeType = NodeType> = {
  [K in NodeType]: {
    type: K;
    /** Token within the type (`gibraltar`). */
    id: string;
    /** Canonical id (`strait:gibraltar`). */
    entityId: string;
    /** Display label (name, title, common name, or alt text). */
    name: string;
    data: EntityDataMap[K];
  };
}[T];

function node<T extends NodeType>(
  type: T,
  id: string,
  name: string,
  data: EntityDataMap[T],
): EntityNode<T> {
  return { type, id, entityId: entityId(type, id), name, data } as EntityNode<T>;
}

const straitNode = (strait: Strait) => node('strait', strait.id, strait.name, strait);
const countryNode = (country: Country) => node('country', country.id, country.name, country);
const waterBodyNode = (body: WaterBody) => node('water-body', body.id, body.name, body);
const regionNode = (region: RegionEntity) => node('region', region.id, region.name, region);
const sourceNode = (source: Source) => node('source', source.id, source.title, source);
const imageNode = (image: Image) => node('image', image.id, image.alt, image);
const eventNode = (event: HistoricalEvent) => node('historical-event', event.id, event.name, event);
const wildlifeNode = (species: Wildlife) =>
  node('wildlife', species.id, species.commonName, species);
const tagNode = (tag: Tag) => node('tag', tag.id, tag.label, tag);

/**
 * Relationships per entity type, with their cardinality. Single-valued
 * relationships return one node (or null); multi-valued ones return arrays.
 */
export interface RelationshipMap {
  strait: {
    /** many-to-many */
    countries: readonly EntityNode<'country'>[];
    /** one-to-one from the strait's side */
    region: EntityNode<'region'> | null;
    /** many-to-many */
    waterBodies: readonly EntityNode<'water-body'>[];
    images: readonly EntityNode<'image'>[];
    sources: readonly EntityNode<'source'>[];
    events: readonly EntityNode<'historical-event'>[];
    wildlife: readonly EntityNode<'wildlife'>[];
    tags: readonly EntityNode<'tag'>[];
    /** Statistics are values about the strait, not nodes (DATA_MODEL.md). */
    statistics: readonly Statistic[];
  };
  country: {
    straits: readonly EntityNode<'strait'>[];
    waterBodies: readonly EntityNode<'water-body'>[];
  };
  'water-body': {
    straits: readonly EntityNode<'strait'>[];
    countries: readonly EntityNode<'country'>[];
    regions: readonly EntityNode<'region'>[];
    /** one-to-one: the containing water body (null for oceans). */
    parent: EntityNode<'water-body'> | null;
    children: readonly EntityNode<'water-body'>[];
    sources: readonly EntityNode<'source'>[];
  };
  region: {
    straits: readonly EntityNode<'strait'>[];
    waterBodies: readonly EntityNode<'water-body'>[];
    countries: readonly EntityNode<'country'>[];
  };
  image: { depicts: readonly EntityNode[] };
  source: { citedBy: readonly EntityNode<'strait'>[] };
  'historical-event': { involves: readonly EntityNode[] };
  wildlife: { habitats: readonly EntityNode[] };
  tag: { straits: readonly EntityNode<'strait'>[] };
}

const dedupeById = <N extends { id: string }>(nodes: readonly N[]): readonly N[] => {
  const seen = new Set<string>();
  return nodes.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
};

function straitsOfIds(ids: readonly string[] | undefined): readonly EntityNode<'strait'>[] {
  return (ids ?? []).flatMap((id) => {
    const strait = loadAllStraits().find((s) => s.id === id);
    return strait ? [straitNode(strait)] : [];
  });
}

function refNodes(refs: readonly EntityRef[]): readonly EntityNode[] {
  return refs.flatMap((ref) => {
    const resolved = getEntity(entityId(ref.type, ref.id));
    return resolved ? [resolved] : [];
  });
}

const RESOLVERS: {
  [T in NodeType]: {
    [R in keyof RelationshipMap[T]]: (n: EntityNode<T>) => RelationshipMap[T][R];
  };
} = {
  strait: {
    countries: (n) =>
      n.data.countries.flatMap((name) => {
        const id = derivedRegistries().countryIdByName.get(name);
        const country = id ? derivedRegistries().countriesById.get(id) : undefined;
        return country ? [countryNode(country)] : [];
      }),
    region: (n) => {
      const region = derivedRegistries().regionsById.get(slugifyName(n.data.region));
      return region ? regionNode(region) : null;
    },
    waterBodies: (n) => {
      const derivedIds = derivedRegistries().waterBodyIdsByStraitId.get(n.id) ?? [];
      const explicitIds = (n.data.connectsWaterBodies ?? []).map((ref) => ref.id);
      return dedupeById(
        [...explicitIds, ...derivedIds].flatMap((id) => {
          const body = loadAllWaterBodies().find((wb) => wb.id === id);
          return body ? [waterBodyNode(body)] : [];
        }),
      );
    },
    images: (n) =>
      dedupeById([
        ...loadImages()
          .filter((image) => image.depicts.some((d) => d.type === 'strait' && d.id === n.id))
          .map(imageNode),
        ...(n.data.imageIds ?? []).flatMap((id) => {
          const image = loadImages().find((i) => i.id === id);
          return image ? [imageNode(image)] : [];
        }),
      ]),
    sources: (n) =>
      (n.data.sourceIds ?? []).flatMap((id) => {
        const source = loadSources().find((s) => s.id === id);
        return source ? [sourceNode(source)] : [];
      }),
    events: (n) =>
      dedupeById([
        ...loadHistoricalEvents()
          .filter((event) => event.involves.some((d) => d.type === 'strait' && d.id === n.id))
          .map(eventNode),
        ...(n.data.eventIds ?? []).flatMap((id) => {
          const event = loadHistoricalEvents().find((e) => e.id === id);
          return event ? [eventNode(event)] : [];
        }),
      ]),
    wildlife: (n) =>
      dedupeById([
        ...loadWildlife()
          .filter((species) => species.habitats.some((d) => d.type === 'strait' && d.id === n.id))
          .map(wildlifeNode),
        ...(n.data.wildlifeIds ?? []).flatMap((id) => {
          const species = loadWildlife().find((w) => w.id === id);
          return species ? [wildlifeNode(species)] : [];
        }),
      ]),
    tags: (n) =>
      (n.data.tagIds ?? []).flatMap((id) => {
        const tag = loadTags().find((t) => t.id === id);
        return tag ? [tagNode(tag)] : [];
      }),
    statistics: (n) => loadStatisticsFor({ type: 'strait', id: n.id }),
  },
  country: {
    straits: (n) => straitsOfIds(derivedRegistries().straitIdsByCountryId.get(n.id)),
    waterBodies: (n) =>
      dedupeById(
        straitsOfIds(derivedRegistries().straitIdsByCountryId.get(n.id)).flatMap((strait) =>
          RESOLVERS.strait.waterBodies(strait),
        ),
      ),
  },
  'water-body': {
    straits: (n) => straitsOfIds(derivedRegistries().straitIdsByWaterBodyId.get(n.id)),
    countries: (n) =>
      dedupeById(
        straitsOfIds(derivedRegistries().straitIdsByWaterBodyId.get(n.id)).flatMap((strait) =>
          RESOLVERS.strait.countries(strait),
        ),
      ),
    regions: (n) =>
      dedupeById(
        straitsOfIds(derivedRegistries().straitIdsByWaterBodyId.get(n.id)).flatMap((strait) => {
          const region = RESOLVERS.strait.region(strait);
          return region ? [region] : [];
        }),
      ),
    parent: (n) => {
      const parentId = n.data.parentId;
      if (parentId === undefined) return null;
      const parent = loadAllWaterBodies().find((wb) => wb.id === parentId);
      return parent ? waterBodyNode(parent) : null;
    },
    children: (n) =>
      loadAllWaterBodies()
        .filter((wb) => wb.parentId === n.id)
        .map(waterBodyNode),
    sources: (n) =>
      n.data.sourceIds.flatMap((id) => {
        const source = loadSources().find((src) => src.id === id);
        return source ? [sourceNode(source)] : [];
      }),
  },
  region: {
    straits: (n) => straitsOfIds(derivedRegistries().straitIdsByRegionId.get(n.id)),
    waterBodies: (n) =>
      dedupeById(
        straitsOfIds(derivedRegistries().straitIdsByRegionId.get(n.id)).flatMap((strait) =>
          RESOLVERS.strait.waterBodies(strait),
        ),
      ),
    countries: (n) =>
      dedupeById(
        straitsOfIds(derivedRegistries().straitIdsByRegionId.get(n.id)).flatMap((strait) =>
          RESOLVERS.strait.countries(strait),
        ),
      ),
  },
  image: { depicts: (n) => refNodes(n.data.depicts) },
  source: {
    citedBy: (n) =>
      loadAllStraits()
        .filter((strait) => {
          const inDoc = strait.sourceIds?.includes(n.id) ?? false;
          const dims = strait.dimensions;
          const inDims = dims
            ? Object.values(dims).some((m) => m?.sourceIds.includes(n.id) ?? false)
            : false;
          return inDoc || inDims;
        })
        .map(straitNode),
  },
  'historical-event': { involves: (n) => refNodes(n.data.involves) },
  wildlife: { habitats: (n) => refNodes(n.data.habitats) },
  tag: {
    straits: (n) =>
      loadAllStraits()
        .filter((strait) => strait.tagIds?.includes(n.id) ?? false)
        .map(straitNode),
  },
};

/** Looks up any entity by canonical id (`strait:gibraltar`, `country:spain`). */
export function getEntity(id: string): EntityNode | null {
  const parsed = parseEntityId(id);
  if (!parsed) return null;
  const { type, token } = parsed;
  switch (type) {
    case 'strait': {
      try {
        return straitNode(loadStrait(token));
      } catch {
        return null;
      }
    }
    case 'country': {
      const country = derivedRegistries().countriesById.get(token);
      return country ? countryNode(country) : null;
    }
    case 'water-body': {
      try {
        return waterBodyNode(loadWaterBody(token));
      } catch {
        return null;
      }
    }
    case 'region': {
      const region = derivedRegistries().regionsById.get(token);
      return region ? regionNode(region) : null;
    }
    case 'source': {
      const source = loadSources().find((s) => s.id === token);
      return source ? sourceNode(source) : null;
    }
    case 'image': {
      const image = loadImages().find((i) => i.id === token);
      return image ? imageNode(image) : null;
    }
    case 'historical-event': {
      const event = loadHistoricalEvents().find((e) => e.id === token);
      return event ? eventNode(event) : null;
    }
    case 'wildlife': {
      const species = loadWildlife().find((w) => w.id === token);
      return species ? wildlifeNode(species) : null;
    }
    case 'tag': {
      const tag = loadTags().find((t) => t.id === token);
      return tag ? tagNode(tag) : null;
    }
    default:
      return null;
  }
}

/** Node for a strait document already in hand — cannot fail. */
export function getStraitEntity(strait: Strait): EntityNode<'strait'> {
  return straitNode(strait);
}

/**
 * Typed, single-hop relationship traversal. `T` is inferred from the node's
 * `type` discriminant, so only that entity's relationship names compile.
 */
export function getRelated<T extends NodeType, R extends keyof RelationshipMap[T] & string>(
  entity: Extract<EntityNode, { type: T }>,
  relationshipType: R,
): RelationshipMap[T][R] {
  const table = RESOLVERS[entity.type];
  // The map type guarantees this for TypeScript callers; the runtime guard
  // is for untyped (JavaScript) callers passing an unknown relationship.
  const resolver = table[relationshipType] as unknown as
    ((node: Extract<EntityNode, { type: T }>) => RelationshipMap[T][R]) | undefined;
  if (!resolver) {
    throw new Error(`Unknown relationship "${relationshipType}" for entity type "${entity.type}"`);
  }
  return resolver(entity);
}

/**
 * Containment hierarchy (DATA_MODEL.md): regions contain straits and the
 * water bodies those straits connect; straits contain their attached
 * knowledge content. getParents mirrors getChildren exactly.
 */
export function getChildren(entity: EntityNode): readonly EntityNode[] {
  switch (entity.type) {
    case 'region':
      return [...getRelated(entity, 'straits'), ...getRelated(entity, 'waterBodies')];
    case 'water-body':
      return getRelated(entity, 'children');
    case 'strait':
      return [
        ...getRelated(entity, 'images'),
        ...getRelated(entity, 'events'),
        ...getRelated(entity, 'wildlife'),
      ];
    default:
      return [];
  }
}

export function getParents(entity: EntityNode): readonly EntityNode[] {
  switch (entity.type) {
    case 'strait': {
      const region = getRelated(entity, 'region');
      return region ? [region] : [];
    }
    case 'water-body': {
      const parent = getRelated(entity, 'parent');
      return parent ? [parent] : [];
    }
    case 'image':
      return getRelated(entity, 'depicts');
    case 'historical-event':
      return getRelated(entity, 'involves');
    case 'wildlife':
      return getRelated(entity, 'habitats');
    default:
      return [];
  }
}
