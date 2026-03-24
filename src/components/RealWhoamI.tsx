import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import emailjs from "emailjs-com";
import profilePicture from "../assets/profile_picture.jpg";
import GoogleReviews from './GoogleReviews';
import { Handshake, Award, Mail, Star, Quote, ArrowRight, CheckCircle2 } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';
import { House } from '../types';

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
  const [expensiveHouseImage, setExpensiveHouseImage] = useState<string>("");

  useEffect(() => {
    const fetchExpensiveHouse = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'houses'));
        const housesData = querySnapshot.docs.map(doc => doc.data() as House);
        
        if (housesData.length > 0) {
          const mostExpensive = housesData.reduce((prev, current) => {
            const getPrice = (h: any) => Number(h.price?.toString().replace(/[^0-9.-]+/g, '') || h.prix?.toString().replace(/[^0-9.-]+/g, '')) || 0;
            return getPrice(current) > getPrice(prev) ? current : prev;
          }, housesData[0]);
          
          if (mostExpensive && mostExpensive.principalImage) {
            setExpensiveHouseImage(mostExpensive.principalImage);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des maisons :', error);
      }
    };
    fetchExpensiveHouse();
  }, []);

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

      const templateParams = {
        to_email: "tiagobuil.tb@gmail.com",
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      };

      await emailjs.send(serviceID, templateID, templateParams, userID);

      setSuccessMessage("Votre message a été envoyé avec succès ! Merci de m'avoir contacté.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      console.error("EmailJS Error:", error);
      setErrorMessage("Une erreur s'est produite lors de l'envoi de votre message. Veuillez réessayer plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#fafafa] min-h-screen font-sans text-gray-800">
      <Helmet>
        <title>À Propos de Elise BUIL - Vente et Location Immobilière</title>
        <meta name="description" content="Découvrez l'expertise d'Elise BUIL en vente et location immobilière. Un accompagnement personnalisé, juridique et commercial pour vos projets." />
        <meta name="keywords" content="Elise BUIL, immobilier, vente immobilière, location, accompagnement juridique, agent immobilier" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Elise Buil" />
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/elisebuil" />
      </Helmet>

      {/* Main Content wrapper */}
      <main className="flex-grow pt-8 md:pt-16">
        
        {/* Section 1: Hero */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <div className="md:w-1/2 flex flex-col justify-center">
            <span className="text-primary font-bold text-xs md:text-sm tracking-[0.2em] uppercase mb-4 md:mb-6">L'excellence sur mesure</span>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-gray-900 mb-8 leading-[1.05] tracking-tight">
              À propos <br/>de <span className="text-primary italic font-serif font-light">moi</span>
            </h1>
            <div className="text-gray-600 space-y-6 text-lg md:text-xl leading-relaxed font-light max-w-xl">
              <p className="font-semibold text-gray-900">
                Bien plus qu'un métier, une véritable passion!
              </p>
              <p>
                Riche d’une forte expérience dans le secteur de l’immobilier, je mets mon expertise à votre service pour vous accompagner dans toutes vos démarches liées à la vente de votre bien. Je mets un point d’honneur à développer une véritable relation basée sur l’écoute et le respect de vos besoins.
              </p>
            </div>
          </div>
          
          <div className="md:w-1/2 relative mt-8 md:mt-0 flex justify-center w-full">
             <div className="relative rounded-bl-[5rem] rounded-tr-[5rem] rounded-tl-2xl rounded-br-2xl overflow-hidden shadow-2xl group w-full max-w-lg aspect-[4/5]">
                <img src={profilePicture} alt="Elise BUIL" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
             </div>
             
             {/* Badge Overlapping */}
             <div className="absolute -bottom-8 -left-2 md:-left-8 bg-white p-6 md:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-10 w-64 border border-gray-100 transform transition-transform hover:-translate-y-2">
               <div className="font-extrabold text-2xl text-gray-900 mb-2 leading-tight">Expertise</div>
               <div className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                 Immobilière en Guadeloupe
               </div>
             </div>
          </div>
        </section>

        {/* Section 2: Vision Personnalisée (Grey Background) */}
        <section className="bg-[#f2f2f2] py-24 md:py-32 px-4 sm:px-6 lg:px-8 mt-24">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="lg:w-1/2">
               <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                 Une vision<br className="hidden md:block" /> <span className="text-primary">personnalisée</span>
               </h2>
               <div className="w-20 h-1.5 bg-primary mb-10 rounded-full"></div>
               <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-light max-w-xl">
                 Issue d'une formation juridique en droit immobilier, je vous propose un accompagnement spécialisé dans la concrétisation de vos projets immobiliers, notamment en proposant la rédaction du compromis de vente en collaboration avec votre notaire , vous faisant ainsi bénéficier d'un temps précieux.
               </p>
            </div>
            
            <div className="lg:w-1/2 flex flex-col sm:flex-row gap-6 lg:gap-8 w-full">
               {/* Card 1 */}
               <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg flex-1 border border-transparent hover:border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                 <div className="text-primary bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                   <Handshake className="w-8 h-8" strokeWidth={2} />
                 </div>
                 <h3 className="text-gray-900 font-extrabold text-2xl mb-4">Confiance</h3>
                 <p className="text-gray-500 text-base leading-relaxed font-light">
                   Un accompagnement transparent et honnête à chaque étape du processus.
                 </p>
               </div>
               {/* Card 2 */}
               <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg flex-1 border border-transparent hover:border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 mt-0 sm:mt-16">
                 <div className="text-primary bg-red-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                   <Award className="w-8 h-8" strokeWidth={2} />
                 </div>
                 <h3 className="text-gray-900 font-extrabold text-2xl mb-4">Excellence</h3>
                 <p className="text-gray-500 text-base leading-relaxed font-light">
                   Une rigueur absolue dans la sélection des biens et le suivi administratif.
                 </p>
               </div>
            </div>
          </div>
        </section>

        {/* Section 3: Bento Grid Style */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 auto-rows-fr">
             
             {/* Large Image Block */}
             <div className="lg:col-span-7 rounded-[2rem] overflow-hidden shadow-xl relative min-h-[400px] lg:min-h-[500px] group bg-gray-200">
               {expensiveHouseImage && (
                 <img src={expensiveHouseImage} alt="L'immobilier d'exception" className="w-full h-full object-cover absolute inset-0 transition-transform duration-1000 group-hover:scale-105" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
               <div className="absolute bottom-10 left-10 right-10">
                 <h3 className="text-white font-extrabold text-3xl md:text-4xl mb-3 tracking-tight">L'immobilier d'exception</h3>
                 <p className="text-white/80 text-lg font-light">Une sélection rigoureuse de propriétés uniques.</p>
               </div>
             </div>

             {/* Right Column Grid container */}
             <div className="lg:col-span-5 flex flex-col gap-6 lg:gap-8">
               
               {/* Red Box */}
               <div className="bg-primary rounded-[2rem] p-10 md:p-12 shadow-xl flex flex-col justify-center text-white flex-1 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150"></div>
                  <h3 className="text-3xl md:text-4xl font-extrabold mb-6 leading-tight tracking-tight italic relative z-10">
                    "Une approche unique"
                  </h3>
                  <p className="text-white/90 text-lg leading-relaxed font-light relative z-10">
                    Mon service de vente immobilière se distingue par une approche unique alliant expertise juridique et authentique relation d’échanges.
                  </p>
               </div>

               {/* Bottom 2 boxes */}
               <div className="flex flex-col sm:flex-row gap-6 lg:gap-8 flex-1">
                 
                 {/* Google Reviews Metro Box */}
                 <div className="bg-[#f0f0f0] rounded-[2rem] p-8 shadow-inner flex-1 flex flex-col justify-center items-center text-center transition-transform duration-300 hover:scale-[1.03] border border-gray-200">
                   <div className="flex gap-1.5 mb-4 text-[#fbbc04]">
                     {[1,2,3,4,5].map((i) => <Star key={i} className="w-7 h-7 md:w-8 md:h-8 fill-current" />)}
                   </div>
                   <div className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-2 tracking-tighter">5.0</div>
                   <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">Avis Google</div>
                 </div>

                 {/* Contact Call to action Box */}
                 <div 
                   onClick={scrollToContact}
                   className="bg-gray-900 rounded-[2rem] p-8 lg:p-10 shadow-xl flex-1 flex flex-col justify-center items-start cursor-pointer group hover:bg-black transition-colors border border-gray-800 relative overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                   <div className="bg-white/10 p-3 rounded-2xl mb-6 relative z-10">
                     <Mail className="w-8 h-8 text-primary" />
                   </div>
                   <h4 className="text-white font-extrabold text-xl md:text-2xl mb-3 relative z-10">Prêt à échanger ?</h4>
                   <p className="text-primary text-base font-bold flex items-center gap-2 group-hover:gap-4 transition-all relative z-10">
                     Me contacter <ArrowRight className="w-5 h-5" />
                   </p>
                 </div>

               </div>
             </div>
          </div>
        </section>

        {/* Section 4: Bottom Quote */}
        <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-white text-center flex flex-col items-center justify-center max-w-5xl mx-auto">
          <Quote className="text-red-100 w-16 h-16 md:w-24 md:h-24 mb-10 mx-auto transform -scale-x-100" fill="currentColor" />
          <p className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-500 italic leading-snug md:leading-tight mb-12 px-4 md:px-10">
             N'hésitez pas à prendre contact avec moi pour échanger sur vos projets, je me ferai un plaisir de pouvoir répondre à vos questions. Ensemble, construisons une relation solide et fiable pour mener à bien votre vente immobilière en toute sécurité!
          </p>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="w-12 h-[2px] bg-primary"></div>
            <span className="text-primary font-extrabold tracking-[0.3em] uppercase text-sm md:text-base">ELISE BUIL</span>
            <div className="w-12 h-[2px] bg-primary"></div>
          </div>
          <p className="text-gray-400 mt-8 font-medium text-lg uppercase tracking-widest">Au plaisir de vous rencontrer</p>
        </section>

        {/* Testimonials - Google Reviews Section */}
        <section className="bg-[#f5f5f5] py-24 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
               <span className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-4 block">Avis Certifiés</span>
               <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">Témoignages Clients</h2>
               <div className="w-20 h-1.5 bg-primary mx-auto rounded-full"></div>
            </div>
            <GoogleReviews />
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto bg-[#fafafa] p-8 md:p-16 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50">
            <div className="text-center mb-12">
              <span className="text-primary font-bold text-sm tracking-[0.2em] uppercase mb-4 block">Échangeons</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Contactez-moi</h2>
              <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto">Remplissez le formulaire ci-dessous et je reviendrai vers vous pour discuter de votre projet immobilier avec passion et expertise.</p>
            </div>
            
            {successMessage ? (
              <div className="text-center py-12 px-6 bg-white rounded-3xl shadow-sm border border-green-50">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 text-green-500 mb-8 shadow-sm">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <p className="text-gray-900 text-2xl font-extrabold mb-8">{successMessage}</p>
                <button
                  onClick={() => {
                    setSuccessMessage("");
                    setFormData({ name: "", email: "", phone: "", message: "" });
                  }}
                  className="bg-gray-900 text-white font-bold py-4 px-10 rounded-xl shadow-lg hover:bg-black transition-all transform hover:-translate-y-1"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form className="space-y-8" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Name Field */}
                  <div className="group">
                    <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-3 ml-1 group-focus-within:text-primary transition-colors">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      placeholder="Jean Dupont"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring focus:ring-primary/10 bg-white px-6 py-4 outline-none transition-all shadow-[0_5px_15px_rgba(0,0,0,0.02)]"
                    />
                  </div>

                  {/* Phone Field */}
                  <div className="group">
                    <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-3 ml-1 group-focus-within:text-primary transition-colors">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      placeholder="06 90 ..."
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring focus:ring-primary/10 bg-white px-6 py-4 outline-none transition-all shadow-[0_5px_15px_rgba(0,0,0,0.02)]"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-3 ml-1 group-focus-within:text-primary transition-colors">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="jean.dupont@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring focus:ring-primary/10 bg-white px-6 py-4 outline-none transition-all shadow-[0_5px_15px_rgba(0,0,0,0.02)]"
                  />
                </div>

                {/* Message Field */}
                <div className="group">
                  <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-3 ml-1 group-focus-within:text-primary transition-colors">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    placeholder="Parlez-moi de votre projet immobilier..."
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full rounded-2xl border-gray-200 shadow-sm focus:border-primary focus:ring focus:ring-primary/10 bg-white px-6 py-4 outline-none transition-all shadow-[0_5px_15px_rgba(0,0,0,0.02)] resize-none"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-primary text-white font-extrabold text-lg py-5 rounded-2xl shadow-[0_10px_30px_rgb(217,1,21,0.25)] hover:shadow-[0_15px_40px_rgb(217,1,21,0.35)] hover:bg-red-700 focus:outline-none transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-3 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Envoi en cours...
                    </>
                  ) : "Envoyer mon message"}
                </button>
                
                {errorMessage && (
                  <p className="text-red-500 text-center font-bold mt-6 bg-red-50 p-4 rounded-xl">{errorMessage}</p>
                )}
              </form>
            )}
          </div>
        </section>

      </main>
    </div>
  );
};

export default RealWhoAmI;

