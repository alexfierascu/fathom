import { Link } from 'react-router';

import { SeoTags } from '../components/SeoTags';

/**
 * Off the chart: a small night seascape for addresses the atlas has
 * never surveyed. Pure CSS animation — the sloop bobs, the waves
 * drift, the lighthouse breathes — and all of it stands still under
 * prefers-reduced-motion.
 */

// One crest per 40 units, spanning -80..640 so an 80-unit drift loops
// without ever showing an edge.
const WAVE = `q 20 -10 40 0 ${'t 40 0 '.repeat(17).trim()}`;

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
        <svg className="nf-scene" viewBox="0 0 560 320" role="img" aria-hidden="true">
          <g className="nf-stars">
            <circle cx="60" cy="46" r="1.6" />
            <circle cx="142" cy="72" r="1.1" />
            <circle cx="238" cy="38" r="1.4" />
            <circle cx="336" cy="66" r="1.1" />
            <circle cx="92" cy="112" r="1" />
            <circle cx="396" cy="30" r="1.3" />
            <circle cx="508" cy="52" r="1.2" />
          </g>

          <g className="nf-moon">
            <circle cx="300" cy="58" r="15" />
            <path d="M293 45 a15 15 0 1 0 14 26 a12 12 0 1 1 -14 -26" />
          </g>

          {/* The lighthouse and its breathing beam */}
          <path className="nf-beam" d="M469 152 L236 198 L266 240 Z" />
          <g className="nf-lighthouse">
            <path className="nf-rock" d="M438 234 q 22 -14 46 -8 q 18 4 28 14 v 14 h -74 z" />
            <path d="M462 232 l 5 -66 h 14 l 5 66 z" />
            <path d="M458 158 h 22 M460 146 h 9 l 5.5 -9 l 5.5 9 h 9 z" />
            <path className="nf-soft" d="M464.5 210 h 19 M466 192 h 16" />
            <circle className="nf-lamp" cx="469.5" cy="152" r="3" />
          </g>

          {/* The course that led here */}
          <path className="nf-route" d="M28 306 C 92 300 122 284 152 268" />
          <g className="nf-x">
            <path d="M157 254 l 11 11 M168 254 l -11 11" />
          </g>
          <text className="nf-here" x="184" y="264">
            you are here
          </text>

          <path className="nf-wave nf-wave--back" d={`M-80 228 ${WAVE}`} />

          <g className="nf-boat">
            <path className="nf-sail" d="M189 176 q 27 21 25 58 h -25 z" />
            <path className="nf-sail nf-soft" d="M183 182 q -21 15 -19 52 h 19 z" />
            <path d="M186 238 v -64" />
            <path className="nf-pennant" d="M186 172 l 11 4.5 l -11 4.5 z" />
            <path className="nf-hull" d="M150 240 q 7 15 27 17 h 18 q 17 -4 21 -17 z" />
          </g>

          <path className="nf-wave nf-wave--mid" d={`M-80 248 ${WAVE}`} />
          <path className="nf-wave nf-wave--front" d={`M-80 266 ${WAVE}`} />
        </svg>

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
