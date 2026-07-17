import { useEffect, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet.markercluster';

import { loadStatistics, type Strait } from '@fathom/data';
import {
  getMaritimeGraph,
  journeyCourse,
  loadJourneys,
  randomEntity,
  randomWalk,
} from '@fathom/discovery';

import { Link } from 'react-router';

import type { TileStyle } from '../../theme/themes';
import {
  WORLD_CENTER,
  WORLD_ZOOM,
  bindStraitMarker,
  createStraitMap,
  observeMapSize,
  parseViewParam,
  setupMapChrome,
  syncViewToUrl,
  type TileManager,
} from '../lib/map';

interface MapPanelProps {
  straits: readonly Strait[];
  /** Ids passing the active filters, or null when nothing is filtered. */
  filteredIds: ReadonlySet<string> | null;
  hoveredId: string | null;
  visibleCount: number;
  /** Draw the world's charted trade lanes and EIA-scaled chokepoints. */
  lanes?: boolean;
  /** Drift mode: the chart sails itself from place to place. */
  drift?: boolean;
  onDriftStop?: () => void;
  tileStyle: TileStyle;
}

export function MapPanel({
  straits,
  filteredIds,
  hoveredId,
  visibleCount,
  lanes = false,
  drift = false,
  onDriftStop,
  tileStyle,
}: MapPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<TileManager | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A shared ?view=lat,lon,zoom restores the exact chart position.
    const shared = parseViewParam(new URLSearchParams(window.location.search).get('view'));
    const map = createStraitMap(
      container,
      shared?.center ?? WORLD_CENTER,
      shared?.zoom ?? WORLD_ZOOM,
    );
    mapRef.current = map;
    tilesRef.current = setupMapChrome(map, panelRef.current);
    const stopSyncing = syncViewToUrl(map);

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 45,
      disableClusteringAtZoom: 7,
      showCoverageOnHover: false,
      iconCreateFunction: (group) =>
        L.divIcon({
          className: 'strait-cluster',
          html: `<span>${String(group.getChildCount())}</span>`,
          iconSize: [30, 30],
        }),
    });
    const markers = markersRef.current;
    for (const strait of straits) {
      markers.set(strait.id, bindStraitMarker(cluster, strait));
    }
    map.addLayer(cluster);

    const stopObserving = observeMapSize(map);

    return () => {
      stopSyncing();
      stopObserving();
      map.remove();
      mapRef.current = null;
      tilesRef.current = null;
      markers.clear();
    };
  }, [straits]);

  // No dependency array: runs after every commit, which both applies the
  // initial style right after the map-init effect and follows theme changes.
  useEffect(() => {
    tilesRef.current?.set(tileStyle);
  });

  // The world's flow, drawn: every charted journey course as a gold lane,
  // and the EIA-sourced chokepoints scaled by what passes through them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !lanes) return;
    const layer = L.layerGroup().addTo(map);
    for (const journey of loadJourneys()) {
      L.polyline(
        journeyCourse(journey).map((point) => [point.lat, point.lon] as L.LatLngTuple),
        { weight: 1.4, opacity: 0.45, color: '#e7b75f' },
      ).addTo(layer);
    }
    const graph = getMaritimeGraph();
    for (const stat of loadStatistics()) {
      if (stat.metric !== 'oil-transit') continue;
      const node = graph.nodes.get(`${stat.subject.type}:${stat.subject.id}`);
      if (node?.lat === undefined || node.lon === undefined) continue;
      L.circleMarker([node.lat, node.lon], {
        radius: 5 + stat.value / 2.2,
        color: '#e7b75f',
        weight: 1.5,
        fillColor: '#e7b75f',
        fillOpacity: 0.25,
      })
        .bindTooltip(`${node.name} — ${String(stat.value)} ${stat.unit} (EIA, ${stat.period})`, {
          className: 'strait-tip',
          direction: 'top',
        })
        .addTo(layer);
    }
    return () => {
      layer.remove();
    };
  }, [lanes, straits]);

  // Drift mode: sail to a new charted place every few seconds.
  const [driftNode, setDriftNode] = useState<{ id: string; name: string; path: string } | null>(
    null,
  );
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drift) {
      setDriftNode(null);
      return;
    }
    const graph = getMaritimeGraph();
    let currentId = randomEntity({ types: ['strait'] }, graph)?.entityId ?? null;
    const sail = () => {
      if (!currentId) return;
      let next = null;
      let cursor = currentId;
      for (let attempt = 0; attempt < 8 && !next; attempt += 1) {
        const step = randomWalk(cursor, 1, undefined, graph)[0];
        if (!step) break;
        cursor = step.entityId;
        if (step.lat !== undefined && step.lon !== undefined) next = step;
      }
      next ??= randomEntity({ types: ['strait'], excludeId: currentId }, graph);
      if (next?.lat === undefined || next.lon === undefined) return;
      currentId = next.entityId;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) map.setView([next.lat, next.lon], 5);
      else map.flyTo([next.lat, next.lon], 5, { duration: 2.4 });
      setDriftNode({
        id: next.entityId,
        name: next.name,
        path: `/${next.type === 'strait' ? 'straits' : 'water-bodies'}/${next.id}`,
      });
    };
    sail();
    const timer = window.setInterval(sail, 4600);
    return () => {
      window.clearInterval(timer);
    };
  }, [drift]);

  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const element = marker.getElement();
      if (!element) continue;
      element.classList.remove('is-match', 'is-dim');
      if (filteredIds) {
        element.classList.add(filteredIds.has(id) ? 'is-match' : 'is-dim');
      }
    }
  }, [filteredIds]);

  useEffect(() => {
    if (!hoveredId) return;
    const element = markersRef.current.get(hoveredId)?.getElement();
    if (!element) return;
    element.classList.add('is-hover');
    return () => {
      element.classList.remove('is-hover');
    };
  }, [hoveredId]);

  return (
    <div className="map-panel" ref={panelRef}>
      <div className="cap">
        <span>WORLD MAP</span>
        <div className="cap-right">
          <span id="chartCount">{visibleCount} ON MAP</span>
          <button
            id="resetView"
            type="button"
            onClick={() => {
              mapRef.current?.flyTo(WORLD_CENTER, WORLD_ZOOM, { duration: 0.8 });
            }}
          >
            Reset view
          </button>
        </div>
      </div>
      <div id="map" ref={containerRef} />
      {drift && driftNode && (
        <div className="drift-chip">
          <span className="geo-label">Adrift</span>
          <Link viewTransition to={driftNode.path}>
            {driftNode.name}
          </Link>
          <button
            type="button"
            onClick={() => {
              onDriftStop?.();
            }}
          >
            Drop anchor
          </button>
        </div>
      )}
    </div>
  );
}
