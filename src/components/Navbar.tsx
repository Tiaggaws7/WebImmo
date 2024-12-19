'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <header className="sticky top-0 bg-white p-4 border-b border-gray-200 z-50">
      <nav className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="font-bold text-lg">
            <Link to="/">investimmo</Link>
          </div>

          {/* Mobile menu button */}
          <button onClick={toggleMenu} className="md:hidden">
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
          </div>
        </div>

        {/* Mobile Navigation Links */}
        {isOpen && (
          <div className="md:hidden mt-4 space-y-4">
            <NavLinks />
          </div>
        )}
      </nav>
    </header>
  )
}

const NavLinks = () => (
  <>
    <Link to="/Vendre" className="block text-black hover:text-gray-700">
      Vendre
    </Link>
    <Link to="/Acheter" className="block text-black hover:text-gray-700">
      Acheter
    </Link>
    <Link to="/Blog" className="block text-black hover:text-gray-700">
      Nos guides
    </Link>
    <Link to="/NomPrenom" className="block text-black hover:text-gray-700">
      Nom Prenom
    </Link>
    <a href="tel:+33789985632" className="block text-black hover:text-gray-700">
      <span className="md:hidden">Appeler</span>
      <span className="hidden md:inline">+33 7 89 98 56 32</span>
      <Phone className="inline-block ml-2 h-4 w-4 md:hidden" />
    </a>
    <Link to="/Gestion" className="block text-black hover:text-gray-700">
      mon compte
    </Link>
    <Link
      to="/Estimation"
      className="block bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors text-center"
    >
      Estimer votre bien
    </Link>
  </>
)

export default Navbar