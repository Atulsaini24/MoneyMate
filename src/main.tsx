import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/figtree';
import '@fontsource-variable/bricolage-grotesque';
import App from './App';
import './index.css';
import { initMonitoring } from './lib/monitoring';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

initMonitoring();

// Installable + offline shell. Production only, so dev hot-reload is never cached.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.warn('Service worker not registered', err));
  });
}
