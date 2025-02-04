'use client'

import { useState, useEffect } from 'react'
import { MapPin, Home, Building, Map, Store, CheckSquare, User, ChevronLeft, Lock, ArrowRight } from 'lucide-react'
import emailjs from 'emailjs-com';

type FormData = {
  address: string
  propertyType: 'appartement' | 'maison' | 'terrain' | 'local commercial' | ''
  livingArea: string
  landArea: string
  floors: string
  rooms: string
  bedrooms: string
  constructionPeriod: string
  condition: string
  features: string[]
  saleTimeline: string
  contact: {
    gender: 'monsieur' | 'madame' | ''
    firstName: string
    lastName: string
    email: string
    phone: string
  }
}

const stepIcons = [MapPin, Building, Home, CheckSquare, User]

export default function ModernRealEstateForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    address: '',
    propertyType: '',
    livingArea: '',
    landArea: '',
    floors: '',
    rooms: '',
    bedrooms: '',
    constructionPeriod: '',
    condition: '',
    features: [],
    saleTimeline: '',
    contact: {
      gender: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  })
  const [showFinalMessage, setShowFinalMessage] = useState(false)
  const [isStepValid, setIsStepValid] = useState(false)

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const updateContactData = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: value
      }
    }))
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const handleNext = () => {
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
      setIsStepValid(false)
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    setIsStepValid(false)
  }

  const handleSubmit = async () => {
    if (!isStepValid) return;

    // Prepare email data
    const templateParams = {
      address: formData.address,
      propertyType: formData.propertyType,
      livingArea: formData.livingArea,
      landArea: formData.landArea,
      floors: formData.floors,
      rooms: formData.rooms,
      bedrooms: formData.bedrooms,
      features: formData.features.join(', '),
      contactGender: formData.contact.gender,
      contactFirstName: formData.contact.firstName,
      contactLastName: formData.contact.lastName,
      contactEmail: formData.contact.email,
      contactPhone: formData.contact.phone,
    };
    

    const serviceID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateID = import.meta.env.VITE_EMAILJS_ESTIMATION_TEMPLATE_ID;
    const userID = import.meta.env.VITE_EMAILJS_USER_ID;

    try {
      emailjs.init(userID);
      await emailjs.send(
        serviceID,
        templateID,
        templateParams
      );
      setShowFinalMessage(true);
    } catch (error) {
      console.error('Error sending email:', error);
      // Handle error appropriately, e.g., display an error message to the user.
    }
  };

  useEffect(() => {
    const progressBar = document.querySelector('.progress-bar') as HTMLElement
    if (progressBar) {
      progressBar.style.width = `${(currentStep - 1) * 25}%`
    }

    // Validate current step
    switch (currentStep) {
      case 1:
        setIsStepValid(formData.address.length > 0)
        break
      case 2:
        setIsStepValid(formData.propertyType !== '')
        break
      case 3:
        setIsStepValid(
          formData.livingArea !== '' &&
          formData.landArea !== '' &&
          formData.floors !== '' &&
          formData.rooms !== '' &&
          formData.bedrooms !== ''
        )
        break
      case 4:
        setIsStepValid(formData.features.length > 0)
        break
      case 5:
        setIsStepValid(
          formData.contact.gender !== '' &&
          formData.contact.firstName !== '' &&
          formData.contact.lastName !== '' &&
          formData.contact.email !== '' &&
          formData.contact.phone !== ''
        )
        break
      default:
        setIsStepValid(false)
    }
  }, [currentStep, formData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {stepIcons.map((Icon, index) => (
              <div
                key={index}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  index + 1 === currentStep
                    ? 'bg-primary text-white pulse'
                    : index + 1 < currentStep
                    ? 'bg-gray-200 text-primary'
                    : 'bg-gray-200 text-primary'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
            ))}
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="progress-bar h-full bg-primary transition-all duration-500 ease-out" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg shadow-primary">
          <div className={`slide-in`} key={currentStep}>
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 fade-in">
                  Où se situe votre bien ?
                </h2>
                <div className="space-y-4 fade-in">
                  <label htmlFor="address" className="block text-lg font-medium text-gray-700">
                    Adresse du bien à estimer
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="12 rue Saint Denis, 75011 Paris"
                      className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Property Type */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 fade-in">
                  Quel type de bien souhaitez-vous estimer ?
                </h2>
                <div className="grid grid-cols-2 gap-4 fade-in">
                  {[
                    { id: 'appartement', label: 'Un appartement', icon: Building },
                    { id: 'maison', label: 'Une maison', icon: Home },
                    { id: 'terrain', label: 'Un Terrain', icon: Map },
                    { id: 'local commercial', label: 'Un local commercial', icon: Store }
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => updateFormData('propertyType', type.id)}
                      className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 ${
                        formData.propertyType === type.id
                          ? 'border-primary bg-primary-50 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50'
                      }`}
                    >
                      <type.icon className="mb-4 h-16 w-16" />
                      <span className="text-lg font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Property Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 fade-in">
                  Détails de votre bien
                </h2>
                <div className="grid grid-cols-2 gap-4 fade-in">
                  {[
                    { id: 'livingArea', label: 'Surface habitable', unit: 'm²' },
                    { id: 'landArea', label: 'Surface du terrain', unit: 'm²' },
                    { id: 'floors', label: 'Nombre de niveaux' },
                    { id: 'rooms', label: 'Nombre de pièces' },
                    { id: 'bedrooms', label: 'Nombre de chambres' }
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <div className="flex items-center">
                        <input
                          id={field.id}
                          type="number"
                          value={formData[field.id as keyof typeof formData] as string}
                          onChange={(e) => updateFormData(field.id, e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                        />
                        {field.unit && (
                          <span className="ml-2 text-sm text-gray-500">{field.unit}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Features */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 fade-in">
                  Caractéristiques spécifiques
                </h2>
                <div className="grid grid-cols-2 gap-4 fade-in">
                  {['Terrasse', 'Parking', 'Garage', 'Piscine', 'Aucun'].map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`py-4 rounded-lg border-2 transition-all duration-300 ${
                        formData.features.includes(feature)
                          ? 'border-primary bg-red-100 text-primary'
                          : 'border-gray-200 text-gray-600 hover:border-primary hover:bg-red-50'
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Contact Information */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center fade-in">
                  <h2 className="text-3xl font-bold text-gray-800">
                    Votre estimation est prête !
                  </h2>
                  <p className="mt-2 text-gray-600">
                    Renseignez ces informations pour recevoir votre estimation.
                  </p>
                </div>
                <div className="space-y-4 fade-in">
                  <div className="flex justify-center gap-4">
                    {['monsieur', 'madame'].map((gender) => (
                      <button
                        key={gender}
                        onClick={() => updateContactData('gender', gender)}
                        className={`px-6 py-2 rounded-full text-lg transition-all duration-300 ${
                          formData.contact.gender === gender
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </button>
                    ))}
                  </div>
                  {[
                    { id: 'firstName', label: 'Prénom', placeholder: 'Caroline' },
                    { id: 'lastName', label: 'Nom', placeholder: 'Gomez' },
                    {
                      id: 'email',
                      label: 'Adresse mail',
                      placeholder: 'carolinegomez@gmail.com',
                      type: 'email'
                    },
                    {
                      id: 'phone',
                      label: 'Téléphone',
                      placeholder: '07 89 78 65 89',
                      type: 'tel'
                    }
                  ].map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <input
                        id={field.id}
                        type={field.type || 'text'}
                        value={formData.contact[field.id as keyof typeof formData.contact]}
                        onChange={(e) => updateContactData(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-gray-800 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {showFinalMessage && (
            <div className="mt-8 p-6 bg-green-50 border-2 border-green-500 rounded-xl text-center fade-in">
              <h2 className="text-2xl font-bold text-green-700 mb-4">Merci pour votre demande d'estimation !</h2>
              <p className="text-green-600">
                Nous avons bien reçu vos informations. Notre expert immobilier va étudier votre dossier et vous contactera dans les 48 heures avec une estimation détaillée de votre bien.
              </p>
            </div>
          )}

          {!showFinalMessage && (
            <div className="mt-8 flex justify-between fade-in">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center px-6 py-2 rounded-lg bg-gray-100 text-gray-600 transition-all duration-300 hover:bg-gray-200"
                >
                  <ChevronLeft className="mr-2 h-5 w-5" />
                  Retour
                </button>
              )}
              <button
                onClick={currentStep === 5 ? handleSubmit : handleNext}
                disabled={!isStepValid}
                className={`ml-auto flex items-center px-6 py-2 rounded-lg transition-all duration-300 ${
                  isStepValid ? 'bg-primary text-white hover:bg-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {currentStep === 5 ? "Recevoir mon estimation" : 'Étape suivante'}
                {isStepValid ? (
                  <ArrowRight className="ml-2 h-5 w-5" />
                ) : (
                  <Lock className="ml-2 h-5 w-5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}