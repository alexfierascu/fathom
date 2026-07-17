import { recordExploration } from '../progression/store';

/**
 * A small trail of where the reader has been, for the homepage's
 * Continue Reading section. Stored locally; nothing leaves the browser.
 */

export interface RecentVisit {
  entityId: string;
  name: string;
  path: string;
}

const STORAGE_KEY = 'fathom-recently-viewed';
const LIMIT = 8;

export function loadRecentlyViewed(): readonly RecentVisit[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentVisit =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as RecentVisit).entityId === 'string' &&
        typeof (entry as RecentVisit).name === 'string' &&
        typeof (entry as RecentVisit).path === 'string',
    );
  } catch {
    return [];
  }
}

export function recordVisit(visit: RecentVisit): void {
  try {
    const trail = [visit, ...loadRecentlyViewed().filter((v) => v.entityId !== visit.entityId)];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trail.slice(0, LIMIT)));
  } catch {
    // Storage unavailable — the trail simply isn't kept.
  }
  recordExploration(visit.entityId);
}
