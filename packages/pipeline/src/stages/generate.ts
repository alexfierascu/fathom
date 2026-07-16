import {
  CountrySchema,
  IslandSchema,
  PortSchema,
  StraitSchema,
  WaterBodySchema,
  slugifyName,
  validateEntity,
  type Strait,
  type WaterBody,
} from '@fathom/data';
import type { AtlasContent } from '@fathom/search';
import type { z } from 'zod';

import type { Issue, NormalizedRecord, StagedEntity } from '../types';

const WATER_BODY_KINDS = new Set(['ocean', 'sea', 'channel', 'strait', 'gulf', 'bay']);

/**
 * Stage 6 — Generate entity JSON. Builds documents in Fathom's exact
 * schema shape, Zod-validates every one, and separates entities already
 * charted (duplicates) from new staged entities and from records that
 * need editorial completion before they can enter the atlas.
 */
export function generateEntities(
  records: readonly NormalizedRecord[],
  atlas: AtlasContent,
): {
  staged: readonly StagedEntity[];
  duplicatesOfAtlas: number;
  rejected: number;
  issues: readonly Issue[];
} {
  const issues: Issue[] = [];
  const staged: StagedEntity[] = [];
  let duplicatesOfAtlas = 0;
  let rejected = 0;

  const existingIds: Partial<Record<NormalizedRecord['entityType'], ReadonlySet<string>>> = {
    strait: new Set(atlas.straits.map((s) => s.id)),
    'water-body': new Set(atlas.waterBodies.map((w) => w.id)),
    country: new Set(atlas.countries.map((c) => c.id)),
    port: new Set(atlas.ports.map((p) => p.id)),
    island: new Set(atlas.islands.map((i) => i.id)),
  };

  const reject = (record: NormalizedRecord, message: string) => {
    rejected += 1;
    issues.push({
      severity: 'error',
      stage: 'generate',
      subject: `${record.entityType}:${record.id}`,
      message,
    });
  };

  const stage = (
    record: NormalizedRecord,
    schema: z.ZodType,
    document: Record<string, unknown>,
  ) => {
    const result = validateEntity(schema, document);
    if (result.ok) {
      staged.push({ type: record.entityType, id: record.id, document });
    } else {
      reject(record, `Schema validation failed: ${result.issues.join('; ')}`);
    }
  };

  for (const record of records) {
    if (existingIds[record.entityType]?.has(record.id)) {
      duplicatesOfAtlas += 1;
      issues.push({
        severity: 'warning',
        stage: 'generate',
        subject: `${record.entityType}:${record.id}`,
        message: 'Already charted in the atlas — skipped as duplicate',
      });
      continue;
    }
    const sourceIds = record.sources.map((source) => source.id);

    switch (record.entityType) {
      case 'strait': {
        if (record.lat === undefined || record.lon === undefined) {
          reject(record, 'Missing coordinates');
          break;
        }
        if (!record.summary) {
          reject(record, 'Missing summary — enrich or author before staging');
          break;
        }
        if (!record.connects) {
          reject(record, 'Missing connected waters — needs P206-style data or editing');
          break;
        }
        const document: Strait = {
          id: record.id,
          name: record.name,
          countries: [...record.countryNames],
          region: (record.region ?? 'Europe') as Strait['region'],
          connects: record.connects,
          lat: round(record.lat),
          lon: round(record.lon),
          note: record.summary,
          ...(record.alternateNames.length > 0
            ? { names: record.alternateNames.map((value) => ({ value })) }
            : {}),
          sourceIds,
          status: 'draft' as const,
        };
        if (document.countries.length === 0) {
          reject(record, 'No bordering countries known');
          break;
        }
        stage(record, StraitSchema, document);
        break;
      }
      case 'water-body': {
        const kind = record.waterBodyType?.toLowerCase() ?? '';
        if (!WATER_BODY_KINDS.has(kind)) {
          reject(record, `Unknown water body kind "${kind}"`);
          break;
        }
        if (!record.summary) {
          reject(record, 'Missing summary');
          break;
        }
        const parentName = record.connectsNames[0];
        const parentId = parentName ? slugifyName(parentName) : undefined;
        if (kind !== 'ocean' && !parentId) {
          reject(record, 'Non-ocean water body needs a parent — editorial assignment required');
          break;
        }
        const document: WaterBody = {
          id: record.id,
          name: record.name,
          type: kind as WaterBody['type'],
          summary: record.summary,
          ...(kind === 'ocean' ? {} : { parentId }),
          sourceIds,
          status: 'draft' as const,
        };
        stage(record, WaterBodySchema, document);
        break;
      }
      case 'country': {
        if (!record.summary) {
          reject(record, 'Missing summary');
          break;
        }
        stage(record, CountrySchema, {
          id: record.id,
          name: record.name,
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      case 'island': {
        const waterName = record.connectsNames[0];
        if (!waterName) {
          reject(record, 'Island needs its water body');
          break;
        }
        if (!record.summary) {
          reject(record, 'Missing summary');
          break;
        }
        stage(record, IslandSchema, {
          id: record.id,
          name: record.name,
          waterBodyId: slugifyName(waterName),
          ...(record.countryNames[0] ? { countryId: slugifyName(record.countryNames[0]) } : {}),
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      case 'port': {
        const countryName = record.countryNames[0];
        const waterName = record.connectsNames[0];
        if (!countryName || !waterName || !record.summary) {
          reject(record, 'Port needs a country, a water it opens onto, and a summary');
          break;
        }
        stage(record, PortSchema, {
          id: record.id,
          name: record.name,
          countryId: slugifyName(countryName),
          opensOnto: { type: 'water-body', id: slugifyName(waterName) },
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      default:
        reject(record, `Generation for type "${record.entityType}" is not implemented yet`);
    }
  }

  return { staged, duplicatesOfAtlas, rejected, issues };
}

const round = (value: number) => Math.round(value * 100) / 100;
