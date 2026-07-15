import { loadAllStraits } from './loader';
import type { Strait, StraitRegion } from './schema';

/**
 * Regions are not stored as documents yet, so they are derived from the
 * strait documents. Countries and water bodies ARE first-class documents;
 * here only edges are derived — strait ↔ country from `countries` names and
 * strait ↔ water body from "A ↔ B" `connects` values — by slugifying names.
 * Edge ids must resolve to documents; integrity checking enforces it.
 */

export interface RegionEntity {
  id: string;
  name: StraitRegion;
}

/** Deterministic token from a display name ("Gulf of St. Lawrence" → gulf-of-st-lawrence). */
export function slugifyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The water-body names a strait's `connects` field declares, in order. */
export function connectedWaterBodyNames(strait: Strait): readonly string[] {
  const parts = strait.connects.split(' ↔ ');
  return parts.length === 2 ? parts : [];
}

export interface DerivedRegistries {
  regionsById: ReadonlyMap<string, RegionEntity>;
  /** Membership and edge maps, all in canonical strait order. */
  straitIdsByCountryId: ReadonlyMap<string, readonly string[]>;
  straitIdsByWaterBodyId: ReadonlyMap<string, readonly string[]>;
  straitIdsByRegionId: ReadonlyMap<string, readonly string[]>;
  waterBodyIdsByStraitId: ReadonlyMap<string, readonly string[]>;
}

let cache: DerivedRegistries | null = null;

export function buildDerivedRegistries(straits: readonly Strait[]): DerivedRegistries {
  const regionsById = new Map<string, RegionEntity>();
  const straitIdsByCountryId = new Map<string, string[]>();
  const straitIdsByWaterBodyId = new Map<string, string[]>();
  const straitIdsByRegionId = new Map<string, string[]>();
  const waterBodyIdsByStraitId = new Map<string, string[]>();

  const append = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key) ?? [];
    if (!list.includes(value)) list.push(value);
    map.set(key, list);
  };

  for (const strait of straits) {
    for (const countryName of strait.countries) {
      append(straitIdsByCountryId, slugifyName(countryName), strait.id);
    }

    const regionId = slugifyName(strait.region);
    if (!regionsById.has(regionId)) {
      regionsById.set(regionId, { id: regionId, name: strait.region });
    }
    append(straitIdsByRegionId, regionId, strait.id);

    for (const waterBodyName of connectedWaterBodyNames(strait)) {
      const id = slugifyName(waterBodyName);
      append(straitIdsByWaterBodyId, id, strait.id);
      append(waterBodyIdsByStraitId, strait.id, id);
    }
  }

  return {
    regionsById,
    straitIdsByCountryId,
    straitIdsByWaterBodyId,
    straitIdsByRegionId,
    waterBodyIdsByStraitId,
  };
}

/** Registries for the loaded dataset, built once and memoized. */
export function derivedRegistries(): DerivedRegistries {
  cache ??= buildDerivedRegistries(loadAllStraits());
  return cache;
}
