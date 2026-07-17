import { useEffect, useMemo, useRef, useState } from 'react';

import { Link, useNavigate, useSearchParams } from 'react-router';

import {
  loadCanals,
  loadCountriesIndex,
  loadImages,
  loadImagesFor,
  loadPorts,
  loadStrait,
  loadStraitsIndex,
  loadWaterBodiesIndex,
} from '@fathom/data';
import { loadJourneys, type Journey } from '@fathom/discovery';

import { attributionOf, heroImage, mediaSrcSet, mediaUrl } from '../../media/media';
import { recordLegendFound } from '../../progression/store';
import { Section } from '../components/Section';
import { SeoTags } from '../components/SeoTags';
import { entityPath } from '../lib/entityPaths';

/**
 * Uncharted waters: sailing past the atlas's edge lands the traveller
 * in a hidden part of the ocean, not on an error page. A cinematic
 * photographic hero (real straits, credited), then a page of
 * discovery that reshuffles on every visit — a featured strait, a
 * voyage, a sourced fact, unexpected destinations, a chart extract,
 * and, about once in a hundred visits, legendary waters.
 */

/** Straits whose photographs read cinematic under a dark grade. */
const BACKDROPS = ['gibraltar', 'korea', 'hormuz', 'magellan'] as const;
/** The rare backdrop, reserved for legendary visits. */
const LEGEND_BACKDROP = 'bass';

/** Deterministic spray field — golden-ratio spacing, no randomness. */
const SPRAY = Array.from({ length: 14 }, (_, i) => ({
  left: `${String(((i * 61.8) % 100).toFixed(1))}%`,
  delay: `${String((-(i * 7.3) % 22).toFixed(1))}s`,
  duration: `${String((18 + ((i * 3.7) % 14)).toFixed(1))}s`,
  size: 1.4 + ((i * 2.6) % 2.2),
}));

/** A cheap seeded hash so one visit's picks are stable across renders. */
const at = (seed: number, salt: number): number => {
  const v = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

const pickFrom = <T,>(items: readonly T[], seed: number, salt: number): T | undefined =>
  items[Math.floor(at(seed, salt) * items.length)];

interface Destination {
  type: 'strait' | 'water-body' | 'country' | 'port' | 'canal';
  id: string;
  name: string;
  verb: string;
}

function journeyCover(journey: Journey) {
  if (!journey.coverImageId) return null;
  return loadImages().find((image) => image.id === journey.coverImageId) ?? null;
}

/** Web-Mercator tile coordinates for a static chart extract. */
function tileMath(lat: number, lon: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y, n };
}

const MAP_ZOOM = 6;
const TILE = 256;
const MAP_COLS = 4;
const MAP_ROWS = 2;

export function NotFoundPage() {
  const [seed] = useState(() => Math.random());
  const [searchParams] = useSearchParams();
  const legend = searchParams.has('legend') || seed < 0.01;

  useEffect(() => {
    if (legend) recordLegendFound();
  }, [legend]);

  // --- The hero backdrop: a real, credited photograph -----------------------
  const backdropId = legend
    ? LEGEND_BACKDROP
    : (BACKDROPS[Math.floor(at(seed, 1) * BACKDROPS.length)] ?? 'gibraltar');
  const backdropStrait = loadStrait(backdropId);
  const backdropImage = heroImage(loadImagesFor({ type: 'strait', id: backdropId }));

  // --- This visit's discoveries ---------------------------------------------
  const straitsWithImages = useMemo(() => {
    const ids = new Set<string>();
    for (const image of loadImages()) {
      for (const depicted of image.depicts) {
        if (depicted.type === 'strait') ids.add(depicted.id);
      }
    }
    return [...ids].sort();
  }, []);

  const featuredId =
    pickFrom(
      straitsWithImages.filter((id) => id !== backdropId),
      seed,
      2,
    ) ?? 'malacca';
  const featured = loadStrait(featuredId);
  const featuredImage = heroImage(loadImagesFor({ type: 'strait', id: featuredId }));

  const journeys = loadJourneys();
  const journey = pickFrom(journeys, seed, 3) ?? journeys[0];
  const cover = journey ? journeyCover(journey) : null;

  const factStrait = loadStrait(pickFrom(loadStraitsIndex(), seed, 4)?.id ?? 'gibraltar');

  const destinations = useMemo<Destination[]>(
    () => [
      ...loadStraitsIndex().map((s) => ({
        type: 'strait' as const,
        id: s.id,
        name: s.name,
        verb: 'Explore',
      })),
      ...loadWaterBodiesIndex().map((w) => ({
        type: 'water-body' as const,
        id: w.id,
        name: w.name,
        verb: 'Learn about',
      })),
      ...loadCountriesIndex().map((c) => ({
        type: 'country' as const,
        id: c.id,
        name: c.name,
        verb: 'Discover',
      })),
      ...loadPorts().map((p) => ({ type: 'port' as const, id: p.id, name: p.name, verb: 'Visit' })),
      ...loadCanals().map((c) => ({
        type: 'canal' as const,
        id: c.id,
        name: c.name,
        verb: 'Discover',
      })),
    ],
    [],
  );

  const suggestions = useMemo(() => {
    const taken: Destination[] = [];
    const used = new Set<number>();
    for (let salt = 0; taken.length < 6 && salt < 80; salt += 1) {
      const index = Math.floor(at(seed, 40 + salt) * destinations.length);
      if (used.has(index)) continue;
      used.add(index);
      const destination = destinations[index];
      if (destination) taken.push(destination);
    }
    return taken;
  }, [seed, destinations]);

  const navigate = useNavigate();
  const openRandomPlace = () => {
    const target = destinations[Math.floor(Math.random() * destinations.length)];
    const path = target ? entityPath(target) : null;
    if (path) void navigate(path);
  };

  // --- The chart extract -----------------------------------------------------
  const mapStrait = loadStrait(
    pickFrom(
      loadStraitsIndex().filter((s) => s.id !== featuredId),
      seed,
      5,
    )?.id ?? 'bosporus',
  );
  const chart = useMemo(() => {
    const { x, y, n } = tileMath(mapStrait.lat, mapStrait.lon, MAP_ZOOM);
    const x0 = Math.round(x) - MAP_COLS / 2;
    const y0 = Math.round(y) - MAP_ROWS / 2;
    const tiles = [];
    for (let row = 0; row < MAP_ROWS; row += 1) {
      for (let col = 0; col < MAP_COLS; col += 1) {
        const tx = (((x0 + col) % n) + n) % n;
        const sub = 'abcd'[(tx + row) % 4] ?? 'a';
        tiles.push({
          key: `${String(col)}-${String(row)}`,
          left: col * TILE,
          top: row * TILE,
          url: `https://${sub}.basemaps.cartocdn.com/dark_all/${String(MAP_ZOOM)}/${String(tx)}/${String(y0 + row)}@2x.png`,
        });
      }
    }
    return { tiles, markerLeft: (x - x0) * TILE, markerTop: (y - y0) * TILE };
  }, [mapStrait]);

  // --- Gentle pointer parallax on the hero backdrop --------------------------
  const backdropRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      const dx = (event.clientX / window.innerWidth - 0.5) * -14;
      const dy = (event.clientY / window.innerHeight - 0.5) * -10;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        backdrop.style.transform = `translate3d(${String(dx)}px, ${String(dy)}px, 0) scale(1.06)`;
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <>
      <SeoTags
        title="Uncharted waters — Fathom"
        description="This place isn't on any chart, but the world's waterways are full of discoveries waiting to be explored."
        path="/404"
        ogType="website"
      />
      <meta name="robots" content="noindex" />

      <section className={legend ? 'uncharted uncharted--legend' : 'uncharted'}>
        <div ref={backdropRef} className="uc-backdrop" aria-hidden="true">
          {backdropImage && (
            <img
              className="uc-photo"
              src={mediaUrl(backdropImage.file)}
              srcSet={mediaSrcSet(backdropImage.file)}
              sizes="100vw"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          )}
          <div className="uc-grade" />
          <div className="uc-fog uc-fog--one" />
          <div className="uc-fog uc-fog--two" />
          <div className="uc-spray">
            {SPRAY.map((drop, i) => (
              <span
                key={i}
                style={{
                  left: drop.left,
                  width: drop.size,
                  height: drop.size,
                  animationDelay: drop.delay,
                  animationDuration: drop.duration,
                }}
              />
            ))}
          </div>
          <div className="uc-scrim" />
        </div>

        <div className="uc-content">
          <p className="uc-eyebrow">
            {legend ? 'A legendary discovery' : 'Beyond the edge of the chart'}
          </p>
          <h2 className="uc-title">You&rsquo;ve entered uncharted waters.</h2>
          <p className="uc-sub">
            The place you were looking for isn&rsquo;t on any chart, but the world&rsquo;s waterways
            are full of discoveries waiting to be explored.
          </p>
          <div className="uc-actions">
            <Link viewTransition className="uc-btn uc-btn--primary" to="/explore">
              Continue exploring
            </Link>
            <Link viewTransition className="uc-btn uc-btn--ghost" to="/">
              Return home
            </Link>
            <Link viewTransition className="uc-btn uc-btn--ghost" to="/map">
              Open the atlas
            </Link>
          </div>
        </div>

        <div className="uc-foot">
          <span className="uc-cue" aria-hidden="true">
            Discoveries below ⌄
          </span>
          {backdropImage && (
            <p className="uc-credit">
              {backdropImage.alt} · {attributionOf(backdropImage)} ·{' '}
              <Link viewTransition to={`/straits/${backdropStrait.id}`}>
                {backdropStrait.name}
              </Link>
            </p>
          )}
        </div>
      </section>

      <div className="uc-sections">
        {legend && (
          <div className="uc-legend-card">
            <div className="geo-label">Legendary waters</div>
            <blockquote>
              <p>&ldquo;It is not down in any map; true places never are.&rdquo;</p>
              <footer>
                — Herman Melville, <cite>Moby-Dick</cite> (1851)
              </footer>
            </blockquote>
            <p className="note">
              Few travellers ever sight these waters. A hidden trophy has been added to your{' '}
              <Link viewTransition to="/profile">
                captain&rsquo;s log
              </Link>
              .
            </p>
          </div>
        )}

        <Section label="From the chart">
          <div className="uc-feature">
            {featuredImage && (
              <Link viewTransition className="uc-feature-media" to={`/straits/${featured.id}`}>
                <img
                  src={mediaUrl(featuredImage.file)}
                  srcSet={mediaSrcSet(featuredImage.file)}
                  sizes="(max-width: 760px) 100vw, 560px"
                  alt={featuredImage.alt}
                  loading="lazy"
                  decoding="async"
                />
                <span className="uc-media-credit">{attributionOf(featuredImage)}</span>
              </Link>
            )}
            <div className="uc-feature-text">
              <div className="geo-label">Featured strait</div>
              <h3>{featured.name}</h3>
              <p>{featured.note}</p>
              <Link viewTransition className="uc-more" to={`/straits/${featured.id}`}>
                Explore {featured.name} →
              </Link>
            </div>
          </div>
        </Section>

        {journey && (
          <Section label="A voyage to begin">
            <div className="uc-feature uc-feature--flip">
              {cover && (
                <Link viewTransition className="uc-feature-media" to={`/journeys/${journey.id}`}>
                  <img
                    src={mediaUrl(cover.file)}
                    srcSet={mediaSrcSet(cover.file)}
                    sizes="(max-width: 760px) 100vw, 560px"
                    alt={cover.alt}
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="uc-media-credit">{attributionOf(cover)}</span>
                </Link>
              )}
              <div className="uc-feature-text">
                <div className="geo-label">Featured journey</div>
                <h3>{journey.title}</h3>
                <p>{journey.subtitle}</p>
                <p className="uc-meta">
                  {String(journey.waypoints.length)} stops · about{' '}
                  {String(journey.estimatedMinutes)} minutes
                </p>
                <Link viewTransition className="uc-more" to={`/journeys/${journey.id}`}>
                  Begin the journey →
                </Link>
              </div>
            </div>
          </Section>
        )}

        <div className="uc-duo">
          <Section label="Did you know?">
            <div className="fact-quotes">
              <blockquote className="fact-quote">
                <p>{factStrait.note}</p>
                <footer>
                  —{' '}
                  <Link viewTransition to={`/straits/${factStrait.id}`}>
                    {factStrait.name}
                  </Link>
                </footer>
              </blockquote>
            </div>
          </Section>
          <Section label="Captain's log">
            <dl className="uc-log">
              <div>
                <dt>Latitude</dt>
                <dd>Unknown</dd>
              </div>
              <div>
                <dt>Longitude</dt>
                <dd>Unknown</dd>
              </div>
              <div>
                <dt>Chart status</dt>
                <dd>{legend ? 'Legendary' : 'Unmapped'}</dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>Clear</dd>
              </div>
              <div>
                <dt>Recommendation</dt>
                <dd>Continue exploring</dd>
              </div>
            </dl>
          </Section>
        </div>

        <Section label="Somewhere unexpected">
          <div className="pills">
            {suggestions.map((destination) => {
              const path = entityPath(destination);
              if (!path) return null;
              return (
                <Link
                  viewTransition
                  key={`${destination.type}:${destination.id}`}
                  className="pill"
                  to={path}
                >
                  {destination.verb} {destination.name}
                </Link>
              );
            })}
            <button type="button" className="pill pill--action" onClick={openRandomPlace}>
              Open a random place ⚄
            </button>
          </div>
        </Section>

        <Section label="Somewhere on the chart">
          <Link viewTransition className="uc-chart" to={`/straits/${mapStrait.id}`}>
            <div
              className="uc-chart-tiles"
              style={{ width: MAP_COLS * TILE, height: MAP_ROWS * TILE }}
            >
              {chart.tiles.map((tile) => (
                <img
                  key={tile.key}
                  src={tile.url}
                  style={{ left: tile.left, top: tile.top }}
                  width={TILE}
                  height={TILE}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ))}
              <span
                className="uc-chart-marker"
                style={{ left: chart.markerLeft, top: chart.markerTop }}
                aria-hidden="true"
              />
            </div>
            <span className="uc-chart-caption">
              <b>{mapStrait.name}</b>
              <span>Open this stretch of the chart →</span>
            </span>
          </Link>
          <p className="uc-chart-attribution">Chart tiles © OpenStreetMap contributors © CARTO</p>
        </Section>

        <Section label="Keep learning">
          <div className="explore-tiles">
            <Link viewTransition className="explore-tile" to="/quiz">
              <div className="explore-tile-glyph">✶</div>
              <h3>Take a quiz</h3>
              <p>Three tiers, ten questions — earn your Pilot&rsquo;s ticket.</p>
            </Link>
            <Link viewTransition className="explore-tile" to="/journeys">
              <div className="explore-tile-glyph">⚓</div>
              <h3>Continue a journey</h3>
              <p>Guided voyages through the world&rsquo;s great narrows.</p>
            </Link>
            <Link viewTransition className="explore-tile" to="/learn">
              <div className="explore-tile-glyph">❖</div>
              <h3>Browse collections</h3>
              <p>Straits gathered by theme — chokepoints, polar passages, and more.</p>
            </Link>
            <Link viewTransition className="explore-tile" to="/map">
              <div className="explore-tile-glyph">✦</div>
              <h3>Explore the map</h3>
              <p>Every charted strait on one interactive ocean.</p>
            </Link>
          </div>
        </Section>
      </div>
    </>
  );
}
