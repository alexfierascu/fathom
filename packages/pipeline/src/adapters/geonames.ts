import type { ImportableType, ImportScope, ProviderAdapter, ProviderRecord } from '../types';

/**
 * GeoNames (CC BY 4.0). Their web services require a registered username;
 * set GEONAMES_USERNAME to enable this adapter.
 */

const FEATURE_CODE_BY_TYPE: Partial<Record<ImportableType, string>> = {
  strait: 'STRT',
  island: 'ISL',
  port: 'PRT',
  canal: 'CNL',
};

interface GeoName {
  geonameId: number;
  name: string;
  lat: string;
  lng: string;
  countryName?: string;
}

export const geonamesAdapter: ProviderAdapter = {
  name: 'geonames',
  provides: ['strait', 'island', 'port', 'canal'],
  async fetchRecords(scope: ImportScope) {
    const username = process.env.GEONAMES_USERNAME;
    if (!username) {
      throw new Error('Set GEONAMES_USERNAME (free registration at geonames.org) to import');
    }
    const accessedOn = new Date().toISOString().slice(0, 10);
    const records: ProviderRecord[] = [];
    for (const type of scope.types) {
      const code = FEATURE_CODE_BY_TYPE[type];
      if (!code) continue;
      const url = `http://api.geonames.org/searchJSON?featureCode=${code}&orderby=relevance&maxRows=${String(scope.limit ?? 25)}&username=${encodeURIComponent(username)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`GeoNames search failed: HTTP ${String(response.status)}`);
      const body = (await response.json()) as { geonames?: GeoName[] };
      for (const entry of body.geonames ?? []) {
        records.push({
          provider: 'geonames',
          providerId: String(entry.geonameId),
          entityType: type,
          name: entry.name,
          lat: Number(entry.lat),
          lon: Number(entry.lng),
          countryNames: entry.countryName ? [entry.countryName] : [],
          source: {
            id: `geonames-${String(entry.geonameId)}`,
            type: 'dataset',
            title: `GeoNames: ${entry.name}`,
            publisher: 'GeoNames',
            locator: `https://www.geonames.org/${String(entry.geonameId)}`,
            accessedOn,
            license: 'CC BY 4.0',
          },
        });
      }
    }
    return records;
  },
};
