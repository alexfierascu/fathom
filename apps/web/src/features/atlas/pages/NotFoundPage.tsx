import { useEffect, useRef } from 'react';

import { Link } from 'react-router';

import { SeoTags } from '../components/SeoTags';
import { runNotFoundScene } from './notFoundScene';

/**
 * Off the chart: a live night seascape for addresses the atlas has
 * never surveyed. The scene itself is drawn on canvas each frame —
 * see notFoundScene.ts — and stands still under
 * prefers-reduced-motion.
 */

function Seascape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return runNotFoundScene(canvas);
  }, []);

  return <canvas ref={canvasRef} className="nf-scene" aria-hidden="true" />;
}

export function NotFoundPage() {
  return (
    <>
      <SeoTags
        title="Off the chart — Fathom"
        description="Nothing is charted at this address."
        path="/404"
        ogType="website"
      />
      <section className="notfound">
        <Seascape />
        <div className="geo-label">Off the chart</div>
        <h2 className="nf-code">404</h2>
        <p className="note note--lede nf-note">
          Nothing is charted at this address — the current may have shifted, or the chart was
          redrawn. The lighthouse will see you back to surveyed waters.
        </p>
        <div className="pills nf-pills">
          <Link viewTransition className="pill pill--action" to="/">
            Return to the chart
          </Link>
          <Link viewTransition className="pill" to="/explore">
            Explore the atlas
          </Link>
          <Link viewTransition className="pill" to="/map">
            Open the map
          </Link>
          <Link viewTransition className="pill" to="/map?drift=1">
            Set adrift ⚓
          </Link>
        </div>
      </section>
    </>
  );
}
