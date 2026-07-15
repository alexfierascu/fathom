import { Link, useOutletContext, useParams } from 'react-router';

import { getRelated, getStraitEntity } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ConnectsLine } from '../components/ConnectsLine';
import { StraitMap } from '../components/StraitMap';
import { StraitPager } from '../components/StraitPager';
import { formatLat, formatLon } from '../lib/format';
import { findStraitBySlug, getAdjacentStraits } from '../lib/navigation';
import { buildStraitSeo } from '../lib/seo';

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
  const entity = getStraitEntity(strait);
  const region = getRelated(entity, 'region');
  const countries = getRelated(entity, 'countries');
  const regionName = region?.name ?? strait.region;
  const seo = buildStraitSeo(strait);
  const canonical = new URL(seo.path, window.location.origin).href;

  return (
    <>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="Fathom" />

      <Breadcrumbs
        items={[{ label: 'Home', to: '/' }, { label: regionName }, { label: strait.name }]}
      />

      <article className="detail">
        <div className="eyebrow">{regionName}</div>
        <h2 className="detail-title">{strait.name}</h2>
        <div className="pills">
          {countries.map((country) => (
            <Link key={country.id} className="pill" to={`/countries/${country.id}`}>
              {country.name}
            </Link>
          ))}
        </div>
        <ConnectsLine strait={strait} />
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
