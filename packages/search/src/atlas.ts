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
} from '@fathom/data';

import { createSearchIndex, type SearchDocument, type SearchIndex } from './engine';

/**
 * Builds search documents for everything currently charted in the atlas.
 * Ports, canals, bridges, and tunnels are supported types with no data yet;
 * they contribute documents the moment their collections gain entries.
 */
export function buildAtlasSearchDocuments(): readonly SearchDocument[] {
  const documents: SearchDocument[] = [];
  const tags = loadTags();

  for (const strait of loadAllStraits()) {
    const tagLabels = (strait.tagIds ?? []).flatMap(
      (id) => tags.find((tag) => tag.id === id)?.label ?? [],
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

  for (const waterBody of loadAllWaterBodies()) {
    documents.push({
      entityId: `water-body:${waterBody.id}`,
      type: 'water-body',
      name: waterBody.name,
      path: `/water-bodies/${waterBody.id}`,
      summary: waterBody.summary,
      keywords: [waterBody.type, ...(waterBody.names ?? []).map((name) => name.value)],
    });
  }

  for (const country of loadAllCountries()) {
    documents.push({
      entityId: `country:${country.id}`,
      type: 'country',
      name: country.name,
      path: `/countries/${country.id}`,
      summary: country.summary,
      keywords: [country.code ?? '', 'country', ...(country.names ?? []).map((n) => n.value)],
    });
  }

  const countryName = (id: string) =>
    loadAllCountries().find((country) => country.id === id)?.name ?? '';

  for (const port of loadPorts()) {
    documents.push({
      entityId: `port:${port.id}`,
      type: 'port',
      name: port.name,
      path: `/ports/${port.id}`,
      summary: port.summary,
      keywords: ['port', countryName(port.countryId), ...(port.functions ?? [])],
    });
  }
  for (const canal of loadCanals()) {
    documents.push({
      entityId: `canal:${canal.id}`,
      type: 'canal',
      name: canal.name,
      path: `/canals/${canal.id}`,
      summary: canal.summary,
      keywords: ['canal', ...canal.countryIds.map(countryName)],
    });
  }
  for (const bridge of loadBridges()) {
    documents.push({
      entityId: `bridge:${bridge.id}`,
      type: 'bridge',
      name: bridge.name,
      path: `/bridges/${bridge.id}`,
      summary: bridge.summary,
      keywords: ['bridge'],
    });
  }
  for (const tunnel of loadTunnels()) {
    documents.push({
      entityId: `tunnel:${tunnel.id}`,
      type: 'tunnel',
      name: tunnel.name,
      path: `/tunnels/${tunnel.id}`,
      summary: tunnel.summary,
      keywords: ['tunnel', tunnel.mode ?? ''],
    });
  }
  for (const island of loadIslands()) {
    documents.push({
      entityId: `island:${island.id}`,
      type: 'island',
      name: island.name,
      path: `/islands/${island.id}`,
      summary: island.summary,
      keywords: ['island', island.countryId ? countryName(island.countryId) : ''],
    });
  }
  for (const route of loadMaritimeRoutes()) {
    documents.push({
      entityId: `maritime-route:${route.id}`,
      type: 'maritime-route',
      name: route.name,
      path: `/routes/${route.id}`,
      summary: route.summary,
      keywords: ['route', route.routeType],
    });
  }

  const straits = loadAllStraits();
  for (const region of STRAIT_REGIONS) {
    const count = straits.filter((strait) => strait.region === region).length;
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
