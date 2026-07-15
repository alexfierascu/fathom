import L from 'leaflet';

import type { Strait } from '@fathom/data';

import type { TileStyle } from '../../theme/themes';
import { popupHtml } from './popup';

export const WORLD_CENTER: L.LatLngTuple = [15, 10];
export const WORLD_ZOOM = 2;
/** Zoom used when centering on a single strait (the prototype's fly-to zoom). */
export const STRAIT_ZOOM = 7;

export const TILE_STYLES: Record<TileStyle, { url: string; attribution: string }> = {
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

/** Creates a map with the atlas's shared options and chrome. */
export function createStraitMap(
  container: HTMLElement,
  center: L.LatLngTuple,
  zoom: number,
): L.Map {
  const map = L.map(container, { minZoom: 2, maxZoom: 18, worldCopyJump: true }).setView(
    center,
    zoom,
  );
  map.attributionControl.setPrefix(false);
  return map;
}

export function createStraitIcon(): L.DivIcon {
  return L.divIcon({
    className: 'strait-icon',
    html: '<span class="pin-pulse"></span><span class="pin-dot"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -9],
  });
}

/** Adds a strait marker with the shared tooltip and popup bindings. */
export function bindStraitMarker(map: L.Map, strait: Strait): L.Marker {
  const marker = L.marker([strait.lat, strait.lon], { icon: createStraitIcon() }).addTo(map);
  marker.bindTooltip(strait.name, { direction: 'top', offset: [0, -11], className: 'strait-tip' });
  marker.bindPopup(popupHtml(strait));
  return marker;
}

export interface TileManager {
  set: (style: TileStyle) => void;
}

/** Swaps tile layers only when the style actually changes. */
export function createTileManager(map: L.Map): TileManager {
  let current: TileStyle | null = null;
  let layer: L.TileLayer | null = null;
  return {
    set(style) {
      if (style === current) return;
      if (layer) map.removeLayer(layer);
      layer = L.tileLayer(TILE_STYLES[style].url, {
        attribution: TILE_STYLES[style].attribution,
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);
      current = style;
    },
  };
}

/**
 * Keeps the map sized correctly: on window resize and once shortly after
 * mount (the prototype's 250ms invalidate). Returns a cleanup function.
 */
export function observeMapSize(map: L.Map): () => void {
  const handleResize = () => map.invalidateSize();
  window.addEventListener('resize', handleResize);
  const initial = window.setTimeout(() => map.invalidateSize(), 250);
  return () => {
    window.removeEventListener('resize', handleResize);
    window.clearTimeout(initial);
  };
}
