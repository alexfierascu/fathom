/**
 * The Fathom search engine: a small, dependency-free, framework-free index
 * over search documents. It has no notion of React or the web app — the
 * same engine serves the site today and mobile or API surfaces later.
 */

export const SEARCHABLE_TYPES = [
  'strait',
  'water-body',
  'country',
  'region',
  'port',
  'canal',
  'bridge',
  'tunnel',
] as const;
export type SearchableType = (typeof SEARCHABLE_TYPES)[number];

export interface SearchDocument {
  /** Canonical entity id (`strait:gibraltar`). */
  entityId: string;
  type: SearchableType;
  name: string;
  /** Site-relative path of the entity's page. */
  path: string;
  /** Short summary shown with the result. */
  summary: string;
  /** Alternate names, tags, countries, regions, codes — all searchable. */
  keywords: readonly string[];
}

export interface MatchRange {
  start: number;
  end: number;
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  /** Ranges within `document.name` matching the query, for highlighting. */
  nameMatches: readonly MatchRange[];
}

export interface SearchIndex {
  search: (query: string, options?: { limit?: number }) => readonly SearchResult[];
  readonly documents: readonly SearchDocument[];
}

/**
 * Folds one UTF-16 unit to its lowercased, diacritic-free base character,
 * so folded strings stay index-aligned with the original ("Öresund" is
 * found by "ores" and the highlight range still lands on "Öre").
 */
function foldChar(char: string): string {
  const decomposed = char.normalize('NFD');
  const base = decomposed.charAt(0);
  return base.toLowerCase() || char.toLowerCase();
}

/** Folds a whole string, preserving length and character positions. */
export function foldForSearch(value: string): string {
  let folded = '';
  for (let i = 0; i < value.length; i += 1) {
    folded += foldChar(value.charAt(i));
  }
  return folded;
}

interface IndexedDocument {
  document: SearchDocument;
  foldedName: string;
  foldedKeywords: readonly string[];
  foldedSummary: string;
}

const isWordStart = (haystack: string, position: number) =>
  position === 0 || !/[a-z0-9]/.test(haystack.charAt(position - 1));

/** Score one query token against a document; 0 means no match. */
function scoreToken(entry: IndexedDocument, token: string): number {
  const { foldedName, foldedKeywords, foldedSummary } = entry;
  const inName = foldedName.indexOf(token);
  if (inName === 0) return 100;
  if (inName > 0 && isWordStart(foldedName, inName)) return 80;
  if (inName > 0) return 60;
  for (const keyword of foldedKeywords) {
    const inKeyword = keyword.indexOf(token);
    if (inKeyword === 0) return 40;
    if (inKeyword >= 0) return 30;
  }
  if (foldedSummary.includes(token)) return 10;
  return 0;
}

function nameMatchRanges(foldedName: string, tokens: readonly string[]): MatchRange[] {
  const ranges: MatchRange[] = [];
  for (const token of tokens) {
    let from = 0;
    let position = foldedName.indexOf(token, from);
    while (position >= 0) {
      ranges.push({ start: position, end: position + token.length });
      from = position + token.length;
      position = foldedName.indexOf(token, from);
    }
  }
  ranges.sort((a, b) => a.start - b.start);
  const merged: MatchRange[] = [];
  for (const range of ranges) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      last.end = Math.max(last.end, range.end);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

export function createSearchIndex(documents: readonly SearchDocument[]): SearchIndex {
  const indexed: readonly IndexedDocument[] = documents.map((document) => ({
    document,
    foldedName: foldForSearch(document.name),
    foldedKeywords: document.keywords.map(foldForSearch),
    foldedSummary: foldForSearch(document.summary),
  }));

  return {
    documents,
    search(query, options) {
      const limit = options?.limit ?? 15;
      const tokens = foldForSearch(query).split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return [];

      const results: SearchResult[] = [];
      for (const entry of indexed) {
        let score = 0;
        let allMatched = true;
        for (const token of tokens) {
          const tokenScore = scoreToken(entry, token);
          if (tokenScore === 0) {
            allMatched = false;
            break;
          }
          score += tokenScore;
        }
        if (!allMatched) continue;
        results.push({
          document: entry.document,
          score,
          nameMatches: nameMatchRanges(entry.foldedName, tokens),
        });
      }

      results.sort((a, b) => b.score - a.score || a.document.name.localeCompare(b.document.name));
      return results.slice(0, limit);
    },
  };
}

export interface SearchResultGroup {
  type: SearchableType;
  results: readonly SearchResult[];
}

/**
 * Groups results for display. Groups are ordered by their best-scoring
 * result (canonical type order as the tiebreak), so the strongest match is
 * always first on screen and first to open on Enter.
 */
export function groupResults(results: readonly SearchResult[]): readonly SearchResultGroup[] {
  return SEARCHABLE_TYPES.map((type, position) => ({
    type,
    position,
    results: results.filter((result) => result.document.type === type),
  }))
    .filter((group) => group.results.length > 0)
    .sort(
      (a, b) => (b.results[0]?.score ?? 0) - (a.results[0]?.score ?? 0) || a.position - b.position,
    )
    .map(({ type, results: groupResults }) => ({ type, results: groupResults }));
}
