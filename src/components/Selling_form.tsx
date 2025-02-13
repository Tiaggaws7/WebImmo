import React, { useState, } from 'react'
import { Helmet } from 'react-helmet-async';
import emailjs from 'emailjs-com';

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
    <div className="min-h-screen bg-white p-4 flex items-center justify-center">
      <Helmet>
        <title>Vendez Votre Bien Immobilier - Obtenez une Estimation Gratuite</title>
        <meta name="description" content="Obtenez une estimation gratuite de votre bien immobilier et bénéficiez d'un accompagnement complet pour la vente de votre maison ou appartement." />
        <meta name="keywords" content="vente immobilier, estimation gratuite, vendre maison, vendre appartement, immobilier France" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Elise Buil" />
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/Vendre" />
      </Helmet>
      <div 
        className="w-full max-w-5xl bg-white rounded-xl shadow-lg shadow-primary overflow-hidden flex flex-col lg:flex-row"
        style={{ maxHeight: '95vh' }}
      >
        <div className="lg:w-2/5 p-6 bg-primary text-white flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-4">Vendez Votre Bien</h1>
          <p className="text-lg mb-6">Obtenez une estimation gratuite dès aujourd'hui</p>
          <ul className="space-y-3 text-base">
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Analyse de marché experte
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Stratégie de vente personnalisée
            </li>
            <li className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              Accompagnement commercial, administratif et juridique
            </li>
          </ul>
        </div>

        {isSubmitted ? (
          <div className='w-2/4 mx-auto'>
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-xl text-center mb-6">Merci de votre confiance, nos experts reviennent vers vous d'ici 48 heures maximum</p>
              <button
                onClick={handleReset}
                className="w-full max-w-md flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
              >
                Je veux obtenir une autre estimation
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="lg:w-3/5 p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-1">Prénom</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
                placeholder="Jean"
              />
            </div>
            <div>
              <label htmlFor="surname" className="block text-base font-medium text-gray-700 mb-1">Nom de famille</label>
              <input
                type="text"
                id="surname"
                name="surname"
                required
                value={formData.surname}
                onChange={handleChange}
                className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
                placeholder="Dupont"
              />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-base font-medium text-gray-700 mb-1">Numéro de téléphone</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
              placeholder="06 12 34 56 78"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-base font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
              placeholder="jean.dupont@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="project" className="block text-base font-medium text-gray-700 mb-1">Votre Projet Immobilier</label>
            <textarea
              id="project"
              name="project"
              required
              rows={3}
              value={formData.project}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
              placeholder="Décrivez votre projet immobilier (par exemple, vendre une maison de 3 chambres sur Baie-Mahault...)"
            ></textarea>
          </div>
          <div>
            <label htmlFor="availability" className="block text-base font-medium text-gray-700 mb-1">Vos Disponibilités</label>
            <textarea
              id="availability"
              name="availability"
              required
              rows={3}
              value={formData.availability}
              onChange={handleChange}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-150 ease-in-out"
              placeholder="Par exemple, en semaine après 17h, week-ends de 9h à 17h"
            ></textarea>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition duration-150 ease-in-out"
            >
              Obtenez Votre Estimation Gratuite
            </button>
          </div>
        </form>
        )}

        
      </div>
    </div>
  )
}