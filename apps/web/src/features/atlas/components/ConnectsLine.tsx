import { Link } from 'react-router';

import { getRelated, getStraitEntity, slugifyName, type Strait } from '@fathom/data';

/**
 * The strait's `connects` line. "A ↔ B" values render each water body as a
 * link to its page; prose values render as plain text.
 */
export function ConnectsLine({ strait }: { strait: Strait }) {
  const waterBodies = getRelated(getStraitEntity(strait), 'waterBodies');
  const bySlug = new Map(waterBodies.map((wb) => [wb.id, wb]));
  const [first, second] = strait.connects.split(' ↔ ');

  if (first !== undefined && second !== undefined) {
    const renderSide = (label: string) => {
      const waterBody = bySlug.get(slugifyName(label));
      return waterBody ? (
        <Link to={`/water-bodies/${waterBody.id}`}>{label}</Link>
      ) : (
        <span>{label}</span>
      );
    };
    return (
      <div className="connects">
        {renderSide(first)} ↔ {renderSide(second)}
      </div>
    );
  }

  return <div className="connects">{strait.connects}</div>;
}
