import { slugifyName } from '@fathom/data';

import type { Issue, NormalizedRecord, ProviderRecord } from '../types';

const TOKEN = /^[a-z0-9-]+$/;

/**
 * Stage 2 — Normalize. Trims and canonicalizes names, derives slugs, and
 * merges records describing the same entity (same type + slug) across
 * providers, keeping every provenance and source.
 */
export function normalize(records: readonly ProviderRecord[]): {
  normalized: readonly NormalizedRecord[];
  issues: readonly Issue[];
  duplicatesInBatch: number;
} {
  const issues: Issue[] = [];
  const byKey = new Map<string, NormalizedRecord>();
  let duplicatesInBatch = 0;

  for (const record of records) {
    const name = record.name.trim().replace(/\s+/g, ' ');
    if (!name) {
      issues.push({
        severity: 'error',
        stage: 'normalize',
        subject: `${record.provider}:${record.providerId}`,
        message: 'Record has no name',
      });
      continue;
    }
    const id = slugifyName(name);
    if (!TOKEN.test(id)) {
      issues.push({
        severity: 'error',
        stage: 'normalize',
        subject: name,
        message: `Name does not produce a valid slug ("${id}")`,
      });
      continue;
    }

    const key = `${record.entityType}:${id}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        id,
        entityType: record.entityType,
        name,
        alternateNames: dedupe(record.alternateNames ?? []),
        lat: record.lat,
        lon: record.lon,
        summary: record.summary?.trim() ? record.summary.trim() : undefined,
        countryNames: dedupe(record.countryNames ?? []),
        connectsNames: dedupe(record.connectsNames ?? []),
        waterBodyType: record.waterBodyType,
        providers: [{ provider: record.provider, providerId: record.providerId }],
        sources: [record.source],
      });
      continue;
    }

    duplicatesInBatch += 1;
    byKey.set(key, {
      ...existing,
      alternateNames: dedupe([...existing.alternateNames, ...(record.alternateNames ?? [])]),
      lat: existing.lat ?? record.lat,
      lon: existing.lon ?? record.lon,
      summary: pickLonger(existing.summary, record.summary?.trim()),
      countryNames: dedupe([...existing.countryNames, ...(record.countryNames ?? [])]),
      connectsNames:
        existing.connectsNames.length > 0
          ? existing.connectsNames
          : dedupe(record.connectsNames ?? []),
      waterBodyType: existing.waterBodyType ?? record.waterBodyType,
      providers: [
        ...existing.providers,
        { provider: record.provider, providerId: record.providerId },
      ],
      sources: [...existing.sources, record.source],
    });
  }

  return { normalized: [...byKey.values()], issues, duplicatesInBatch };
}

const dedupe = (values: readonly string[]) => [
  ...new Set(values.map((v) => v.trim()).filter(Boolean)),
];

const pickLonger = (a: string | undefined, b: string | undefined) => {
  if (!a) return b === '' ? undefined : b;
  if (!b) return a;
  return b.length > a.length ? b : a;
};
