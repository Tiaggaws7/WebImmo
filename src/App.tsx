import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './home.tsx'
import NotFound from './NotFound.tsx';
import Selling_form from './components/Selling_form';
//import Search_house from './components/Search_house.tsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer.tsx';
import HouseDetails from './components/HouseDetails.tsx';
import HouseExplorer from './components/HouseExplorer.tsx';
import Blog from './components/Blog.tsx';
import RealWhoAmI from './components/RealWhoamI.tsx';
import EstimationForm from './components/EstimationForm.tsx';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Vendre" element={<Selling_form />} />
          <Route path="/Acheter" element={<HouseExplorer />} />
          <Route path="/house/:id" element={<HouseDetails />} />
          <Route path="/NomPrenom" element={<RealWhoAmI />} />
          <Route path="/Blog" element={<Blog/>} />
          <Route path="/Estimation" element={<EstimationForm />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer/>
      </BrowserRouter>
    </>
  )
}

export default App

