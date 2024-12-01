import React from "react";

const RealWhoAmI: React.FC = () => {
  return (
    <div className="bg-gray-100 text-gray-800">
      
      <main className="container mx-auto w-2/3 p-4">
        {/* Header */}
        <header className="bg-gray-800 text-white text-center py-6 rounded shadow">
          <h1 className="text-2xl font-bold">Marie Lefèvre</h1>
          <p className="text-lg">Agent Immobilier & Spécialiste en Rédaction de Mandats</p>
        </header>

        {/* About Section */}
      <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">À propos de moi</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <img
            src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80"
            alt="Jane Doe"
            className="w-64 h-64 rounded-full object-cover"
          />
          <div>
            <p className="text-lg mb-4">
              Avec plus de 10 ans d'expérience dans le secteur de l'immobilier, j'ai aidé de nombreuses familles à trouver leur maison de rêve et des investisseurs à acquérir des propriétés lucratives. Ma passion pour l'immobilier et mon engagement envers la réussite de mes clients me distinguent dans ce marché compétitif.
            </p>
            <p className="text-lg">
              Je crois en l'établissement de relations durables avec mes clients, en offrant un service personnalisé et en utilisant des technologies de pointe pour simplifier le processus d'achat et de vente. Que vous soyez un primo-accédant ou un investisseur expérimenté, je suis là pour vous guider à chaque étape.
            </p>
          </div>
        </div>
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
</div>
        )
}

export default RealWhoAmI