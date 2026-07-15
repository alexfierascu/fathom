import { createBrowserRouter } from 'react-router';

import { HomePage } from '../features/atlas/pages/HomePage';
import { RootLayout } from './RootLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
]);
