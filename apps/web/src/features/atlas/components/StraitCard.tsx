import { memo } from 'react';

import { Link } from 'react-router';

import { getRelated, getStraitEntity, type Strait } from '@fathom/data';

import { prefetchEntityPage } from '../../../app/prefetch';
import { formatLat, formatLon } from '../lib/format';

interface StraitCardProps {
  strait: Strait;
  onHover?: (id: string | null) => void;
}

export const StraitCard = memo(function StraitCard({ strait, onHover }: StraitCardProps) {
  const entity = getStraitEntity(strait);
  const region = getRelated(entity, 'region');
  const countries = getRelated(entity, 'countries');

  return (
    <Link
      to={`/straits/${strait.id}`}
      className="card"
      data-id={strait.id}
      onMouseEnter={() => {
        onHover?.(strait.id);
        prefetchEntityPage('strait');
      }}
      onMouseLeave={() => {
        onHover?.(null);
      }}
    >
      <div className="eyebrow">{region?.name ?? strait.region}</div>
      <h3>{strait.name}</h3>
      <div className="pills">
        {countries.map((country) => (
          <span key={country.id} className="pill">
            {country.name}
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
});
