import { createBrowserRouter } from 'react-router';

import { HomePage } from '../features/atlas/pages/HomePage';
import { NotFoundPage } from '../features/atlas/pages/NotFoundPage';
import { RegionDetailPage } from '../features/atlas/pages/RegionDetailPage';
import { StraitDetailPage } from '../features/atlas/pages/StraitDetailPage';
import {
  BridgeDetailPage,
  CanalDetailPage,
  IslandDetailPage,
  MaritimeRouteDetailPage,
  PortDetailPage,
  TunnelDetailPage,
} from '../features/atlas/pages/StructurePages';
import { CountryDetailPage } from '../features/atlas/pages/CountryDetailPage';
import { WaterBodyDetailPage } from '../features/atlas/pages/WaterBodyDetailPage';
import { RootLayout } from './RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'straits/:slug', element: <StraitDetailPage /> },
      { path: 'water-bodies/:slug', element: <WaterBodyDetailPage /> },
      { path: 'countries/:slug', element: <CountryDetailPage /> },
      { path: 'regions/:slug', element: <RegionDetailPage /> },
      { path: 'ports/:slug', element: <PortDetailPage /> },
      { path: 'canals/:slug', element: <CanalDetailPage /> },
      { path: 'bridges/:slug', element: <BridgeDetailPage /> },
      { path: 'tunnels/:slug', element: <TunnelDetailPage /> },
      { path: 'islands/:slug', element: <IslandDetailPage /> },
      { path: 'routes/:slug', element: <MaritimeRouteDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
