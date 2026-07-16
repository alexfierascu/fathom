import { createBrowserRouter } from 'react-router';

import { HomePage } from '../features/atlas/pages/HomePage';
import { NotFoundPage } from '../features/atlas/pages/NotFoundPage';
import { pageChunks } from './prefetch';
import { RootLayout } from './RootLayout';

/**
 * The homepage ships in the main bundle; every detail page is a lazy
 * route chunk (the six structure pages share one). Hover prefetching in
 * app/prefetch.ts warms the same chunks.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'straits/:slug',
        lazy: () => pageChunks.strait().then((m) => ({ Component: m.StraitDetailPage })),
      },
      {
        path: 'water-bodies/:slug',
        lazy: () => pageChunks.waterBody().then((m) => ({ Component: m.WaterBodyDetailPage })),
      },
      {
        path: 'countries/:slug',
        lazy: () => pageChunks.country().then((m) => ({ Component: m.CountryDetailPage })),
      },
      {
        path: 'regions/:slug',
        lazy: () => pageChunks.region().then((m) => ({ Component: m.RegionDetailPage })),
      },
      {
        path: 'ports/:slug',
        lazy: () => pageChunks.structures().then((m) => ({ Component: m.PortDetailPage })),
      },
      {
        path: 'canals/:slug',
        lazy: () => pageChunks.structures().then((m) => ({ Component: m.CanalDetailPage })),
      },
      {
        path: 'bridges/:slug',
        lazy: () => pageChunks.structures().then((m) => ({ Component: m.BridgeDetailPage })),
      },
      {
        path: 'tunnels/:slug',
        lazy: () => pageChunks.structures().then((m) => ({ Component: m.TunnelDetailPage })),
      },
      {
        path: 'islands/:slug',
        lazy: () => pageChunks.structures().then((m) => ({ Component: m.IslandDetailPage })),
      },
      {
        path: 'routes/:slug',
        lazy: () => pageChunks.structures().then((m) => ({ Component: m.MaritimeRouteDetailPage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
