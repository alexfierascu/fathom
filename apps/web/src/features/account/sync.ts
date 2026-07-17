import { accountApi, type ProgressEntry } from './api';

/**
 * Two-way sync between the browser's captain's log and the account.
 * The log is additive — places explored, days at sea, voyages
 * finished — so every key merges by union or high-water mark before
 * anything is written. Nothing is ever lost to a sync: signing in on
 * a second ship combines both logs.
 */

const SYNC_PREFIXES = [
  'fathom-journey',
  'fathom-quiz-best',
  'fathom-visited',
  'fathom-days',
  'fathom-favourites',
];

export const isSyncableKey = (key: string) =>
  SYNC_PREFIXES.some((prefix) => key.startsWith(prefix));

type Json = unknown;

function parse(text: string | null): Json {
  if (text === null) return null;
  try {
    return JSON.parse(text) as Json;
  } catch {
    return null;
  }
}

const isRecord = (value: Json): value is Record<string, Json> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Merge two values of one storage key without losing progress. */
export function mergeValue(key: string, local: Json, remote: Json): Json {
  if (local === null || local === undefined) return remote;
  if (remote === null || remote === undefined) return local;

  if (key === 'fathom-visited') {
    // Union of first-visit dates; the earlier date wins.
    if (!isRecord(local) || !isRecord(remote)) return local;
    const merged: Record<string, Json> = { ...remote, ...local };
    for (const [id, date] of Object.entries(remote)) {
      const mine = merged[id];
      if (typeof mine === 'string' && typeof date === 'string' && date < mine) merged[id] = date;
    }
    return merged;
  }

  if (key === 'fathom-days') {
    if (!Array.isArray(local) || !Array.isArray(remote)) return local;
    const all: unknown[] = [...(remote as unknown[]), ...(local as unknown[])];
    return [...new Set(all)].filter((day) => typeof day === 'string').sort();
  }

  if (key === 'fathom-favourites') {
    if (!Array.isArray(local) || !Array.isArray(remote)) return local;
    const byId = new Map<string, Json>();
    const all: unknown[] = [...(remote as unknown[]), ...(local as unknown[])];
    for (const place of all) {
      if (isRecord(place) && typeof place.entityId === 'string') byId.set(place.entityId, place);
    }
    return [...byId.values()];
  }

  if (key === 'fathom-quiz-best') {
    // High-water mark per tier.
    if (!isRecord(local) || !isRecord(remote)) return local;
    const merged: Record<string, Json> = { ...remote, ...local };
    for (const [tier, score] of Object.entries(remote)) {
      const mine = merged[tier];
      if (typeof mine === 'number' && typeof score === 'number' && score > mine) {
        merged[tier] = score;
      }
    }
    return merged;
  }

  if (key.startsWith('fathom-journey-log-')) {
    if (!isRecord(local) || !isRecord(remote)) return local;
    const quiz = {
      ...(isRecord(remote.quiz) ? remote.quiz : {}),
      ...(isRecord(local.quiz) ? local.quiz : {}),
    };
    const challenges = {
      ...(isRecord(remote.challenges) ? remote.challenges : {}),
      ...(isRecord(local.challenges) ? local.challenges : {}),
    };
    // Keep the better exam: a pass beats a fail, then higher score.
    const exams = [local.exam, remote.exam].filter(isRecord);
    const exam = exams.sort((a, b) => {
      const passed = Number(b.passed === true) - Number(a.passed === true);
      if (passed !== 0) return passed;
      return (
        (typeof b.score === 'number' ? b.score : 0) - (typeof a.score === 'number' ? a.score : 0)
      );
    })[0];
    return exam ? { quiz, challenges, exam } : { quiz, challenges };
  }

  if (key.startsWith('fathom-journey-')) {
    // Journey progress: finished beats unfinished, then the further stop.
    if (!isRecord(local) || !isRecord(remote)) return local;
    const pick = (a: Record<string, Json>, b: Record<string, Json>) => {
      const finished = Number(b.finished === true) - Number(a.finished === true);
      if (finished !== 0) return finished > 0 ? b : a;
      const stopA = typeof a.stop === 'number' ? a.stop : -1;
      const stopB = typeof b.stop === 'number' ? b.stop : -1;
      return stopB > stopA ? b : a;
    };
    const winner = pick(local, remote);
    const dates = [local.finishedOn, remote.finishedOn].filter(
      (date): date is string => typeof date === 'string',
    );
    return dates.length > 0 ? { ...winner, finishedOn: dates.sort()[0] } : winner;
  }

  return local;
}

function readSyncableKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (key && isSyncableKey(key)) keys.push(key);
  }
  return keys;
}

/** Pull the account's log, merge into this browser, push the result. */
export async function syncLog(): Promise<{ pulled: number; pushed: number }> {
  const { entries } = await accountApi.pullProgress();

  let pulled = 0;
  for (const [key, entry] of Object.entries(entries)) {
    if (!isSyncableKey(key)) continue;
    const local = parse(window.localStorage.getItem(key));
    const merged = mergeValue(key, local, parse(entry.value));
    if (merged !== null && merged !== undefined) {
      const text = JSON.stringify(merged);
      if (text !== window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, text);
        pulled += 1;
      }
    }
  }

  const now = new Date().toISOString();
  const push: Record<string, ProgressEntry> = {};
  for (const key of readSyncableKeys()) {
    const value = window.localStorage.getItem(key);
    if (value !== null) push[key] = { value, updatedAt: now };
  }
  const pushed = Object.keys(push).length;
  if (pushed > 0) await accountApi.pushProgress(push);
  return { pulled, pushed };
}
