import { useCallback, useMemo, useState } from 'react';

import { Link } from 'react-router';

import { loadCountriesIndex, loadStraitsIndex, loadWaterBodiesIndex } from '@fathom/data';
import { loadJourneys, type Journey } from '@fathom/discovery';

import { AccountSection } from '../account/AccountSection';
import { accountApi } from '../account/api';
import { PageHero } from '../atlas/components/PageHero';
import { Section } from '../atlas/components/Section';
import { SeoTags } from '../atlas/components/SeoTags';
import { loadRecentlyViewed } from '../explore/recentlyViewed';
import {
  achievementPoints,
  computeStreaks,
  CUSTOM_AVATAR_XP,
  evaluateAchievements,
  gatherStats,
  RANKS,
  rankFor,
  totalXp,
  xpLedger,
} from '../progression/engine';
import { Avatar } from '../progression/Avatar';
import { AVATARS } from '../progression/avatars';
import { loadIdentity, saveIdentity, today, type Identity } from '../progression/store';
import { Trophy } from '../progression/Trophy';

/**
 * The Captain's Log: one page holding everything the traveller has
 * done — rank, experience, trophies, voyages, quizzes, and the places
 * they keep returning to. Local-first: the whole log lives in the
 * browser, and export/import carries it between ships.
 */

interface Stamp {
  journey: Journey;
  finished: boolean;
  finishedOn?: string;
  honours: boolean;
}

function read(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

function stampOf(journey: Journey): Stamp {
  const progress = read(`fathom-journey-${journey.id}`) as {
    finished?: boolean;
    finishedOn?: string;
  } | null;
  const log = read(`fathom-journey-log-${journey.id}`) as { exam?: { passed?: boolean } } | null;
  return {
    journey,
    finished: progress?.finished === true,
    finishedOn: progress?.finishedOn,
    honours: log?.exam?.passed === true,
  };
}

const LOG_KEYS = [
  'fathom-quiz-best',
  'fathom-visited',
  'fathom-days',
  'fathom-favourites',
  'fathom-legend',
];
const isLogKey = (key: string) =>
  key.startsWith('fathom-journey') || key === 'fathom-identity' || LOG_KEYS.includes(key);

function exportLog() {
  const dump: Record<string, unknown> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && isLogKey(key)) dump[key] = JSON.parse(window.localStorage.getItem(key) ?? 'null');
    }
  } catch {
    return;
  }
  const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'fathom-captains-log.json';
  link.click();
  URL.revokeObjectURL(url);
}

function importLog(file: File) {
  void file.text().then((text) => {
    try {
      const dump: unknown = JSON.parse(text);
      if (typeof dump !== 'object' || dump === null) return;
      for (const [key, value] of Object.entries(dump)) {
        if (isLogKey(key)) window.localStorage.setItem(key, JSON.stringify(value));
      }
      window.location.reload();
    } catch {
      // Not a log file; leave everything as it was.
    }
  });
}

function IdentityEditor({
  identity,
  canPortrait,
  onSave,
  onClose,
}: {
  identity: Identity;
  canPortrait: boolean;
  onSave: (identity: Identity) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(identity);

  const pickPortrait = (file: File) => {
    if (file.size > 300_000) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((state) => ({ ...state, portrait: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form
      className="identity-editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...draft,
          name: draft.name.trim().slice(0, 40),
          bio: draft.bio.trim().slice(0, 240),
        });
        onClose();
      }}
    >
      <label className="identity-field">
        <span className="geo-label">Name</span>
        <input
          type="text"
          value={draft.name}
          maxLength={40}
          placeholder="Unnamed mariner"
          onChange={(event) => {
            setDraft((state) => ({ ...state, name: event.target.value }));
          }}
        />
      </label>
      <label className="identity-field">
        <span className="geo-label">Log entry — about you</span>
        <textarea
          value={draft.bio}
          maxLength={240}
          rows={3}
          placeholder="Ports of origin, waters of interest…"
          onChange={(event) => {
            setDraft((state) => ({ ...state, bio: event.target.value }));
          }}
        />
      </label>
      <div className="identity-field">
        <span className="geo-label">Ensign</span>
        <div className="avatar-picker" role="radiogroup" aria-label="Choose an avatar">
          {AVATARS.map((spec) => (
            <button
              key={spec.id}
              type="button"
              role="radio"
              aria-checked={draft.avatar === spec.id && !draft.portrait}
              className={
                draft.avatar === spec.id && !draft.portrait
                  ? 'avatar-option is-chosen'
                  : 'avatar-option'
              }
              title={spec.label}
              onClick={() => {
                setDraft((state) => ({ ...state, avatar: spec.id, portrait: undefined }));
              }}
            >
              <Avatar identity={{ avatar: spec.id, name: '' }} size={44} />
            </button>
          ))}
        </div>
        {canPortrait ? (
          <label className="journey-btn identity-upload">
            {draft.portrait ? 'Replace portrait' : 'Upload a portrait'}
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) pickPortrait(file);
              }}
            />
          </label>
        ) : (
          <p className="note identity-locked">
            A custom portrait unlocks at the rank of Navigator ({String(CUSTOM_AVATAR_XP)} XP) —
            until then, sail under an ensign.
          </p>
        )}
      </div>
      <div className="journey-actions" style={{ justifyContent: 'flex-start' }}>
        <button type="submit" className="journey-btn journey-btn--primary">
          Save to log
        </button>
        <button type="button" className="journey-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export function ProfilePage() {
  const [identity, setIdentity] = useState(loadIdentity);
  const [editing, setEditing] = useState(false);

  // Bumped after a sync or sign-in so every derived figure recomputes.
  const [logVersion, setLogVersion] = useState(0);
  const refreshLog = useCallback(() => {
    setIdentity(loadIdentity());
    setLogVersion((version) => version + 1);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats = useMemo(() => gatherStats(), [logVersion]);
  const xp = totalXp(stats);
  const { rank, next, progress } = rankFor(xp);
  const streaks = computeStreaks(stats, today());
  const achievements = evaluateAchievements(stats);
  const earned = achievements.filter((achievement) => achievement.isEarned);
  const points = achievementPoints(stats);
  const ledger = xpLedger(stats);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stamps = useMemo(() => loadJourneys().map(stampOf), [logVersion]);
  const finished = stamps.filter((stamp) => stamp.finished);
  const recent = loadRecentlyViewed();

  const totals = useMemo(
    () => ({
      straits: loadStraitsIndex().length,
      seas: loadWaterBodiesIndex().length,
      countries: loadCountriesIndex().length,
    }),
    [],
  );

  const coverage = [
    { label: 'Straits', explored: stats.visitedStraits.length, of: totals.straits },
    { label: 'Seas & oceans', explored: stats.visitedSeas.length, of: totals.seas },
    { label: 'Countries', explored: stats.visitedCountries.length, of: totals.countries },
    { label: 'Journeys', explored: finished.length, of: stamps.length },
  ];

  const quizTiers = [
    { id: 'apprentice', label: 'Apprentice' },
    { id: 'navigator', label: 'Navigator' },
    { id: 'pilot', label: 'Pilot' },
  ] as const;

  const displayName = identity.name || 'Unnamed mariner';

  return (
    <>
      <SeoTags
        title="Captain's Log — Fathom"
        description="Your rank, voyages, trophies, and everything you have learned at sea."
        path="/profile"
      />
      <article className="detail">
        <PageHero
          eyebrow="Captain's log"
          title={displayName}
          subtitle={identity.bio || undefined}
          actions={
            <button
              type="button"
              className="uc-btn uc-btn--ghost"
              onClick={() => {
                setEditing((state) => !state);
              }}
            >
              {editing ? 'Close' : 'Edit profile'}
            </button>
          }
        >
          <div className="log-hero-id">
            <Avatar identity={identity} size={76} />
            <div className="log-hero-chips">
              <span className="chip chip--on">{rank.title}</span>
              <span className="chip chip--teal">{String(xp)} XP</span>
              <span className="chip">
                {String(earned.length)} of {String(achievements.length)} trophies
              </span>
            </div>
          </div>
        </PageHero>

        {editing && (
          <IdentityEditor
            identity={identity}
            canPortrait={xp >= CUSTOM_AVATAR_XP}
            onSave={(next_) => {
              saveIdentity(next_);
              setIdentity(next_);
              // When signed in, the profile follows to the account;
              // signed out (401) or unconfigured (503) is fine too.
              void accountApi
                .updateProfile({
                  name: next_.name,
                  bio: next_.bio,
                  avatar: next_.avatar,
                  portrait: next_.portrait ?? null,
                })
                .catch(() => undefined);
            }}
            onClose={() => {
              setEditing(false);
            }}
          />
        )}

        <Section label="Standing">
          <div className="rank-card">
            <div className="rank-heading">
              <span className="rank-title">{rank.title}</span>
              <span className="rank-xp">
                {String(xp)} XP · {String(points)} achievement points
              </span>
            </div>
            <div
              className="rank-bar"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={next ? `Progress toward ${next.title}` : 'Highest rank reached'}
            >
              <span style={{ width: `${String(Math.round(progress * 100))}%` }} />
            </div>
            <div className="rank-next note">
              {next
                ? `${String(next.atXp - xp)} XP to ${next.title}${next.unlocks ? ` — unlocks ${next.unlocks.toLowerCase()}` : ''}`
                : 'The highest rank on the books. Fair winds, Grand Explorer.'}
            </div>
            <ol className="rank-ladder">
              {RANKS.map((step) => (
                <li
                  key={step.id}
                  className={
                    step.id === rank.id ? 'is-current' : xp >= step.atXp ? 'is-passed' : undefined
                  }
                  title={`${step.title} · ${String(step.atXp)} XP`}
                >
                  <span className="rank-dot" aria-hidden="true" />
                  <span className="rank-step">{step.title}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="log-tally" style={{ marginTop: 14 }}>
            <span className="chip chip--on">{String(streaks.current)}-day watch streak</span>
            <span className="chip chip--teal">Longest {String(streaks.longest)} days</span>
            <span className="chip">
              Exploring streak {String(streaks.exploring)} day{streaks.exploring === 1 ? '' : 's'}
            </span>
            <span className="chip">{String(stats.activeDays.length)} days at sea</span>
          </div>
        </Section>

        <Section label="The chart so far">
          <div className="coverage-grid">
            {coverage.map((row) => {
              const pct = row.of > 0 ? Math.round((row.explored / row.of) * 100) : 0;
              return (
                <div key={row.label} className="coverage-row">
                  <div className="coverage-heading">
                    <span>{row.label}</span>
                    <span className="coverage-count">
                      {String(row.explored)} of {String(row.of)}
                    </span>
                  </div>
                  <div
                    className="rank-bar rank-bar--thin"
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.label} explored`}
                  >
                    <span style={{ width: `${String(pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          label={`Trophy cabinet · ${String(earned.length)} of ${String(achievements.length)}`}
        >
          <div className="trophy-grid">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={achievement.isEarned ? 'trophy-card is-earned' : 'trophy-card'}
              >
                <Trophy kind={achievement.trophy} earned={achievement.isEarned} size={58} />
                <b>{achievement.name}</b>
                <span className="trophy-line">{achievement.line}</span>
                <span className="trophy-points">{String(achievement.points)} pts</span>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Voyages">
          <div className="stamp-grid">
            {stamps.map(({ journey, finished: done, finishedOn, honours }) => (
              <Link
                viewTransition
                key={journey.id}
                className={honours ? 'stamp is-earned is-gold' : done ? 'stamp is-earned' : 'stamp'}
                to={`/journeys/${journey.id}`}
              >
                <span className="stamp-ring" aria-hidden="true">
                  {honours ? '★' : done ? '✓' : '·'}
                </span>
                <b>{journey.title}</b>
                <span className="stamp-date">
                  {honours
                    ? `With honours · ${finishedOn ?? ''}`
                    : done
                      ? (finishedOn ?? 'Completed')
                      : `${String(journey.waypoints.length)} stops`}
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <Section label="Seamanship">
          <div className="log-tally">
            {quizTiers.map((tier) => (
              <span
                key={tier.id}
                className={(stats.quizBest[tier.id] ?? 0) > 0 ? 'chip chip--on' : 'chip'}
              >
                {tier.label} best {String(stats.quizBest[tier.id] ?? 0)} / 10
              </span>
            ))}
            <span className="chip chip--teal">
              Journey quizzes {String(stats.quizCorrect)} / {String(stats.quizAnswered)}
            </span>
            <span className="chip">Chart challenges {String(stats.challengesCompleted)}</span>
            <span className="chip">Daily expeditions {String(stats.dailiesFinished)}</span>
          </div>
          {ledger.length > 0 && (
            <dl className="xp-ledger">
              {ledger.map((line) => (
                <div key={line.label} className="xp-line">
                  <dt>{line.label}</dt>
                  <dd>{String(line.xp)} XP</dd>
                </div>
              ))}
              <div className="xp-line xp-line--total">
                <dt>Total</dt>
                <dd>{String(xp)} XP</dd>
              </div>
            </dl>
          )}
        </Section>

        {stats.favourites.length > 0 && (
          <Section label="Favourite waters">
            <div className="pills">
              {stats.favourites.map((place) => (
                <Link viewTransition key={place.entityId} className="pill" to={place.path}>
                  {place.name}
                </Link>
              ))}
            </div>
          </Section>
        )}

        {recent.length > 0 && (
          <Section label="Recently explored">
            <div className="pills">
              {recent.map((visit) => (
                <Link viewTransition key={visit.entityId} className="pill" to={visit.path}>
                  {visit.name}
                </Link>
              ))}
            </div>
          </Section>
        )}

        <AccountSection onSignedChange={refreshLog} />

        <Section label="Carry it with you">
          <p className="note">
            The log lives in this browser and nowhere else. Take it to another ship as a file.
          </p>
          <div className="journey-actions" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="journey-btn" onClick={exportLog}>
              Export log ↓
            </button>
            <label className="journey-btn" style={{ cursor: 'pointer' }}>
              Import log
              <input
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) importLog(file);
                }}
              />
            </label>
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
            <Link viewTransition className="pill" to="/quiz">
              Quiz deck
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
