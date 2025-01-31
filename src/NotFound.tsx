import { Link } from "react-router-dom"
import { ArrowRight, User } from "lucide-react"

const NavigationPage = () => {
  const navigationLinks = [
    { to: "/", label: "Retour à l'accueil", icon: "🏡" },
    { to: "/Vendre", label: "Vendre votre bien", icon: "🏠" },
    { to: "/Acheter", label: "Acheter un bien", icon: "🔑" },
    { to: "/Blog", label: "Découvrir nos actualités", icon: "📰" },
    { to: "/EliseBUIL", label: "Rencontrer Elise BUIL", icon: "👋" },
    { to: "/Estimation", label: "Estimer votre bien", icon: "📊" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-8">Où souhaitez-vous aller ?</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {navigationLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center justify-between p-6 bg-white shadow-md rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-4">{link.icon}</span>
                <span className="text-lg font-medium">{link.label}</span>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="container mx-auto px-4">
          <div className="mt-4 text-center">
            <Link to="/Gestion" className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center">
              <User className="h-4 w-4 mr-2" />
              Mon compte
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default NavigationPage

