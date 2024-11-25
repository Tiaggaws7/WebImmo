import React from "react";

const WhoAmI3: React.FC = () => {
  return (
    <div className="bg-gray-100 text-gray-800">
      
      <main className="container mx-auto w-2/3 p-4">
        {/* Header */}
        <header className="bg-gray-800 text-white text-center py-6 rounded shadow">
          <h1 className="text-2xl font-bold">Marie Lefèvre</h1>
          <p className="text-lg">Agent Immobilier & Spécialiste en Rédaction de Mandats</p>
        </header>

        {/* About Section */}
        <section id="about" className="bg-white mt-6 p-6 rounded shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">À Propos de Moi</h2>
          <p className="text-gray-600 mb-4">
            Bienvenue sur ma page ! Je suis Marie Lefèvre, agent immobilier avec plus de 12 ans d'expérience dans le secteur. Spécialisée dans l'achat, la vente et la gestion de biens immobiliers, j’accompagne mes clients tout au long de leurs projets immobiliers. Mon expertise s'étend également à la rédaction de mandats, à la négociation de contrats et à l'application des lois en matière de transaction immobilière.
          </p>
          <p className="text-gray-600">
            Passionnée par l'immobilier, j'aide aussi bien les particuliers que les investisseurs à trouver les opportunités les plus adaptées à leurs besoins. Mon approche est basée sur l'écoute, la transparence et l'efficacité. Grâce à une parfaite maîtrise des réglementations en vigueur, je m'assure que chaque transaction soit en totale conformité avec la législation.
          </p>
        </section>

        {/* Expertise Section */}
        <section id="expertise" className="bg-white mt-6 p-6 rounded shadow">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Mon Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-200 p-4 rounded shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Vente et Location de Biens Immobiliers</h3>
              <p className="text-gray-600">
                Je possède une vaste expérience dans la vente et la location de biens résidentiels et commerciaux. Mon objectif est de guider mes clients à chaque étape, de l’évaluation du bien à la signature du contrat, en garantissant une transaction rapide et sûre.
              </p>
            </div>
            <div className="bg-gray-200 p-4 rounded shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Rédaction de Mandats Immobiliers</h3>
              <p className="text-gray-600">
                Je rédige des mandats de vente et de location conformes aux exigences légales, en veillant à la clarté des termes et à la protection des intérêts des deux parties. Chaque mandat est adapté aux spécificités du bien et aux attentes du client, tout en respectant les normes juridiques en vigueur.
              </p>
            </div>
            <div className="bg-gray-200 p-4 rounded shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Conseils Juridiques en Immobilier</h3>
              <p className="text-gray-600">
                Forte de mes connaissances approfondies en droit immobilier, je conseille mes clients sur les aspects juridiques des transactions, y compris les baux, les conflits de copropriété et la législation fiscale liée à l'immobilier. Je m'assure que toutes les démarches respectent les règles en vigueur.
              </p>
            </div>
            <div className="bg-gray-200 p-4 rounded shadow">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Négociation et Vente</h3>
              <p className="text-gray-600">
                Je suis également experte en négociation immobilière, cherchant à obtenir les meilleures conditions pour mes clients, tout en favorisant une relation de confiance et de transparence avec toutes les parties impliquées dans la transaction.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
<section id="contact" className="bg-white mt-6 p-6 rounded-lg shadow-lg">
  <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contactez-moi</h2>
  <form className="space-y-6">
    {/* Name Field */}
    <div>
      <label htmlFor="name" className="block text-sm font-medium text-gray-700">
        Nom :
      </label>
      <input
        type="text"
        id="name"
        name="name"
        required
        placeholder="Votre nom complet"
        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 px-4 py-2"
      />
    </div>

    {/* Email Field */}
    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        Email :
      </label>
      <input
        type="email"
        id="email"
        name="email"
        required
        placeholder="Votre adresse email"
        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 px-4 py-2"
      />
    </div>

    {/* Message Field */}
    <div>
      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
        Message :
      </label>
      <textarea
        id="message"
        name="message"
        rows={5}
        required
        placeholder="Votre message"
        className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 px-4 py-2"
      ></textarea>
    </div>

    {/* Submit Button */}
    <button
      type="submit"
      className="w-full bg-black text-white font-medium py-3 rounded-md shadow hover:bg-black-100 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 transition duration-150"
    >
      Envoyer le Message
    </button>
  </form>
</section>

      </main>

      <footer className="bg-gray-900 text-white text-center py-4 mt-8">
        <p>&copy; 2023 Marie Lefèvre. Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default WhoAmI3;
