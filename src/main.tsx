import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { initTheme } from './lib/theme';
import { db } from './lib/db';

initTheme();

// Eagerly open the IndexedDB so the first page does not have to wait
// (and surfaces any DB-open errors at startup rather than mid-flow).
db.open().catch((err) => console.error('Dexie open failed', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
