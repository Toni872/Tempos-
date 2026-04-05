/**
 * routePrefetch — prefetch de rutas React Router en hover/focus/touch.
 * Compatible con React Router v6 y Vite dynamic import.
 */

const prefetched = new Set();

/**
 * Prefetch dinámico del chunk JS asociado a una ruta.
 * Sólo ejecuta el import la primera vez por `path`.
 * @param {string} path - Ruta relativa a la app (p.ej. '/login')
 */
export function prefetchRoute(path) {
  if (!path || prefetched.has(path)) return;
  prefetched.add(path);

  // Mapeo de rutas conocidas a sus chunks de Vite
  const routeMap = {
    '/login':      () => import('../pages/AuthPage.jsx'),
    '/register':   () => import('../pages/AuthPage.jsx'),
    '/trial':      () => import('../pages/AuthPage.jsx'),
    '/dashboard':  () => import('../pages/DashboardPage.jsx'),
    '/marketing':  () => import('../pages/MarketingPage.jsx'),
  };

  const loader = routeMap[path];
  if (loader) {
    loader().catch(() => {
      // Silenciar errores de prefetch — no críticos
      prefetched.delete(path);
    });
  }
}
