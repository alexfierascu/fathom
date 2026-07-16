import { STRAIT_REGIONS, slugifyName } from '@fathom/data';
import type { AtlasContent } from '@fathom/search';

import type { Issue, NormalizedRecord } from '../types';

/**
 * Coarse region assignment from coordinates. Verified against every
 * existing strait; imported records still get a review warning because
 * the boxes are editorial, not authoritative.
 */
export function assignRegion(lat: number, lon: number): (typeof STRAIT_REGIONS)[number] {
  if (lat >= 66) return 'Americas & Arctic';
  if (lon <= -25) return 'Americas & Arctic';
  if (lat >= 35 && lon <= 45) return 'Europe';
  if (lon >= 115 && (lat >= 15 || lat <= -9.5)) return 'East Asia & Oceania';
  if (lon >= 55 && lon <= 125 && lat <= 15 && lat > -9.5) return 'South & Southeast Asia';
  return 'Middle East & Africa';
}

/**
 * Stage 5 — Resolve relationships. Verifies country references against
 * charted countries, builds the connects line from connected waters,
 * assigns regions to straits, and flags everything unresolved.
 */
export function resolveRelationships(
  records: readonly NormalizedRecord[],
  atlas: AtlasContent,
): { resolved: readonly NormalizedRecord[]; issues: readonly Issue[] } {
  const issues: Issue[] = [];
  const chartedCountries = new Set(atlas.countries.map((c) => c.id));
  const chartedWaters = new Set(atlas.waterBodies.map((w) => w.id));
  const batchWaters = new Set(
    records.filter((r) => r.entityType === 'water-body').map((r) => r.id),
  );

  const resolved = records.map((record) => {
    const subject = `${record.entityType}:${record.id}`;
    const next: NormalizedRecord = { ...record };

    for (const countryName of record.countryNames) {
      const countryId = slugifyName(countryName);
      if (!chartedCountries.has(countryId)) {
        issues.push({
          severity: 'warning',
          stage: 'resolve',
          subject,
          message: `Country "${countryName}" is not charted yet (country:${countryId})`,
        });
      }
    }

    if (record.connectsNames.length >= 2) {
      const [first, second] = record.connectsNames;
      next.connects = `${first ?? ''} ↔ ${second ?? ''}`;
      for (const waterName of record.connectsNames.slice(0, 2)) {
        const waterId = slugifyName(waterName);
        if (!chartedWaters.has(waterId) && !batchWaters.has(waterId)) {
          issues.push({
            severity: 'warning',
            stage: 'resolve',
            subject,
            message: `Connected water "${waterName}" is not charted yet (water-body:${waterId})`,
          });
        }
      }
    }

    if (record.entityType === 'strait' && record.lat !== undefined && record.lon !== undefined) {
      next.region = assignRegion(record.lat, record.lon);
      issues.push({
        severity: 'warning',
        stage: 'resolve',
        subject,
        message: `Region "${next.region}" assigned from coordinates — review`,
      });
    }

    return next;
  });

  return { resolved, issues };
}
