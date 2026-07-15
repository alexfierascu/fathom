import { Link } from 'react-router';

import type { Strait } from '@fathom/data';

import { formatLat, formatLon } from '../lib/format';

interface StraitCardProps {
  strait: Strait;
  onHover: (id: string | null) => void;
}

export function StraitCard({ strait, onHover }: StraitCardProps) {
  return (
    <Link
      to={`/straits/${strait.id}`}
      className="card"
      data-id={strait.id}
      onMouseEnter={() => {
        onHover(strait.id);
      }}
      onMouseLeave={() => {
        onHover(null);
      }}
    >
      <div className="eyebrow">{strait.region}</div>
      <h3>{strait.name}</h3>
      <div className="pills">
        {strait.countries.map((country) => (
          <span key={country} className="pill">
            {country}
          </span>
        ))}
      </div>
      <div className="connects">{strait.connects}</div>
      <div className="note">{strait.note}</div>
      <div className="coords">
        {formatLat(strait.lat)}, {formatLon(strait.lon)}
      </div>
    </Link>
  );
}
