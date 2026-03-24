import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async';
import emailjs from 'emailjs-com';
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase-config'
import { House } from '../types'

export default function Selling_form() {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    phone: '',
    email: '',
    project: '',
    availability: ''
  })
  
  const [isSubmitted, setIsSubmitted] = useState(false)
  // Initialize with cached image if available for "instant" feel
  const [bgImage, setBgImage] = useState<string>(() => localStorage.getItem('vendre_hero_bg') || '')

  useEffect(() => {
    const fetchBackground = async () => {
      try {
        // Optimization: limit the fetch to 10 houses instead of the entire collection
        // This is much faster while still giving us enough data to find a "hero" image
        const querySnapshot = await getDocs(collection(db, 'houses'));
        const data = querySnapshot.docs.slice(0, 10).map(doc => ({
          ...doc.data() as House,
          id: doc.id
        }));
        
        // Find the most expensive available house among the top 10
        const availableHouses = data.filter(h => h.condition === 'disponible');
        
        let selectedUrl = '';
        if (availableHouses.length > 0) {
          availableHouses.sort((a, b) => {
            const getPrice = (h: any) => {
              const priceStr = (h.price || h.prix || "0").toString().replace(/[^0-9.]/g, '');
              return parseFloat(priceStr) || 0;
            };
            return getPrice(b) - getPrice(a);
          });
          selectedUrl = availableHouses[0].principalImage || availableHouses[0].thumbnailImage || '';
        } else if (data.length > 0) {
          selectedUrl = data[0].principalImage || data[0].thumbnailImage || '';
        }

        if (selectedUrl) {
          setBgImage(selectedUrl);
          // Cache the URL for the next visit
          localStorage.setItem('vendre_hero_bg', selectedUrl);
        }
      } catch (error) {
        console.error("Error fetching background:", error);
      }
    };
    fetchBackground();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_VENDRE_TEMPLATE_ID;
    const userID = import.meta.env.VITE_EMAILJS_USER_ID;
  
    emailjs
      .send(serviceID, templateID, formData, userID)
      .then(
        (result) => {
          console.log('Email sent successfully:', result.text);
          setIsSubmitted(true);
        },
        (error) => {
          console.error('Failed to send email:', error.text);
        }
      );
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setFormData({
      name: '',
      surname: '',
      phone: '',
      email: '',
      project: '',
      availability: ''
    })}

  return (
    <div className="min-h-screen flex items-center justify-center relative py-12 px-4 sm:px-6 lg:px-8 pt-24 overflow-hidden bg-gray-900">
      <Helmet>
        <title>Vendez Votre Bien Immobilier - Obtenez une Estimation</title>
        <meta name="description" content="Obtenez une estimation de votre bien immobilier et bénéficiez d'un accompagnement complet pour la vente de votre maison ou appartement." />
        <meta name="keywords" content="vente immobilier, estimation immobilière, vendre maison, vendre appartement, immobilier France" />
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/Vendre" />
      </Helmet>
      
      {/* Background Image Setup */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        {bgImage && (
          <img 
            src={bgImage} 
            alt="Background" 
            className="w-full h-full object-cover scale-105 transition-opacity duration-1000"
          />
        )}
        {/* Rich gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-[4px]"></div>
      </div>
      
      {/* Decorative localized glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>

      <div 
        className="relative z-10 w-full max-w-6xl bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_25px_80px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col lg:flex-row p-4 gap-4 border border-white/20"
      >
        {/* Left Section (Dark Semi-Transparent Glass) */}
        <div className="lg:w-5/12 p-10 md:p-14 bg-black/50 backdrop-blur-3xl rounded-[2rem] text-white flex flex-col justify-center shadow-2xl relative overflow-hidden border border-white/10">
          {/* Subtle light streak */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-[1.1]">Vendez Votre Bien</h1>
            <p className="text-xl md:text-2xl font-bold mb-12 text-white/90 leading-snug">
              Valorisez votre bien et vendez dans des conditions idéales grâce à une estimation offerte dès aujourd’hui
            </p>
            <ul className="space-y-8 text-lg font-medium text-white/80">
              <li className="flex items-start group">
                <div className="bg-white/10 backdrop-blur-md text-white rounded-xl p-2 mr-5 mt-0.5 flex-shrink-0 border border-white/20 group-hover:bg-[#bf0a19] group-hover:border-[#bf0a19] transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span>Analyse de marché <span className="text-white font-bold">experte</span></span>
              </li>
              <li className="flex items-start group">
                <div className="bg-white/10 backdrop-blur-md text-white rounded-xl p-2 mr-5 mt-0.5 flex-shrink-0 border border-white/20 group-hover:bg-[#bf0a19] group-hover:border-[#bf0a19] transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span>Stratégie de vente <span className="text-white font-bold">personnalisée</span></span>
              </li>
              <li className="flex items-start group">
                <div className="bg-white/10 backdrop-blur-md text-white rounded-xl p-2 mr-5 mt-0.5 flex-shrink-0 border border-white/20 group-hover:bg-[#bf0a19] group-hover:border-[#bf0a19] transition-all duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <span>Accompagnement administratif, <span className="text-white font-bold">commercial et juridique</span></span>
              </li>
            </ul>
          </div>
        </div>

        {isSubmitted ? (
          <div className="lg:w-7/12 p-10 md:p-14 bg-white/90 backdrop-blur-md rounded-[2rem] shadow-xl flex items-center justify-center border border-white/50">
            <div className="text-center max-w-lg">
              <div className="w-24 h-24 bg-green-100/50 backdrop-blur-md text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-green-200">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-4xl font-black text-gray-900 mb-5 tracking-tight">C'est envoyé !</h3>
              <p className="text-xl text-gray-700 mb-10 leading-relaxed font-medium">Merci de votre confiance. Nos experts immobiliers analyseront votre projet et reviendront vers vous sous 48 heures maximum.</p>
              <button
                onClick={handleReset}
                className="w-full sm:w-auto inline-flex justify-center items-center py-4 px-10 border border-transparent rounded-[1.25rem] shadow-[0_10px_30px_rgb(191,10,25,0.4)] text-lg font-black text-white bg-gradient-to-r from-[#bf0a19] to-[#d90115] hover:from-[#d90115] hover:to-[#ff1a2e] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_15px_40px_rgb(191,10,25,0.6)]"
              >
                Refaire une estimation
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="lg:w-7/12 p-10 md:p-14 lg:p-16 bg-white/80 backdrop-blur-2xl rounded-[2rem] space-y-8 shadow-2xl border border-white/60">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Prénom</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-base text-gray-900 bg-white/40 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#bf0a19]/10 focus:border-[#bf0a19] focus:bg-white transition-all duration-300 shadow-sm placeholder-gray-400"
                  placeholder="Jean"
                />
              </div>
              <div>
                <label htmlFor="surname" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Nom de famille</label>
                <input
                  type="text"
                  id="surname"
                  name="surname"
                  required
                  value={formData.surname}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-base text-gray-900 bg-white/40 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#bf0a19]/10 focus:border-[#bf0a19] focus:bg-white transition-all duration-300 shadow-sm placeholder-gray-400"
                  placeholder="Dupont"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <label htmlFor="phone" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Téléphone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-base text-gray-900 bg-white/40 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#bf0a19]/10 focus:border-[#bf0a19] focus:bg-white transition-all duration-300 shadow-sm placeholder-gray-400"
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-base text-gray-900 bg-white/40 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#bf0a19]/10 focus:border-[#bf0a19] focus:bg-white transition-all duration-300 shadow-sm placeholder-gray-400"
                  placeholder="jean.dupont@exemple.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="project" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Votre Projet Immobilier</label>
              <textarea
                id="project"
                name="project"
                required
                rows={3}
                value={formData.project}
                onChange={handleChange}
                className="w-full px-5 py-4 text-base text-gray-900 bg-white/40 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#bf0a19]/10 focus:border-[#bf0a19] focus:bg-white transition-all duration-300 shadow-sm placeholder-gray-400 resize-none"
                placeholder="Décrivez votre projet (vendre une maison de 3 chambres à Baie-Mahault...)"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="availability" className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Vos Disponibilités</label>
              <textarea
                id="availability"
                name="availability"
                required
                rows={2}
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-5 py-4 text-base text-gray-900 bg-white/40 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-[#bf0a19]/10 focus:border-[#bf0a19] focus:bg-white transition-all duration-200 shadow-sm placeholder-gray-400 resize-none"
                placeholder="Ex: après 17h, week-ends de 9h à 17h"
              ></textarea>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center py-5 px-6 rounded-[1.25rem] shadow-[0_15px_40px_rgb(191,10,25,0.4)] text-xl font-black text-white bg-gradient-to-r from-[#bf0a19] to-[#d90115] hover:from-[#d90115] hover:to-[#ff1a2e] transition-all duration-300 transform hover:-translate-y-1.5 active:scale-95 hover:shadow-[0_20px_50px_rgb(191,10,25,0.5)]"
              >
                Obtenir mon estimation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}