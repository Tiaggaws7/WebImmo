import './App.css';
import { BrowserRouter, Route, Routes, /*useLocation*/ } from 'react-router-dom';
import Home from './home.tsx';
import NotFound from './NotFound.tsx';
import Selling_form from './components/Selling_form';
import Navbar from './components/Navbar';
//import Footer from './components/Footer.tsx';
import HouseDetails from './components/HouseDetails.tsx';
import HouseExplorer from './components/HouseExplorer.tsx';
import Blog from './components/Blog.tsx';
import RealWhoAmI from './components/RealWhoamI.tsx';
import EstimationForm from './components/EstimationForm.tsx';
import AdminPanel from './components/adminPanel.tsx';

const AppContent = () => {
  // Hook pour obtenir la route actuelle
  //const location = useLocation();

  // Liste des routes où le footer ne doit pas être affiché
  //const noFooterRoutes = ['/Gestion', '/']; // Ajouter ici toutes les routes sans footer

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Vendre" element={<Selling_form />} />
        <Route path="/Acheter" element={<HouseExplorer />} />
        <Route path="/house/:id" element={<HouseDetails />} />
        <Route path="/EliseBUIL" element={<RealWhoAmI />} />
        <Route path="/Blog" element={<Blog />} />
        <Route path="/Estimation" element={<EstimationForm />} />
        <Route path="/Gestion" element={<AdminPanel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {/* Affichage conditionnel du footer */}
      {/*!noFooterRoutes.includes(location.pathname) && <Footer />*/}
    </>
  );
};

function App() {
  return (
    <BrowserRouter basename="/">
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
