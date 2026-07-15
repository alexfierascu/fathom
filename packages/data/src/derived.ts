import { loadAllStraits } from './loader';
import type { Strait, StraitRegion } from './schema';

/**
 * Countries and regions are not stored as documents yet — duplicating them
 * would violate the single-source rule, so they are derived from the strait
 * documents. Water bodies ARE first-class documents (src/water-bodies/);
 * here only the strait ↔ water body edges are derived, by slugifying the
 * `connects` values of the form "A ↔ B" (prose values yield none). Edge ids
 * must resolve to water body documents — integrity checking enforces it.
 */

export interface Country {
  id: string;
  name: string;
}

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
  countriesById: ReadonlyMap<string, Country>;
  countryIdByName: ReadonlyMap<string, string>;
  regionsById: ReadonlyMap<string, RegionEntity>;
  /** Membership and edge maps, all in canonical strait order. */
  straitIdsByCountryId: ReadonlyMap<string, readonly string[]>;
  straitIdsByWaterBodyId: ReadonlyMap<string, readonly string[]>;
  straitIdsByRegionId: ReadonlyMap<string, readonly string[]>;
  waterBodyIdsByStraitId: ReadonlyMap<string, readonly string[]>;
}

let cache: DerivedRegistries | null = null;

export function buildDerivedRegistries(straits: readonly Strait[]): DerivedRegistries {
  const countriesById = new Map<string, Country>();
  const countryIdByName = new Map<string, string>();
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
      const id = slugifyName(countryName);
      if (!countriesById.has(id)) {
        countriesById.set(id, { id, name: countryName });
        countryIdByName.set(countryName, id);
      }
      append(straitIdsByCountryId, id, strait.id);
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
    countriesById,
    countryIdByName,
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
