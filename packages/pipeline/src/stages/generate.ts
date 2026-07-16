import {
  BridgeSchema,
  CanalSchema,
  CountrySchema,
  IslandSchema,
  MaritimeRouteSchema,
  PortSchema,
  StraitSchema,
  TunnelSchema,
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
 * Order-insensitive name key: "Strait of Kerch" and "Kerch Strait" fold to
 * the same key, as do "Saint"/"St." variants. Catches name-variant
 * duplicates that slug equality misses.
 */
export function nameKey(name: string): string {
  return slugifyName(name)
    .split('-')
    .map((word) => (word === 'saint' ? 'st' : word))
    .filter((word) => word !== 'the' && word !== 'of')
    .sort()
    .join('-');
}

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

  const keysOf = (entries: readonly { id: string; name: string }[]) =>
    new Set(entries.flatMap((entry) => [entry.id, nameKey(entry.name)]));
  const existingKeys: Partial<Record<NormalizedRecord['entityType'], ReadonlySet<string>>> = {
    strait: keysOf(atlas.straits),
    'water-body': keysOf(atlas.waterBodies),
    country: keysOf(atlas.countries),
    port: keysOf(atlas.ports),
    canal: keysOf(atlas.canals),
    bridge: keysOf(atlas.bridges),
    tunnel: keysOf(atlas.tunnels),
    island: keysOf(atlas.islands),
    'maritime-route': keysOf(atlas.maritimeRoutes),
  };

  /** Straits within ~0.6° combined delta of an existing strait are duplicates. */
  const nearExistingStrait = (lat: number, lon: number) =>
    atlas.straits.find((strait) => Math.abs(strait.lat - lat) + Math.abs(strait.lon - lon) < 0.6);

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
    const keys = existingKeys[record.entityType];
    if (keys?.has(record.id) || keys?.has(nameKey(record.name))) {
      duplicatesOfAtlas += 1;
      issues.push({
        severity: 'warning',
        stage: 'generate',
        subject: `${record.entityType}:${record.id}`,
        message: 'Already charted in the atlas (id or name variant) — skipped as duplicate',
      });
      continue;
    }
    if (record.entityType === 'strait' && record.lat !== undefined && record.lon !== undefined) {
      const near = nearExistingStrait(record.lat, record.lon);
      if (near) {
        duplicatesOfAtlas += 1;
        issues.push({
          severity: 'warning',
          stage: 'generate',
          subject: `strait:${record.id}`,
          message: `Coordinates within 0.6° of charted strait:${near.id} — skipped as duplicate`,
        });
        continue;
      }
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
        const parentId = record.parentName ? slugifyName(record.parentName) : undefined;
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
          ...(record.isoCode && /^[A-Z]{2}$/.test(record.isoCode) ? { code: record.isoCode } : {}),
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      case 'canal': {
        const waters = record.connectsNames.slice(0, 2);
        if (waters.length < 2 || !record.summary || record.countryNames.length === 0) {
          reject(record, 'Canal needs two connected waters, countries, and a summary');
          break;
        }
        issues.push({
          severity: 'warning',
          stage: 'generate',
          subject: `canal:${record.id}`,
          message: 'Operational status assumed "operational" — review',
        });
        stage(record, CanalSchema, {
          id: record.id,
          name: record.name,
          connects: waters.map((name) => ({ type: 'water-body', id: slugifyName(name) })),
          countryIds: record.countryNames.map(slugifyName),
          operationalStatus: 'operational',
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      case 'bridge':
      case 'tunnel': {
        if (!record.crossesName || !record.summary || record.countryNames.length < 2) {
          reject(
            record,
            'Crossing needs the strait it crosses, at least two countries, and a summary',
          );
          break;
        }
        issues.push({
          severity: 'warning',
          stage: 'generate',
          subject: `${record.entityType}:${record.id}`,
          message: 'Operational status assumed "operational" — review',
        });
        stage(record, record.entityType === 'bridge' ? BridgeSchema : TunnelSchema, {
          id: record.id,
          name: record.name,
          crosses: { type: 'strait', id: slugifyName(record.crossesName) },
          connects: record.countryNames.map((name) => ({
            type: 'country',
            id: slugifyName(name),
          })),
          operationalStatus: 'operational',
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      case 'maritime-route': {
        const waypoints = record.connectsNames;
        if (waypoints.length < 2 || !record.summary) {
          reject(record, 'Route needs at least two sourced waypoints and a summary');
          break;
        }
        issues.push({
          severity: 'warning',
          stage: 'generate',
          subject: `maritime-route:${record.id}`,
          message: 'Route type assumed "trade-lane" — review',
        });
        stage(record, MaritimeRouteSchema, {
          id: record.id,
          name: record.name,
          routeType: 'trade-lane',
          waypoints: waypoints.map((name) => ({ type: 'water-body', id: slugifyName(name) })),
          summary: record.summary,
          sourceIds,
          status: 'draft',
        });
        break;
      }
      case 'island': {
        const chartedStraits = new Set(atlas.straits.map((strait) => strait.id));
        const flanks = record.connectsNames.map(slugifyName).filter((id) => chartedStraits.has(id));
        const waterName = record.connectsNames.find(
          (name) => !chartedStraits.has(slugifyName(name)),
        );
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
          ...(flanks.length > 0 ? { flanksStraitIds: flanks } : {}),
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
    }
  }

  return { staged, duplicatesOfAtlas, rejected, issues };
}

const round = (value: number) => Math.round(value * 100) / 100;
