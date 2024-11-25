import React from 'react';

const WhoAmI1: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative h-[50vh] bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1973&q=80')" }}>
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Jane Doe</h1>
            <p className="text-xl text-white">Votre professionnelle de l'immobilier de confiance</p>
          </div>
        </div>
      </section>

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

      {/* Skills Section */}
      <section className="py-16 px-4 md:px-8 bg-gray-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Mes Compétences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Analyse du marché",
              "Négociation",
              "Évaluation des biens",
              "Stratégie marketing",
              "Relations clients",
              "Gestion des contrats"
            ].map((skill, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-2">{skill}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${Math.floor(Math.random() * 20) + 80}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">Ce que disent mes clients</h2>
        <blockquote className="italic text-xl text-center">
          "L'expertise et le dévouement de Jane ont rendu notre expérience d'achat de maison fluide et agréable. Elle va vraiment au-delà pour ses clients !"
          <footer className="text-base font-semibold mt-4">- Sarah Johnson, Propriétaire comblée</footer>
        </blockquote>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 md:px-8 bg-blue-600 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Prêt à trouver votre maison de rêve ?</h2>
        <p className="text-xl mb-8">Travaillons ensemble pour concrétiser vos objectifs immobiliers.</p>
        <button className="bg-white text-blue-600 font-bold py-2 px-6 rounded-full text-lg hover:bg-blue-100 transition duration-300">
          Contactez-moi dès aujourd'hui
        </button>
      </section>
    </div>
  );
};

export default WhoAmI1;
