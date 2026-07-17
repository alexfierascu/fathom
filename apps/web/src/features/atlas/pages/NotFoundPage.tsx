import { useEffect, useRef, useState } from 'react';

import { Link } from 'react-router';

import { loadImagesFor, loadStrait } from '@fathom/data';
import { loadJourneys } from '@fathom/discovery';

import { attributionOf, heroImage, mediaSrcSet, mediaUrl } from '../../media/media';
import { SeoTags } from '../components/SeoTags';

/**
 * Uncharted waters: the 404 as a full-bleed cinematic hero. The
 * backdrop is a real photograph of a real strait from the atlas's own
 * sourced media — satellite and orbital imagery, credited and linked —
 * so even the void beyond the chart is a place you can go and read
 * about. Motion is a slow drift, light fog, and rising spray, all
 * stilled under prefers-reduced-motion.
 */

/** Straits whose photographs read cinematic under a dark grade. */
const BACKDROPS = ['gibraltar', 'korea', 'hormuz', 'magellan'] as const;

/** Deterministic spray field — golden-ratio spacing, no randomness. */
const SPRAY = Array.from({ length: 14 }, (_, i) => ({
  left: `${String(((i * 61.8) % 100).toFixed(1))}%`,
  delay: `${String((-(i * 7.3) % 22).toFixed(1))}s`,
  duration: `${String((18 + ((i * 3.7) % 14)).toFixed(1))}s`,
  size: 1.4 + ((i * 2.6) % 2.2),
}));

export function NotFoundPage() {
  const [seed] = useState(() => Math.random());
  const straitId = BACKDROPS[Math.floor(seed * BACKDROPS.length)] ?? 'gibraltar';
  const strait = loadStrait(straitId);
  const image = heroImage(loadImagesFor({ type: 'strait', id: straitId }));

  const journeys = loadJourneys();
  const journey = journeys[Math.floor(seed * 997) % journeys.length];

  // Gentle pointer parallax on the backdrop; never under reduced motion.
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
        description="The page you're looking for could not be found, but the world's waterways are still waiting to be explored."
        path="/404"
        ogType="website"
      />
      <section className="uncharted">
        <div ref={backdropRef} className="uc-backdrop" aria-hidden="true">
          {image && (
            <img
              className="uc-photo"
              src={mediaUrl(image.file)}
              srcSet={mediaSrcSet(image.file)}
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
          <p className="uc-eyebrow">404 · Off the chart</p>
          <h2 className="uc-title">You&rsquo;ve entered uncharted waters.</h2>
          <p className="uc-sub">
            The page you&rsquo;re looking for could not be found, but the world&rsquo;s waterways
            are still waiting to be explored.
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
          <div className="uc-discover">
            <Link viewTransition className="uc-tile" to={`/straits/${strait.id}`}>
              <span className="uc-tile-label">The place in this photograph</span>
              <b>{strait.name}</b>
              <span>Open its page in the atlas</span>
            </Link>
            {journey && (
              <Link viewTransition className="uc-tile" to={`/journeys/${journey.id}`}>
                <span className="uc-tile-label">Featured journey</span>
                <b>{journey.title}</b>
                <span>{String(journey.waypoints.length)} stops, guided</span>
              </Link>
            )}
            <Link viewTransition className="uc-tile" to="/map?drift=1">
              <span className="uc-tile-label">Random discovery</span>
              <b>Set adrift</b>
              <span>Let the chart choose your next strait</span>
            </Link>
          </div>
          {image && (
            <p className="uc-credit">
              {image.alt} · {attributionOf(image)}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
