import { useEffect, useRef } from 'react';

import L from 'leaflet';

import type { Strait, WaterBody } from '@fathom/data';

import type { TileStyle } from '../../theme/themes';
import {
  WORLD_CENTER,
  WORLD_ZOOM,
  bindStraitMarker,
  createStraitMap,
  createTileManager,
  observeMapSize,
  type TileManager,
} from '../lib/map';

interface WaterBodyMapProps {
  waterBody: WaterBody;
  /** The straits connecting this water body, shown as markers. */
  straits: readonly Strait[];
  tileStyle: TileStyle;
}

/** Interactive map fitted to a water body's connecting straits. */
export function WaterBodyMap({ waterBody, straits, tileStyle }: WaterBodyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<TileManager | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = createStraitMap(container, WORLD_CENTER, WORLD_ZOOM);
    tilesRef.current = createTileManager(map);
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
  }, [waterBody, straits]);

  // No dependency array: applies the initial style right after map init and
  // follows theme changes afterwards.
  useEffect(() => {
    tilesRef.current?.set(tileStyle);
  });

  return (
    <div className="map-panel">
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
