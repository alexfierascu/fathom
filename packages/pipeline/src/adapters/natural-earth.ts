import { readFile } from 'node:fs/promises';

import type { ImportableType, ImportScope, ProviderAdapter, ProviderRecord } from '../types';

/**
 * Natural Earth (public domain). Works on the GeoJSON conversion of
 * ne_10m_geography_marine_polys (or the label points file): set
 * NATURAL_EARTH_FILE to a local GeoJSON path, or pass a URL.
 */

interface MarineFeature {
  properties?: { name?: string; featurecla?: string; label_x?: number; label_y?: number };
  geometry?: { type: string; coordinates: unknown };
}

const TYPE_BY_FEATURECLA: Record<string, { entityType: ImportableType; kind?: string }> = {
  strait: { entityType: 'strait' },
  ocean: { entityType: 'water-body', kind: 'ocean' },
  sea: { entityType: 'water-body', kind: 'sea' },
  gulf: { entityType: 'water-body', kind: 'gulf' },
  bay: { entityType: 'water-body', kind: 'bay' },
  channel: { entityType: 'water-body', kind: 'channel' },
};

/** Parses Natural Earth marine features (exported for tests). */
export function parseNaturalEarthFeatures(
  features: readonly MarineFeature[],
  wanted: readonly ImportableType[],
): readonly ProviderRecord[] {
  const accessedOn = new Date().toISOString().slice(0, 10);
  return features.flatMap((feature) => {
    const name = feature.properties?.name;
    const featurecla = feature.properties?.featurecla?.toLowerCase() ?? '';
    const mapping = TYPE_BY_FEATURECLA[featurecla];
    if (!name || !mapping || !wanted.includes(mapping.entityType)) return [];
    return [
      {
        provider: 'natural-earth',
        providerId: `${featurecla}:${name}`,
        entityType: mapping.entityType,
        name,
        lat: feature.properties?.label_y,
        lon: feature.properties?.label_x,
        ...(mapping.kind ? { waterBodyType: mapping.kind } : {}),
        source: {
          id: 'natural-earth-10m-marine',
          type: 'dataset' as const,
          title: 'Natural Earth 1:10m Physical Vectors — Marine Areas',
          publisher: 'Natural Earth',
          locator: 'https://www.naturalearthdata.com/downloads/10m-physical-vectors/',
          accessedOn,
          license: 'Public domain',
        },
      },
    ];
  });
}

export function naturalEarthAdapter(location?: string): ProviderAdapter {
  return {
    name: 'natural-earth',
    provides: ['strait', 'water-body'],
    async fetchRecords(scope: ImportScope) {
      const where = location ?? process.env.NATURAL_EARTH_FILE;
      if (!where) {
        throw new Error(
          'Set NATURAL_EARTH_FILE to a marine-polys GeoJSON path (see adapter docs) or pass a URL',
        );
      }
      const text = where.startsWith('http')
        ? await (await fetch(where)).text()
        : await readFile(where, 'utf8');
      const geojson = JSON.parse(text) as { features: MarineFeature[] };
      const records = parseNaturalEarthFeatures(geojson.features, scope.types);
      return scope.limit ? records.slice(0, scope.limit) : records;
    },
  };
}
