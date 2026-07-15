import { Link, useOutletContext, useParams } from 'react-router';

import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { StraitMap } from '../components/StraitMap';
import { StraitPager } from '../components/StraitPager';
import { formatLat, formatLon } from '../lib/format';
import { findStraitBySlug, getAdjacentStraits } from '../lib/navigation';

export function StraitDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const strait = findStraitBySlug(slug);

  if (!strait) {
    return (
      <div className="empty">
        No strait charted at this address. <Link to="/">Return to the chart.</Link>
      </div>
    );
  }

  const { previous, next } = getAdjacentStraits(strait.id);

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Home', to: '/' }, { label: strait.region }, { label: strait.name }]}
      />

      <article className="detail">
        <div className="eyebrow">{strait.region}</div>
        <h2 className="detail-title">{strait.name}</h2>
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

        <StraitMap strait={strait} tileStyle={tileStyle} />

        <StraitPager previous={previous} next={next} />
      </article>
    </>
  );
}
