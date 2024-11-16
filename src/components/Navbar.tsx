import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="sticky top-0 bg-white p-4 border-b border-gray-200 z-50">
      <nav className="flex justify-between items-center ">
        {/* Logo */}
        <div className="font-bold text-lg">
          <Link to="/Home">ExpertImmo</Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-6">
          <Link to="/Vendre" className="text-black hover:text-gray-700">
            Vendre
          </Link>
          <Link to="/Acheter" className="text-black hover:text-gray-700">
            Acheter
          </Link>
          <Link to="/Blog" className="text-black hover:text-gray-700">
            Nos guides
          </Link>
          <Link to="/NomPrenom" className="text-black hover:text-gray-700">
            Nom Prenom
          </Link>
          <a href="tel:+33789985632" className="text-black hover:text-gray-700">
            +33 7 89 98 56 32
          </a>
          <Link
            to="/Estimation"
            className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors"
          >
            Estimer votre bien
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
