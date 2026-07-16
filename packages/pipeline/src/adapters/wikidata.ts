import type { ImportableType, ImportScope, ProviderAdapter, ProviderRecord } from '../types';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'FathomAtlas-DataPipeline/0.1 (open-source maritime atlas)';

interface QueryTarget {
  classId: string;
  /** Match direct instances only — required for classes too large for
   *  subclass traversal within the WDQS timeout. */
  direct?: boolean;
  /** Water body kind for water-body targets. */
  kind?: string;
  /** Extra required WHERE fragments. */
  requires?: readonly ('countries' | 'waters' | 'twoWaters' | 'crossesStrait')[];
  /** Bind a parent via P361 (part of). */
  withParent?: boolean;
  /** Bind ISO 3166-1 alpha-2 via P297. */
  withIso?: boolean;
  /** Exclude instances of this class (e.g. oceans from seas). */
  excludeClass?: string;
}

/**
 * Wikidata classes per Fathom entity type. Results are ordered by
 * sitelink count — a practical notability proxy, so "limit 50" means
 * "the 50 most-documented", not 50 arbitrary rows.
 */
const TARGETS: Partial<Record<ImportableType, readonly QueryTarget[]>> = {
  strait: [{ classId: 'Q37901', requires: ['countries', 'twoWaters'] }],
  'water-body': [
    { classId: 'Q9430', kind: 'ocean' },
    { classId: 'Q165', kind: 'sea', direct: true, withParent: true, excludeClass: 'Q9430' },
    { classId: 'Q1322134', kind: 'gulf', direct: true, withParent: true },
    { classId: 'Q39594', kind: 'bay', direct: true, withParent: true },
  ],
  country: [{ classId: 'Q3624078', withIso: true }],
  port: [{ classId: 'Q44782', direct: true, requires: ['countries', 'waters'] }],
  canal: [{ classId: 'Q12284', direct: true, requires: ['countries', 'twoWaters'] }],
  bridge: [{ classId: 'Q12280', direct: true, requires: ['countries', 'crossesStrait'] }],
  tunnel: [{ classId: 'Q44377', direct: true, requires: ['countries', 'crossesStrait'] }],
  island: [{ classId: 'Q23442', direct: true, requires: ['countries', 'waters'] }],
  'maritime-route': [{ classId: 'Q1259617' }],
};

function buildQuery(target: QueryTarget, limit: number): string {
  const requires = new Set(target.requires ?? []);
  const instanceLine = target.direct
    ? `?item wdt:P31 wd:${target.classId} .`
    : `?item wdt:P31/wdt:P279* wd:${target.classId} .`;
  const lines: string[] = [
    instanceLine,
    '?item wikibase:sitelinks ?sitelinks .',
    '?item p:P625 ?coordStatement .',
    '?coordStatement psv:P625 ?coordValue .',
    '?coordValue wikibase:geoLatitude ?lat ; wikibase:geoLongitude ?lon .',
  ];
  if (target.excludeClass) {
    lines.push(`FILTER NOT EXISTS { ?item wdt:P31/wdt:P279* wd:${target.excludeClass} . }`);
  }
  if (requires.has('countries')) {
    lines.push(
      '?item wdt:P17 ?country . ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en")',
    );
  } else {
    lines.push(
      'OPTIONAL { ?item wdt:P17 ?country . ?country rdfs:label ?countryLabel FILTER(LANG(?countryLabel) = "en") }',
    );
  }
  if (requires.has('waters') || requires.has('twoWaters')) {
    lines.push(
      '?item wdt:P206 ?water . ?water rdfs:label ?waterLabel FILTER(LANG(?waterLabel) = "en")',
    );
  } else {
    lines.push(
      'OPTIONAL { ?item wdt:P206 ?water . ?water rdfs:label ?waterLabel FILTER(LANG(?waterLabel) = "en") }',
    );
  }
  if (requires.has('crossesStrait')) {
    lines.push(
      '?item wdt:P177 ?crossed . ?crossed wdt:P31/wdt:P279* wd:Q37901 .',
      '?crossed rdfs:label ?crossesLabel FILTER(LANG(?crossesLabel) = "en")',
    );
  }
  if (target.withParent) {
    lines.push(
      'OPTIONAL { ?item wdt:P361 ?parentEntity . ?parentEntity rdfs:label ?parentLabel FILTER(LANG(?parentLabel) = "en") }',
    );
  }
  if (target.withIso) {
    lines.push('OPTIONAL { ?item wdt:P297 ?iso }');
  }
  lines.push(
    'OPTIONAL { ?item schema:description ?description FILTER(LANG(?description) = "en") }',
  );
  lines.push('SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }');

  const having = requires.has('twoWaters') ? 'HAVING (COUNT(DISTINCT ?water) >= 2)' : '';

  return `
SELECT ?item ?itemLabel ?lat ?lon ?description ?iso ?sitelinks
  (GROUP_CONCAT(DISTINCT ?countryLabel; separator="|") AS ?countries)
  (GROUP_CONCAT(DISTINCT ?waterLabel; separator="|") AS ?waters)
  (SAMPLE(?parentLabel) AS ?parent)
  (SAMPLE(?crossesLabel) AS ?crosses)
WHERE {
  ${lines.join('\n  ')}
}
GROUP BY ?item ?itemLabel ?lat ?lon ?description ?iso ?sitelinks
${having}
ORDER BY DESC(?sitelinks)
LIMIT ${String(limit)}`;
}

interface SparqlBinding {
  item: { value: string };
  itemLabel: { value: string };
  lat?: { value: string };
  lon?: { value: string };
  countries?: { value: string };
  waters?: { value: string };
  description?: { value: string };
  parent?: { value: string };
  iso?: { value: string };
  crosses?: { value: string };
}

/** Parses a SPARQL result into provider records (exported for tests). */
export function parseWikidataResults(
  bindings: readonly SparqlBinding[],
  entityType: ImportableType,
  kind?: string,
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
        ...(kind ? { waterBodyType: kind } : {}),
        ...(binding.parent?.value ? { parentName: binding.parent.value } : {}),
        ...(binding.iso?.value ? { isoCode: binding.iso.value } : {}),
        ...(binding.crosses?.value ? { crossesName: binding.crosses.value } : {}),
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
  provides: Object.keys(TARGETS) as ImportableType[],
  async fetchRecords(scope: ImportScope) {
    const records: ProviderRecord[] = [];
    const failures: string[] = [];
    for (const type of scope.types) {
      for (const target of TARGETS[type] ?? []) {
        try {
          const url = `${ENDPOINT}?format=json&query=${encodeURIComponent(
            buildQuery(target, scope.limit ?? 25),
          )}`;
          const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
          if (!response.ok) {
            throw new Error(`HTTP ${String(response.status)}`);
          }
          const body = (await response.json()) as { results: { bindings: SparqlBinding[] } };
          records.push(...parseWikidataResults(body.results.bindings, type, target.kind));
        } catch (error) {
          // One heavy class must not sink the whole batch.
          const message = error instanceof Error ? error.message : String(error);
          failures.push(`${type}/${target.classId}: ${message}`);
          console.warn(`wikidata target failed — ${type}/${target.classId}: ${message}`);
        }
      }
    }
    if (records.length === 0 && failures.length > 0) {
      throw new Error(`All targets failed (${failures.join('; ')})`);
    }
    return records;
  },
};
