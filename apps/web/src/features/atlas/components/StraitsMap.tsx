import { useEffect, useRef } from 'react';

import L from 'leaflet';

import type { Strait } from '@fathom/data';

import type { TileStyle } from '../../theme/themes';
import {
  WORLD_CENTER,
  WORLD_ZOOM,
  bindStraitMarker,
  createStraitMap,
  observeMapSize,
  setupMapChrome,
  type TileManager,
} from '../lib/map';

interface StraitsMapProps {
  /**
   * The straits shown as markers. Pass a memoized array — the map is
   * recreated when the array identity changes.
   */
  straits: readonly Strait[];
  tileStyle: TileStyle;
}

/** Interactive map fitted to a set of strait markers. */
export function StraitsMap({ straits, tileStyle }: StraitsMapProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<TileManager | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = createStraitMap(container, WORLD_CENTER, WORLD_ZOOM);
    tilesRef.current = setupMapChrome(map, panelRef.current);
    for (const strait of straits) {
      bindStraitMarker(map, strait);
    }
    if (straits.length > 0) {
      const bounds = L.latLngBounds(straits.map((s) => [s.lat, s.lon] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
    }
    const stopObserving = observeMapSize(map);

    return () => {
      stopObserving();
      map.remove();
      tilesRef.current = null;
    };
  }, [straits]);

  // No dependency array: applies the initial style right after map init and
  // follows theme changes afterwards.
  useEffect(() => {
    tilesRef.current?.set(tileStyle);
  });

  return (
    <div className="map-panel" ref={panelRef}>
      <div className="cap">
        <span>LOCATION</span>
        <div className="cap-right">
          <span>{straits.length} ON MAP</span>
        </div>
      </div>
      <div id="map" ref={containerRef} />
    </div>
  );
}
