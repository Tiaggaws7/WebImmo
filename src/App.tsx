import { lazy, Suspense, useEffect } from 'react';
import './App.css';
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop.tsx';
import WhatsAppBubble from './components/WhatsAppBubble';
import Home from './home.tsx';
import { initAnalytics } from './lib/analytics';

// La page d'accueil est le point d'entrée de la quasi-totalité des visites :
// l'importer directement supprime un aller-retour réseau avant le premier rendu.
const Selling_form = lazy(() => import('./components/Selling_form'));
const HouseExplorer = lazy(() => import('./components/HouseExplorer.tsx'));
const HouseDetails = lazy(() => import('./components/HouseDetails.tsx'));
const RealWhoAmI = lazy(() => import('./components/RealWhoamI.tsx'));
const EstimationForm = lazy(() => import('./components/EstimationForm.tsx'));
const AdminPanel = lazy(() => import('./components/adminPanel.tsx'));
const NotFound = lazy(() => import('./NotFound.tsx'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" aria-label="Chargement...">
    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const AppContent = () => {
  useEffect(() => {
    // gtag n'est chargé qu'à la première interaction (voir lib/analytics).
    initAnalytics();
  }, []);

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
