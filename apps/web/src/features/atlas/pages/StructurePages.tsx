import { useMemo } from 'react';

import { Link, useOutletContext, useParams } from 'react-router';

import {
  entityId,
  getEntity,
  getRelated,
  type EntityNode,
  type NodeType,
  type Strait,
} from '@fathom/data';

import { ContinueExploring } from '../../explore/ContinueExploring';
import { EntityGallery } from '../../media/MediaGallery';
import type { LayoutContext } from '../../../app/RootLayout';
import { EditorialSection } from '../components/EditorialSection';
import { EntityPills } from '../components/EntityPills';
import { InteractiveSection } from '../components/InteractiveSection';
import { PageHero } from '../components/PageHero';
import { SeoTags } from '../components/SeoTags';
import { SourcesList } from '../components/SourcesList';
import { StraitsMap } from '../components/StraitsMap';
import { entityPath } from '../lib/entityPaths';
import { breadcrumbsJsonLd, placeJsonLd } from '../lib/seo';

/**
 * Detail pages for the maritime structure entities. They share one shell:
 * eyebrow, name, summary, entity-specific sections, a map fitted to the
 * straits related to the entity, and references.
 */

interface StructurePageProps {
  type: NodeType;
  eyebrow: string;
  emptyLabel: string;
  /** Facts tiles derived from the document. */
  facts?: (node: EntityNode) => readonly { label: string; value: string }[];
  /** Labeled pill sections derived from relationships. */
  pillSections: (node: EntityNode) => readonly { label: string; entities: readonly EntityNode[] }[];
  /** Straits to fit the map to. */
  mapStraits: (node: EntityNode) => readonly Strait[];
  sources: (node: EntityNode) => readonly EntityNode<'source'>[];
}

function StructurePage({
  type,
  eyebrow,
  emptyLabel,
  facts,
  pillSections,
  mapStraits,
  sources,
}: StructurePageProps) {
  const { slug } = useParams();
  const { tileStyle } = useOutletContext<LayoutContext>();

  const resolved = useMemo(() => {
    if (!slug) return null;
    const node = getEntity(entityId(type, slug));
    if (node?.type !== type) return null;
    return {
      node,
      facts: facts?.(node) ?? [],
      pillSections: pillSections(node).filter((section) => section.entities.length > 0),
      mapStraits: mapStraits(node),
      sources: sources(node),
    };
  }, [slug, type, facts, pillSections, mapStraits, sources]);

  if (!resolved) {
    return (
      <div className="empty">
        No {emptyLabel} charted at this address.{' '}
        <Link viewTransition to="/">
          Return to the chart.
        </Link>
      </div>
    );
  }

  const { node, facts: factList, pillSections: sections, mapStraits: straits } = resolved;
  const summary =
    'summary' in node.data && typeof node.data.summary === 'string' ? node.data.summary : '';
  const path = entityPath(node) ?? '/';
  const title = `${node.name} — Fathom`;
  const hasMap = straits.length > 0;

  const factsBlock =
    factList.length > 0 ? (
      <div>
        <div className="geo-label">At a glance</div>
        <div className="facts facts--line">
          {factList.map((fact) => (
            <div key={fact.label} className="fact">
              <div className="fact-label">{fact.label}</div>
              <div className="fact-value fact-value--small">{fact.value}</div>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  return (
    <>
      <SeoTags
        title={title}
        description={`${node.name}: ${summary}`}
        path={path}
        jsonLd={[
          placeJsonLd({ name: node.name, description: summary, path }),
          breadcrumbsJsonLd([
            { name: 'Home', path: '/' },
            { name: node.name, path },
          ]),
        ]}
      />

      <article>
        <PageHero
          eyebrow={eyebrow}
          title={node.name}
          subtitle={summary}
          actions={
            hasMap ? (
              <a className="uc-btn uc-btn--primary" href="#chart">
                See it on the chart
              </a>
            ) : undefined
          }
        />

        {hasMap && (
          <InteractiveSection
            eyebrow="The chart"
            title={`${node.name} on the water`}
            id="chart"
            aside={factsBlock ?? undefined}
          >
            <StraitsMap straits={straits} tileStyle={tileStyle} />
          </InteractiveSection>
        )}

        {!hasMap && factsBlock && <EditorialSection wide>{factsBlock}</EditorialSection>}

        {sections.length > 0 && (
          <EditorialSection eyebrow="Connections" title={`Around ${node.name}`} wide>
            <div className="geo-groups">
              {sections.map((section) => (
                <div key={section.label}>
                  <div className="geo-label">{section.label}</div>
                  <EntityPills entities={section.entities} />
                </div>
              ))}
            </div>
          </EditorialSection>
        )}

        <div className="strait-onward">
          <EntityGallery entity={{ type: node.type, id: node.id }} />
          <SourcesList sources={resolved.sources} />
          <ContinueExploring entityId={node.entityId} entityName={node.name} />
        </div>
      </article>
    </>
  );
}

const straitDocsOf = (nodes: readonly EntityNode[]): readonly Strait[] =>
  nodes.flatMap((node) => (node.type === 'strait' ? [node.data] : []));

const asNode = <T extends NodeType>(node: EntityNode, type: T): EntityNode<T> => {
  if (node.type !== type) throw new Error(`Expected ${type} node`);
  return node as EntityNode<T>;
};

export function PortDetailPage() {
  return (
    <StructurePage
      type="port"
      eyebrow="Port"
      emptyLabel="port"
      pillSections={(node) => {
        const port = asNode(node, 'port');
        const country = getRelated(port, 'country');
        const opensOnto = getRelated(port, 'opensOnto');
        const nearbyStraits =
          opensOnto?.type === 'water-body' ? getRelated(opensOnto, 'straits') : [];
        return [
          { label: 'Country', entities: country ? [country] : [] },
          { label: 'Opens onto', entities: opensOnto ? [opensOnto] : [] },
          { label: 'Straits of these waters', entities: nearbyStraits },
        ];
      }}
      mapStraits={(node) => {
        const opensOnto = getRelated(asNode(node, 'port'), 'opensOnto');
        if (!opensOnto) return [];
        if (opensOnto.type === 'strait') return [opensOnto.data];
        if (opensOnto.type === 'water-body')
          return getRelated(opensOnto, 'straits').map((strait) => strait.data);
        return [];
      }}
      sources={(node) => getRelated(asNode(node, 'port'), 'sources')}
    />
  );
}

export function CanalDetailPage() {
  return (
    <StructurePage
      type="canal"
      eyebrow="Canal"
      emptyLabel="canal"
      facts={(node) => {
        const canal = asNode(node, 'canal');
        return [
          { label: 'Status', value: canal.data.operationalStatus },
          { label: 'Opened', value: canal.data.opened ?? '—' },
        ];
      }}
      pillSections={(node) => {
        const canal = asNode(node, 'canal');
        return [
          { label: 'Links', entities: getRelated(canal, 'waterBodies') },
          { label: 'Countries', entities: getRelated(canal, 'countries') },
        ];
      }}
      mapStraits={() => []}
      sources={(node) => getRelated(asNode(node, 'canal'), 'sources')}
    />
  );
}

export function BridgeDetailPage() {
  return (
    <StructurePage
      type="bridge"
      eyebrow="Bridge"
      emptyLabel="bridge"
      facts={(node) => {
        const bridge = asNode(node, 'bridge');
        return [
          { label: 'Status', value: bridge.data.operationalStatus },
          { label: 'Opened', value: bridge.data.opened ?? '—' },
        ];
      }}
      pillSections={(node) => {
        const bridge = asNode(node, 'bridge');
        const crosses = getRelated(bridge, 'crosses');
        return [
          { label: 'Crosses', entities: crosses ? [crosses] : [] },
          { label: 'Connects', entities: getRelated(bridge, 'connects') },
        ];
      }}
      mapStraits={(node) => {
        const crosses = getRelated(asNode(node, 'bridge'), 'crosses');
        return crosses ? straitDocsOf([crosses]) : [];
      }}
      sources={(node) => getRelated(asNode(node, 'bridge'), 'sources')}
    />
  );
}

export function TunnelDetailPage() {
  return (
    <StructurePage
      type="tunnel"
      eyebrow="Tunnel"
      emptyLabel="tunnel"
      facts={(node) => {
        const tunnel = asNode(node, 'tunnel');
        return [
          { label: 'Status', value: tunnel.data.operationalStatus },
          { label: 'Mode', value: tunnel.data.mode ?? '—' },
          { label: 'Opened', value: tunnel.data.opened ?? '—' },
        ];
      }}
      pillSections={(node) => {
        const tunnel = asNode(node, 'tunnel');
        const crosses = getRelated(tunnel, 'crosses');
        return [
          { label: 'Passes under', entities: crosses ? [crosses] : [] },
          { label: 'Connects', entities: getRelated(tunnel, 'connects') },
        ];
      }}
      mapStraits={(node) => {
        const crosses = getRelated(asNode(node, 'tunnel'), 'crosses');
        return crosses ? straitDocsOf([crosses]) : [];
      }}
      sources={(node) => getRelated(asNode(node, 'tunnel'), 'sources')}
    />
  );
}

export function IslandDetailPage() {
  return (
    <StructurePage
      type="island"
      eyebrow="Island"
      emptyLabel="island"
      pillSections={(node) => {
        const island = asNode(node, 'island');
        const waterBody = getRelated(island, 'waterBody');
        const country = getRelated(island, 'country');
        return [
          { label: 'Waters', entities: waterBody ? [waterBody] : [] },
          { label: 'Country', entities: country ? [country] : [] },
          { label: 'Flanks', entities: getRelated(island, 'straits') },
        ];
      }}
      mapStraits={(node) => getRelated(asNode(node, 'island'), 'straits').map((s) => s.data)}
      sources={(node) => getRelated(asNode(node, 'island'), 'sources')}
    />
  );
}

export function MaritimeRouteDetailPage() {
  return (
    <StructurePage
      type="maritime-route"
      eyebrow="Maritime route"
      emptyLabel="route"
      facts={(node) => {
        const route = asNode(node, 'maritime-route');
        return [
          { label: 'Type', value: route.data.routeType.replace('-', ' ') },
          { label: 'Waypoints', value: String(route.data.waypoints.length) },
        ];
      }}
      pillSections={(node) => {
        const route = asNode(node, 'maritime-route');
        return [{ label: 'Waypoints, in order', entities: getRelated(route, 'waypoints') }];
      }}
      mapStraits={(node) => straitDocsOf(getRelated(asNode(node, 'maritime-route'), 'waypoints'))}
      sources={(node) => getRelated(asNode(node, 'maritime-route'), 'sources')}
    />
  );
}
