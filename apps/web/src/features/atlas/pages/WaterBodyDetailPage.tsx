import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { getEntity, getRelated, entityId } from '@fathom/data';

import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs';
import { StraitCard } from '../components/StraitCard';
import { StraitsMap } from '../components/StraitsMap';
import { findWaterBodyBySlug } from '../lib/navigation';
import { buildWaterBodySeo } from '../lib/seo';

const TYPE_LABELS: Record<string, string> = {
  ocean: 'Ocean',
  sea: 'Sea',
  channel: 'Channel',
  strait: 'Strait',
  gulf: 'Gulf',
  bay: 'Bay',
};

export function WaterBodyDetailPage() {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();
  const waterBody = findWaterBodyBySlug(slug);

  const related = useMemo(() => {
    if (!waterBody) return null;
    const node = getEntity(entityId('water-body', waterBody.id));
    if (node?.type !== 'water-body') return null;
    const straits = getRelated(node, 'straits');
    return {
      parent: getRelated(node, 'parent'),
      children: getRelated(node, 'children'),
      straits,
      straitDocs: straits.map((strait) => strait.data),
      countries: getRelated(node, 'countries'),
      sources: getRelated(node, 'sources'),
    };
  }, [waterBody]);

  if (!waterBody || !related) {
    return (
      <div className="empty">
        No waters charted at this address. <Link to="/">Return to the chart.</Link>
      </div>
    );
  }

  const { parent, children, straits, straitDocs, countries, sources } = related;

  const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }];
  if (parent) crumbs.push({ label: parent.name, to: `/water-bodies/${parent.id}` });
  crumbs.push({ label: waterBody.name });

  const seo = buildWaterBodySeo(waterBody);
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

      <Breadcrumbs items={crumbs} />

      <article className="detail">
        <div className="eyebrow">{TYPE_LABELS[waterBody.type] ?? waterBody.type}</div>
        <h2 className="detail-title">{waterBody.name}</h2>
        <div className="note">{waterBody.summary}</div>

        {parent && (
          <div className="connects">
            Part of <Link to={`/water-bodies/${parent.id}`}>{parent.name}</Link>
          </div>
        )}

        {children.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Contains</div>
            <div className="pills">
              {children.map((child) => (
                <Link key={child.id} className="pill" to={`/water-bodies/${child.id}`}>
                  {child.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {countries.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Bordered by</div>
            <div className="pills">
              {countries.map((country) => (
                <Link key={country.id} className="pill" to={`/countries/${country.id}`}>
                  {country.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <StraitsMap straits={straitDocs} tileStyle={tileStyle} />

        {straits.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Straits of these waters</div>
            <div className="grid">
              {straits.map((strait) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          </section>
        )}

        {sources.length > 0 && (
          <section className="detail-section">
            <div className="eyebrow">Sources</div>
            <ul className="sources">
              {sources.map((source) => (
                <li key={source.id}>
                  {source.data.title} — {source.data.publisher}
                  {source.data.publishedOn ? ` (${source.data.publishedOn})` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  );
}
