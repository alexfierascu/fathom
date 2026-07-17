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
  shortestPath,
} from '@fathom/discovery';

import { Link, useNavigate } from 'react-router';

import { formatDistance } from '../lib/units';

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
  /** Clickable sea-name labels for anchored waters. */
  seaLabels?: boolean;
  /** Course plotter: click two straits, see the water route between them. */
  plot?: boolean;
  /** GEBCO bathymetry as the opening base layer. */
  base?: 'chart' | 'bathymetry';
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
  seaLabels = false,
  plot = false,
  base = 'chart',
  tileStyle,
}: MapPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<TileManager | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());

  // Course plotter: two picked straits, one water route between them.
  const plotRef = useRef(plot);
  const [plotPicks, setPlotPicks] = useState<string[]>([]);
  const [plotResult, setPlotResult] = useState<{ label: string } | null>(null);
  const plotLayerRef = useRef<L.LayerGroup | null>(null);
  // Render-time adjustment: leaving plot mode clears the picks.
  const [plotAdopted, setPlotAdopted] = useState(plot);
  if (plotAdopted !== plot) {
    setPlotAdopted(plot);
    if (!plot) {
      setPlotPicks([]);
      setPlotResult(null);
    }
  }
  useEffect(() => {
    plotRef.current = plot;
    if (!plot) {
      plotLayerRef.current?.remove();
      plotLayerRef.current = null;
    }
  }, [plot]);
  const pickForPlot = (straitId: string) => {
    setPlotPicks((picks) => {
      const next = picks.includes(straitId) ? picks : [...picks, straitId].slice(-2);
      if (next.length === 2 && next[0] && next[1]) {
        const map = mapRef.current;
        const graph = getMaritimeGraph();
        const path = shortestPath(graph, `strait:${next[0]}`, `strait:${next[1]}`, {
          kinds: ['connected_to', 'adjacent_to', 'flows_into', 'contains'],
        });
        plotLayerRef.current?.remove();
        if (map && path) {
          const points = path
            .map((id) => graph.nodes.get(id))
            .filter(
              (node): node is NonNullable<typeof node> & { lat: number; lon: number } =>
                node?.lat !== undefined && node.lon !== undefined,
            );
          const layer = L.layerGroup().addTo(map);
          L.polyline(
            points.map((point) => [point.lat, point.lon] as L.LatLngTuple),
            { weight: 2, dashArray: '5 5', color: '#2faea0' },
          ).addTo(layer);
          plotLayerRef.current = layer;
          let km = 0;
          for (let i = 1; i < points.length; i += 1) {
            const a = points[i - 1];
            const b = points[i];
            if (a && b) km += map.distance([a.lat, a.lon], [b.lat, b.lon]) / 1000;
          }
          const fromName = graph.nodes.get(`strait:${next[0]}`)?.name ?? next[0];
          const toName = graph.nodes.get(`strait:${next[1]}`)?.name ?? next[1];
          setPlotResult({
            label: `${fromName} → ${toName} · ~${formatDistance(km)} via charted waters (estimate)`,
          });
        } else {
          setPlotResult({ label: 'No charted water route between those two.' });
        }
      } else {
        setPlotResult(null);
        plotLayerRef.current?.remove();
        plotLayerRef.current = null;
      }
      return next;
    });
  };

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
    tilesRef.current = setupMapChrome(map, panelRef.current, 'dark', { base });
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
      const marker = bindStraitMarker(cluster, strait);
      marker.on('click', () => {
        if (!plotRef.current) return;
        marker.closePopup();
        pickForPlot(strait.id);
      });
      markers.set(strait.id, marker);
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

  // Sea-name labels for anchored waters — click one to open its page.
  const navigate = useNavigate();
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !seaLabels) return;
    const graph = getMaritimeGraph();
    const layer = L.layerGroup().addTo(map);
    for (const node of graph.nodes.values()) {
      if (node.type !== 'water-body' || node.lat === undefined || node.lon === undefined) continue;
      if (node.anchorDerived) continue;
      const marker = L.marker([node.lat, node.lon], {
        icon: L.divIcon({ className: 'sea-label', html: `<span>${node.name}</span>` }),
        zIndexOffset: -100,
      }).addTo(layer);
      marker.on('click', () => {
        void navigate(`/water-bodies/${node.id}`);
      });
    }
    return () => {
      layer.remove();
    };
  }, [seaLabels, navigate, straits]);

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
      {plot && (
        <div className="drift-chip plot-chip">
          <span className="geo-label">Plot a course</span>
          <span className="plot-status">
            {plotResult
              ? plotResult.label
              : plotPicks.length === 1
                ? 'Now click the second strait'
                : 'Click two straits on the chart'}
          </span>
          {plotPicks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setPlotPicks([]);
                setPlotResult(null);
                plotLayerRef.current?.remove();
                plotLayerRef.current = null;
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
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
