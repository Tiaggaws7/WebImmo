'use client'

import { useState, useEffect } from 'react'
import { MapPin, Home, Building, Map, Store, CheckSquare, User, ChevronLeft, ChevronRight } from 'lucide-react'

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
    setCurrentStep(prev => Math.min(prev + 1, 5))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  useEffect(() => {
    const progressBar = document.querySelector('.progress-bar') as HTMLElement
    if (progressBar) {
      progressBar.style.width = `${(currentStep - 1) * 25}%`
    }
  }, [currentStep])

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
                    ? 'bg-blue-600 text-white pulse'
                    : index + 1 < currentStep
                    ? 'bg-blue-200 text-blue-700'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
            ))}
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="progress-bar h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: '0%' }}></div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white p-6 shadow-lg">
          <div className={`slide-in`} key={currentStep}>
            {/* Step 1: Address */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 fade-in">
                  Où se situe votre bien ?
                </h2>
                <div className="space-y-4 fade-in">
                  <label className="block text-lg font-medium text-gray-700">
                    Adresse du bien à estimer
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-6 w-6 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData('address', e.target.value)}
                      placeholder="12 rue Saint Denis, 75011 Paris"
                      className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
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
                      className={`flex flex-col items-center rounded-xl border-2 p-6 transition-all duration-300 hover:border-blue-500 ${
                        formData.propertyType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <type.icon className="mb-4 h-16 w-16 text-blue-500" />
                      <span className="text-lg font-medium text-gray-700">{type.label}</span>
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
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <div className="flex items-center">
                        <input
                          type="number"
                          value={formData.contact[field.id as keyof typeof formData.contact] as string}                          onChange={(e) => updateFormData(field.id, e.target.value)}
                          className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
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
                  {['Terrasse', 'Parking', 'Garage', 'Piscine'].map((feature) => (
                    <button
                      key={feature}
                      onClick={() => toggleFeature(feature)}
                      className={`flex items-center justify-center rounded-lg border-2 p-4 text-center transition-all duration-300 hover:bg-blue-50 ${
                        formData.features.includes(feature)
                          ? 'border-blue-500 bg-blue-100 text-blue-700'
                          : 'border-gray-200 text-gray-600'
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
                        className={`rounded-full px-6 py-2 text-lg transition-all duration-300 ${
                          formData.contact.gender === gender
                            ? 'bg-blue-500 text-white'
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
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={formData.contact[field.id as keyof typeof formData.contact]}
                        onChange={(e) => updateContactData(field.id, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full rounded-lg border-2 border-gray-200 bg-gray-50 px-4 py-2 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between fade-in">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center rounded-lg bg-gray-100 px-6 py-2 text-gray-600 transition-all duration-300 hover:bg-gray-200"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                Retour
              </button>
            )}
            <button
              onClick={currentStep === 5 ? () => console.log(formData) : handleNext}
              className="ml-auto flex items-center rounded-lg bg-blue-500 px-6 py-2 text-white transition-all duration-300 hover:bg-blue-600"
            >
              {currentStep === 5 ? "Découvrir l'estimation" : 'Étape suivante'}
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

