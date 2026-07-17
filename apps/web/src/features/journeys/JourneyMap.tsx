import { useEffect, useRef } from 'react';

import L from 'leaflet';

import type { Journey } from '@fathom/discovery';
import { journeyCourse } from '@fathom/discovery';

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
  /** Journey Mode is on — follow the traveller; otherwise show the course. */
  travelling: boolean;
  /** Clicking a stop pin jumps the voyage there. */
  onSelectStop?: (index: number) => void;
  tileStyle: TileStyle;
}

/**
 * The voyage chart: numbered markers for every locatable stop, a dashed
 * course line that follows sea lanes through the authored via points,
 * and an animated fly-to whenever the traveller moves.
 */
export function JourneyMap({
  journey,
  currentStop,
  travelling,
  onSelectStop,
  tileStyle,
}: JourneyMapProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<TileManager | null>(null);
  const markersRef = useRef(new Map<number, L.Marker>());
  const onSelectStopRef = useRef(onSelectStop);
  useEffect(() => {
    onSelectStopRef.current = onSelectStop;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const course = journeyCourse(journey);
    const map = createStraitMap(container, [20, 10], 2);
    mapRef.current = map;
    tilesRef.current = setupMapChrome(map, panelRef.current);

    const markers = markersRef.current;
    const line = L.polyline(
      course.map((point) => [point.lat, point.lon] as L.LatLngTuple),
      { weight: 2, dashArray: '6 4', opacity: 0.7 },
    ).addTo(map);

    for (const point of course) {
      if (point.stopIndex === undefined) continue;
      const marker = L.marker([point.lat, point.lon], {
        icon: L.divIcon({
          className: 'journey-pin',
          html: `<span>${String(point.stopIndex + 1)}</span>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
      }).addTo(map);
      if (point.name) {
        marker.bindTooltip(point.name, {
          direction: 'top',
          offset: [0, -14],
          className: 'strait-tip',
        });
      }
      const stopIndex = point.stopIndex;
      marker.on('click', () => {
        onSelectStopRef.current?.(stopIndex);
      });
      markers.set(point.stopIndex, marker);
    }

    if (course.length > 0) {
      map.fitBounds(line.getBounds(), { padding: [40, 40], maxZoom: 5 });
    }
    map.attributionControl.addAttribution(
      'Sea routes: <a href="https://github.com/genthalili/searoute-py">searoute</a> · MARNET',
    );
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

  // While travelling, follow the traveller and highlight their pin;
  // before departure the chart shows the whole course. The stop card's
  // height changes with its content, so re-measure before flying.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.invalidateSize();
    const settle = window.setTimeout(() => map.invalidateSize(), 320);
    for (const [index, marker] of markersRef.current) {
      const element = marker.getElement();
      if (!element) continue;
      element.classList.toggle('is-current', travelling && index === currentStop);
      element.classList.toggle('is-done', travelling && index < currentStop);
      element.classList.toggle('is-next', travelling && index === currentStop + 1);
    }
    if (!travelling) {
      return () => {
        window.clearTimeout(settle);
      };
    }
    const marker = markersRef.current.get(currentStop);
    if (marker) {
      map.flyTo(marker.getLatLng(), 6, { duration: 1.1 });
    }
    return () => {
      window.clearTimeout(settle);
    };
  }, [currentStop, travelling, journey]);

  const chartedStops = journeyCourse(journey).filter(
    (point) => point.stopIndex !== undefined,
  ).length;

  return (
    <div className="map-panel journey-map" ref={panelRef}>
      <div className="cap">
        <span>THE COURSE</span>
        <div className="cap-right">
          <span>
            {String(chartedStops)} of {String(journey.waypoints.length)} stops charted
          </span>
        </div>
      </div>
      <div id="map" ref={containerRef} />
    </div>
  );
}
