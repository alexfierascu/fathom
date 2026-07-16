import type { ImportScope, ProviderAdapter, ProviderRecord } from '../types';

const ENDPOINT = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'FathomAtlas-DataPipeline/0.1 (open-source maritime atlas)';

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** Parses Overpass elements into provider records (exported for tests). */
export function parseOverpassElements(
  elements: readonly OverpassElement[],
): readonly ProviderRecord[] {
  const accessedOn = new Date().toISOString().slice(0, 10);
  return elements.flatMap((element) => {
    const name = element.tags?.['name:en'] ?? element.tags?.name;
    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (!name || lat === undefined || lon === undefined) return [];
    return [
      {
        provider: 'osm',
        providerId: `${element.type}/${String(element.id)}`,
        entityType: 'strait' as const,
        name,
        lat,
        lon,
        source: {
          id: `osm-${element.type}-${String(element.id)}`,
          type: 'dataset' as const,
          title: `OpenStreetMap: ${name}`,
          publisher: 'OpenStreetMap contributors',
          locator: `https://www.openstreetmap.org/${element.type}/${String(element.id)}`,
          accessedOn,
          license: 'ODbL 1.0',
        },
      },
    ];
  });
}

/** Imports named straits (natural=strait) via the Overpass API. */
export const osmAdapter: ProviderAdapter = {
  name: 'osm',
  provides: ['strait'],
  async fetchRecords(scope: ImportScope) {
    if (!scope.types.includes('strait')) return [];
    const limit = scope.limit ?? 25;
    const query = `[out:json][timeout:30];(node["natural"="strait"]["name"];way["natural"="strait"]["name"];);out center ${String(limit)};`;
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'user-agent': USER_AGENT, 'content-type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!response.ok) throw new Error(`Overpass query failed: HTTP ${String(response.status)}`);
    const body = (await response.json()) as { elements: OverpassElement[] };
    return parseOverpassElements(body.elements);
  },
};
