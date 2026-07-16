import { useEffect, useRef } from 'react';

import L from 'leaflet';
import 'leaflet.markercluster';

import type { Strait } from '@fathom/data';

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
  tileStyle: TileStyle;
}

export function MapPanel({
  straits,
  filteredIds,
  hoveredId,
  visibleCount,
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
    </div>
  );
}
