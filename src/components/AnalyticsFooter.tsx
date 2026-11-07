import { useState } from 'react';
import { isAnalyticsOptedOut, resumeAnalytics, setAnalyticsOptOut } from '../lib/analytics';
import { clearTrackingIdentity } from '../lib/tracking';

/**
 * Pied de page minimal : copyright + possibilité de refuser la mesure
 * d'audience. Le composant Footer historique n'est pas monté dans l'app,
 * ce lien garantit donc l'opposition sur toutes les pages publiques.
 */
export default function AnalyticsFooter() {
  const [optedOut, setOptedOut] = useState(isAnalyticsOptedOut);

  const toggle = () => {
    const next = !optedOut;
    setAnalyticsOptOut(next);
    if (next) {
      clearTrackingIdentity();
    } else {
      resumeAnalytics();
    }
    setOptedOut(next);
  };

  return (
    <footer className="bg-white border-t border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4 pr-20 sm:pr-4 flex flex-col sm:flex-row items-center justify-center gap-x-3 gap-y-1 text-center text-[11px] text-gray-400">
        <span>© {new Date().getFullYear()} Elise Buil Immobilier</span>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          onClick={toggle}
          className="underline underline-offset-2 hover:text-gray-600 transition-colors"
        >
          {optedOut ? 'Autoriser la mesure d’audience' : 'Refuser la mesure d’audience'}
        </button>
        <span className="hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <span>Mesure d’audience anonyme, sans IP ni données personnelles.</span>
      </div>
    </footer>
  );
}
