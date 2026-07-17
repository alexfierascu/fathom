/**
 * The traveller's lifetime record, kept locally: which places were
 * first explored when, which days the atlas was opened, and which
 * places were pinned as favourites. The recently-viewed trail is a
 * short working memory; this is the permanent log the progression
 * engine reads.
 */

export interface FavouritePlace {
  entityId: string;
  name: string;
  path: string;
}

const VISITED_KEY = 'fathom-visited';
const DAYS_KEY = 'fathom-days';
const FAVOURITES_KEY = 'fathom-favourites';
const DAYS_LIMIT = 730;

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable — the log simply isn't kept.
  }
}

export const today = (): string => new Date().toISOString().slice(0, 10);

/** Canonical id → the date the place was first explored. */
export function loadVisited(): Record<string, string> {
  const visited = read<Record<string, string>>(VISITED_KEY);
  return visited && typeof visited === 'object' ? visited : {};
}

/** Stamp a place as explored; the first date is never overwritten. */
export function recordExploration(canonicalId: string): void {
  const visited = loadVisited();
  if (!visited[canonicalId]) {
    visited[canonicalId] = today();
    write(VISITED_KEY, visited);
  }
  recordActiveDay();
}

/** The distinct days the atlas was used, oldest first. */
export function loadActiveDays(): string[] {
  const days = read<string[]>(DAYS_KEY);
  return Array.isArray(days) ? days.filter((day) => typeof day === 'string') : [];
}

export function recordActiveDay(): void {
  const days = loadActiveDays();
  const day = today();
  if (days[days.length - 1] === day) return;
  if (!days.includes(day)) write(DAYS_KEY, [...days, day].sort().slice(-DAYS_LIMIT));
}

export function loadFavourites(): FavouritePlace[] {
  const favourites = read<FavouritePlace[]>(FAVOURITES_KEY);
  if (!Array.isArray(favourites)) return [];
  return favourites.filter(
    (place): place is FavouritePlace =>
      typeof place === 'object' &&
      place !== null &&
      typeof place.entityId === 'string' &&
      typeof place.name === 'string' &&
      typeof place.path === 'string',
  );
}

export function isFavourite(entityId: string): boolean {
  return loadFavourites().some((place) => place.entityId === entityId);
}

/** Pin or unpin a place; returns the new pinned state. */
export function toggleFavourite(place: FavouritePlace): boolean {
  const favourites = loadFavourites();
  const without = favourites.filter((candidate) => candidate.entityId !== place.entityId);
  const nowPinned = without.length === favourites.length;
  write(FAVOURITES_KEY, nowPinned ? [...favourites, place] : without);
  return nowPinned;
}

const LEGEND_KEY = 'fathom-legend';

/** The traveller found the legendary waters past the atlas's edge. */
export function recordLegendFound(): void {
  if (!read<{ on?: string }>(LEGEND_KEY)) write(LEGEND_KEY, { on: today() });
  recordActiveDay();
}

export function legendFound(): boolean {
  return read<{ on?: string }>(LEGEND_KEY) !== null;
}

// ---------------------------------------------------------------------------
// Identity — who the captain's log belongs to. Local until an account
// exists; the same shape syncs to the server once one does.

export interface Identity {
  name: string;
  bio: string;
  /** One of the predefined avatar ids. */
  avatar: string;
  /** A custom portrait (data URL), unlockable by rank. */
  portrait?: string;
}

const IDENTITY_KEY = 'fathom-identity';

export const DEFAULT_IDENTITY: Identity = { name: '', bio: '', avatar: 'helm' };

export function loadIdentity(): Identity {
  const identity = read<Partial<Identity>>(IDENTITY_KEY);
  if (!identity || typeof identity !== 'object') return DEFAULT_IDENTITY;
  return {
    name: typeof identity.name === 'string' ? identity.name : '',
    bio: typeof identity.bio === 'string' ? identity.bio : '',
    avatar: typeof identity.avatar === 'string' ? identity.avatar : 'helm',
    portrait: typeof identity.portrait === 'string' ? identity.portrait : undefined,
  };
}

export function saveIdentity(identity: Identity): void {
  write(IDENTITY_KEY, identity);
}
