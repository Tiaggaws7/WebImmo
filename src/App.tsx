import { lazy, Suspense, useEffect } from 'react';
import './App.css';
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop.tsx';
import WhatsAppBubble from './components/WhatsAppBubble';

// Lazy-loaded routes for optimal initial bundle size
const Home = lazy(() => import('./home.tsx'));
const Selling_form = lazy(() => import('./components/Selling_form'));
const HouseExplorer = lazy(() => import('./components/HouseExplorer.tsx'));
const HouseDetails = lazy(() => import('./components/HouseDetails.tsx'));
const RealWhoAmI = lazy(() => import('./components/RealWhoamI.tsx'));
const EstimationForm = lazy(() => import('./components/EstimationForm.tsx'));
const AdminPanel = lazy(() => import('./components/adminPanel.tsx'));
const NotFound = lazy(() => import('./NotFound.tsx'));

// Idle prefetcher for frequent subsequent pages once homepage is loaded
const useIdlePrefetch = () => {
  useEffect(() => {
    const prefetchRoutes = () => {
      // Prefetch primary pages in the background after initial render
      import('./components/HouseExplorer.tsx');
      import('./components/EstimationForm.tsx');
      import('./components/RealWhoamI.tsx');
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const handle = win.requestIdleCallback(prefetchRoutes, { timeout: 3000 });
      return () => {
        if (typeof win.cancelIdleCallback === 'function') {
          win.cancelIdleCallback(handle);
        }
      };
    } else {
      const timer = setTimeout(prefetchRoutes, 2000);
      return () => clearTimeout(timer);
    }
  }, []);
};

const PageLoader = () => (
  <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" aria-label="Chargement...">
    <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const AppContent = () => {
  useIdlePrefetch();

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
