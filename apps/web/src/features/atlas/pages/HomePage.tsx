import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { Link, useNavigate, useOutletContext } from 'react-router';

import {
  loadCanals,
  loadCountriesIndex,
  loadHistoricalEvents,
  loadImagesFor,
  loadPorts,
  loadStraitsIndex,
  loadWaterBodiesIndex,
  loadWildlife,
} from '@fathom/data';
import { loadJourneys } from '@fathom/discovery';

import type { LayoutContext } from '../../../app/RootLayout';
import { useLocale, useT } from '../../i18n/locale';
import { LOCALES, type Locale, type StringKey } from '../../i18n/strings';
import { heroImage, mediaSrcSet, mediaUrl } from '../../media/media';
import { Avatar } from '../../progression/Avatar';
import { loadIdentity, recordActiveDay, type Identity } from '../../progression/store';
import {
  appearanceToTheme,
  loadAppearance,
  saveAppearance,
  type Appearance,
} from '../../theme/appearance';
import type { ThemeKey } from '../../theme/themes';
import { GlobalSearch } from '../../search/GlobalSearch';
import { SeoTags } from '../components/SeoTags';

/**
 * The launcher. Fathom is no longer "an atlas" — the atlas is one of
 * four ways to experience the sea, and this screen lets you choose:
 * Explore, Journey, Chart Room, Academy. Everything here is meant to
 * disappear into the imagery: a floating logo, one collapsible search,
 * one avatar. Choosing a mode expands it to fill the screen before the
 * route ever changes.
 */

const journeys = loadJourneys();

const COUNTS = {
  straits: loadStraitsIndex().length,
  ports: loadPorts().length,
  canals: loadCanals().length,
  waters: loadWaterBodiesIndex().length,
  countries: loadCountriesIndex().length,
  journeys: journeys.length,
  stops: journeys.reduce((total, journey) => total + journey.waypoints.length, 0),
  events: loadHistoricalEvents().length,
  species: loadWildlife().length,
};

interface ModeSpec {
  key: string;
  to: string;
  to2: string;
  backdrop: string;
  titleKey: StringKey;
  subtitleKey: StringKey;
  descKey: StringKey;
  ctaKey: StringKey;
  cta2Key: StringKey;
  meta: { value: number; labelKey: StringKey }[];
}

const MODES: readonly ModeSpec[] = [
  {
    key: 'explore',
    to: '/explore',
    to2: '/six-degrees',
    backdrop: 'gibraltar',
    titleKey: 'home.explore.title',
    subtitleKey: 'home.explore.subtitle',
    descKey: 'home.explore.desc',
    ctaKey: 'home.explore.cta',
    cta2Key: 'home.explore.cta2',
    meta: [
      { value: COUNTS.straits, labelKey: 'home.meta.straits' },
      { value: COUNTS.ports, labelKey: 'home.meta.ports' },
      { value: COUNTS.canals, labelKey: 'home.meta.canals' },
    ],
  },
  {
    key: 'journey',
    to: '/journeys',
    to2: '/daily',
    backdrop: 'singapore',
    titleKey: 'home.journey.title',
    subtitleKey: 'home.journey.subtitle',
    descKey: 'home.journey.desc',
    ctaKey: 'home.journey.cta',
    cta2Key: 'home.journey.cta2',
    meta: [
      { value: COUNTS.journeys, labelKey: 'home.meta.voyages' },
      { value: COUNTS.stops, labelKey: 'home.meta.stops' },
    ],
  },
  {
    key: 'chart',
    to: '/map',
    to2: '/map?drift=1',
    backdrop: 'magellan',
    titleKey: 'home.chart.title',
    subtitleKey: 'home.chart.subtitle',
    descKey: 'home.chart.desc',
    ctaKey: 'home.chart.cta',
    cta2Key: 'home.chart.cta2',
    meta: [
      { value: COUNTS.straits, labelKey: 'home.meta.straits' },
      { value: COUNTS.waters, labelKey: 'home.meta.waters' },
      { value: COUNTS.countries, labelKey: 'home.meta.countries' },
    ],
  },
  {
    key: 'academy',
    to: '/learn',
    to2: '/quiz',
    backdrop: 'denmark',
    titleKey: 'home.academy.title',
    subtitleKey: 'home.academy.subtitle',
    descKey: 'home.academy.desc',
    ctaKey: 'home.academy.cta',
    cta2Key: 'home.academy.cta2',
    meta: [
      { value: COUNTS.events, labelKey: 'home.meta.events' },
      { value: COUNTS.species, labelKey: 'home.meta.species' },
      { value: 3, labelKey: 'home.meta.quizTiers' },
    ],
  },
];

const MODE_DATA = MODES.map((mode) => ({
  ...mode,
  image: heroImage(loadImagesFor({ type: 'strait', id: mode.backdrop })),
}));

/** A few slow drifting motes for ambient life; deterministic placement. */
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  left: `${String(((i * 61.8) % 100).toFixed(1))}%`,
  top: `${String(((i * 38.2 + 12) % 100).toFixed(1))}%`,
  delay: `${String((-(i * 5.1) % 30).toFixed(1))}s`,
  duration: `${String((26 + ((i * 4.3) % 20)).toFixed(1))}s`,
  size: 1.2 + ((i * 1.7) % 2),
}));

const APPEARANCE_KEY: Record<Appearance, StringKey> = {
  system: 'home.profile.system',
  dark: 'home.profile.dark',
  light: 'home.profile.light',
};
const LOCALE_KEY: Record<Locale, StringKey> = {
  en: 'home.profile.english',
  ro: 'home.profile.romanian',
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function SearchGlyph() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/** Collapsed to a circle, it expands into the live search on click. */
function LauncherSearch({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;
    const focusTimer = window.setTimeout(() => {
      document.getElementById('search')?.focus();
    }, 20);
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={open ? 'launch-search is-open' : 'launch-search'}>
      {open ? (
        <div
          className="launch-search-field"
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget) && query.trim() === '') {
              close();
            }
          }}
        >
          <GlobalSearch query={query} onQueryChange={setQuery} />
        </div>
      ) : (
        <button
          type="button"
          className="launch-icon"
          aria-label={label}
          onClick={() => {
            setOpen(true);
          }}
        >
          <SearchGlyph />
        </button>
      )}
    </div>
  );
}

function ProfileMenu({
  identity,
  theme,
  setTheme,
  onClose,
}: {
  identity: Identity;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  onClose: () => void;
}) {
  const t = useT();
  const { locale, setLocale } = useLocale();
  const [appearance, setAppearanceState] = useState<Appearance>(loadAppearance);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [onClose]);

  const chooseAppearance = (mode: Appearance) => {
    setAppearanceState(mode);
    saveAppearance(mode);
    setTheme(appearanceToTheme(mode));
  };

  // Theme is set through appearance, so the appearance dots reflect the
  // real theme even if it changed elsewhere.
  const activeAppearance: Appearance =
    theme === 'parchment' || theme === 'daylight'
      ? appearance === 'system'
        ? 'system'
        : 'light'
      : appearance === 'system'
        ? 'system'
        : 'dark';

  return (
    <div ref={rootRef} className="profile-menu" role="menu" aria-label={t('home.profile.identity')}>
      <div className="profile-identity">
        <span className="profile-avatar">
          <Avatar identity={identity} size={54} />
          <span className="avatar-status avatar-status--offline" aria-hidden="true" />
        </span>
        <div className="geo-label">{t('home.profile.identity')}</div>
        <b>{identity.name || t('home.profile.guest')}</b>
        <span className="profile-sub">{t('home.profile.sailor')}</span>
        <span className="profile-rank">{t('home.profile.rank')}</span>
      </div>

      <div className="profile-section">
        <div className="geo-label">{t('home.profile.appearance')}</div>
        <div className="profile-radios" role="group" aria-label={t('home.profile.appearance')}>
          {(['system', 'dark', 'light'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              role="menuitemradio"
              aria-checked={activeAppearance === mode}
              className={activeAppearance === mode ? 'profile-radio is-on' : 'profile-radio'}
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

      <div className="profile-section">
        <div className="geo-label">{t('home.profile.language')}</div>
        <div className="profile-radios" role="group" aria-label={t('home.profile.language')}>
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={locale === code}
              className={locale === code ? 'profile-radio is-on' : 'profile-radio'}
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

      <div className="profile-links">
        <Link viewTransition role="menuitem" to="/profile">
          {t('home.profile.statistics')}
        </Link>
        <Link viewTransition role="menuitem" to="/profile">
          {t('home.profile.achievements')}
        </Link>
        <Link viewTransition role="menuitem" to="/profile">
          {t('home.profile.settings')}
        </Link>
        <Link viewTransition role="menuitem" to="/profile">
          {t('home.profile.signin')}
        </Link>
      </div>

      <div className="profile-foot">{t('home.profile.soon')}</div>
    </div>
  );
}

export function HomePage() {
  const { theme, setTheme } = useOutletContext<LayoutContext>();
  const t = useT();
  const navigate = useNavigate();

  const [active, setActive] = useState<number | null>(null);
  const [launching, setLaunching] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [identity] = useState(loadIdentity);
  const ctaRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    recordActiveDay();
  }, []);

  const stateOf = (index: number) =>
    launching === index
      ? 'is-launching'
      : active === index
        ? 'is-active'
        : active !== null || launching !== null
          ? 'is-collapsed'
          : '';

  const focusMode = useCallback((index: number) => {
    setActive(index);
    ctaRefs.current[index]?.focus();
  }, []);

  const launch = useCallback(
    (index: number, to: string) => {
      if (launching !== null) return;
      setActive(index);
      if (prefersReducedMotion()) {
        void navigate(to, { viewTransition: true });
        return;
      }
      setLaunching(index);
      window.setTimeout(() => {
        void navigate(to, { viewTransition: true });
      }, 460);
    },
    [launching, navigate],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = MODE_DATA.length - 1;
    if (active === null) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        focusMode(event.key === 'ArrowLeft' || event.key === 'End' ? last : 0);
      }
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusMode(Math.min(last, active + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusMode(Math.max(0, active - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusMode(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusMode(last);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const hint = hintRef.current;
    if (!hint) return;
    if (active === null || launching !== null || event.pointerType === 'touch') {
      hint.style.opacity = '0';
      return;
    }
    hint.style.transform = `translate3d(${String(event.clientX)}px, ${String(event.clientY)}px, 0)`;
    hint.style.opacity = '1';
  };

  const wrapClass = launching !== null ? 'portal-wrap is-launching' : 'portal-wrap';

  return (
    <>
      <SeoTags
        title="Fathom — Choose how to experience the sea"
        description="Fathom is an interactive maritime platform. Explore the world's waterways, follow guided journeys, read the interactive chart, or learn at the Academy."
        path="/"
        ogType="website"
      />

      <h1 className="sr-only">Fathom — {t('home.platform')}</h1>

      <div className={wrapClass}>
        <div className="portal-topbar">
          <Link viewTransition className="portal-logo" to="/">
            <span className="portal-logo-mark">FATHOM</span>
            <span className="portal-logo-sub">{t('home.platform')}</span>
          </Link>
          <div className="portal-utils">
            <LauncherSearch label={t('search.open')} />
            <div className="avatar-wrap">
              <button
                type="button"
                className={menuOpen ? 'avatar-button is-open' : 'avatar-button'}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t('home.profile.open')}
                onClick={() => {
                  setMenuOpen((open) => !open);
                }}
              >
                <span className="avatar-shell">
                  <Avatar identity={identity} size={34} />
                  <span className="avatar-status avatar-status--offline" aria-hidden="true" />
                </span>
              </button>
              {menuOpen && (
                <ProfileMenu
                  identity={identity}
                  theme={theme}
                  setTheme={setTheme}
                  onClose={() => {
                    setMenuOpen(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div
          className={launching !== null ? 'portal is-launching' : 'portal'}
          role="list"
          aria-label={t('home.platform')}
          onKeyDown={onKeyDown}
          onPointerMove={onPointerMove}
          onMouseLeave={() => {
            setActive(null);
            if (hintRef.current) hintRef.current.style.opacity = '0';
          }}
        >
          {MODE_DATA.map((mode, index) => (
            <article
              key={mode.key}
              className={`panel panel--${mode.key} ${stateOf(index)}`.trim()}
              role="listitem"
              aria-labelledby={`mode-${mode.key}`}
              onMouseEnter={() => {
                setActive(index);
              }}
              onFocus={() => {
                setActive(index);
              }}
            >
              <div className="panel-bg" aria-hidden="true">
                {mode.image && (
                  <img
                    src={mediaUrl(mode.image.file)}
                    srcSet={mediaSrcSet(mode.image.file)}
                    sizes="(max-width: 760px) 100vw, 72vw"
                    alt=""
                    loading="eager"
                    decoding="async"
                  />
                )}
                <span className="panel-tint" />
                <span className="panel-particles" aria-hidden="true">
                  {PARTICLES.map((p, i) => (
                    <span
                      key={i}
                      style={{
                        left: p.left,
                        top: p.top,
                        width: p.size,
                        height: p.size,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                      }}
                    />
                  ))}
                </span>
              </div>

              <span className="panel-rail" aria-hidden="true">
                <span className="panel-rail-title">{t(mode.titleKey)}</span>
              </span>

              <div className="panel-face">
                <h2 id={`mode-${mode.key}`} className="panel-title">
                  {t(mode.titleKey)}
                </h2>
                <div className="panel-lower">
                  <p className="panel-subtitle">{t(mode.subtitleKey)}</p>
                  <div className="panel-detail">
                    <p className="panel-desc">{t(mode.descKey)}</p>
                    <div className="panel-actions">
                      <Link
                        viewTransition
                        className="uc-btn uc-btn--primary"
                        to={mode.to}
                        ref={(node) => {
                          ctaRefs.current[index] = node;
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          launch(index, mode.to);
                        }}
                      >
                        {t(mode.ctaKey)}
                      </Link>
                      <Link viewTransition className="uc-btn uc-btn--ghost" to={mode.to2}>
                        {t(mode.cta2Key)}
                      </Link>
                    </div>
                    <dl className="panel-meta">
                      {mode.meta.map((item) => (
                        <div key={item.labelKey}>
                          <dt>{item.value.toLocaleString('en')}</dt>
                          <dd>{t(item.labelKey)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div ref={hintRef} className="portal-cursor" aria-hidden="true">
          {active !== null ? `${t(MODE_DATA[active]?.ctaKey ?? 'home.explore.cta')} →` : ''}
        </div>
      </div>
    </>
  );
}
