import { Link, useOutletContext, useParams } from 'react-router';

import { getRelated, getStraitEntity } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ConnectsLine } from '../components/ConnectsLine';
import { EntityPills } from '../components/EntityPills';
import { SeoTags } from '../components/SeoTags';
import { StraitMap } from '../components/StraitMap';
import { StraitPager } from '../components/StraitPager';
import { formatLat, formatLon } from '../lib/format';
import { findStraitBySlug, getAdjacentStraits } from '../lib/navigation';
import { breadcrumbsJsonLd, buildStraitSeo, placeJsonLd } from '../lib/seo';

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

  return (
    <>
      <SeoTags
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={[
          placeJsonLd({
            name: strait.name,
            description: seo.description,
            path: seo.path,
            lat: strait.lat,
            lon: strait.lon,
          }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            ...(region ? [{ name: region.name, path: `/regions/${region.id}` }] : []),
            { name: strait.name, path: seo.path },
          ]),
        ]}
      />

      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          region ? { label: region.name, to: `/regions/${region.id}` } : { label: regionName },
          { label: strait.name },
        ]}
      />

      <article className="detail">
        <div className="eyebrow">{regionName}</div>
        <h2 className="detail-title">{strait.name}</h2>
        <EntityPills entities={countries} />
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
