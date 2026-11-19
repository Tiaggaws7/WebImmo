import { prefetchPublicData } from './firestoreRest';

/**
 * Chargeurs des pages (code-splitting par route).
 *
 * Partagés entre `React.lazy` (App.tsx) et le préchargement à l'intention :
 * l'import dynamique d'un module déjà demandé renvoie la même promesse, le clic
 * suivant n'a donc plus rien à télécharger.
 */
export const routeLoaders = {
  home: () => import('../home.tsx'),
  sell: () => import('../components/Selling_form'),
  buy: () => import('../components/HouseExplorer.tsx'),
  house: () => import('../components/HouseDetails.tsx'),
  about: () => import('../components/RealWhoamI.tsx'),
  estimate: () => import('../components/EstimationForm.tsx'),
  admin: () => import('../components/adminPanel.tsx'),
  notFound: () => import('../NotFound.tsx'),
};

type RouteKey = keyof typeof routeLoaders;

function routeFor(pathname: string): RouteKey | null {
  const path = pathname.replace(/\/+$/, '').toLowerCase() || '/';
  if (path === '/') return 'home';
  if (path === '/vendre') return 'sell';
  if (path === '/acheter') return 'buy';
  if (path.startsWith('/house/')) return 'house';
  if (path === '/elisebuil') return 'about';
  if (path === '/estimation') return 'estimate';
  // /Gestion (administration) n'est volontairement jamais préchargée.
  return null;
}

const prefetched = new Set<string>();

/** Télécharge le code (et les données publiques) d'une page avant le clic. */
export function prefetchRoute(pathname: string): void {
  const key = routeFor(pathname);
  if (!key || prefetched.has(key + pathname)) return;
  prefetched.add(key + pathname);
  void routeLoaders[key]().catch(() => prefetched.delete(key + pathname));
  prefetchPublicData(pathname);
}

/**
 * Précharge la page d'un lien interne dès que l'utilisateur montre son
 * intention : survol de la souris, focus clavier ou début de toucher. Le
 * délai entre cette intention et le clic (100-300 ms) suffit généralement à
 * rendre la navigation instantanée.
 */
export function enableIntentPrefetch(): () => void {
  const onIntent = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    const href = link?.getAttribute('href');
    if (!href || !href.startsWith('/') || href.startsWith('//')) return;
    prefetchRoute(href.split(/[?#]/)[0]);
  };

  const events = ['pointerover', 'focusin', 'touchstart'] as const;
  for (const name of events) document.addEventListener(name, onIntent, { passive: true });
  return () => {
    for (const name of events) document.removeEventListener(name, onIntent);
  };
}
