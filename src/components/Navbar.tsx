import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone, ChevronRight } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [location])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 bg-primary ${
          isScrolled
            ? 'shadow-lg py-3'
            : 'shadow-md py-4'
        }`}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Brand / Logo */}
            <Link to="/" className="group flex items-center gap-1">
              <span className="font-semibold text-lg sm:text-xl lg:text-lg xl:text-xl tracking-tight text-black transition-opacity duration-300 hover:opacity-75">
                Votre solution clé en main !
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center lg:space-x-4 xl:space-x-8">
              <DesktopNavLink to="/Acheter">Acheter</DesktopNavLink>
              <DesktopNavLink to="/Vendre">Vendre</DesktopNavLink>
              <DesktopNavLink to="/EliseBUIL">Élise BUIL</DesktopNavLink>
              <a 
                href="https://blog.elisebuilimmobilierguadeloupe.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-black/80 font-medium hover:text-black transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-black after:transition-all after:duration-300 hover:after:w-full py-1"
              >
                Actualités
              </a>
            </div>

            {/* Desktop CTA & Phone */}
            <div className="hidden lg:flex items-center lg:space-x-3 xl:space-x-5">
              <a
                href="tel:+590690590565"
                className="flex items-center gap-2 text-black hover:text-gray-800 font-semibold transition-colors group"
              >
                <div className="bg-black/10 p-2 rounded-full group-hover:bg-black/20 transition-colors">
                  <Phone className="w-4 h-4 text-black" />
                </div>
                <span className="lg:text-sm xl:text-base">+590 690 590 565</span>
              </a>
              <Link
                to="/Estimation"
                className="bg-black text-white font-bold lg:py-2 lg:px-4 xl:py-2.5 xl:px-6 rounded-xl hover:bg-gray-900 transition duration-300 shadow-[0_4px_14px_0_rgb(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transform tracking-wide text-sm xl:text-base"
              >
                Estimer votre bien
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(true)}
              className="lg:hidden p-2 -mr-2 text-black hover:bg-red-800 hover:text-white rounded-xl transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer (white background) */}
      <div
        className={`fixed top-0 right-0 h-full w-[85%] sm:w-[350px] bg-white z-[70] transform transition-transform duration-500 ease-in-out lg:hidden flex flex-col shadow-2xl border-l border-gray-100 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-1">
            <span className="font-extrabold text-2xl text-gray-900">Menu</span>
            <span className="w-2 h-2 rounded-full bg-primary mt-2"></span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-primary hover:bg-red-50 rounded-xl transition-colors bg-gray-50"
            aria-label="Fermer le menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
          <MobileNavLink to="/Acheter" onClick={() => setIsOpen(false)}>Acheter</MobileNavLink>
          <MobileNavLink to="/Vendre" onClick={() => setIsOpen(false)}>Vendre</MobileNavLink>
          <MobileNavLink to="/EliseBUIL" onClick={() => setIsOpen(false)}>Élise BUIL</MobileNavLink>
          <a
            href="https://blog.elisebuilimmobilierguadeloupe.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl text-lg font-bold text-gray-700 hover:text-primary hover:bg-red-50 transition-all border border-transparent hover:border-red-100 group"
          >
            Actualités
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors transform group-hover:translate-x-1" />
          </a>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
          <a
            href="tel:+590690590565"
            className="flex items-center justify-center gap-3 w-full bg-white border border-gray-200 text-gray-800 font-bold py-4 px-6 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <div className="bg-red-50 text-primary p-1.5 rounded-full">
               <Phone className="w-5 h-5" />
            </div>
            +590 690 590 565
          </a>
          <Link
            to="/Estimation"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center w-full bg-black text-white font-extrabold py-4 px-6 rounded-2xl hover:bg-gray-900 transition duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.3)] transform hover:-translate-y-1 text-lg"
          >
            Estimer votre bien
          </Link>
        </div>
      </div>
    </>
  )
}

// Helpers for cleaner code
const DesktopNavLink = ({ to, children }: { to: string, children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`font-medium py-1 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-black after:transition-all after:duration-300 hover:after:w-full ${
        isActive 
          ? 'text-black after:w-full' 
          : 'text-black/80 hover:text-black after:w-0'
      }`}
    >
      {children}
    </Link>
  )
}

const MobileNavLink = ({ to, children, onClick }: { to: string, children: React.ReactNode, onClick: () => void }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center justify-between p-4 rounded-2xl text-lg font-bold transition-all border ${
        isActive
          ? 'bg-red-50 border-red-100 text-primary'
          : 'text-gray-700 border-transparent hover:bg-gray-50 hover:text-primary hover:border-gray-100'
      } group`}
    >
      {children}
      <ChevronRight className={`w-5 h-5 transition-colors transform group-hover:translate-x-1 ${isActive ? 'text-primary' : 'text-gray-400 group-hover:text-primary'}`} />
    </Link>
  )
}

export default Navbar