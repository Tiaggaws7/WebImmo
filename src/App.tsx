import { lazy, Suspense, useEffect } from 'react';
import './App.css';
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop.tsx';
import WhatsAppBubble from './components/WhatsAppBubble';
import AnalyticsFooter from './components/AnalyticsFooter';
import { initAnalytics } from './lib/analytics';
import { setupAutoTracking, trackPageview } from './lib/tracking';
import { enableIntentPrefetch, routeLoaders } from './lib/routes';

// La page d'accueil est le point d'entrée de la quasi-totalité des visites.
// Elle est préchargée depuis index.html (voir routeChunkPreloadPlugin) pour
// éviter un aller-retour, mais reste hors du bundle initial : les visiteurs qui
// arrivent directement sur /Acheter, /Vendre, etc. n'ont pas à télécharger son
// code ni les avis clients.
const Home = lazy(routeLoaders.home);
const Selling_form = lazy(routeLoaders.sell);
const HouseExplorer = lazy(routeLoaders.buy);
const HouseDetails = lazy(routeLoaders.house);
const RealWhoAmI = lazy(routeLoaders.about);
const EstimationForm = lazy(routeLoaders.estimate);
const AdminPanel = lazy(routeLoaders.admin);
const NotFound = lazy(routeLoaders.notFound);

const PageLoader = () => (
  <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" aria-label="Chargement...">
    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const AppContent = () => {
  const location = useLocation();

  useEffect(() => {
    // gtag est chargé à la première interaction (ou après le rendu initial).
    initAnalytics();
    setupAutoTracking();
    // Survol / focus / toucher d'un lien interne : la page est préchargée.
    return enableIntentPrefetch();
  }, []);

  useEffect(() => {
    // Le titre est mis à jour par Helmet : on attend la frame suivante pour
    // envoyer un libellé de page correct.
    const frame = requestAnimationFrame(() => {
      trackPageview(location.pathname, document.title);
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <WhatsAppBubble />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Vendre" element={<Selling_form />} />
          <Route path="/Acheter" element={<HouseExplorer />} />
          <Route path="/house/:id" element={<HouseDetails />} />
          <Route path="/EliseBUIL" element={<RealWhoAmI />} />
          <Route path="/Estimation" element={<EstimationForm />} />
          <Route path="/Gestion" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {location.pathname !== '/Gestion' && <AnalyticsFooter />}
    </>
  );
};

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter basename="/">
        <AppContent />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
