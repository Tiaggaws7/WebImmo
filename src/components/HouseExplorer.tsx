import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

// Import house images
import house1 from "../assets/house1.jpg"
import house2 from "../assets/house2.jpg"
import house3 from "../assets/house3.jpg"
import house4 from "../assets/house4.jpg"
import houseGwada from "../assets/houseGwada.jpg"


interface House {
  id: number
  title: string
  price: number
  size: number
  type: string
  rooms: number
  bedrooms: number
  bathrooms: number
  amenities: string[]
  location: string
  image: string
}

interface SearchCriteria {
  location: string
  maxPrice: number
  minSize: number
  propertyTypes: string[]
  rooms: string
  bedrooms: string
  bathrooms: string
  amenities: string[]
}

interface HouseExplorerProps {
  initialCriteria: SearchCriteria
}

export default function HouseExplorer({ initialCriteria }: HouseExplorerProps) {
  const [houses, setHouses] = useState<House[]>([])
  const [filteredHouses, setFilteredHouses] = useState<House[]>([])
  const [criteria, setCriteria] = useState(initialCriteria)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Simulating an API call to fetch houses
    const fetchHouses = async () => {
      // In a real application, you would fetch this data from an API
      const mockHouses: House[] = [
        {
          id: 1,
          title: "Appartement moderne au centre-ville",
          price: 350000,
          size: 75,
          type: "apartment",
          rooms: 3,
          bedrooms: 2,
          bathrooms: 1,
          amenities: ["parking", "elevator"],
          location: "Paris",
          image: house1
        },
        {
          id: 2,
          title: "Maison familiale avec jardin",
          price: 550000,
          size: 150,
          type: "house",
          rooms: 5,
          bedrooms: 3,
          bathrooms: 2,
          amenities: ["pool", "parking"],
          location: "Lyon",
          image: house2
        },
        {
          id: 3,
          title: "Loft industriel rénové",
          price: 420000,
          size: 100,
          type: "apartment",
          rooms: 2,
          bedrooms: 1,
          bathrooms: 1,
          amenities: ["parking"],
          location: "Marseille",
          image: house3
        },
        {
          id: 4,
          title: "Appartement cosy proche des transports",
          price: 280000,
          size: 60,
          type: "apartment",
          rooms: 2,
          bedrooms: 1,
          bathrooms: 1,
          amenities: ["elevator"],
          location: "Bordeaux",
          image: house4
        },
        {
          id: 5,
          title: "Villa de luxe avec vue sur mer",
          price: 1500000,
          size: 300,
          type: "house",
          rooms: 8,
          bedrooms: 5,
          bathrooms: 4,
          amenities: ["pool", "beautiful_view", "parking"],
          location: "Nice",
          image: houseGwada
        },
      ]

      setHouses(mockHouses)
    }

    fetchHouses()
  }, [])

  useEffect(() => {
    const filtered = houses.filter(house => {
      return (
        house.price <= criteria.maxPrice &&
        house.size >= criteria.minSize &&
        (criteria.propertyTypes.length === 0 || criteria.propertyTypes.includes(house.type)) &&
        house.rooms >= parseInt(criteria.rooms) &&
        house.bedrooms >= parseInt(criteria.bedrooms) &&
        house.bathrooms >= parseInt(criteria.bathrooms) &&
        (criteria.amenities.length === 0 || criteria.amenities.every(amenity => house.amenities.includes(amenity))) &&
        (criteria.location === '' || house.location.toLowerCase().includes(criteria.location.toLowerCase()))
      )
    })

    setFilteredHouses(filtered)
  }, [houses, criteria])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCriteria(prev => ({ ...prev, [name]: value }))
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
    setCriteria(prev => ({
      ...prev,
      [name]: Array.isArray(prev[name])
        ? prev[name].includes(value)
          ? (prev[name] as string[]).filter((item) => item !== value)
          : [...(prev[name] as string[]), value]
        : prev[name],
    }));
  };

  const propertyTypeOptions = [
    { value: 'apartment', label: 'Appartement' },
    { value: 'house', label: 'Maison' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Maison de ville' },
    { value: 'land', label: 'Terrain' },
  ]

  const amenityOptions = [
    { value: 'pool', label: 'Piscine' },
    { value: 'parking', label: 'Parking' },
    { value: 'cave', label: 'Cave' },
    { value: 'beautiful_view', label: 'Belle vue' },
    { value: 'elevator', label: 'Ascenseur' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Résultats de la recherche</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-violet-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors duration-200 flex items-center"
          >
            {showFilters ? <X className="mr-2" /> : <Search className="mr-2" />}
            {showFilters ? 'Fermer les filtres' : 'Afficher les filtres'}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Localisation
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={criteria.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Prix Maximum
              </label>
              <input
                id="maxPrice"
                name="maxPrice"
                type="number"
                value={criteria.maxPrice}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label htmlFor="minSize" className="block text-sm font-medium text-gray-700 mb-1">
                Taille Minimum (m²)
              </label>
              <input
                id="minSize"
                name="minSize"
                type="number"
                value={criteria.minSize}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de Propriété
              </label>
              <div className="flex flex-wrap gap-2">
                {propertyTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelectChange('propertyTypes', option.value)}
                    className={`py-1 px-3 rounded-full text-xs font-medium transition-colors duration-200 ${
                      criteria.propertyTypes.includes(option.value)
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="rooms" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de Pièces minimum
              </label>
              <select
                id="rooms"
                name="rooms"
                value={criteria.rooms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                {[1, 2, 3, 4, 5, '6+'].map((num) => (
                  <option key={num} value={num.toString()}>{num} {num === 1 ? 'pièce' : 'pièces'}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de chambres minimum
              </label>
              <select
                id="bedrooms"
                name="bedrooms"
                value={criteria.bedrooms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                {[1, 2, 3, 4, 5, '6+'].map((num) => (
                  <option key={num} value={num.toString()}>{num} {num === 1 ? 'chambre' : 'chambres'}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de salles de bain minimum
              </label>
              <select
                id="bathrooms"
                name="bathrooms"
                value={criteria.bathrooms}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                {[1, 2, 3, 4, '5+'].map((num) => (
                  <option key={num} value={num.toString()}>{num} {num === 1 ? 'salle de bain' : 'salles de bain'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commodités
              </label>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelectChange('amenities', option.value)}
                    className={`py-1 px-3 rounded-full text-xs font-medium transition-colors duration-200 ${
                      criteria.amenities.includes(option.value)
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {filteredHouses.length === 0 ? (
          <p>Aucune propriété ne correspond à vos critères.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHouses.map(house => (
              <div key={house.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img src={house.image} alt={house.title} className="w-full h-48 object-cover" />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{house.title}</h3>
                  <p className="text-gray-600 mb-2">{house.location}</p>
                  <p className="text-violet-600 font-bold mb-2">{house.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{house.size} m²</span>
                    <span>{house.rooms} pièces</span>
                    <span>{house.bedrooms} ch.</span>
                    <span>{house.bathrooms} sdb.</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {house.amenities.map(amenity => (
                      <span key={amenity} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

