import { createBrowserRouter, Navigate } from 'react-router';

import { HomePage } from '../features/atlas/pages/HomePage';
import { NotFoundPage } from '../features/atlas/pages/NotFoundPage';
import { pageChunks } from './prefetch';
import { RootLayout } from './RootLayout';
import { TourRedirect } from './TourRedirect';

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
        path: 'explore',
        lazy: () => pageChunks.hubs().then((m) => ({ Component: m.ExplorePage })),
      },
      {
        path: 'map',
        lazy: () => pageChunks.hubs().then((m) => ({ Component: m.MapPage })),
      },
      {
        path: 'learn',
        lazy: () => pageChunks.hubs().then((m) => ({ Component: m.LearnPage })),
      },
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
      {
        path: 'tags/:slug',
        lazy: () => pageChunks.discovery().then((m) => ({ Component: m.TagDetailPage })),
      },
      {
        path: 'compare/:a?/:b?',
        lazy: () => pageChunks.discovery().then((m) => ({ Component: m.ComparePage })),
      },
      {
        path: 'journeys',
        lazy: () => pageChunks.journeys().then((m) => ({ Component: m.JourneysPage })),
      },
      {
        path: 'journeys/:slug',
        lazy: () => pageChunks.journeys().then((m) => ({ Component: m.JourneyDetailPage })),
      },
      {
        path: 'daily',
        lazy: () =>
          import('../features/journeys/DailyPage').then((m) => ({ Component: m.DailyPage })),
      },
      {
        path: 'passport',
        lazy: () =>
          import('../features/journeys/PassportPage').then((m) => ({
            Component: m.PassportPage,
          })),
      },
      {
        path: 'six-degrees',
        lazy: () =>
          import('../features/explore/SixDegreesPage').then((m) => ({
            Component: m.SixDegreesPage,
          })),
      },
      { path: 'tours', element: <Navigate to="/journeys" replace /> },
      { path: 'tours/:slug', element: <TourRedirect /> },
      {
        path: 'quiz',
        lazy: () => pageChunks.discovery().then((m) => ({ Component: m.QuizPage })),
      },
      {
        path: 'timeline',
        lazy: () => pageChunks.discovery().then((m) => ({ Component: m.TimelinePage })),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    // Chrome-free page for third-party iframes; deliberately outside
    // RootLayout so embeds carry no header, nav, or footer.
    path: '/embed/straits/:slug',
    lazy: () =>
      import('../features/atlas/pages/EmbedStraitPage').then((m) => ({
        Component: m.EmbedStraitPage,
      })),
  },
]);
