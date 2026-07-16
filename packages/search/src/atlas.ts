import {
  STRAIT_REGIONS,
  loadAllCountries,
  loadAllStraits,
  loadAllWaterBodies,
  loadBridges,
  loadCanals,
  loadIslands,
  loadMaritimeRoutes,
  loadPorts,
  loadTags,
  loadTunnels,
  slugifyName,
  type Bridge,
  type Canal,
  type Country,
  type Island,
  type MaritimeRoute,
  type Port,
  type Strait,
  type Tag,
  type Tunnel,
  type WaterBody,
} from '@fathom/data';

import { createSearchIndex, type SearchDocument, type SearchIndex } from './engine';

/** Everything searchable, as plain collections — no loaders involved. */
export interface AtlasContent {
  straits: readonly Strait[];
  waterBodies: readonly WaterBody[];
  countries: readonly Country[];
  ports: readonly Port[];
  canals: readonly Canal[];
  bridges: readonly Bridge[];
  tunnels: readonly Tunnel[];
  islands: readonly Island[];
  maritimeRoutes: readonly MaritimeRoute[];
  tags: readonly Tag[];
}

/**
 * Pure search-document builder over atlas content. The web app feeds it
 * the loaded dataset; the data pipeline feeds it staged imports.
 */
export function buildSearchDocuments(content: AtlasContent): readonly SearchDocument[] {
  const documents: SearchDocument[] = [];
  const countryName = (id: string) =>
    content.countries.find((country) => country.id === id)?.name ?? '';

  for (const strait of content.straits) {
    const tagLabels = (strait.tagIds ?? []).flatMap(
      (id) => content.tags.find((tag) => tag.id === id)?.label ?? [],
    );
    documents.push({
      entityId: `strait:${strait.id}`,
      type: 'strait',
      name: strait.name,
      path: `/straits/${strait.id}`,
      summary: strait.note,
      keywords: [
        ...strait.countries,
        strait.region,
        strait.connects,
        ...(strait.names ?? []).map((name) => name.value),
        ...tagLabels,
      ],
    });
  }

  for (const waterBody of content.waterBodies) {
    documents.push({
      entityId: `water-body:${waterBody.id}`,
      type: 'water-body',
      name: waterBody.name,
      path: `/water-bodies/${waterBody.id}`,
      summary: waterBody.summary,
      keywords: [waterBody.type, ...(waterBody.names ?? []).map((name) => name.value)],
    });
  }

  for (const country of content.countries) {
    documents.push({
      entityId: `country:${country.id}`,
      type: 'country',
      name: country.name,
      path: `/countries/${country.id}`,
      summary: country.summary,
      keywords: [country.code ?? '', 'country', ...(country.names ?? []).map((n) => n.value)],
    });
  }

  for (const port of content.ports) {
    documents.push({
      entityId: `port:${port.id}`,
      type: 'port',
      name: port.name,
      path: `/ports/${port.id}`,
      summary: port.summary,
      keywords: ['port', countryName(port.countryId), ...(port.functions ?? [])],
    });
  }
  for (const canal of content.canals) {
    documents.push({
      entityId: `canal:${canal.id}`,
      type: 'canal',
      name: canal.name,
      path: `/canals/${canal.id}`,
      summary: canal.summary,
      keywords: ['canal', ...canal.countryIds.map(countryName)],
    });
  }
  for (const bridge of content.bridges) {
    documents.push({
      entityId: `bridge:${bridge.id}`,
      type: 'bridge',
      name: bridge.name,
      path: `/bridges/${bridge.id}`,
      summary: bridge.summary,
      keywords: ['bridge'],
    });
  }
  for (const tunnel of content.tunnels) {
    documents.push({
      entityId: `tunnel:${tunnel.id}`,
      type: 'tunnel',
      name: tunnel.name,
      path: `/tunnels/${tunnel.id}`,
      summary: tunnel.summary,
      keywords: ['tunnel', tunnel.mode ?? ''],
    });
  }
  for (const island of content.islands) {
    documents.push({
      entityId: `island:${island.id}`,
      type: 'island',
      name: island.name,
      path: `/islands/${island.id}`,
      summary: island.summary,
      keywords: ['island', island.countryId ? countryName(island.countryId) : ''],
    });
  }
  for (const route of content.maritimeRoutes) {
    documents.push({
      entityId: `maritime-route:${route.id}`,
      type: 'maritime-route',
      name: route.name,
      path: `/routes/${route.id}`,
      summary: route.summary,
      keywords: ['route', route.routeType],
    });
  }

  for (const region of STRAIT_REGIONS) {
    const count = content.straits.filter((strait) => strait.region === region).length;
    documents.push({
      entityId: `region:${slugifyName(region)}`,
      type: 'region',
      name: region,
      path: `/regions/${slugifyName(region)}`,
      summary: `${String(count)} straits charted in this region.`,
      keywords: ['region'],
    });
  }

  return documents;
}

/** The loaded atlas as AtlasContent. */
export function loadedAtlasContent(): AtlasContent {
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
    tags: loadTags(),
  };
}

export function buildAtlasSearchDocuments(): readonly SearchDocument[] {
  return buildSearchDocuments(loadedAtlasContent());
}

let cached: SearchIndex | null = null;

/** The search index over the loaded atlas, built once and memoized. */
export function atlasSearchIndex(): SearchIndex {
  cached ??= createSearchIndex(buildAtlasSearchDocuments());
  return cached;
}

/** Curated entry points shown when the search box is focused and empty. */
const SUGGESTED_IDS = [
  'strait:hormuz',
  'strait:gibraltar',
  'water-body:mediterranean-sea',
  'country:japan',
  'canal:suez-canal',
  'region:europe',
];

export function atlasSuggestions(): readonly SearchDocument[] {
  const { documents } = atlasSearchIndex();
  return SUGGESTED_IDS.flatMap(
    (id) => documents.find((document) => document.entityId === id) ?? [],
  );
}
