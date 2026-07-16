import L from 'leaflet';

import type { Strait } from '@fathom/data';

import type { TileStyle } from '../../theme/themes';
import { formatLat, formatLon } from './format';
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
export function bindStraitMarker(target: L.Map | L.LayerGroup, strait: Strait): L.Marker {
  const marker = L.marker([strait.lat, strait.lon], { icon: createStraitIcon() }).addTo(target);
  marker.bindTooltip(strait.name, { direction: 'top', offset: [0, -11], className: 'strait-tip' });
  marker.bindPopup(popupHtml(strait));
  return marker;
}

export interface TileManager {
  set: (style: TileStyle) => void;
}

const ESRI_IMAGERY = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
};
const OPENTOPO = {
  url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  attribution:
    'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
};

/** Compact factory for small custom Leaflet controls. */
function makeControl(
  position: L.ControlPosition,
  className: string,
  build: (container: HTMLElement, map: L.Map) => void,
): L.Control {
  const Ctl = L.Control.extend({
    onAdd(map: L.Map) {
      const el = L.DomUtil.create('div', className);
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);
      build(el, map);
      return el;
    },
  });
  return new Ctl({ position });
}

function ctlButton(label: string, title: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'map-ctl-btn';
  button.textContent = label;
  button.title = title;
  button.setAttribute('aria-label', title);
  return button;
}

function addFullscreenControl(map: L.Map, panel: HTMLElement): void {
  makeControl('topright', 'map-ctl', (el) => {
    const button = ctlButton('⛶', 'Toggle fullscreen map');
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') toggle(false);
    };
    const toggle = (force?: boolean) => {
      const active = force ?? !panel.classList.contains('map-panel--fullscreen');
      panel.classList.toggle('map-panel--fullscreen', active);
      if (active) {
        document.addEventListener('keydown', onEscape);
      } else {
        document.removeEventListener('keydown', onEscape);
      }
      window.setTimeout(() => map.invalidateSize(), 60);
    };
    button.addEventListener('click', () => {
      toggle();
    });
    el.appendChild(button);
  }).addTo(map);
}

function addCoordinatesControl(map: L.Map): void {
  makeControl('bottomleft', 'map-coords', (el) => {
    el.textContent = '—';
    map.on('mousemove', (event: L.LeafletMouseEvent) => {
      el.textContent = `${formatLat(event.latlng.lat)}, ${formatLon(event.latlng.lng)}`;
    });
    map.on('mouseout', () => {
      el.textContent = '—';
    });
  }).addTo(map);
}

function addMeasureControl(map: L.Map): void {
  makeControl('topright', 'map-ctl', (el) => {
    const button = ctlButton('⤳', 'Measure distance');
    const layer = L.layerGroup();
    const line = L.polyline([], { weight: 2, dashArray: '6 4' });
    let points: L.LatLng[] = [];
    let active = false;

    const setActive = (next: boolean) => {
      active = next;
      button.classList.toggle('is-active', active);
      map.getContainer().style.cursor = active ? 'crosshair' : '';
      if (active) {
        map.doubleClickZoom.disable();
      } else {
        map.doubleClickZoom.enable();
      }
    };

    button.addEventListener('click', () => {
      if (active || points.length > 0) {
        layer.clearLayers();
        points = [];
        line.setLatLngs([]);
        setActive(false);
        if (points.length === 0 && !active) return;
      }
      setActive(!active);
    });

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (!active) return;
      points.push(event.latlng);
      if (!map.hasLayer(layer)) layer.addTo(map);
      L.circleMarker(event.latlng, { radius: 4, weight: 2 }).addTo(layer);
      if (points.length === 1) {
        line.setLatLngs(points).addTo(layer);
      } else {
        line.setLatLngs(points);
        let meters = 0;
        for (let i = 1; i < points.length; i += 1) {
          const from = points[i - 1];
          const to = points[i];
          if (from && to) meters += map.distance(from, to);
        }
        const km = meters / 1000;
        const nauticalMiles = km / 1.852;
        line
          .bindTooltip(`${km.toFixed(1)} km · ${nauticalMiles.toFixed(1)} nm`, {
            className: 'strait-tip',
            permanent: true,
          })
          .openTooltip(event.latlng);
      }
    });

    map.on('dblclick', () => {
      if (active) setActive(false);
    });

    el.appendChild(button);
  }).addTo(map);
}

/**
 * Full map chrome: the themed chart base layer (URL-swapped on theme
 * change), satellite and relief base layers with a layer control, and the
 * fullscreen, coordinate, and measure controls. Returns the tile manager
 * that follows the app theme.
 */
export function setupMapChrome(
  map: L.Map,
  panel: HTMLElement | null,
  initialStyle: TileStyle = 'dark',
): TileManager {
  const chart = L.tileLayer(TILE_STYLES[initialStyle].url, {
    attribution: TILE_STYLES[initialStyle].attribution,
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(map);
  const satellite = L.tileLayer(ESRI_IMAGERY.url, {
    attribution: ESRI_IMAGERY.attribution,
    maxZoom: 19,
  });
  const relief = L.tileLayer(OPENTOPO.url, { attribution: OPENTOPO.attribution, maxZoom: 17 });

  L.control
    .layers({ Chart: chart, Satellite: satellite, Relief: relief }, undefined, {
      position: 'topright',
    })
    .addTo(map);
  if (panel) addFullscreenControl(map, panel);
  addCoordinatesControl(map);
  addMeasureControl(map);

  let current: TileStyle = initialStyle;
  return {
    set(style) {
      if (style === current) return;
      chart.setUrl(TILE_STYLES[style].url);
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
