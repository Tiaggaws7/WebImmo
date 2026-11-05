/**
 * Chargement différé de Google Ads (gtag).
 *
 * Le tag représente ~160 Ko de JavaScript et ~400 ms de blocage du thread
 * principal. Il n'est utile qu'à partir du moment où l'utilisateur interagit
 * (clic, saisie, défilement) : on le charge donc à la première interaction.
 * Les conversions (soumission de formulaire) restent déclenchées après cette
 * interaction, donc le suivi est conservé.
 */

const ADS_CONVERSION_ID = 'AW-17711266631';

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let started = false;

function loadGoogleAds(): void {
  if (started) return;
  started = true;

  window.dataLayer = window.dataLayer || [];
  // File d'attente compatible avec l'API gtag.js.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', ADS_CONVERSION_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_CONVERSION_ID}`;
  document.head.appendChild(script);
}

export function initAnalytics(): void {
  if (typeof window === 'undefined') return;

  const events = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
  const start = () => {
    loadGoogleAds();
    for (const event of events) window.removeEventListener(event, start);
  };

  for (const event of events) {
    window.addEventListener(event, start, { once: true, passive: true });
  }
}
