import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/red-hat-display/500.css';
import '@fontsource/red-hat-display/600.css';
import '@fontsource/red-hat-display/700.css';
import '@fontsource/red-hat-display/800.css';
import '@fontsource/red-hat-display/900.css';
import '@fontsource/red-hat-text/400.css';
import '@fontsource/red-hat-text/500.css';
import '@fontsource/red-hat-text/600.css';
import './index.css';
import { App } from './App';
import { DEMO_STATIQUE } from './lib/api';

// Démo GitHub Pages : le site vit sous /leef-group_website/ ; en production, à la racine du domaine.
const basename = DEMO_STATIQUE ? import.meta.env.BASE_URL.replace(/\/$/, '') : undefined;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
