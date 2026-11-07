/**
 * Chargement différé du tag Google Ads (gtag).
 *
 * Le tag représente ~160 Ko de JavaScript et ~400 ms de blocage du thread
 * principal. Il n'est utile qu'à partir du moment où l'utilisateur interagit
 * (clic, saisie, défilement) : on le charge donc à la première interaction.
 * Un chargement différé après l'événement `load` est aussi programmé pour ne
 * pas bloquer le rendu initial.
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

  const start = () => {
    loadTags();
  };

  const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
  const onInteraction = () => {
    start();
    for (const event of events) window.removeEventListener(event, onInteraction);
  };
  for (const event of events) {
    window.addEventListener(event, onInteraction, { once: true, passive: true });
  }

  // Charge aussi après le rendu initial : les conversions Google Ads ne
  // dépendent pas d'une interaction préalable.
  const idle = () => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(start, { timeout: 4000 });
    } else {
      window.setTimeout(start, 2500);
    }
  };

  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, { once: true });
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
  scheduleLoad();
}
