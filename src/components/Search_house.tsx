'use client'

import { useState } from 'react'
import { Search, Home } from 'lucide-react'
import HouseExplorer from './HouseExplorer'

export default function Search_house() {
  const [showSearchForm, setShowSearchForm] = useState(true)
  const [searchCriteria, setSearchCriteria] = useState({
    location: '',
    maxPrice: 2000000,
    minSize: 50,
    propertyTypes: [] as string[],
    rooms: '1',
    bedrooms: '1',
    bathrooms: '1',
    amenities: [] as string[]
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSearchForm(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSearchCriteria(prev => ({ ...prev, [name]: value }))
  }

  type SearchCriteria = {
    location: string;
    maxPrice: number;
    minSize: number;
    propertyTypes: string[];
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    amenities: string[];
  };

  const handleMultiSelectChange = <K extends keyof SearchCriteria>(
    name: K,
    value: string
  ) => {
    setSearchCriteria(prev => ({
      ...prev,
      [name]: Array.isArray(prev[name])
        ? prev[name].includes(value)
          ? (prev[name] as string[]).filter((item) => item !== value)
          : [...(prev[name] as string[]), value]
        : prev[name],
    }));
  };

  if (!showSearchForm) {
    return <HouseExplorer initialCriteria={searchCriteria} />
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="p-8 md:p-12 bg-gradient-to-br from-violet-600 to-violet-500 text-white flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-6">Trouvez la maison de vos rêves</h2>
          <p className="text-lg mb-8 text-violet-100">
            Utilisez notre recherche avancée pour découvrir la propriété parfaite répondant à tous vos critères
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-400/30 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <span>Filtres de recherche avancés</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-400/30 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <span>Base de données immobilières étendue</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="p-8 md:p-12 bg-white space-y-6">
          <div className="space-y-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Localisation
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="Entrez une ville ou un code postal"
              value={searchCriteria.location}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">
              Prix Maximum
            </label>
            <input
              id="maxPrice"
              name="maxPrice"
              type="number"
              value={searchCriteria.maxPrice}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-4">
            <label htmlFor="minSize" className="block text-sm font-medium text-gray-700">
              Taille Minimum (m²)
            </label>
            <input
              id="minSize"
              name="minSize"
              type="number"
              value={searchCriteria.minSize}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Type de Propriété
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['apartment', 'house', 'condo', 'townhouse', 'land'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleMultiSelectChange('propertyTypes', type)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    searchCriteria.propertyTypes.includes(type)
                      ? 'bg-violet-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
              Nombre de Pièces minimum
            </label>
            <select
              id="rooms"
              name="rooms"
              value={searchCriteria.rooms}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
            >
              {[1, 2, 3, 4, 5, '6+'].map((num) => (
                <option key={num} value={num.toString()}>{num} {num === 1 ? 'pièce' : 'pièces'}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-violet-700 transition-colors duration-200"
          >
            Rechercher des Propriétés
          </button>
        </form>
      </div>
    </div>
  )
}

