import { useEffect, useRef, useState } from 'react';

import { Link, useSearchParams } from 'react-router';

import { loadImagesFor } from '@fathom/data';

import { attributionOf, heroImage, mediaSrcSet, mediaUrl } from '../../media/media';
import { recordLegendFound } from '../../progression/store';
import { SeoTags } from '../components/SeoTags';

/**
 * Uncharted waters: the whole 404 experience on one screen. Sailing
 * past the atlas's edge lands the traveller in a hidden part of the
 * ocean — a cinematic photograph of a real strait (credited), an
 * editorial title, and three ways onward. The hero IS the page:
 * nothing sits below it and nothing scrolls. About one visit in a
 * hundred finds legendary waters — a rare backdrop and a silent
 * trophy in the captain's log.
 */

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

/** A cheap seeded hash so one visit's backdrop is stable across renders. */
const at = (seed: number, salt: number): number => {
  const v = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

export function NotFoundPage() {
  const [seed] = useState(() => Math.random());
  const [searchParams] = useSearchParams();
  const legend = searchParams.has('legend') || seed < 0.01;

  // While this page is up, the whole shell collapses to one screen:
  // the nav floats over the image, the footer is gone, nothing scrolls.
  useEffect(() => {
    document.documentElement.classList.add('route-uncharted');
    return () => {
      document.documentElement.classList.remove('route-uncharted');
    };
  }, []);

  useEffect(() => {
    if (legend) recordLegendFound();
  }, [legend]);

  const backdropId = legend
    ? LEGEND_BACKDROP
    : (BACKDROPS[Math.floor(at(seed, 1) * BACKDROPS.length)] ?? 'gibraltar');
  const image = heroImage(loadImagesFor({ type: 'strait', id: backdropId }));

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
        description="This place isn't on any chart, but the world's waterways are full of discoveries waiting to be explored."
        path="/404"
        ogType="website"
      />
      <meta name="robots" content="noindex" />

      <section className={legend ? 'uncharted uncharted--legend' : 'uncharted'}>
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

        {image && (
          <p className="uc-credit">
            {image.alt} · {attributionOf(image)}
          </p>
        )}
      </section>
    </>
  );
}
