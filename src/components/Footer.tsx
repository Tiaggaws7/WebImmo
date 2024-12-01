import { Link } from 'react-router-dom'
import { Phone } from 'lucide-react'

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
            <h3 className="text-lg font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li><Link to="/Vendre" className="text-sm hover:underline">Vendre</Link></li>
              <li><Link to="/Acheter" className="text-sm hover:underline">Acheter</Link></li>
              <li><Link to="/Blog" className="text-sm hover:underline">Nos guides</Link></li>
              <li><Link to="/NomPrenom" className="text-sm hover:underline">Nom Prenom</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contactez-nous</h3>
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2" />
              <a href="tel:+33789985632" className="text-sm hover:underline">+33 7 89 98 56 32</a>
            </div>
            <Link
              to="/Estimation"
              className="inline-block mt-4 bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors text-center"
            >
              Estimer votre bien
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-gray-700 text-center text-sm">
          &copy; {new Date().getFullYear()} investimmo. Tous droits réservés.
        </div>
      </div>
    </footer>
  )
}

export default Footer

