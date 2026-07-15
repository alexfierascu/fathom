import { loadAllStraits, loadStrait, type Strait } from '@fathom/data';

/** Slug-based lookup for routes; returns null instead of throwing. */
export function findStraitBySlug(slug: string | undefined): Strait | null {
  if (!slug) return null;
  try {
    return loadStrait(slug);
  } catch {
    return null;
  }
}

export interface AdjacentStraits {
  previous: Strait | null;
  next: Strait | null;
}

/** Neighbors of a strait in the canonical (index) order, without wrapping. */
export function getAdjacentStraits(id: string): AdjacentStraits {
  const all = loadAllStraits();
  const position = all.findIndex((strait) => strait.id === id);
  if (position === -1) return { previous: null, next: null };
  return {
    previous: position > 0 ? (all[position - 1] ?? null) : null,
    next: position < all.length - 1 ? (all[position + 1] ?? null) : null,
  };
}
