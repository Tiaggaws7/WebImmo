import React, { useState } from "react";
import emailjs from "emailjs-com";

import profilePicture from "../assets/profile_picture.jpg"

const RealWhoAmI: React.FC = () => {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateID = import.meta.env.VITE_EMAILJS_VENDRE_TEMPLATE_ID;
      const userID = import.meta.env.VITE_EMAILJS_USER_ID;

      await emailjs.send(serviceID, templateID, formData, userID);

      setSuccessMessage("Votre message a été envoyé avec succès ! Merci de m'avoir contacté.");
    } catch (error) {
      console.error("EmailJS Error:", error);
      setErrorMessage("Une erreur s'est produite lors de l'envoi de votre message. Veuillez réessayer plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="bg-white text-gray-800">
      
      <main className="container mx-auto w-auto p-4">
        {/* Header */}
        <header className="bg-gray-800 text-white text-center py-6 rounded shadow">
          <h1 className="text-2xl font-bold">Elise BUIL</h1>
          <p className="text-lg">Vente / Location Immobilière</p>
          <p className="text-lg">Accompagnement Commercial, Administratif et Juridique
          </p>
        </header>

        {/* About Section */}
      <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center">À propos de moi</h2>
        <div className="flex flex-col md:flex-row items-center gap-8">
        <img
              src={profilePicture}
              alt="Elise BUIL"
              className="w-64 h-90 rounded-full object-cover"
            />
          <div>
              <p className="text-lg mb-4">
              Bien plus qu'un métier, une véritable passion!
              </p>
              <p className="text-lg mb-4">
              Riche d’une forte expérience dans le secteur de l’immobilier, je mets mon expertise à votre service pour vous accompagner dans toutes vos démarches liées à la vente de votre bien. Je mets un point d’honneur à développer une véritable relation basée sur l’écoute et le respect de vos besoins.  
              </p>
              <p className="text-lg mb-4">
              Issue d'une formation juridique en droit immobilier, je vous propose un accompagnement spécialisé dans la concrétisation de vos projets immobiliers, notamment en proposant la rédaction du compromis de vente en collaboration avec votre notaire , vous faisant ainsi bénéficier d'un temps précieux.
              </p>
              <p className="text-lg mb-4">
              Mon service de vente immobilière se distingue par une approche unique alliant expertise juridique et authentique relation d’échanges.
              </p>
              <p className="text-lg mb-4">
              N'hésitez pas à prendre contact avec moi pour échanger sur vos projets, je me ferai un plaisir de pouvoir répondre à vos questions.
              <br/> Ensemble, construisons une relation solide et fiable pour mener à bien votre vente immobilière en toute sécurité!              </p>
              <p className="text-lg">
              Au plaisir de vous rencontrer, 
              </p>
            </div>
        </div>
      </section>

        {/* Testimonials */}
        <section className="mb-12 bg-white p-6 rounded-lg shadow-md shadow-primary">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Témoignages Clients</h2>
          <div className="space-y-6">
            <blockquote className="italic text-gray-600 border-l-4 border-primary pl-4">
            " Nous sommes ravis de l'accompagnement et de la conscience professionnelle d'Elise pour la recherche et l'achat de notre maison. Nous la recommandons vivement." 
              <footer className="text-gray-500 mt-2">- Jennifer et Xavier ROLLAND</footer>
            </blockquote>
            <blockquote className="italic text-gray-600 border-l-4 border-primary pl-4">
            "Elise m'a permis de vendre mon appartement rapidement. Je la remercie pour sa disponibilité."
              <footer className="text-gray-500 mt-2">- Guillaume RABILLER</footer>
            </blockquote>
          </div>
        </section>

       {/* Contact Section */}
        <section id="contact" className="bg-white mt-6 p-6 rounded-lg shadow-md shadow-primary  ">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Contactez-moi</h2>
          {successMessage ? (
            <div className="text-center">
              <p className="text-green-500 text-xl font-semibold mb-4">{successMessage}</p>
              <button
                onClick={() => {
                  setSuccessMessage("");
                  setFormData({ name: "", email: "", phone: "", message: "" });
                }}
                className="bg-black text-white font-medium py-2 px-4 rounded-md shadow hover:bg-gray-800 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 transition duration-150"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={formData.name}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 px-4 py-2"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Téléphone :
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  placeholder="Votre numéro de téléphone"
                  value={formData.phone}
                  onChange={handleChange}
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
                  value={formData.message}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-300 focus:ring-opacity-50 px-4 py-2"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary text-white font-medium py-3 rounded-md shadow hover:bg-gray-800 focus:outline-none focus:ring focus:ring-blue-300 focus:ring-opacity-50 transition duration-150"
              >
                {isSubmitting ? "Envoi en cours..." : "Envoyer le Message"}
              </button>
            </form>
          )}
          
          {/* Error Message */}
          {errorMessage && (
            <p className="text-red-500 mt-4">{errorMessage}</p>
          )}
        </section>

    </main>
</div>
        )
}

export default RealWhoAmI

