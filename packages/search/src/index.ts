/**
 * @fathom/search — the atlas search engine.
 *
 * A dependency-free index (`engine.ts`) plus a builder that indexes
 * everything charted in the atlas (`atlas.ts`). Framework-agnostic by
 * design: the web app, future mobile clients, and APIs consume the same
 * engine.
 */

export {
  SEARCHABLE_TYPES,
  createSearchIndex,
  foldForSearch,
  groupResults,
  withinEditDistance,
} from './engine';
export type {
  MatchRange,
  SearchDocument,
  SearchIndex,
  SearchOptions,
  SearchResult,
  SearchResultGroup,
  SearchableType,
} from './engine';

export { atlasSearchIndex, atlasSuggestions, buildAtlasSearchDocuments } from './atlas';
