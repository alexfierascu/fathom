import { RouterProvider } from 'react-router';

import { LocaleProvider } from '../features/i18n/LocaleProvider';
import { router } from './router';

export function App() {
  return (
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  );
}
