import type { ImportableType, ImportScope, ProviderAdapter, ProviderRecord } from '../types';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'FathomAtlas-DataPipeline/0.1 (open-source maritime atlas)';

/** Wikidata classes per Fathom entity type. */
const CLASS_BY_TYPE: Partial<Record<ImportableType, string>> = {
  strait: 'Q37901',
  canal: 'Q12284',
  island: 'Q23442',
  port: 'Q44782',
  'water-body': 'Q165',
};

interface SparqlBinding {
  item: { value: string };
  itemLabel: { value: string };
  lat?: { value: string };
  lon?: { value: string };
  countries?: { value: string };
  waters?: { value: string };
  description?: { value: string };
}

function query(classId: string, limit: number): string {
  return `
SELECT ?item ?itemLabel ?lat ?lon ?description
  (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") AS ?countries)
  (GROUP_CONCAT(DISTINCT ?waterLabel; separator="|") AS ?waters)
WHERE {
  ?item wdt:P31/wdt:P279* wd:${classId} .
  ?item p:P625 ?coordStatement .
  ?coordStatement psv:P625 ?coordValue .
  ?coordValue wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .
  OPTIONAL { ?item wdt:P17 ?country . ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en") }
  OPTIONAL { ?item wdt:P206 ?water . ?water rdfs:label ?waterLabel FILTER(LANG(?waterLabel) = "en") }
  OPTIONAL { ?item schema:description ?description FILTER(LANG(?description) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
GROUP BY ?item ?itemLabel ?lat ?lon ?description
LIMIT ${String(limit)}`;
}

/** Parses a SPARQL result into provider records (exported for tests). */
export function parseWikidataResults(
  bindings: readonly SparqlBinding[],
  entityType: ImportableType,
): readonly ProviderRecord[] {
  const accessedOn = new Date().toISOString().slice(0, 10);
  return bindings.flatMap((binding) => {
    const qid = binding.item.value.split('/').pop() ?? '';
    const name = binding.itemLabel.value;
    if (!qid || !name || name === qid) return [];
    const split = (value?: { value: string }) =>
      (value?.value ?? '')
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);
    return [
      {
        provider: 'wikidata',
        providerId: qid,
        entityType,
        name,
        lat: binding.lat ? Number(binding.lat.value) : undefined,
        lon: binding.lon ? Number(binding.lon.value) : undefined,
        summary: binding.description?.value,
        countryNames: split(binding.countries),
        connectsNames: split(binding.waters),
        ...(entityType === 'water-body' ? { waterBodyType: 'sea' } : {}),
        source: {
          id: `wikidata-${qid.toLowerCase()}`,
          type: 'dataset' as const,
          title: `Wikidata: ${name} (${qid})`,
          publisher: 'Wikimedia Foundation',
          locator: `https://www.wikidata.org/wiki/${qid}`,
          accessedOn,
          license: 'CC0 1.0',
        },
      },
    ];
  });
}

export const wikidataAdapter: ProviderAdapter = {
  name: 'wikidata',
  provides: ['strait', 'canal', 'island', 'port', 'water-body'],
  async fetchRecords(scope: ImportScope) {
    const records: ProviderRecord[] = [];
    for (const type of scope.types) {
      const classId = CLASS_BY_TYPE[type];
      if (!classId) continue;
      const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(query(classId, scope.limit ?? 25))}`;
      const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
      if (!response.ok) {
        throw new Error(`Wikidata query for ${type} failed: HTTP ${String(response.status)}`);
      }
      const body = (await response.json()) as { results: { bindings: SparqlBinding[] } };
      records.push(...parseWikidataResults(body.results.bindings, type));
    }
    return records;
  },
};
