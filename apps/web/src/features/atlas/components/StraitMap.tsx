import { useEffect, useRef } from 'react';

import type { Strait } from '@fathom/data';

import type { TileStyle } from '../../theme/themes';
import { formatLat, formatLon } from '../lib/format';
import {
  STRAIT_ZOOM,
  bindStraitMarker,
  createStraitMap,
  createTileManager,
  observeMapSize,
  type TileManager,
} from '../lib/map';

interface StraitMapProps {
  strait: Strait;
  tileStyle: TileStyle;
}

/** Interactive map centered on a single strait, for the detail page. */
export function StraitMap({ strait, tileStyle }: StraitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tilesRef = useRef<TileManager | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = createStraitMap(container, [strait.lat, strait.lon], STRAIT_ZOOM);
    tilesRef.current = createTileManager(map);
    bindStraitMarker(map, strait);
    const stopObserving = observeMapSize(map);

    return () => {
      stopObserving();
      map.remove();
      tilesRef.current = null;
    };
  }, [strait]);

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
          <span>
            {formatLat(strait.lat)}, {formatLon(strait.lon)}
          </span>
        </div>
      </div>
      <div id="map" ref={containerRef} />
    </div>
  );
}
