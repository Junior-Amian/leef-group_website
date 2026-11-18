import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DEMO_STATIQUE } from './lib/api';
import { SitePage } from './site/SitePage';

// Le panel n'est téléchargé que par les administrateurs : le site public reste léger.
const AdminApp = lazy(() => import('./admin/AdminApp'));

export function App() {
  return (
    <Routes>
      {!DEMO_STATIQUE && (
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="grid min-h-dvh place-items-center text-encre">Chargement…</div>}>
              <AdminApp />
            </Suspense>
          }
        />
      )}
      <Route path="*" element={<SitePage />} />
    </Routes>
  );
}
