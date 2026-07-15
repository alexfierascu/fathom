/**
 * @fathom/data — shared domain data and types.
 *
 * Strait data lives as one JSON document per strait in `./straits/`, described
 * by the Zod schemas in `./schema` and served through the loader in `./loader`.
 */

export {
  STRAIT_REGIONS,
  StraitIndexEntrySchema,
  StraitRegionSchema,
  StraitSchema,
  StraitsIndexSchema,
} from './schema';
export type { Strait, StraitIndexEntry, StraitRegion, StraitsIndex } from './schema';

export { loadAllStraits, loadStrait, loadStraitsIndex } from './loader';

import { loadAllStraits } from './loader';

/** @deprecated Transitional alias — use loadAllStraits(). */
export const STRAITS = loadAllStraits();
