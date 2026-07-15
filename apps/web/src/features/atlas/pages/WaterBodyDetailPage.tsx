import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import { entityId, getEntity, getRelated } from '@fathom/data';

import { EntityGallery } from '../../media/MediaGallery';
import type { LayoutContext } from '../../../app/RootLayout';
import { Breadcrumbs, type BreadcrumbItem } from '../components/Breadcrumbs';
import { EntityPills } from '../components/EntityPills';
import { Section } from '../components/Section';
import { SeoTags } from '../components/SeoTags';
import { SourcesList } from '../components/SourcesList';
import { StraitCard } from '../components/StraitCard';
import { StraitsMap } from '../components/StraitsMap';
import { findWaterBodyBySlug } from '../lib/navigation';
import { breadcrumbsJsonLd, buildWaterBodySeo, placeJsonLd } from '../lib/seo';

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
      canals: getRelated(node, 'canals'),
      islands: getRelated(node, 'islands'),
      ports: getRelated(node, 'ports'),
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

  const { parent, children, straits, straitDocs, countries, canals, islands, ports, sources } =
    related;

  const crumbs: BreadcrumbItem[] = [{ label: 'Home', to: '/' }];
  if (parent) crumbs.push({ label: parent.name, to: `/water-bodies/${parent.id}` });
  crumbs.push({ label: waterBody.name });

  const seo = buildWaterBodySeo(waterBody);

  return (
    <>
      <SeoTags
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={[
          placeJsonLd({ name: waterBody.name, description: seo.description, path: seo.path }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            ...(parent ? [{ name: parent.name, path: `/water-bodies/${parent.id}` }] : []),
            { name: waterBody.name, path: seo.path },
          ]),
        ]}
      />

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
          <Section label="Contains">
            <EntityPills entities={children} />
          </Section>
        )}

        {countries.length > 0 && (
          <Section label="Bordered by">
            <EntityPills entities={countries} />
          </Section>
        )}

        {canals.length > 0 && (
          <Section label="Canals">
            <EntityPills entities={canals} />
          </Section>
        )}

        {islands.length > 0 && (
          <Section label="Islands">
            <EntityPills entities={islands} />
          </Section>
        )}

        {ports.length > 0 && (
          <Section label="Ports">
            <EntityPills entities={ports} />
          </Section>
        )}

        <StraitsMap straits={straitDocs} tileStyle={tileStyle} />

        {straits.length > 0 && (
          <Section label="Straits of these waters">
            <div className="grid">
              {straits.map((strait) => (
                <StraitCard key={strait.id} strait={strait.data} />
              ))}
            </div>
          </Section>
        )}

        <EntityGallery entity={{ type: 'water-body', id: waterBody.id }} />

        <SourcesList sources={sources} />
      </article>
    </>
  );
}
