import { useCallback, useEffect, useState } from 'react';

/**
 * The voyage log: which quizzes were answered (and how) and which chart
 * challenges were completed, per journey — the raw material of the
 * Journey Notes recap. Local, like all journey progress.
 */

export interface JourneyLog {
  /** Keyed `stopIndex:quizKey` → answered correctly? */
  quiz: Record<string, boolean>;
  /** Keyed by stop index → challenge completed. */
  challenges: Record<string, boolean>;
  /** The end-of-voyage exam, once taken. */
  exam?: { score: number; total: number; passed: boolean };
}

const EMPTY: JourneyLog = { quiz: {}, challenges: {} };

const storageKey = (journeyId: string) => `fathom-journey-log-${journeyId}`;

function loadLog(journeyId: string): JourneyLog {
  try {
    const raw = window.localStorage.getItem(storageKey(journeyId));
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    const record = parsed as Partial<JourneyLog>;
    return {
      quiz: typeof record.quiz === 'object' && record.quiz !== null ? record.quiz : {},
      challenges:
        typeof record.challenges === 'object' && record.challenges !== null
          ? record.challenges
          : {},
      exam: typeof record.exam === 'object' && record.exam !== null ? record.exam : undefined,
    };
  } catch {
    return EMPTY;
  }
}

export function useJourneyLog(journeyId: string) {
  const [log, setLog] = useState<JourneyLog>(() => loadLog(journeyId));

  const [loadedFor, setLoadedFor] = useState(journeyId);
  if (loadedFor !== journeyId) {
    setLoadedFor(journeyId);
    setLog(loadLog(journeyId));
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(journeyId), JSON.stringify(log));
    } catch {
      // Storage unavailable — the log simply isn't kept.
    }
  }, [journeyId, log]);

  const logQuiz = useCallback((key: string, correct: boolean) => {
    setLog((state) => ({ ...state, quiz: { ...state.quiz, [key]: correct } }));
  }, []);
  const logChallenge = useCallback((stop: number) => {
    setLog((state) => ({ ...state, challenges: { ...state.challenges, [String(stop)]: true } }));
  }, []);
  const logExam = useCallback((score: number, total: number, passed: boolean) => {
    setLog((state) => ({ ...state, exam: { score, total, passed } }));
  }, []);
  const resetLog = useCallback(() => {
    setLog(EMPTY);
  }, []);

  return { log, logQuiz, logChallenge, logExam, resetLog };
}
