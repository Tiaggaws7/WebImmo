import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">investimmo</h3>
            <p className="text-sm">Votre partenaire de confiance en immobilier</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li><Link to="/properties" className="text-sm hover:underline">Propriétés</Link></li>
              <li><Link to="/about" className="text-sm hover:underline">À propos de nous</Link></li>
              <li><Link to="/contact" className="text-sm hover:underline">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contactez-nous</h3>
            <ul className="space-y-2">
              <li className="flex items-center"><Phone className="h-4 w-4 mr-2" /> <span className="text-sm">+1 (123) 456-7890</span></li>
              <li className="flex items-center"><Mail className="h-4 w-4 mr-2" /> <span className="text-sm">info@investimmo.com</span></li>
              <li className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> <span className="text-sm">123 Rue de l'Immobilier, Ville, Pays</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm">
          &copy; {new Date().getFullYear()} investimmo. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}
export default Footer;
