import type { Strait } from '@fathom/data';

export interface StraitSeo {
  title: string;
  description: string;
  /** Site-relative canonical path; the origin is resolved at render time. */
  path: string;
}

/** Page metadata composed purely from existing strait data. */
export function buildStraitSeo(strait: Strait): StraitSeo {
  return {
    title: `${strait.name} — Fathom`,
    description: `${strait.name}: ${strait.connects}. ${strait.note}`,
    path: `/straits/${strait.id}`,
  };
}
