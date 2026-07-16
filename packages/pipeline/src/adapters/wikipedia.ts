import type {
  Enricher,
  ImportScope,
  NormalizedRecord,
  ProviderAdapter,
  ProviderRecord,
} from '../types';

const USER_AGENT = 'FathomAtlas-DataPipeline/0.1 (open-source maritime atlas)';

interface WikipediaSummary {
  title: string;
  extract?: string;
  description?: string;
  coordinates?: { lat: number; lon: number };
  content_urls?: { desktop?: { page?: string } };
}

async function fetchSummary(title: string): Promise<WikipediaSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, { headers: { 'user-agent': USER_AGENT } });
  if (!response.ok) return null;
  return (await response.json()) as WikipediaSummary;
}

function wikipediaSource(title: string, pageUrl: string) {
  return {
    id: `wikipedia-${title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`,
    type: 'website' as const,
    title: `${title} — Wikipedia`,
    publisher: 'Wikimedia Foundation',
    locator: pageUrl,
    accessedOn: new Date().toISOString().slice(0, 10),
    license: 'CC BY-SA 4.0',
  };
}

/**
 * Enricher: fills missing summaries from the Wikipedia page matching the
 * record's name, citing the article. Only the first sentence is used —
 * atlas summaries are one line by design.
 */
export function wikipediaEnricher(options?: { maxLookups?: number }): Enricher {
  let remaining = options?.maxLookups ?? 25;
  return {
    name: 'wikipedia-summaries',
    async enrich(record: NormalizedRecord) {
      if (record.summary && record.summary.length > 40) return record;
      if (remaining <= 0) return record;
      remaining -= 1;
      const summary = await fetchSummary(record.name);
      const extract = summary?.extract?.trim().replace(/\s+/g, ' ');
      if (!summary || !extract) return record;
      const firstSentence = /^.+?[.!?](?=\s|$)/.exec(extract)?.[0] ?? extract;
      const pageUrl =
        summary.content_urls?.desktop?.page ??
        `https://en.wikipedia.org/wiki/${encodeURIComponent(record.name)}`;
      return {
        ...record,
        summary: firstSentence,
        lat: record.lat ?? summary.coordinates?.lat,
        lon: record.lon ?? summary.coordinates?.lon,
        sources: [...record.sources, wikipediaSource(summary.title, pageUrl)],
      };
    },
  };
}

/**
 * Adapter: imports a curated list of Wikipedia article titles as entity
 * records — Wikipedia has no queryable "all straits" listing, so this
 * adapter works from editorial title lists.
 */
export function wikipediaAdapter(
  titles: readonly { title: string; entityType: ProviderRecord['entityType'] }[],
): ProviderAdapter {
  return {
    name: 'wikipedia',
    provides: [...new Set(titles.map((entry) => entry.entityType))],
    async fetchRecords(scope: ImportScope) {
      const records: ProviderRecord[] = [];
      for (const entry of titles) {
        if (!scope.types.includes(entry.entityType)) continue;
        const summary = await fetchSummary(entry.title);
        if (!summary?.extract) continue;
        const pageUrl =
          summary.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.title)}`;
        records.push({
          provider: 'wikipedia',
          providerId: summary.title,
          entityType: entry.entityType,
          name: summary.title,
          lat: summary.coordinates?.lat,
          lon: summary.coordinates?.lon,
          summary:
            /^.+?[.!?](?=\s|$)/.exec(summary.extract.trim().replace(/\s+/g, ' '))?.[0] ??
            summary.extract,
          source: wikipediaSource(summary.title, pageUrl),
        });
      }
      return records;
    },
  };
}
