import { Link } from 'react-router';

import { loadJourneys, type Journey } from '@fathom/discovery';

import { Breadcrumbs } from '../atlas/components/Breadcrumbs';
import { Section } from '../atlas/components/Section';
import { SeoTags } from '../atlas/components/SeoTags';

/**
 * The Voyage Passport: what the traveller has done, stamped. Everything
 * reads from the same local storage the journeys write — nothing ever
 * leaves the browser.
 */

interface StampInfo {
  journey: Journey;
  finished: boolean;
  finishedOn?: string;
  quizCorrect: number;
  quizTotal: number;
  challenges: number;
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function stampOf(journey: Journey): StampInfo {
  const progress = read(`fathom-journey-${journey.id}`) as {
    finished?: boolean;
    finishedOn?: string;
  } | null;
  const log = read(`fathom-journey-log-${journey.id}`) as {
    quiz?: Record<string, boolean>;
    challenges?: Record<string, boolean>;
  } | null;
  const quiz = Object.values(log?.quiz ?? {});
  return {
    journey,
    finished: progress?.finished === true,
    finishedOn: progress?.finishedOn,
    quizCorrect: quiz.filter(Boolean).length,
    quizTotal: quiz.length,
    challenges: Object.keys(log?.challenges ?? {}).length,
  };
}

function dailyCompletions(): number {
  try {
    let count = 0;
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key?.startsWith('fathom-journey-daily-')) continue;
      if (key.startsWith('fathom-journey-log-')) continue;
      const progress = read(key) as { finished?: boolean } | null;
      if (progress?.finished === true) count += 1;
    }
    return count;
  } catch {
    return 0;
  }
}

export function PassportPage() {
  const stamps = loadJourneys().map(stampOf);
  const finished = stamps.filter((stamp) => stamp.finished);
  const quizCorrect = stamps.reduce((sum, stamp) => sum + stamp.quizCorrect, 0);
  const quizTotal = stamps.reduce((sum, stamp) => sum + stamp.quizTotal, 0);
  const challenges = stamps.reduce((sum, stamp) => sum + stamp.challenges, 0);
  const dailies = dailyCompletions();

  const badges = [
    { label: 'First landfall', earned: finished.length > 0, hint: 'Complete any journey' },
    {
      label: 'Chokepoint master',
      earned: stamps.some((s) => s.journey.id === 'the-worlds-great-chokepoints' && s.finished),
      hint: "Complete The World's Great Chokepoints",
    },
    {
      label: 'Polar explorer',
      earned: stamps.some((s) => s.journey.id === 'arctic-exploration' && s.finished),
      hint: 'Complete Arctic Exploration',
    },
    { label: 'Quizmaster', earned: quizCorrect >= 10, hint: 'Answer 10 quizzes correctly' },
    { label: 'Pathfinder', earned: challenges >= 5, hint: 'Complete 5 chart challenges' },
    { label: 'Tide follower', earned: dailies >= 3, hint: 'Complete 3 daily expeditions' },
  ];

  return (
    <>
      <SeoTags
        title="Voyage Passport — Fathom"
        description="Your journeys, quizzes, and chart challenges — stamped."
        path="/passport"
      />
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Passport' }]} />
      <article className="detail">
        <header className="hub-header">
          <h2 className="detail-title detail-title--hero">Voyage Passport</h2>
          <p className="note note--lede">
            Every voyage logged, every narrows named, every challenge met — kept in your browser and
            nowhere else.
          </p>
          <div className="log-tally" style={{ marginTop: 18 }}>
            <span className="chip chip--on">
              Journeys {String(finished.length)} / {String(stamps.length)}
            </span>
            <span className="chip chip--teal">
              Quizzes {String(quizCorrect)} / {String(quizTotal)}
            </span>
            <span className="chip">Chart challenges {String(challenges)}</span>
            <span className="chip">Daily expeditions {String(dailies)}</span>
          </div>
        </header>

        <Section label="Stamps">
          <div className="stamp-grid">
            {stamps.map(({ journey, finished: done, finishedOn }) => (
              <Link
                viewTransition
                key={journey.id}
                className={done ? 'stamp is-earned' : 'stamp'}
                to={`/journeys/${journey.id}`}
              >
                <span className="stamp-ring" aria-hidden="true">
                  {done ? '✓' : '·'}
                </span>
                <b>{journey.title}</b>
                <span className="stamp-date">
                  {done ? (finishedOn ?? 'Completed') : `${String(journey.waypoints.length)} stops`}
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section label="Badges">
          <div className="badge-row">
            {badges.map((badge) => (
              <span
                key={badge.label}
                className={badge.earned ? 'badge is-earned' : 'badge'}
                title={badge.hint}
              >
                {badge.earned ? '★' : '☆'} {badge.label}
              </span>
            ))}
          </div>
        </Section>

        <Section label="Keep travelling">
          <div className="pills">
            <Link viewTransition className="pill pill--action" to="/daily">
              Today's Daily Expedition ⚓
            </Link>
            <Link viewTransition className="pill" to="/journeys">
              All journeys
            </Link>
            <Link viewTransition className="pill" to="/six-degrees">
              Six Degrees of Sea
            </Link>
          </div>
        </Section>
      </article>
    </>
  );
}
