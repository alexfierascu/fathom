import { useEffect, useRef } from 'react';

import L from 'leaflet';

import type { Journey } from '@fathom/discovery';
import { locatedStops } from '@fathom/discovery';

import type { TileStyle } from '../theme/themes';
import {
  createStraitMap,
  observeMapSize,
  setupMapChrome,
  type TileManager,
} from '../atlas/lib/map';

interface JourneyMapProps {
  journey: Journey;
  /** Index into journey.waypoints of the current stop. */
  currentStop: number;
  tileStyle: TileStyle;
}

/**
 * The voyage chart: numbered markers for every locatable stop, a dashed
 * course line through them in order, and an animated fly-to whenever the
 * traveller moves to a stop that has coordinates.
 */
export function JourneyMap({ journey, currentStop, tileStyle }: JourneyMapProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<TileManager | null>(null);
  const markersRef = useRef(new Map<number, L.Marker>());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const stops = locatedStops(journey);
    const map = createStraitMap(container, [20, 10], 2);
    mapRef.current = map;
    tilesRef.current = setupMapChrome(map, panelRef.current);

    const markers = markersRef.current;
    const line = L.polyline(
      stops.map((stop) => [stop.lat, stop.lon] as L.LatLngTuple),
      { weight: 2, dashArray: '6 4', opacity: 0.7 },
    ).addTo(map);

    for (const stop of stops) {
      const stopIndex = journey.waypoints.indexOf(stop.waypoint);
      const marker = L.marker([stop.lat, stop.lon], {
        icon: L.divIcon({
          className: 'journey-pin',
          html: `<span>${String(stopIndex + 1)}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      }).addTo(map);
      marker.bindTooltip(stop.node.name, {
        direction: 'top',
        offset: [0, -14],
        className: 'strait-tip',
      });
      markers.set(stopIndex, marker);
    }

    if (stops.length > 0) {
      map.fitBounds(line.getBounds(), { padding: [40, 40], maxZoom: 5 });
    }
    const stopObserving = observeMapSize(map);

    return () => {
      stopObserving();
      map.remove();
      mapRef.current = null;
      tilesRef.current = null;
      markers.clear();
    };
  }, [journey]);

  // No dependency array: applies the initial style right after map init
  // and follows theme changes afterwards (the app's map convention).
  useEffect(() => {
    tilesRef.current?.set(tileStyle);
  });

  // Animate to the current stop and highlight its pin.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [index, marker] of markersRef.current) {
      marker.getElement()?.classList.toggle('is-current', index === currentStop);
    }
    const marker = markersRef.current.get(currentStop);
    if (marker) {
      map.flyTo(marker.getLatLng(), 6, { duration: 1.1 });
    }
  }, [currentStop, journey]);

  return (
    <div className="map-panel journey-map" ref={panelRef}>
      <div className="cap">
        <span>THE COURSE</span>
        <div className="cap-right">
          <span>
            {String(locatedStops(journey).length)} of {String(journey.waypoints.length)} stops
            charted
          </span>
        </div>
      </div>
      <div id="map" ref={containerRef} />
    </div>
  );
}
