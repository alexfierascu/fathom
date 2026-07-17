import { useCallback, useEffect, useState } from 'react';

/**
 * Journey Mode state: where the traveller is, persisted locally so a
 * journey can be resumed in a later session. One record per journey.
 */

export interface JourneyProgress {
  started: boolean;
  finished: boolean;
  /** Index of the current stop once started. */
  stop: number;
  /** ISO date of the first completion — the passport stamp. */
  finishedOn?: string;
}

const FRESH: JourneyProgress = { started: false, finished: false, stop: 0 };

const storageKey = (journeyId: string) => `fathom-journey-${journeyId}`;

function loadProgress(journeyId: string): JourneyProgress {
  try {
    const raw = window.localStorage.getItem(storageKey(journeyId));
    if (!raw) return FRESH;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return FRESH;
    const record = parsed as Partial<JourneyProgress>;
    return {
      started: record.started === true,
      finished: record.finished === true,
      stop: typeof record.stop === 'number' && record.stop >= 0 ? record.stop : 0,
      finishedOn: typeof record.finishedOn === 'string' ? record.finishedOn : undefined,
    };
  } catch {
    return FRESH;
  }
}

export function useJourneyProgress(journeyId: string, stopCount: number) {
  const [progress, setProgress] = useState<JourneyProgress>(() => loadProgress(journeyId));

  // Navigating between journeys reuses the mounted page component.
  const [loadedFor, setLoadedFor] = useState(journeyId);
  if (loadedFor !== journeyId) {
    setLoadedFor(journeyId);
    setProgress(loadProgress(journeyId));
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(journeyId), JSON.stringify(progress));
    } catch {
      // Storage unavailable — progress simply isn't kept.
    }
  }, [journeyId, progress]);

  const clamp = useCallback(
    (stop: number) => Math.min(Math.max(stop, 0), Math.max(stopCount - 1, 0)),
    [stopCount],
  );

  const start = useCallback(() => {
    setProgress({ started: true, finished: false, stop: 0 });
  }, []);
  const resume = useCallback(() => {
    setProgress((state) => ({ ...state, started: true, finished: false }));
  }, []);
  const pause = useCallback(() => {
    setProgress((state) => ({ ...state, started: false }));
  }, []);
  const next = useCallback(() => {
    setProgress((state) => ({ ...state, stop: clamp(state.stop + 1) }));
  }, [clamp]);
  const previous = useCallback(() => {
    setProgress((state) => ({ ...state, stop: clamp(state.stop - 1) }));
  }, [clamp]);
  const jumpTo = useCallback(
    (stop: number) => {
      setProgress((state) => ({ ...state, started: true, stop: clamp(stop) }));
    },
    [clamp],
  );
  const finish = useCallback(() => {
    setProgress((state) => ({
      ...state,
      finished: true,
      finishedOn: state.finishedOn ?? new Date().toISOString().slice(0, 10),
    }));
  }, []);
  const reset = useCallback(() => {
    setProgress(FRESH);
  }, []);

  return { progress, start, resume, pause, next, previous, jumpTo, finish, reset };
}
