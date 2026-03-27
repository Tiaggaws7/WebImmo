import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Helmet } from "react-helmet-async"

const NavigationPage = () => {
  const navigationLinks = [
    { to: "/", label: "Retour à l'accueil", icon: "🏡" },
    { to: "/Vendre", label: "Vendre votre bien", icon: "🏠" },
    { to: "/Acheter", label: "Acheter un bien", icon: "🔑" },
    // { to: "/Blog", label: "Découvrir nos actualités", icon: "📰" },
    { to: "/EliseBUIL", label: "Rencontrer Elise BUIL", icon: "👋" },
    { to: "/Estimation", label: "Estimer votre bien", icon: "📊" },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Helmet>
        <title>Page introuvable | Elise Buil Immobilier</title>
        <meta name="description" content="La page que vous recherchez est introuvable. Retournez à l'accueil ou explorez nos services immobiliers." />
        <meta name="keywords" content="404, page introuvable, immobilier Guadeloupe, achat maison, vente appartement" />
        <meta name="author" content="Elise Buil" />
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/" />
      </Helmet>
      <main className="flex-grow container mx-auto px-4 py-12">
        <p className="text-center">404 - page introuvable</p>
        <br/>
        <br/>
        <h1 className="text-3xl font-bold text-center mb-8">Où souhaitez-vous aller ?</h1>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
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
    </div>
  )
}

export default NavigationPage

