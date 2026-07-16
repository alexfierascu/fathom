import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './styles/global.css';

import { App } from './app/App';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in index.html');
}

// Offline support ships only with production builds; the dev server's
// module URLs must never be cached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js');
  });
}

// Privacy-respecting analytics, wholly opt-in: without the deploy-time
// token nothing is loaded and no request leaves the page.
const analyticsToken = import.meta.env.VITE_ANALYTICS_TOKEN as string | undefined;
if (analyticsToken) {
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.dataset.cfBeacon = JSON.stringify({ token: analyticsToken });
  document.head.appendChild(beacon);
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
