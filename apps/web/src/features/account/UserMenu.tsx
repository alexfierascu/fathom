import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Link } from 'react-router';

import { loadJourneys } from '@fathom/discovery';

import { useLocale, useT } from '../i18n/locale';
import { LOCALES, type Locale, type StringKey } from '../i18n/strings';
import { RANKS, gatherStats, rankFor, totalXp } from '../progression/engine';
import { Avatar } from '../progression/Avatar';
import { loadIdentity, type Identity } from '../progression/store';
import {
  appearanceToTheme,
  loadAppearance,
  saveAppearance,
  type Appearance,
} from '../theme/appearance';
import { applyReduceMotion, loadReduceMotion, saveReduceMotion } from '../theme/motion';
import type { ThemeKey } from '../theme/themes';

/**
 * The Captain's Log — a floating glass notebook that opens from the
 * avatar. Not a settings panel: it is the explorer's identity hub. Four
 * pages of the log — who you are, the voyage you can resume, the ways
 * into your record, and (folded away) your preferences. It inherits the
 * landing page's language: navy glass, gold accents, serif titles,
 * editorial calm.
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

/** The ways into the log — a table of contents, each a real destination. */
const HUB: readonly { key: string; to: string; glyph: string; labelKey: StringKey }[] = [
  { key: 'log', to: '/profile', glyph: '✦', labelKey: 'home.profile.log' },
  { key: 'trophies', to: '/profile#trophies', glyph: '★', labelKey: 'home.profile.achievements' },
  { key: 'stats', to: '/profile#standing', glyph: '≡', labelKey: 'home.profile.voyagestats' },
  { key: 'academy', to: '/learn', glyph: '◈', labelKey: 'home.profile.academy' },
  { key: 'saved', to: '/profile#saved', glyph: '♥', labelKey: 'home.profile.saved' },
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

/** A compass rose stamped into the corner of the avatar — the log's seal. */
function CompassSeal() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1" />
      <path
        d="M8 1.4v13.2M1.4 8h13.2M3.6 3.6l8.8 8.8M12.4 3.6l-8.8 8.8"
        stroke="currentColor"
        strokeWidth="0.7"
        opacity="0.85"
      />
    </svg>
  );
}

function CaptainsLog({
  theme,
  setTheme,
  onClose,
  closing,
}: {
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  onClose: () => void;
  closing: boolean;
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();

  // Read fresh each time the log is opened.
  const identity = useMemo<Identity>(() => loadIdentity(), []);
  const stats = useMemo(() => gatherStats(), []);
  const expedition = useMemo(() => activeExpedition(), []);
  const xp = totalXp(stats);
  const { rank, next, progress } = rankFor(xp);
  const level = RANKS.findIndex((step) => step.id === rank.id) + 1;

  const [prefsOpen, setPrefsOpen] = useState(false);
  const [appearance, setAppearanceState] = useState<Appearance>(loadAppearance);
  const [reduceMotion, setReduceMotion] = useState<boolean>(loadReduceMotion);

  const chooseAppearance = (mode: Appearance) => {
    setAppearanceState(mode);
    saveAppearance(mode);
    setTheme(appearanceToTheme(mode));
  };
  const toggleMotion = () => {
    const nextValue = !reduceMotion;
    setReduceMotion(nextValue);
    saveReduceMotion(nextValue);
    applyReduceMotion(nextValue);
  };

  // Appearance reflects the real theme even if it changed elsewhere.
  const isLight = theme === 'parchment' || theme === 'daylight';
  const activeAppearance: Appearance =
    appearance === 'system' ? 'system' : isLight ? 'light' : 'dark';

  const pct = Math.round(progress * 100);

  return (
    <div
      className={closing ? 'profile-menu is-closing' : 'profile-menu'}
      role="menu"
      aria-label={t('home.profile.menu')}
    >
      {/* 1 — Captain identity */}
      <div className="clog-id">
        <span className="clog-avatar">
          <Avatar identity={identity} size={60} />
          <span className="clog-seal" aria-hidden="true">
            <CompassSeal />
          </span>
        </span>
        <div className="clog-id-text">
          <b className="clog-name">{identity.name || t('home.profile.guest')}</b>
          <span className="clog-sub">{t('home.profile.sailor')}</span>
          <span className="clog-rank">
            {rank.title} · {t('home.profile.level', { n: level })}
          </span>
        </div>
        <div className="clog-xp">
          <div
            className="clog-xp-bar"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={next ? `Progress toward ${next.title}` : t('home.profile.maxrank')}
          >
            <span style={{ width: `${String(pct)}%` }} />
          </div>
          <div className="clog-xp-cap">
            <span>{t('home.profile.level', { n: level })}</span>
            <span>
              {next ? `${String(next.atXp - xp)} XP → ${next.title}` : t('home.profile.maxrank')}
            </span>
          </div>
        </div>
      </div>

      {/* 2 — Continue expedition */}
      <div className="clog-block">
        <div className="geo-label">{t('home.profile.expedition')}</div>
        {expedition ? (
          <Link
            viewTransition
            role="menuitem"
            className="clog-expedition"
            to={`/journeys/${expedition.journeyId}?stop=${String(expedition.stop + 1)}`}
            onClick={onClose}
          >
            <span className="clog-exp-title">{expedition.title}</span>
            <span className="clog-exp-stop">
              {t('home.profile.stop', { n: expedition.stop + 1, total: expedition.total })}
            </span>
            <span className="clog-exp-bar" aria-hidden="true">
              <span
                style={{
                  width: `${String(Math.round(((expedition.stop + 1) / expedition.total) * 100))}%`,
                }}
              />
            </span>
            <span className="clog-exp-resume">
              {t('home.profile.resume')} <span className="clog-arrow">→</span>
            </span>
          </Link>
        ) : (
          <Link
            viewTransition
            role="menuitem"
            className="clog-expedition clog-expedition--empty"
            to="/journeys"
            onClick={onClose}
          >
            <span className="clog-exp-title">{t('home.profile.begin')}</span>
            <span className="clog-exp-resume">
              {t('home.profile.begincta')} <span className="clog-arrow">→</span>
            </span>
          </Link>
        )}
      </div>

      {/* 3 — Explorer hub */}
      <div className="clog-block">
        <div className="geo-label">{t('home.profile.hub')}</div>
        <nav className="clog-rows">
          {HUB.map((row) => (
            <Link
              viewTransition
              key={row.key}
              role="menuitem"
              className="clog-row"
              to={row.to}
              onClick={onClose}
            >
              <span className="clog-row-glyph" aria-hidden="true">
                {row.glyph}
              </span>
              <span className="clog-row-label">{t(row.labelKey)}</span>
              <span className="clog-row-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* 4 — Preferences, folded away */}
      <div className={prefsOpen ? 'clog-prefs is-open' : 'clog-prefs'}>
        <button
          type="button"
          className="clog-prefs-trigger"
          aria-expanded={prefsOpen}
          onClick={() => {
            setPrefsOpen((open) => !open);
          }}
        >
          <span className="clog-row-glyph" aria-hidden="true">
            ⚙
          </span>
          <span className="clog-row-label">{t('home.profile.preferences')}</span>
          <span className="clog-chevron" aria-hidden="true" />
        </button>
        {prefsOpen && (
          <div className="clog-prefs-body">
            <div className="clog-pref">
              <div className="geo-label">{t('home.profile.appearance')}</div>
              <div className="clog-radios" role="group" aria-label={t('home.profile.appearance')}>
                {(['system', 'dark', 'light'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    role="menuitemradio"
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
            </div>

            <div className="clog-pref">
              <div className="geo-label">{t('home.profile.language')}</div>
              <div className="clog-radios" role="group" aria-label={t('home.profile.language')}>
                {LOCALES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    role="menuitemradio"
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
            </div>

            <div className="clog-pref">
              <div className="geo-label">{t('home.profile.accessibility')}</div>
              <button
                type="button"
                role="menuitemcheckbox"
                aria-checked={reduceMotion}
                className={reduceMotion ? 'clog-toggle is-on' : 'clog-toggle'}
                onClick={toggleMotion}
              >
                <span className="clog-toggle-track" aria-hidden="true">
                  <span className="clog-toggle-knob" />
                </span>
                {t('home.profile.reducemotion')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
  const wrapRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const openMenu = useCallback(() => {
    window.clearTimeout(timer.current);
    setClosing(false);
    setOpen(true);
  }, []);
  const hardClose = useCallback(() => {
    window.clearTimeout(timer.current);
    setClosing(false);
    setOpen(false);
  }, []);
  const animateClose = useCallback(() => {
    window.clearTimeout(timer.current);
    setClosing(true);
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') animateClose();
    };
    const onDown = (event: globalThis.PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) animateClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, animateClose]);

  return (
    <div className="avatar-wrap" ref={wrapRef}>
      <button
        type="button"
        className={open ? 'avatar-button is-open' : 'avatar-button'}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('home.profile.open')}
        onClick={() => {
          if (open && !closing) animateClose();
          else openMenu();
        }}
      >
        <span className="avatar-shell">
          <Avatar identity={identity} size={34} />
          <span className="avatar-status avatar-status--offline" aria-hidden="true" />
        </span>
      </button>
      {open && (
        <CaptainsLog theme={theme} setTheme={setTheme} closing={closing} onClose={hardClose} />
      )}
    </div>
  );
}
