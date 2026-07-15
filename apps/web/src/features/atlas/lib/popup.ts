import type { Strait } from '@fathom/data';

import { formatLat, formatLon } from './format';

/**
 * Popup markup for Leaflet's bindPopup, mirroring the legacy prototype.
 * The dataset is curated, static content, so it is injected as-is.
 */
export function popupHtml(strait: Strait): string {
  const pills = strait.countries.map((c) => `<span class="pill">${c}</span>`).join('');
  return (
    '<div class="pop">' +
    `<div class="pop-eyebrow">${strait.region}</div>` +
    `<h4>${strait.name}</h4>` +
    `<div class="pop-pills">${pills}</div>` +
    `<div class="pop-connects">${strait.connects}</div>` +
    `<div class="pop-note">${strait.note}</div>` +
    `<div class="pop-coords">${formatLat(strait.lat)}, ${formatLon(strait.lon)}</div>` +
    '</div>'
  );
}
