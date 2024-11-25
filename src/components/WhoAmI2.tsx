import { Star, Award, Phone, Mail, MapPin } from 'lucide-react'
import profilePicture from "../assets/houseGwada.jpg"

export default function WhoAmI2() {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="mb-12 text-center">
  <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-full mb-4">
    <img
      src={profilePicture}
      alt="Jane Doe"
      className="object-cover h-full w-full"
    />
  </div>
  <h1 className="text-4xl font-bold text-gray-800">Jane Doe</h1>
  <p className="text-xl text-gray-600">Spécialiste en Immobilier de Luxe</p>
</header>


        {/* About Section */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">À propos de moi</h2>
          <p className="text-gray-600 leading-relaxed">
            Forte de plus de 15 ans d'expérience dans l'immobilier, je me spécialise dans les propriétés de luxe avec une passion pour aider mes clients à trouver la maison de leurs rêves. Mon approche combine une connaissance approfondie du marché, un service personnalisé et un engagement envers l'excellence dans chaque transaction.
          </p>
        </section>

        {/* Skills Section */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Mes Compétences</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Négociation', 'Analyse du marché', 'Évaluation des biens', 'Relations clients', 'Marketing digital', 'Gestion des contrats'].map((skill) => (
              <li key={skill} className="flex items-center">
                <Star className="text-yellow-500 mr-2" />
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Experience and Achievements */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Expériences & Réalisations</h2>
          <ul className="space-y-4">
            <li className="flex items-start">
              <Award className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Top 1% des Agents Immobiliers à l'Échelle Nationale</h3>
                <p className="text-gray-600">Classée parmi les 1% meilleurs agents en volume de ventes</p>
              </div>
            </li>
            <li className="flex items-start">
              <Award className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Plus de 500M€ de Ventes</h3>
                <p className="text-gray-600">Plus d'un demi-milliard d'euros en transactions immobilières réussies</p>
              </div>
            </li>
            <li className="flex items-start">
              <Award className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Certification en Propriétés de Luxe</h3>
                <p className="text-gray-600">Formation spécialisée dans les marchés immobiliers haut de gamme</p>
              </div>
            </li>
          </ul>
        </section>

        {/* Testimonials */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Témoignages Clients</h2>
          <div className="space-y-6">
            <blockquote className="italic text-gray-600 border-l-4 border-blue-500 pl-4">
              "L'expertise et le dévouement de Jane ont rendu notre achat de maison fluide et agréable. Son attention aux détails et sa connaissance du marché sont incomparables."
              <footer className="text-gray-500 mt-2">- John & Sarah M.</footer>
            </blockquote>
            <blockquote className="italic text-gray-600 border-l-4 border-blue-500 pl-4">
              "Travailler avec Jane pour vendre notre propriété a été une expérience fantastique. Sa stratégie marketing et ses talents de négociation ont abouti à un prix de vente supérieur à nos attentes."
              <footer className="text-gray-500 mt-2">- Robert L.</footer>
            </blockquote>
          </div>
        </section>

        {/* Contact Information */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Me Contacter</h2>
          <div className="space-y-4">
            <p className="flex items-center">
              <Phone className="text-blue-500 mr-2" />
              <a href="tel:+11234567890" className="text-gray-600 hover:text-blue-500">06 23 45 67 89</a>
            </p>
            <p className="flex items-center">
              <Mail className="text-blue-500 mr-2" />
              <a href="mailto:jane.doe@immobilier.fr" className="text-gray-600 hover:text-blue-500">jane.doe@immobilier.fr</a>
            </p>
            <p className="flex items-center">
              <MapPin className="text-blue-500 mr-2" />
              <span className="text-gray-600">123 Rue du Luxe, Prestige Ville, FR 75001</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
