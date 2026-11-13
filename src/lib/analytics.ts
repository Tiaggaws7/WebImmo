/**
 * Chargement différé du tag Google Ads (gtag).
 *
 * Le tag représente ~160 Ko de JavaScript et ~400 ms de blocage du thread
 * principal. Il n'est utile qu'à partir du moment où l'utilisateur interagit
 * (clic, saisie, défilement) : on le charge donc uniquement au premier geste.
 * Toute conversion (formulaire, appel, navigation) implique une interaction
 * préalable, le tag est donc chargé à temps. Les visiteurs qui repartent sans
 * interagir ne sont pas mesurés par Google Ads.
 *
 * La mesure d'audience du site est entièrement first-party (voir
 * `lib/tracking.ts`) : aucun événement n'est envoyé à Google Analytics.
 */

const ADS_CONVERSION_ID = 'AW-17711266631';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export const ANALYTICS_OPT_OUT_KEY = 'wi_analytics_optout';

/** L'utilisateur a-t-il demandé à ne pas être mesuré ? */
export function isAnalyticsOptedOut(): boolean {
  try {
    return window.localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

/** Enregistre le choix de l'utilisateur (mesure d'audience). */
export function setAnalyticsOptOut(optedOut: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (optedOut) window.localStorage.setItem(ANALYTICS_OPT_OUT_KEY, '1');
    else window.localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
  } catch {
    /* stockage indisponible : on ne peut pas mémoriser le choix */
  }

  const gtag = window.gtag;
  if (gtag) {
    gtag('consent', 'update', {
      analytics_storage: optedOut ? 'denied' : 'granted',
      ad_storage: optedOut ? 'denied' : 'granted',
    });
  }
}

let initialized = false;
let scriptRequested = false;
let loadScheduled = false;

function ensureGtagStub(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

function loadTags(): void {
  if (scriptRequested || typeof document === 'undefined') return;
  if (isAnalyticsOptedOut()) return;
  scriptRequested = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_CONVERSION_ID)}`;
  document.head.appendChild(script);
}

function scheduleLoad(): void {
  if (loadScheduled || scriptRequested) return;
  loadScheduled = true;

  // Le tag n'est téléchargé qu'au premier geste de l'utilisateur. Toute
  // conversion (soumission de formulaire, clic sur un numéro, navigation)
  // implique une interaction préalable : le tag est donc chargé à temps.
  // Cela évite ~160 Ko de JavaScript publicitaire sur la première visite.
  const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
  const onInteraction = () => {
    loadTags();
    for (const event of events) window.removeEventListener(event, onInteraction);
  };
  for (const event of events) {
    window.addEventListener(event, onInteraction, { once: true, passive: true });
  }
}

/**
 * Initialise le tag Google Ads. Idempotent : peut être rappelé après un
 * changement de consentement.
 */
export function initAnalytics(): void {
  if (typeof window === 'undefined' || initialized) return;
  initialized = true;

  ensureGtagStub();
  const optedOut = isAnalyticsOptedOut();

  window.gtag?.('consent', 'default', {
    analytics_storage: optedOut ? 'denied' : 'granted',
    ad_storage: optedOut ? 'denied' : 'granted',
  });
  window.gtag?.('js', new Date());
  window.gtag?.('config', ADS_CONVERSION_ID);

  if (!optedOut) scheduleLoad();
}

/** Réactive le tag après un retrait d'opposition. */
export function resumeAnalytics(): void {
  if (typeof window === 'undefined') return;
  if (!initialized) {
    initAnalytics();
    return;
  }
  ensureGtagStub();
  window.gtag?.('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted' });
  loadScheduled = false;
  // Le clic sur « Autoriser la mesure d'audience » est déjà une interaction :
  // inutile d'attendre un autre geste, la personne vient de consentir.
  loadTags();
}
