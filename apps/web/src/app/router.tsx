import { createBrowserRouter } from 'react-router';

import { HomePage } from '../features/atlas/pages/HomePage';
import { NotFoundPage } from '../features/atlas/pages/NotFoundPage';
import { StraitDetailPage } from '../features/atlas/pages/StraitDetailPage';
import { RootLayout } from './RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'straits/:slug', element: <StraitDetailPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
