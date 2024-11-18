import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './home.tsx'
import NotFound from './NotFound.tsx';
import Selling_form from './components/Selling_form';
import Navbar from './components/Navbar';
import Footer from './components/Footer.tsx';

function App() {

  return (
    <>
      <BrowserRouter>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Vendre" element={<Selling_form />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer/>
      </BrowserRouter>
    </>
  )
}

export default App
