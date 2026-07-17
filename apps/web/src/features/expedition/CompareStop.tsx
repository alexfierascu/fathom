import { Link } from 'react-router';

import type { Strait } from '@fathom/data';
import { similarStraits } from '@fathom/discovery';

/** This stop beside its closest kin — and why the engine paired them. */
export function CompareStop({ strait }: { strait: Strait }) {
  const kin = similarStraits(strait, 1)[0];
  if (!kin) return null;

  return (
    <div className="xp-compare">
      <div className="xp-compare-cols">
        <div>
          <div className="geo-label">This stop</div>
          <b>{strait.name}</b>
          <p>{strait.connects}</p>
        </div>
        <span className="compare-vs">vs</span>
        <div>
          <div className="geo-label">Closest kin</div>
          <b>{kin.name}</b>
          <p>{kin.reasons[0]?.detail}</p>
        </div>
      </div>
      <Link viewTransition className="more-link" to={`/compare/${strait.id}/${kin.id}`}>
        Full comparison →
      </Link>
    </div>
  );
}
