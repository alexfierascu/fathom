import { useEffect, useRef } from 'react';

import L from 'leaflet';

import type { Journey } from '@fathom/discovery';
import { resolveWaypoint } from '@fathom/discovery';

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
  tileStyle: TileStyle;
}

interface CoursePoint {
  lat: number;
  lon: number;
  /** Present when the point is a numbered stop, not a sea-lane bend. */
  stopIndex?: number;
  name?: string;
}

/**
 * The drawn course: every stop with coordinates plus each leg's authored
 * sea-lane via points, longitudes unwrapped so a voyage crossing the
 * antimeridian (the Arctic journey) stays one continuous line instead of
 * streaking across the whole chart.
 */
function courseOf(journey: Journey): CoursePoint[] {
  const raw: CoursePoint[] = [];
  journey.waypoints.forEach((waypoint, stopIndex) => {
    for (const bend of waypoint.via ?? []) {
      raw.push({ lat: bend.lat, lon: bend.lon });
    }
    const node = resolveWaypoint(waypoint);
    if (node?.lat !== undefined && node.lon !== undefined) {
      raw.push({ lat: node.lat, lon: node.lon, stopIndex, name: node.name });
    }
  });

  let previous: number | null = null;
  return raw.map((point) => {
    let lon = point.lon;
    if (previous !== null) {
      while (lon - previous > 180) lon -= 360;
      while (lon - previous < -180) lon += 360;
    }
    previous = lon;
    return { ...point, lon };
  });
}

/**
 * The voyage chart: numbered markers for every locatable stop, a dashed
 * course line that follows sea lanes through the authored via points,
 * and an animated fly-to whenever the traveller moves.
 */
export function JourneyMap({ journey, currentStop, travelling, tileStyle }: JourneyMapProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tilesRef = useRef<TileManager | null>(null);
  const markersRef = useRef(new Map<number, L.Marker>());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const course = courseOf(journey);
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
      markers.set(point.stopIndex, marker);
    }

    if (course.length > 0) {
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

  // While travelling, follow the traveller and highlight their pin;
  // before departure the chart shows the whole course.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [index, marker] of markersRef.current) {
      marker.getElement()?.classList.toggle('is-current', travelling && index === currentStop);
    }
    if (!travelling) return;
    const marker = markersRef.current.get(currentStop);
    if (marker) {
      map.flyTo(marker.getLatLng(), 6, { duration: 1.1 });
    }
  }, [currentStop, travelling, journey]);

  const chartedStops = courseOf(journey).filter((point) => point.stopIndex !== undefined).length;

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
