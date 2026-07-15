import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(container).render(<StrictMode>{null}</StrictMode>);
