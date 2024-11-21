'use client'

import { useState, useEffect } from 'react'
import { Search, Home } from 'lucide-react'

export default function Search_house() {
  const [location, setLocation] = useState('')
  const [maxPrice, setMaxPrice] = useState(2000000)
  const [maxPriceInput, setMaxPriceInput] = useState('2000000')
  const [minSize, setMinSize] = useState(50)
  const [minSizeInput, setMinSizeInput] = useState('50')
  const [type, setType] = useState('')
  const [rooms, setRooms] = useState('1')

  useEffect(() => {
    setMaxPriceInput(maxPrice.toString())
  }, [maxPrice])

  useEffect(() => {
    setMinSizeInput(minSize.toString())
  }, [minSize])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(price)
  }

  const handleMaxPriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMaxPriceInput(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 2000000) {
      setMaxPrice(numValue)
    }
  }

  const handleMinSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMinSizeInput(value)
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 500) {
      setMinSize(numValue)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Searching for houses with criteria:', { location, maxPrice, minSize, type, rooms })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 bg-white rounded-2xl overflow-hidden shadow-xl">
        <div className="p-8 md:p-12 bg-gradient-to-br from-violet-600 to-violet-500 text-white flex flex-col justify-center">
          <h2 className="text-4xl font-bold mb-6">Find Your Dream Home</h2>
          <p className="text-lg mb-8 text-violet-100">
            Use our advanced search to discover the perfect property that matches all your criteria
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-400/30 flex items-center justify-center">
                <Search className="w-4 h-4" />
              </div>
              <span>Advanced search filters</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-400/30 flex items-center justify-center">
                <Home className="w-4 h-4" />
              </div>
              <span>Extensive property database</span>
            </div>
            <div className="flex items-center gap-3">
              <span>All property types available</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSearch} className="p-8 md:p-12 bg-white space-y-6">
          <div className="space-y-4">
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <div className="relative">
              <input
                id="location"
                type="text"
                placeholder="Enter city or postal code"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              />
              <Home className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Maximum Price: {formatPrice(maxPrice)}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="2000000"
                step="10000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="2000000"
                value={maxPriceInput}
                onChange={handleMaxPriceInputChange}
                className="w-24 px-2 py-1 text-right rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatPrice(0)}</span>
              <span>{formatPrice(1000000)}</span>
              <span>{formatPrice(2000000)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Minimum Size: {minSize} m²
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={minSize}
                onChange={(e) => setMinSize(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="0"
                max="500"
                value={minSizeInput}
                onChange={handleMinSizeInputChange}
                className="w-16 px-2 py-1 text-right rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 m²</span>
              <span>250 m²</span>
              <span>500 m²</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Property Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                <option value="">Select type</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div className="space-y-4">
              <label htmlFor="rooms" className="block text-sm font-medium text-gray-700">
                Bedrooms
              </label>
              <select
                id="rooms"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                {[1, 2, 3, 4, 5, '6+'].map((num) => (
                  <option key={num} value={num.toString()}>{num} {num === 1 ? 'bedroom' : 'bedrooms'}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-violet-700 transition-colors duration-200"
          >
            Search Properties
          </button>
        </form>
      </div>
    </div>
  )
}

