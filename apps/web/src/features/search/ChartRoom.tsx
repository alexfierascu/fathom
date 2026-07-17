import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { Link, useLocation, useNavigate } from 'react-router';

import { loadImages, loadImagesFor, type EntityType } from '@fathom/data';
import { loadJourneys, randomEntity } from '@fathom/discovery';
import {
  atlasSearchIndex,
  atlasSuggestions,
  type MatchRange,
  type SearchableType,
  type SearchResult,
} from '@fathom/search';

import { entityPath } from '../atlas/lib/entityPaths';
import { loadRecentlyViewed } from '../explore/recentlyViewed';
import { useT } from '../i18n/locale';
import { type StringKey } from '../i18n/strings';
import { heroImage, mediaSrcSet, mediaUrl } from '../media/media';
import { Avatar } from '../progression/Avatar';
import { loadIdentity } from '../progression/store';

/**
 * The Chart Room — the search experience reimagined as a destination.
 * Opening it does not replace the homepage; it settles over it like a
 * navigation table, the four modes softened to atmosphere behind glass.
 * With no query it invites (featured destinations, journeys, ways to
 * browse); as you type, the page itself becomes the results. All search
 * work is the existing @fathom/search engine — only the experience is
 * new.
 */

interface ChartRoomProps {
  onClose: () => void;
}

const TYPE_GLYPH: Record<SearchableType, string> = {
  strait: '↔',
  'water-body': '≈',
  country: '⚑',
  region: '◈',
  port: '⚓',
  canal: '⌇',
  bridge: '⌒',
  tunnel: '∩',
  island: '△',
  'maritime-route': '⇢',
};

const TYPE_LABEL: Record<SearchableType, StringKey> = {
  strait: 'chartroom.type.strait',
  'water-body': 'chartroom.type.waterBody',
  country: 'chartroom.type.country',
  region: 'chartroom.type.region',
  port: 'chartroom.type.port',
  canal: 'chartroom.type.canal',
  bridge: 'chartroom.type.bridge',
  tunnel: 'chartroom.type.tunnel',
  island: 'chartroom.type.island',
  'maritime-route': 'chartroom.type.route',
};

const CHIPS: { labelKey: StringKey; to: string }[] = [
  { labelKey: 'chartroom.chip.straits', to: '/explore' },
  { labelKey: 'chartroom.chip.journeys', to: '/journeys' },
  { labelKey: 'chartroom.chip.countries', to: '/explore' },
  { labelKey: 'chartroom.chip.ports', to: '/explore' },
  { labelKey: 'chartroom.chip.canals', to: '/explore' },
  { labelKey: 'chartroom.chip.waters', to: '/explore' },
  { labelKey: 'chartroom.chip.regions', to: '/explore' },
  { labelKey: 'chartroom.chip.academy', to: '/learn' },
];

function thumbFor(entityId: string) {
  const [type, id] = entityId.split(':');
  if (!id) return undefined;
  return heroImage(loadImagesFor({ type: type as EntityType, id }));
}

function Highlighted({ text, ranges }: { text: string; ranges: readonly MatchRange[] }) {
  if (ranges.length === 0) return <>{text}</>;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start > cursor) parts.push(text.slice(cursor, range.start));
    parts.push(<mark key={range.start}>{text.slice(range.start, range.end)}</mark>);
    cursor = range.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}

function DestinationCard({
  entityId,
  type,
  name,
  summary,
  nameMatches,
  onGo,
}: {
  entityId: string;
  type: SearchableType;
  name: string;
  summary: string;
  nameMatches?: readonly MatchRange[];
  onGo: () => void;
}) {
  const t = useT();
  const image = thumbFor(entityId);
  return (
    <button type="button" className="cr-card" onClick={onGo}>
      <span className="cr-card-media">
        {image ? (
          <img
            src={mediaUrl(image.file)}
            srcSet={mediaSrcSet(image.file)}
            sizes="220px"
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="cr-card-glyph" aria-hidden="true">
            {TYPE_GLYPH[type]}
          </span>
        )}
      </span>
      <span className="cr-card-body">
        <span className="cr-card-type">{t(TYPE_LABEL[type])}</span>
        <b className="cr-card-name">
          {nameMatches ? <Highlighted text={name} ranges={nameMatches} /> : name}
        </b>
        {summary && <span className="cr-card-sum">{summary}</span>}
      </span>
    </button>
  );
}

/**
 * Mounted only while open, so each summons starts fresh. RootLayout
 * renders it conditionally; the exit animation runs before onClose.
 */
export function ChartRoom({ onClose }: ChartRoomProps) {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const identity = useMemo(() => loadIdentity(), []);

  const trimmed = query.trim();
  const results = useMemo<readonly SearchResult[]>(
    () => (trimmed ? atlasSearchIndex().search(trimmed, { limit: 18 }) : []),
    [trimmed],
  );

  const closingRef = useRef(false);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 220);
  }, [onClose]);

  const go = useCallback(
    (path: string) => {
      void navigate(path, { viewTransition: true });
      onClose();
    },
    [navigate, onClose],
  );

  // Focus the input and lock the page behind while the room is open.
  useEffect(() => {
    document.documentElement.classList.add('chartroom-open');
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      document.documentElement.classList.remove('chartroom-open');
    };
  }, []);

  // Escape closes from anywhere in the room, not only the input.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [requestClose]);

  // Any external navigation dismisses the Chart Room.
  const lastPath = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      onClose();
    }
  }, [location.pathname, onClose]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      requestClose();
    } else if (event.key === 'ArrowDown' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp' && results.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      const target = results[activeIndex] ?? results[0];
      if (target) {
        event.preventDefault();
        go(target.document.path);
      }
    }
  };

  const recent = loadRecentlyViewed();
  const suggestions = atlasSuggestions();
  const journeys = loadJourneys();

  return (
    <div
      className={closing ? 'chartroom is-closing' : 'chartroom'}
      role="dialog"
      aria-modal="true"
      aria-label={t('chartroom.title')}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="chartroom-top">
        <Link
          viewTransition
          className="portal-logo"
          to="/"
          onClick={(event) => {
            event.preventDefault();
            go('/');
          }}
        >
          <span className="portal-logo-mark">FATHOM</span>
          <span className="portal-logo-sub">{t('home.platform')}</span>
        </Link>
        <div className="chartroom-top-right">
          <button
            type="button"
            className="avatar-button"
            aria-label={t('home.profile.open')}
            onClick={() => {
              go('/profile');
            }}
          >
            <span className="avatar-shell">
              <Avatar identity={identity} size={34} />
            </span>
          </button>
          <button
            type="button"
            className="chartroom-close"
            aria-label={t('chartroom.close')}
            onClick={requestClose}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="chartroom-scroll"
        onMouseDown={(event) => {
          // Clicking the empty water around the content leaves the room.
          if (event.target === event.currentTarget) requestClose();
        }}
      >
        <div className="chartroom-body">
          <header className="chartroom-head">
            <div className="geo-label">{t('chartroom.title')}</div>
            <h2 className="chartroom-tagline">{t('chartroom.tagline')}</h2>
            <div className="chartroom-search">
              <svg
                width="20"
                height="20"
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
              <input
                ref={inputRef}
                type="text"
                className="chartroom-input"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-label={t('chartroom.title')}
                placeholder={t('chartroom.placeholder')}
                autoComplete="off"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={onInputKeyDown}
              />
            </div>
          </header>

          {trimmed === '' ? (
            <div className="chartroom-discover">
              {recent.length > 0 && (
                <section className="cr-section">
                  <div className="geo-label">{t('chartroom.continue')}</div>
                  <div className="cr-chips">
                    {recent.slice(0, 6).map((visit) => (
                      <button
                        key={visit.entityId}
                        type="button"
                        className="cr-chip cr-chip--place"
                        onClick={() => {
                          go(visit.path);
                        }}
                      >
                        {visit.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="cr-section">
                <div className="geo-label">{t('chartroom.featured')}</div>
                <div className="cr-cards">
                  {suggestions.slice(0, 6).map((doc) => (
                    <DestinationCard
                      key={doc.entityId}
                      entityId={doc.entityId}
                      type={doc.type}
                      name={doc.name}
                      summary={doc.summary}
                      onGo={() => {
                        go(doc.path);
                      }}
                    />
                  ))}
                </div>
              </section>

              <section className="cr-section">
                <div className="geo-label">{t('chartroom.journeys')}</div>
                <div className="cr-journeys">
                  {journeys.slice(0, 6).map((journey) => {
                    const cover = journey.coverImageId
                      ? loadImages().find((image) => image.id === journey.coverImageId)
                      : undefined;
                    return (
                      <button
                        key={journey.id}
                        type="button"
                        className="cr-journey"
                        onClick={() => {
                          go(`/journeys/${journey.id}`);
                        }}
                      >
                        <span className="cr-journey-media">
                          {cover && (
                            <img
                              src={mediaUrl(cover.file)}
                              srcSet={mediaSrcSet(cover.file)}
                              sizes="360px"
                              alt=""
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                        </span>
                        <span className="cr-journey-body">
                          <b>{journey.title}</b>
                          <span className="cr-journey-sub">{journey.subtitle}</span>
                          <span className="cr-journey-meta">
                            {String(journey.waypoints.length)} {t('home.meta.stops')} ·{' '}
                            {String(journey.estimatedMinutes)}′
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="cr-section">
                <div className="geo-label">{t('chartroom.browse')}</div>
                <div className="cr-chips">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip.labelKey}
                      type="button"
                      className="cr-chip"
                      onClick={() => {
                        go(chip.to);
                      }}
                    >
                      {t(chip.labelKey)}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : results.length > 0 ? (
            <section className="cr-section" id="chartroom-results" aria-live="polite">
              <div className="geo-label">{t('chartroom.results')}</div>
              <div className="cr-cards">
                {results.map((result, index) => (
                  <div
                    key={result.document.entityId}
                    className={activeIndex === index ? 'cr-card-slot is-active' : 'cr-card-slot'}
                  >
                    <DestinationCard
                      entityId={result.document.entityId}
                      type={result.document.type}
                      name={result.document.name}
                      summary={result.document.summary}
                      nameMatches={result.nameMatches}
                      onGo={() => {
                        go(result.document.path);
                      }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <div className="cr-empty" aria-live="polite">
              <p className="cr-empty-title">{t('chartroom.empty.title')}</p>
              <p className="cr-empty-prompt">{t('chartroom.empty.prompt')}</p>
              <div className="cr-empty-actions">
                <button
                  type="button"
                  className="cr-chip"
                  onClick={() => {
                    const journey = journeys[0];
                    if (journey) go(`/journeys/${journey.id}`);
                  }}
                >
                  {t('chartroom.empty.journey')}
                </button>
                <button
                  type="button"
                  className="cr-chip"
                  onClick={() => {
                    const pick = randomEntity({ types: ['strait'] });
                    const path = pick ? entityPath({ type: pick.type, id: pick.id }) : null;
                    if (path) go(path);
                  }}
                >
                  {t('chartroom.empty.strait')}
                </button>
                <button
                  type="button"
                  className="cr-chip"
                  onClick={() => {
                    const pick = randomEntity({ types: ['port'] });
                    const path = pick ? entityPath({ type: pick.type, id: pick.id }) : null;
                    if (path) go(path);
                  }}
                >
                  {t('chartroom.empty.port')}
                </button>
                <button
                  type="button"
                  className="cr-chip"
                  onClick={() => {
                    go('/daily');
                  }}
                >
                  {t('chartroom.empty.challenge')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
