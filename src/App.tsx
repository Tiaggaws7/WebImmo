import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './home.tsx'
import NotFound from './NotFound.tsx';
import Selling_form from './components/Selling_form';
//import Search_house from './components/Search_house.tsx';
import Navbar from './components/Navbar';
import Footer from './components/Footer.tsx';
import HouseDetails from './components/HouseDetails.tsx';
import WhoAmI from './components/WhoAmI.tsx';
import HouseExplorer from './components/HouseExplorer.tsx';
import { articles } from './data/articles.ts';
import Blog from './components/Blog.tsx';

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
          <Route path="/NomPrenom" element={<WhoAmI />} />
          <Route path="/Blog" element={<Blog articles={articles} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer/>
      </BrowserRouter>
    </>
  )
}

export default App

