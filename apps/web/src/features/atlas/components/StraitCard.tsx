import type { Strait } from '@fathom/data';

import { formatLat, formatLon } from '../lib/format';

interface StraitCardProps {
  strait: Strait;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export function StraitCard({ strait, onSelect, onHover }: StraitCardProps) {
  return (
    <div
      className="card"
      data-id={strait.id}
      tabIndex={0}
      role="button"
      aria-label={`Fly to ${strait.name} on the map`}
      onMouseEnter={() => {
        onHover(strait.id);
      }}
      onMouseLeave={() => {
        onHover(null);
      }}
      onClick={() => {
        onSelect(strait.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(strait.id);
        }
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
    </div>
  );
}
