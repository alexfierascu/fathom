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
import { LocaleSwitcher } from '../../i18n/LocaleSwitcher';
import { attributionOf, heroImage, mediaSrcSet, mediaUrl } from '../../media/media';
import { Avatar } from '../../progression/Avatar';
import { loadIdentity, recordActiveDay } from '../../progression/store';
import { ThemeSwitcher } from '../../theme/ThemeSwitcher';
import { SeoTags } from '../components/SeoTags';

/**
 * Not a homepage but a launcher. Fathom is no longer "an atlas" — the
 * atlas is one of four ways to experience the sea, and this screen lets
 * you choose: Explore, Journey, Chart, Academy. Four cinematic modes
 * fill one viewport; there is no navbar, only floating chrome embedded
 * in the imagery. Hovering a mode glides it open and lights its label;
 * choosing one expands it to fill the screen — stepping through a
 * doorway — before the route ever changes.
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
  title: string;
  subtitle: string;
  description: string;
  backdrop: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
  meta: { value: number; label: string }[];
}

const MODES: readonly ModeSpec[] = [
  {
    key: 'explore',
    title: 'Explore',
    subtitle: 'Discover places.',
    description:
      'Straits, ports, canals, regions and coastlines — the whole maritime world, mapped and keyed for the curious.',
    backdrop: 'gibraltar',
    primary: { label: 'Enter Explore', to: '/explore' },
    secondary: { label: 'Six degrees of sea', to: '/six-degrees' },
    meta: [
      { value: COUNTS.straits, label: 'Straits' },
      { value: COUNTS.ports, label: 'Ports' },
      { value: COUNTS.canals, label: 'Canals' },
    ],
  },
  {
    key: 'journey',
    title: 'Journey',
    subtitle: 'Follow stories.',
    description:
      'Guided voyages and historic expeditions through the narrows that shaped trade, war, and discovery.',
    backdrop: 'singapore',
    primary: { label: 'Begin Journey', to: '/journeys' },
    secondary: { label: 'Today’s expedition', to: '/daily' },
    meta: [
      { value: COUNTS.journeys, label: 'Voyages' },
      { value: COUNTS.stops, label: 'Stops' },
    ],
  },
  {
    key: 'chart',
    title: 'Chart',
    subtitle: 'Read the ocean.',
    description:
      'The interactive chart — every strait, trade lane, and stretch of water, laid out to measure and compare.',
    backdrop: 'magellan',
    primary: { label: 'Open Chart', to: '/map' },
    secondary: { label: 'Set adrift', to: '/map?drift=1' },
    meta: [
      { value: COUNTS.straits, label: 'Straits' },
      { value: COUNTS.waters, label: 'Waters' },
      { value: COUNTS.countries, label: 'Countries' },
    ],
  },
  {
    key: 'academy',
    title: 'Academy',
    subtitle: 'Master the sea.',
    description:
      'Lessons, quizzes, timelines and wildlife — with a captain’s log that tracks how far you have come.',
    backdrop: 'denmark',
    primary: { label: 'Start Learning', to: '/learn' },
    secondary: { label: 'Take a quiz', to: '/quiz' },
    meta: [
      { value: COUNTS.events, label: 'Events' },
      { value: COUNTS.species, label: 'Species' },
      { value: 3, label: 'Quiz tiers' },
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

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HomePage() {
  const { theme, setTheme, openSearch } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const [active, setActive] = useState<number | null>(null);
  const [launching, setLaunching] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [identity] = useState(loadIdentity);
  const ctaRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const portalRef = useRef<HTMLDivElement>(null);
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

  // Choosing a mode expands it to fill the screen, then navigates — the
  // route change happens under cover of the doorway, never seen.
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
      }, 640);
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

  const onScroll = () => {
    const element = portalRef.current;
    if (!element || element.clientWidth === 0) return;
    setSlide(Math.round(element.scrollLeft / element.clientWidth));
  };

  const goToSlide = (index: number) => {
    portalRef.current?.scrollTo({
      left: index * (portalRef.current.clientWidth || 0),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
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

      <h1 className="sr-only">
        Fathom — an interactive maritime platform. Choose how you want to experience the sea:
        Explore, Journey, Chart, or Academy.
      </h1>

      <div className={wrapClass}>
        {/* Floating chrome, embedded in the imagery — no navbar. */}
        <div className="portal-topbar">
          <Link viewTransition className="portal-logo" to="/">
            <span className="portal-logo-mark">FATHOM</span>
            <span className="portal-logo-sub">Interactive Maritime Platform</span>
          </Link>
          <div className="portal-utils">
            <button
              type="button"
              className="util-search"
              onClick={openSearch}
              aria-label="Search the atlas"
            >
              <svg
                width="15"
                height="15"
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
              <span className="util-search-label">Search the Atlas…</span>
              <kbd>⌘K</kbd>
            </button>
            <LocaleSwitcher />
            <ThemeSwitcher theme={theme} onChange={setTheme} />
            <Link
              viewTransition
              className="util-profile"
              to="/profile"
              aria-label="Your captain's log"
            >
              <Avatar identity={identity} size={26} />
              <span>{identity.name || 'Guest Explorer'}</span>
            </Link>
          </div>
        </div>

        {/* Museum plaques: the mode labels ride above their panels. */}
        <div className="portal-labels" aria-hidden="true">
          {MODE_DATA.map((mode, index) => (
            <button
              key={mode.key}
              type="button"
              tabIndex={-1}
              className={`mode-label ${stateOf(index)}`.trim()}
              onMouseEnter={() => {
                setActive(index);
              }}
              onClick={() => {
                launch(index, mode.primary.to);
              }}
            >
              {mode.title}
            </button>
          ))}
        </div>

        <div
          ref={portalRef}
          className={launching !== null ? 'portal is-launching' : 'portal'}
          role="list"
          aria-label="Choose how to experience the sea"
          onKeyDown={onKeyDown}
          onScroll={onScroll}
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
                <span className="panel-rail-title">{mode.title}</span>
              </span>

              <div className="panel-face">
                <h2 id={`mode-${mode.key}`} className="panel-title">
                  {mode.title}
                </h2>
                <div className="panel-lower">
                  <p className="panel-subtitle">{mode.subtitle}</p>
                  <div className="panel-detail">
                    <p className="panel-desc">{mode.description}</p>
                    <div className="panel-actions">
                      <Link
                        viewTransition
                        className="uc-btn uc-btn--primary"
                        to={mode.primary.to}
                        ref={(node) => {
                          ctaRefs.current[index] = node;
                        }}
                        onClick={(event) => {
                          event.preventDefault();
                          launch(index, mode.primary.to);
                        }}
                      >
                        {mode.primary.label}
                      </Link>
                      <Link viewTransition className="uc-btn uc-btn--ghost" to={mode.secondary.to}>
                        {mode.secondary.label}
                      </Link>
                    </div>
                    <dl className="panel-meta">
                      {mode.meta.map((item) => (
                        <div key={item.label}>
                          <dt>{item.value.toLocaleString('en')}</dt>
                          <dd>{item.label}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </div>

              {mode.image && <span className="panel-credit">{attributionOf(mode.image)}</span>}
            </article>
          ))}
        </div>

        <div className="portal-dots" role="tablist" aria-label="Choose a mode">
          {MODE_DATA.map((mode, index) => (
            <button
              key={mode.key}
              type="button"
              role="tab"
              aria-selected={slide === index}
              aria-label={mode.title}
              className={slide === index ? 'portal-dot is-on' : 'portal-dot'}
              onClick={() => {
                goToSlide(index);
              }}
            />
          ))}
        </div>

        <div ref={hintRef} className="portal-cursor" aria-hidden="true">
          {active !== null ? `${MODE_DATA[active]?.primary.label ?? 'Enter'} →` : ''}
        </div>
      </div>
    </>
  );
}
