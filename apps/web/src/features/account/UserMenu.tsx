import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { createPortal } from 'react-dom';
import { Link } from 'react-router';

import { loadAllStraits } from '@fathom/data';
import { loadJourneys } from '@fathom/discovery';

import { useLocale, useT } from '../i18n/locale';
import { LOCALES, type Locale, type StringKey } from '../i18n/strings';
import { RANKS, evaluateAchievements, gatherStats, rankFor, totalXp } from '../progression/engine';
import { Avatar } from '../progression/Avatar';
import { Trophy } from '../progression/Trophy';
import { loadFavourites, loadIdentity, saveIdentity, type Identity } from '../progression/store';
import { loadRecentlyViewed } from '../explore/recentlyViewed';
import {
  appearanceToTheme,
  loadAppearance,
  saveAppearance,
  type Appearance,
} from '../theme/appearance';
import { applyA11y, loadA11y, saveA11y, type A11yPref } from '../theme/a11y';
import type { ThemeKey } from '../theme/themes';
import { accountApi, ApiError, type AccountUser } from './api';
import { syncLog } from './sync';

/**
 * The Captain's Cabin — a frosted drawer that slides from the right, the
 * explorer's personal command centre rather than a settings panel. It
 * opens on the captain's identity and their voyage, keeps preferences
 * folded away, and pushes a second panel for creating a captain. It
 * inherits the landing page's language throughout: navy glass, gold
 * accents, serif titles, calm motion.
 */

const APPEARANCE_KEY: Record<Appearance, StringKey> = {
  system: 'home.profile.system',
  dark: 'home.profile.dark',
  light: 'home.profile.light',
};
const LOCALE_KEY: Record<Locale, StringKey> = {
  en: 'home.profile.english',
  ro: 'home.profile.romanian',
};
const A11Y_LABEL: Record<A11yPref, StringKey> = {
  reduceMotion: 'home.profile.reducemotion',
  highContrast: 'home.profile.highcontrast',
  largerText: 'home.profile.largertext',
  focusRings: 'home.profile.focusrings',
};
const A11Y_ORDER: readonly A11yPref[] = [
  'reduceMotion',
  'highContrast',
  'largerText',
  'focusRings',
];

interface ActiveExpedition {
  journeyId: string;
  title: string;
  stop: number;
  total: number;
}

/** The furthest-along journey that has been started but not finished. */
function activeExpedition(): ActiveExpedition | null {
  try {
    let best: ActiveExpedition | null = null;
    for (const journey of loadJourneys()) {
      const raw = window.localStorage.getItem(`fathom-journey-${journey.id}`);
      if (!raw) continue;
      const record = JSON.parse(raw) as { started?: boolean; finished?: boolean; stop?: number };
      if (record.finished) continue;
      const stop = typeof record.stop === 'number' && record.stop >= 0 ? record.stop : 0;
      if (!record.started && stop === 0) continue;
      if (!best || stop > best.stop) {
        best = {
          journeyId: journey.id,
          title: journey.title,
          stop,
          total: journey.waypoints.length,
        };
      }
    }
    return best;
  } catch {
    return null;
  }
}

/** A "did you know?" fact drawn from a strait's sourced note, new each day. */
function dailyFact(): { id: string; name: string; note: string } | null {
  const straits = loadAllStraits().filter((strait) => strait.note && strait.note.length > 0);
  if (straits.length === 0) return null;
  const day = Math.floor(Date.now() / 86_400_000);
  const strait = straits[day % straits.length]!;
  return { id: strait.id, name: strait.name, note: strait.note };
}

type ActivityKind = 'visit' | 'complete' | 'unlock';
interface Activity {
  key: string;
  kind: ActivityKind;
  label: string;
  to?: string;
}

/** Recent activity, woven from the local log — the freshest actions first. */
function recentActivity(
  stats: ReturnType<typeof gatherStats>,
  t: ReturnType<typeof useT>,
): Activity[] {
  const items: Activity[] = [];
  for (const visit of loadRecentlyViewed().slice(0, 4)) {
    items.push({
      key: `v-${visit.entityId}`,
      kind: 'visit',
      label: t('home.profile.visited', { name: visit.name }),
      to: visit.path,
    });
  }
  const journeys = loadJourneys();
  for (const id of stats.journeysFinished.slice(-2)) {
    const journey = journeys.find((candidate) => candidate.id === id);
    if (journey) {
      items.push({
        key: `j-${id}`,
        kind: 'complete',
        label: t('home.profile.completed', { name: journey.title }),
        to: `/journeys/${id}`,
      });
    }
  }
  for (const achievement of evaluateAchievements(stats)
    .filter((entry) => entry.isEarned)
    .slice(-2)) {
    items.push({
      key: `a-${achievement.id}`,
      kind: 'unlock',
      label: t('home.profile.unlocked', { name: achievement.name }),
      to: '/profile#trophies',
    });
  }
  return items.slice(0, 6);
}

/** A compass rose — the cabin's crest, in place of any emoji. */
function CompassRose({ size = 15 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="9.4" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M12 3.2 13.4 10.6 12 12 10.6 10.6z" fill="currentColor" opacity="0.9" />
      <path
        d="M12 20.8 10.6 13.4 12 12 13.4 13.4z M3.2 12 10.6 10.6 12 12 10.6 13.4z M20.8 12 13.4 13.4 12 12 13.4 10.6z"
        fill="currentColor"
        opacity="0.5"
      />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

// --- Small building blocks ---------------------------------------------------

function Lead({ label, action }: { label: string; action?: ReactNode }) {
  return (
    <div className="cabin-lead">
      <span className="geo-label">{label}</span>
      {action}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="cabin-metric">
      <dt>{label}</dt>
      <dd>{String(value)}</dd>
    </div>
  );
}

/** A single collapsible sub-group inside Preferences. */
function Collapsible({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={open ? 'cabin-sub is-open' : 'cabin-sub'}>
      <button
        type="button"
        className="cabin-sub-trigger"
        aria-expanded={open}
        onClick={() => {
          setOpen((state) => !state);
        }}
      >
        <span className="cabin-chevron" aria-hidden="true" />
        {label}
      </button>
      {open && <div className="cabin-sub-body">{children}</div>}
    </div>
  );
}

function A11yToggle({ pref, label }: { pref: A11yPref; label: string }) {
  const [on, setOn] = useState<boolean>(() => loadA11y(pref));
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={on ? 'cabin-switch is-on' : 'cabin-switch'}
      onClick={() => {
        const next = !on;
        setOn(next);
        saveA11y(pref, next);
        applyA11y(pref, next);
      }}
    >
      <span className="cabin-switch-track" aria-hidden="true">
        <span className="cabin-switch-knob" />
      </span>
      {label}
    </button>
  );
}

// --- The "Welcome aboard" auth panel ----------------------------------------

/** Adopt a signed-in account into the local identity. */
function adoptIdentity(user: AccountUser, fallbackName: string) {
  const local = loadIdentity();
  saveIdentity({
    name: user.name || fallbackName || local.name,
    bio: user.bio || local.bio,
    avatar: user.avatar || local.avatar,
    portrait: user.portrait ?? local.portrait,
  });
}

function AuthPanel({ onBack, onAuthed }: { onBack: () => void; onAuthed: () => void }) {
  const t = useT();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState(() => loadIdentity().name);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const run = async () => {
      if (mode === 'register') {
        const { user } = await accountApi.register(email, password, name || loadIdentity().name);
        await accountApi.updateProfile({
          name: name || loadIdentity().name,
          bio: loadIdentity().bio,
          avatar: loadIdentity().avatar,
        });
        adoptIdentity(user, name);
      } else {
        const { user } = await accountApi.login(email, password);
        adoptIdentity(user, name);
      }
      try {
        await syncLog();
      } catch {
        // The log will sync next time; sign-in still succeeded.
      }
      onAuthed();
    };
    run()
      .catch((error: unknown) => {
        if (error instanceof ApiError && (error.status === 503 || error.status === 0)) {
          setMessage(t('home.profile.authunavailable'));
        } else {
          setMessage(error instanceof Error ? error.message : 'Something went wrong.');
        }
      })
      .finally(() => {
        setBusy(false);
      });
  };

  return (
    <section className="cabin-auth" aria-label={t('home.profile.welcome')}>
      <button type="button" className="cabin-back" onClick={onBack}>
        <span className="cabin-back-arrow" aria-hidden="true">
          ←
        </span>
        {t('home.profile.back')}
      </button>
      <div className="cabin-auth-body">
        <span className="cabin-crest" aria-hidden="true">
          <CompassRose size={30} />
        </span>
        <h2 className="cabin-auth-title">{t('home.profile.welcome')}</h2>
        <p className="cabin-auth-sub">{t('home.profile.welcomesub')}</p>
        <form className="cabin-form" onSubmit={submit}>
          {mode === 'register' && (
            <label className="cabin-field">
              <span className="geo-label">{t('home.profile.captainname')}</span>
              <input
                type="text"
                value={name}
                maxLength={40}
                autoComplete="name"
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </label>
          )}
          <label className="cabin-field">
            <span className="geo-label">{t('home.profile.email')}</span>
            <input
              type="email"
              value={email}
              required
              autoComplete="email"
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </label>
          <label className="cabin-field">
            <span className="geo-label">{t('home.profile.password')}</span>
            <input
              type="password"
              value={password}
              required
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
          </label>
          {message && <p className="cabin-auth-msg">{message}</p>}
          <button type="submit" className="cabin-btn cabin-btn--primary" disabled={busy}>
            {mode === 'register' ? t('home.profile.createcaptain') : t('home.profile.signin')}
          </button>
        </form>
        <button
          type="button"
          className="cabin-auth-toggle"
          onClick={() => {
            setMode((state) => (state === 'register' ? 'login' : 'register'));
            setMessage(null);
          }}
        >
          {mode === 'register' ? t('home.profile.haveaccount') : t('home.profile.newhere')}{' '}
          <b>{mode === 'register' ? t('home.profile.signin') : t('home.profile.createcaptain')}</b>
        </button>
      </div>
    </section>
  );
}

// --- The cabin ---------------------------------------------------------------

function CaptainCabin({
  theme,
  setTheme,
  closing,
  onClose,
}: {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  closing: boolean;
  onClose: () => void;
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();

  const [identity, setIdentity] = useState<Identity>(loadIdentity);
  const [account, setAccount] = useState<AccountUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [appearance, setAppearanceState] = useState<Appearance>(loadAppearance);
  const dialogRef = useRef<HTMLElement>(null);

  const stats = useMemo(() => gatherStats(), []);
  const expedition = useMemo(() => activeExpedition(), []);
  const daily = useMemo(() => dailyFact(), []);
  const favourites = useMemo(() => loadFavourites(), []);
  const trophies = useMemo(
    () => evaluateAchievements(stats).filter((entry) => entry.isEarned),
    [stats],
  );
  const activity = useMemo(() => recentActivity(stats, t), [stats, t]);

  const xp = totalXp(stats);
  const { rank, next, progress } = rankFor(xp);
  const level = RANKS.findIndex((step) => step.id === rank.id) + 1;
  const pct = Math.round(progress * 100);
  const isCaptain = identity.name.trim().length > 0;

  const accuracy =
    stats.quizAnswered > 0
      ? `${String(Math.round((stats.quizCorrect / stats.quizAnswered) * 100))}%`
      : '—';
  const discoveries =
    stats.visitedStraits.length + stats.visitedSeas.length + stats.visitedCountries.length;

  // Whether an account exists on this deployment at all.
  useEffect(() => {
    let cancelled = false;
    accountApi
      .me()
      .then(({ user }) => {
        if (!cancelled) setAccount(user);
      })
      .catch(() => {
        // Signed out, or accounts unavailable — either way, local only.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lock the page while the cabin is open.
  useEffect(() => {
    document.documentElement.classList.add('cabin-open');
    return () => {
      document.documentElement.classList.remove('cabin-open');
    };
  }, []);

  // Escape closes the auth panel first, then the cabin.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (authOpen) setAuthOpen(false);
      else onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [authOpen, onClose]);

  // Enter the dialog, and keep Tab within it.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const focusables = el.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0]!;
      const last = focusables[focusables.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    el.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('keydown', onKey);
    };
  }, [authOpen, prefsOpen, isCaptain]);

  const chooseAppearance = (mode: Appearance) => {
    setAppearanceState(mode);
    saveAppearance(mode);
    setTheme(appearanceToTheme(mode));
  };
  const isLight = theme === 'parchment' || theme === 'daylight';
  const activeAppearance: Appearance =
    appearance === 'system' ? 'system' : isLight ? 'light' : 'dark';

  const afterAuth = () => {
    setIdentity(loadIdentity());
    setAuthOpen(false);
    accountApi
      .me()
      .then(({ user }) => setAccount(user))
      .catch(() => undefined);
  };
  const signOut = () => {
    accountApi
      .logout()
      .catch(() => undefined)
      .finally(() => {
        setAccount(null);
      });
  };

  const continueJourney = expedition && (
    <section className="cabin-section">
      <Lead label={t('home.profile.continuejourney')} />
      <Link
        viewTransition
        className="cabin-journey"
        to={`/journeys/${expedition.journeyId}?stop=${String(expedition.stop + 1)}`}
        onClick={onClose}
      >
        <span className="cabin-journey-title">{expedition.title}</span>
        <span className="cabin-journey-meta">
          {t('home.profile.stop', { n: expedition.stop + 1, total: expedition.total })} ·{' '}
          {String(Math.round(((expedition.stop + 1) / expedition.total) * 100))}%
        </span>
        <span className="cabin-journey-bar" aria-hidden="true">
          <span
            style={{
              width: `${String(Math.round(((expedition.stop + 1) / expedition.total) * 100))}%`,
            }}
          />
        </span>
        <span className="cabin-journey-resume">
          {t('home.profile.resume')} <span className="cabin-arrow">→</span>
        </span>
      </Link>
    </section>
  );

  const dailyCard = daily && (
    <section className="cabin-section">
      <Lead label={t('home.profile.daily')} />
      <Link viewTransition className="cabin-daily" to={`/straits/${daily.id}`} onClick={onClose}>
        <span className="cabin-daily-eyebrow">{t('home.profile.didyouknow')}</span>
        <span className="cabin-daily-fact">{daily.note}</span>
        <span className="cabin-daily-read">
          {t('home.profile.read')} <span className="cabin-arrow">→</span>
        </span>
      </Link>
    </section>
  );

  const preferences = (
    <section className="cabin-section cabin-prefs">
      <button
        type="button"
        className="cabin-collapse-trigger"
        aria-expanded={prefsOpen}
        onClick={() => {
          setPrefsOpen((state) => !state);
        }}
      >
        <span className="geo-label">{t('home.profile.preferences')}</span>
        <span
          className={prefsOpen ? 'cabin-chevron is-open' : 'cabin-chevron'}
          aria-hidden="true"
        />
      </button>
      {prefsOpen && (
        <div className="cabin-collapse-body">
          <Collapsible label={t('home.profile.appearance')}>
            <div
              className="cabin-radios"
              role="radiogroup"
              aria-label={t('home.profile.appearance')}
            >
              {(['system', 'dark', 'light'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={activeAppearance === mode}
                  className={activeAppearance === mode ? 'is-on' : undefined}
                  onClick={() => {
                    chooseAppearance(mode);
                  }}
                >
                  <span className="radio-dot" aria-hidden="true" />
                  {t(APPEARANCE_KEY[mode])}
                </button>
              ))}
            </div>
          </Collapsible>
          <Collapsible label={t('home.profile.language')}>
            <div className="cabin-radios" role="radiogroup" aria-label={t('home.profile.language')}>
              {LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  role="radio"
                  aria-checked={locale === code}
                  className={locale === code ? 'is-on' : undefined}
                  onClick={() => {
                    setLocale(code);
                  }}
                >
                  <span className="radio-dot" aria-hidden="true" />
                  {t(LOCALE_KEY[code])}
                </button>
              ))}
            </div>
          </Collapsible>
          <Collapsible label={t('home.profile.accessibility')}>
            <div className="cabin-switches">
              {A11Y_ORDER.map((pref) => (
                <A11yToggle key={pref} pref={pref} label={t(A11Y_LABEL[pref])} />
              ))}
            </div>
          </Collapsible>
        </div>
      )}
    </section>
  );

  return (
    <>
      <div
        className={closing ? 'cabin-backdrop is-closing' : 'cabin-backdrop'}
        aria-hidden="true"
        onClick={onClose}
      />
      <aside
        ref={dialogRef}
        tabIndex={-1}
        className={closing ? 'cabin is-closing' : 'cabin'}
        role="dialog"
        aria-modal="true"
        aria-label={t('home.profile.menu')}
      >
        <button
          type="button"
          className="cabin-close"
          aria-label={t('home.profile.back')}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="cabin-scroll">
          {isCaptain ? (
            <header className="cabin-hero">
              <span className="cabin-avatar">
                <Avatar identity={identity} size={72} />
              </span>
              <b className="cabin-hero-name">{identity.name}</b>
              <span className="cabin-hero-rank">{rank.title}</span>
              <div className="cabin-levelrow">
                <span>{t('home.profile.level', { n: level })}</span>
                <span>{String(xp)} XP</span>
              </div>
              <div
                className="cabin-xp-bar"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={next ? `Progress toward ${next.title}` : t('home.profile.maxrank')}
              >
                <span style={{ width: `${String(pct)}%` }} />
              </div>
              <div className="cabin-next">
                {next ? (
                  <>
                    {t('home.profile.nextrank')}: <b>{next.title}</b>
                  </>
                ) : (
                  t('home.profile.maxrank')
                )}
              </div>
            </header>
          ) : (
            <header className="cabin-hero cabin-hero--guest">
              <span className="cabin-crest" aria-hidden="true">
                <CompassRose size={34} />
              </span>
              <b className="cabin-hero-name">{t('home.profile.guest')}</b>
              <p className="cabin-hero-line">{t('home.profile.gueststart')}</p>
              <p className="cabin-hero-pitch">{t('home.profile.guestpitch')}</p>
              <div className="cabin-hero-cta">
                <button
                  type="button"
                  className="cabin-btn cabin-btn--primary"
                  onClick={() => {
                    setAuthOpen(true);
                  }}
                >
                  {t('home.profile.createcaptain')}
                </button>
                <button type="button" className="cabin-btn cabin-btn--ghost" onClick={onClose}>
                  {t('home.profile.continueguest')}
                </button>
              </div>
            </header>
          )}

          {continueJourney}

          {isCaptain && (
            <>
              <section className="cabin-section">
                <Lead label={t('home.profile.log')} />
                {activity.length > 0 ? (
                  <ol className="cabin-timeline">
                    {activity.map((event) => (
                      <li key={event.key} className={`cabin-event cabin-event--${event.kind}`}>
                        <span className="cabin-event-dot" aria-hidden="true" />
                        {event.to ? (
                          <Link viewTransition to={event.to} onClick={onClose}>
                            {event.label}
                          </Link>
                        ) : (
                          <span>{event.label}</span>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="cabin-empty">{t('home.profile.logempty')}</p>
                )}
              </section>

              {dailyCard}

              {trophies.length > 0 && (
                <section className="cabin-section">
                  <Lead
                    label={t('home.profile.recentachievements')}
                    action={
                      <Link
                        viewTransition
                        className="cabin-more"
                        to="/profile#trophies"
                        onClick={onClose}
                      >
                        {t('home.profile.seecollection')} →
                      </Link>
                    }
                  />
                  <div className="cabin-medals">
                    {trophies.slice(-3).map((achievement) => (
                      <Link
                        viewTransition
                        key={achievement.id}
                        className="cabin-medal"
                        to="/profile#trophies"
                        title={achievement.line}
                        onClick={onClose}
                      >
                        <Trophy kind={achievement.trophy} earned size={44} />
                        <span>{achievement.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {favourites.length > 0 && (
                <section className="cabin-section">
                  <Lead label={t('home.profile.saved')} />
                  <div className="cabin-saved">
                    {favourites.slice(0, 6).map((place) => (
                      <Link
                        viewTransition
                        key={place.entityId}
                        className="cabin-chip"
                        to={place.path}
                        onClick={onClose}
                      >
                        {place.name}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <section className="cabin-section">
                <Lead
                  label={t('home.profile.academy')}
                  action={
                    <Link viewTransition className="cabin-more" to="/learn" onClick={onClose}>
                      {t('home.profile.continuelearning')} →
                    </Link>
                  }
                />
                <dl className="cabin-metrics">
                  <Metric label={t('home.profile.quizaccuracy')} value={accuracy} />
                  <Metric label={t('home.profile.quizanswers')} value={stats.quizAnswered} />
                  <Metric label={t('home.profile.challenges')} value={stats.challengesCompleted} />
                </dl>
              </section>

              <section className="cabin-section">
                <Lead label={t('home.profile.voyagestats')} />
                <dl className="cabin-metrics">
                  <Metric
                    label={t('home.profile.journeyscompleted')}
                    value={stats.journeysFinished.length}
                  />
                  <Metric label={t('home.profile.discoveries')} value={discoveries} />
                  <Metric
                    label={t('home.profile.countries')}
                    value={stats.visitedCountries.length}
                  />
                  <Metric label={t('home.profile.days')} value={stats.activeDays.length} />
                  <Metric label={t('home.profile.trophies')} value={trophies.length} />
                </dl>
              </section>
            </>
          )}

          {preferences}

          {isCaptain && account && (
            <button type="button" className="cabin-signout" onClick={signOut}>
              {t('home.profile.signout')}
            </button>
          )}
        </div>

        {authOpen && (
          <AuthPanel
            onBack={() => {
              setAuthOpen(false);
            }}
            onAuthed={afterAuth}
          />
        )}
      </aside>
    </>
  );
}

export function UserMenuButton({
  theme,
  setTheme,
}: {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const identity = useMemo(() => loadIdentity(), []);
  const timer = useRef<number | undefined>(undefined);

  const openDrawer = useCallback(() => {
    window.clearTimeout(timer.current);
    setClosing(false);
    setOpen(true);
  }, []);
  const closeDrawer = useCallback(() => {
    window.clearTimeout(timer.current);
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 300);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="avatar-wrap">
      <button
        type="button"
        className={open ? 'avatar-button is-open' : 'avatar-button'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('home.profile.open')}
        onClick={() => {
          if (open && !closing) closeDrawer();
          else openDrawer();
        }}
      >
        <span className="avatar-shell">
          <Avatar identity={identity} size={34} />
          <span className="avatar-status avatar-status--offline" aria-hidden="true" />
        </span>
      </button>
      {open &&
        createPortal(
          <CaptainCabin
            theme={theme}
            setTheme={setTheme}
            closing={closing}
            onClose={closeDrawer}
          />,
          document.body,
        )}
    </div>
  );
}
