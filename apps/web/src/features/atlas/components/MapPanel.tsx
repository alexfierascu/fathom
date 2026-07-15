import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';

import L from 'leaflet';

import type { Strait } from '@fathom/data';

import type { TileStyle } from '../../theme/themes';
import { popupHtml } from '../lib/popup';

export interface MapPanelHandle {
  focusStrait: (id: string) => void;
}

interface MapPanelProps {
  straits: readonly Strait[];
  /** Ids passing the active filters, or null when nothing is filtered. */
  filteredIds: ReadonlySet<string> | null;
  hoveredId: string | null;
  visibleCount: number;
  tileStyle: TileStyle;
  ref?: Ref<MapPanelHandle>;
}

const TILE_STYLES: Record<TileStyle, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

const INITIAL_CENTER: L.LatLngTuple = [15, 10];
const INITIAL_ZOOM = 2;

function createIcon(): L.DivIcon {
  return L.divIcon({
    className: 'strait-icon',
    html: '<span class="pin-pulse"></span><span class="pin-dot"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

export function MapPanel({
  straits,
  filteredIds,
  hoveredId,
  visibleCount,
  tileStyle,
  ref,
}: MapPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileStyleRef = useRef<TileStyle | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const popupTimerRef = useRef<number | undefined>(undefined);

  // The initial tile style must be available to the one-time init effect
  // without re-running it when the theme changes.
  const initialTileStyle = useRef(tileStyle);
  initialTileStyle.current = tileStyle;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { minZoom: 2, maxZoom: 18, worldCopyJump: true }).setView(
      INITIAL_CENTER,
      INITIAL_ZOOM,
    );
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    setTileStyle(map, initialTileStyle.current);

    const markers = markersRef.current;
    for (const strait of straits) {
      const marker = L.marker([strait.lat, strait.lon], { icon: createIcon() }).addTo(map);
      marker.bindTooltip(strait.name, {
        direction: 'top',
        offset: [0, -11],
        className: 'strait-tip',
      });
      marker.bindPopup(popupHtml(strait));
      markers.set(strait.id, marker);
    }

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    const initialInvalidate = window.setTimeout(() => map.invalidateSize(), 250);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(initialInvalidate);
      window.clearTimeout(popupTimerRef.current);
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      tileStyleRef.current = null;
      markers.clear();
    };
  }, [straits]);

  function setTileStyle(map: L.Map, style: TileStyle) {
    if (style === tileStyleRef.current) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(TILE_STYLES[style].url, {
      attribution: TILE_STYLES[style].attribution,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
    tileStyleRef.current = style;
  }

  useEffect(() => {
    if (mapRef.current) setTileStyle(mapRef.current, tileStyle);
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

  useImperativeHandle(
    ref,
    () => ({
      focusStrait(id: string) {
        const map = mapRef.current;
        const strait = straits.find((s) => s.id === id);
        if (!map || !strait) return;
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        map.flyTo([strait.lat, strait.lon], 7, { duration: 0.9 });
        window.clearTimeout(popupTimerRef.current);
        popupTimerRef.current = window.setTimeout(() => {
          markersRef.current.get(id)?.openPopup();
        }, 750);
      },
    }),
    [straits],
  );

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
              mapRef.current?.flyTo(INITIAL_CENTER, INITIAL_ZOOM, { duration: 0.8 });
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
