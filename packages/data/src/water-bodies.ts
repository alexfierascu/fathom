import {
  WaterBodiesIndexSchema,
  WaterBodySchema,
  type WaterBodiesIndex,
  type WaterBody,
} from './schema';

import { RAW_WATER_BODY_DOCUMENTS } from './water-bodies/manifest';
import rawIndex from './water-bodies/index.json';

interface LoadedWaterBodies {
  index: WaterBodiesIndex;
  byId: ReadonlyMap<string, WaterBody>;
  all: readonly WaterBody[];
}

let cache: LoadedWaterBodies | null = null;

/**
 * Validates the index and every document with Zod (once, memoized),
 * cross-checks consistency, and verifies that every parentId resolves.
 */
function load(): LoadedWaterBodies {
  if (cache) return cache;

  const index = WaterBodiesIndexSchema.parse(rawIndex);

  const byId = new Map<string, WaterBody>();
  for (const raw of RAW_WATER_BODY_DOCUMENTS) {
    const waterBody = WaterBodySchema.parse(raw);
    if (byId.has(waterBody.id)) {
      throw new Error(`Duplicate water body document for id "${waterBody.id}"`);
    }
    byId.set(waterBody.id, waterBody);
  }

  if (index.length !== byId.size) {
    throw new Error(
      `Index lists ${String(index.length)} water bodies but ${String(byId.size)} documents exist`,
    );
  }

  const all = index.map((entry) => {
    const waterBody = byId.get(entry.id);
    if (!waterBody) {
      throw new Error(`Index entry "${entry.id}" has no water body document`);
    }
    return waterBody;
  });

  for (const waterBody of all) {
    if (waterBody.parentId !== undefined && !byId.has(waterBody.parentId)) {
      throw new Error(`Water body "${waterBody.id}" has unknown parent "${waterBody.parentId}"`);
    }
  }

  cache = { index, byId, all };
  return cache;
}

/** The lightweight index of all water bodies, in canonical order. */
export function loadWaterBodiesIndex(): WaterBodiesIndex {
  return load().index;
}

/** One full water body document by id. Throws for unknown ids. */
export function loadWaterBody(id: string): WaterBody {
  const waterBody = load().byId.get(id);
  if (!waterBody) {
    throw new Error(`Unknown water body id "${id}"`);
  }
  return waterBody;
}

/** All full water body documents, in canonical (index) order. */
export function loadAllWaterBodies(): readonly WaterBody[] {
  return load().all;
}
