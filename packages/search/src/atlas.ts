import {
  STRAIT_REGIONS,
  loadAllCountries,
  loadAllStraits,
  loadAllWaterBodies,
  loadTags,
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
