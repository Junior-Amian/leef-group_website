import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DEMO_STATIQUE } from './lib/api';
import { SitePage } from './site/SitePage';
import { PageIntrouvable } from './site/PageIntrouvable';

// Le panel n'est téléchargé que par les administrateurs : le site public reste léger.
const AdminApp = lazy(() => import('./admin/AdminApp'));

/**
 * Pages publiques (mêmes adresses que celles reconnues par le serveur, voir backend/app/Services/Seo.php) :
 *   /               accueil
 *   /poles/{slug}   accueil avec la fiche du pôle ouverte (une page indexable par pôle)
 * La route enfant garde SitePage monté : ouvrir ou fermer une fiche ne recharge pas la page.
 */
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
      <Route path="/" element={<SitePage />}>
        <Route path="poles/:slug" element={null} />
      </Route>
      <Route path="*" element={<PageIntrouvable />} />
    </Routes>
  );
}
