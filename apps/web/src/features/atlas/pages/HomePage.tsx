import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { Link } from 'react-router';

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

import { attributionOf, heroImage, mediaSrcSet, mediaUrl } from '../../media/media';
import { recordActiveDay } from '../../progression/store';
import { SeoTags } from '../components/SeoTags';

/**
 * The homepage answers exactly one question — "how do you want to
 * explore Fathom today?" — and nothing else. Four cinematic portals
 * fill one screen: Explore, Journeys, Map, Learn. Hovering (or
 * focusing) a portal glides it open to reveal its invitation; the
 * others fold into rails. On a phone the four become full-screen
 * slides you swipe between. Everything the atlas can actually do lives
 * inside these four doors.
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

interface PanelSpec {
  key: string;
  title: string;
  subtitle: string;
  description: string;
  /** Strait whose sourced photograph backs the panel. */
  backdrop: string;
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
  meta: { value: number; label: string }[];
}

const PANELS: readonly PanelSpec[] = [
  {
    key: 'explore',
    title: 'Explore',
    subtitle: 'Discover the world’s waterways',
    description:
      'Browse every strait, canal, port and coastline through an interactive atlas built for curiosity.',
    backdrop: 'gibraltar',
    primary: { label: 'Start exploring', to: '/explore' },
    secondary: { label: 'Six degrees of sea', to: '/six-degrees' },
    meta: [
      { value: COUNTS.straits, label: 'Straits' },
      { value: COUNTS.ports, label: 'Ports' },
      { value: COUNTS.canals, label: 'Canals' },
    ],
  },
  {
    key: 'journeys',
    title: 'Journeys',
    subtitle: 'Follow the great sea routes',
    description:
      'Sail guided voyages through the narrows that shaped trade, war, and discovery — one stop at a time.',
    backdrop: 'singapore',
    primary: { label: 'Begin a journey', to: '/journeys' },
    secondary: { label: 'Today’s expedition', to: '/daily' },
    meta: [
      { value: COUNTS.journeys, label: 'Voyages' },
      { value: COUNTS.stops, label: 'Stops' },
    ],
  },
  {
    key: 'map',
    title: 'Map',
    subtitle: 'Read the ocean as a chart',
    description:
      'See every strait at once, plotted with trade lanes and the waters that connect them.',
    backdrop: 'magellan',
    primary: { label: 'Open the map', to: '/map' },
    secondary: { label: 'Set adrift', to: '/map?drift=1' },
    meta: [
      { value: COUNTS.straits, label: 'Straits' },
      { value: COUNTS.waters, label: 'Waters' },
      { value: COUNTS.countries, label: 'Countries' },
    ],
  },
  {
    key: 'learn',
    title: 'Learn',
    subtitle: 'The atlas as a classroom',
    description:
      'Timelines, quizzes, wildlife, and long-form reads that turn geography into understanding.',
    backdrop: 'denmark',
    primary: { label: 'Start learning', to: '/learn' },
    secondary: { label: 'Take a quiz', to: '/quiz' },
    meta: [
      { value: COUNTS.events, label: 'Events' },
      { value: COUNTS.species, label: 'Species' },
      { value: 3, label: 'Quiz tiers' },
    ],
  },
];

const PANEL_DATA = PANELS.map((panel) => ({
  ...panel,
  image: heroImage(loadImagesFor({ type: 'strait', id: panel.backdrop })),
}));

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function HomePage() {
  const [active, setActive] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const ctaRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const portalRef = useRef<HTMLDivElement>(null);

  // While the homepage is up, the shell collapses to a single screen:
  // full-bleed panels below the nav, no footer, no scroll.
  useEffect(() => {
    document.documentElement.classList.add('route-portal');
    recordActiveDay();
    return () => {
      document.documentElement.classList.remove('route-portal');
    };
  }, []);

  const focusPanel = useCallback((index: number) => {
    setActive(index);
    ctaRefs.current[index]?.focus();
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = PANEL_DATA.length - 1;
    if (active === null) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        focusPanel(event.key === 'ArrowLeft' || event.key === 'End' ? last : 0);
      }
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      focusPanel(Math.min(last, active + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusPanel(Math.max(0, active - 1));
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusPanel(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusPanel(last);
    }
  };

  const onScroll = () => {
    const element = portalRef.current;
    if (!element || element.clientWidth === 0) return;
    setSlide(Math.round(element.scrollLeft / element.clientWidth));
  };

  const goToSlide = (index: number) => {
    const element = portalRef.current;
    if (!element) return;
    element.scrollTo({
      left: index * element.clientWidth,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  return (
    <>
      <SeoTags
        title="Fathom — The Interactive Atlas of the World's Straits"
        description="The definitive interactive atlas of the world's straits — the narrow waters where oceans meet and history turns. Explore, journey, map, and learn."
        path="/"
        ogType="website"
      />

      <h1 className="sr-only">
        Fathom — the interactive atlas of the world’s straits. Choose how you want to explore.
      </h1>

      <div className="portal-wrap">
        <div
          ref={portalRef}
          className="portal"
          role="list"
          aria-label="Ways to explore Fathom"
          onKeyDown={onKeyDown}
          onScroll={onScroll}
          onMouseLeave={() => {
            setActive(null);
          }}
        >
          {PANEL_DATA.map((panel, index) => {
            const state = active === index ? 'is-active' : active !== null ? 'is-collapsed' : '';
            return (
              <article
                key={panel.key}
                className={`panel panel--${panel.key} ${state}`.trim()}
                role="listitem"
                aria-labelledby={`portal-${panel.key}`}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onFocus={() => {
                  setActive(index);
                }}
              >
                <div className="panel-bg" aria-hidden="true">
                  {panel.image && (
                    <img
                      src={mediaUrl(panel.image.file)}
                      srcSet={mediaSrcSet(panel.image.file)}
                      sizes="(max-width: 760px) 100vw, 72vw"
                      alt=""
                      loading="eager"
                      decoding="async"
                    />
                  )}
                  <span className="panel-tint" />
                </div>

                <span className="panel-rail" aria-hidden="true">
                  <span className="panel-rail-title">{panel.title}</span>
                </span>

                <div className="panel-face">
                  <span className="panel-index">0{index + 1}</span>
                  <h2 id={`portal-${panel.key}`} className="panel-title">
                    {panel.title}
                  </h2>
                  <p className="panel-subtitle">{panel.subtitle}</p>
                  <div className="panel-detail">
                    <p className="panel-desc">{panel.description}</p>
                    <div className="panel-actions">
                      <Link
                        viewTransition
                        className="uc-btn uc-btn--primary"
                        to={panel.primary.to}
                        ref={(node) => {
                          ctaRefs.current[index] = node;
                        }}
                      >
                        {panel.primary.label}
                      </Link>
                      <Link viewTransition className="uc-btn uc-btn--ghost" to={panel.secondary.to}>
                        {panel.secondary.label}
                      </Link>
                    </div>
                    <dl className="panel-meta">
                      {panel.meta.map((item) => (
                        <div key={item.label}>
                          <dt>{item.value.toLocaleString('en')}</dt>
                          <dd>{item.label}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>

                {panel.image && <span className="panel-credit">{attributionOf(panel.image)}</span>}
              </article>
            );
          })}
        </div>

        <div className="portal-dots" role="tablist" aria-label="Choose a panel">
          {PANEL_DATA.map((panel, index) => (
            <button
              key={panel.key}
              type="button"
              role="tab"
              aria-selected={slide === index}
              aria-label={panel.title}
              className={slide === index ? 'portal-dot is-on' : 'portal-dot'}
              onClick={() => {
                goToSlide(index);
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
