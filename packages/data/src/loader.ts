import { StraitSchema, StraitsIndexSchema, type Strait, type StraitsIndex } from './schema';

import { RAW_STRAIT_DOCUMENTS } from './straits/manifest';
import rawIndex from './straits/index.json';

interface LoadedData {
  index: StraitsIndex;
  byId: ReadonlyMap<string, Strait>;
  all: readonly Strait[];
}

let cache: LoadedData | null = null;

/**
 * Validates the index and every strait document with Zod (once, memoized) and
 * cross-checks that the index and the documents agree. Throws on any invalid
 * or inconsistent data — a broken dataset should fail loudly, not render.
 */
function load(): LoadedData {
  if (cache) return cache;

  const index = StraitsIndexSchema.parse(rawIndex);

  const byId = new Map<string, Strait>();
  for (const raw of RAW_STRAIT_DOCUMENTS) {
    const strait = StraitSchema.parse(raw);
    if (byId.has(strait.id)) {
      throw new Error(`Duplicate strait document for id "${strait.id}"`);
    }
    byId.set(strait.id, strait);
  }

  if (index.length !== byId.size) {
    throw new Error(
      `Index lists ${String(index.length)} straits but ${String(byId.size)} documents exist`,
    );
  }

  // The index defines the canonical ordering of the atlas.
  const all = index.map((entry) => {
    const strait = byId.get(entry.id);
    if (!strait) {
      throw new Error(`Index entry "${entry.id}" has no strait document`);
    }
    return strait;
  });

  cache = { index, byId, all };
  return cache;
}

/** The lightweight index of all straits, in canonical order. */
export function loadStraitsIndex(): StraitsIndex {
  return load().index;
}

/** One full strait document by id. Throws for unknown ids. */
export function loadStrait(id: string): Strait {
  const strait = load().byId.get(id);
  if (!strait) {
    throw new Error(`Unknown strait id "${id}"`);
  }
  return strait;
}

/** All full strait documents, in canonical (index) order. */
export function loadAllStraits(): readonly Strait[] {
  return load().all;
}
