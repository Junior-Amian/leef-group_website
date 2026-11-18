import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, l'API PHP tourne sur 127.0.0.1:8000 (voir README).
// changeOrigin: false conserve l'hôte du navigateur : le contrôle d'origine de l'API reste valide.
const api = { target: 'http://127.0.0.1:8000', changeOrigin: false };

export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  // Production : servi par PHP depuis backend/public/app/.
  // Démo GitHub Pages (mode « pages ») : site vitrine statique sous /leef-group_website/.
  base: command === 'build' ? (mode === 'pages' ? '/leef-group_website/' : '/app/') : '/',
  build: {
    outDir: mode === 'pages' ? 'dist-pages' : '../backend/public/app',
    emptyOutDir: true,
  },
  server: {
    proxy: { '/api': api, '/uploads': api },
  },
}));
