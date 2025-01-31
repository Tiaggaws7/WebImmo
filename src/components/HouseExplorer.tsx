import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Link } from 'react-router-dom'

import { House } from '../types';

import {collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';


import { getAuth } from "firebase/auth";
const auth = getAuth();
console.log("Current user:", auth.currentUser);

export default function HouseExplorer() {
  const [houses, setHouses] = useState<House[]>([])
  const [filteredHouses, setFilteredHouses] = useState<House[]>([])
  const [criteria, setCriteria] = useState<SearchCriteria>({
    location: "",
    maxPrice: 100000000,
    minSize: 0,
    propertyTypes: [],
    rooms: '0',
    bedrooms: '0',
    bathrooms: '0',
    amenities: [],
    condition: 'disponible',
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // Fetch data from Firestore
    const fetchHouses = async () => {
      const houseCollection = collection(db, 'houses');
      const houseSnapshot = await getDocs(houseCollection);
      const houseList = houseSnapshot.docs.map((doc) => {
        const data = doc.data() as House; // Ensure `data` matches the `House` type
        return {
          ...data, // Spread `data` first
          id: doc.id, // Overwrite `id` to ensure it comes from Firestore document ID
        };
      });

      setHouses(houseList);
    };

    fetchHouses();
  }, []);

  useEffect(() => {
    const filtered = houses.filter((house) => {
      return (
        (criteria.condition === 'all' || house.condition === criteria.condition) &&
        parseInt(house.price) <= criteria.maxPrice &&
        parseInt(house.size) >= criteria.minSize &&
        (criteria.propertyTypes.length === 0 || // If no property types are selected, allow all types
          (Array.isArray(house.types) && // Check if house.types is an array
            house.types.some((type) => criteria.propertyTypes.includes(type)))) && // Check if any house type matches any selected property type
        parseInt(house.rooms) >= parseInt(criteria.rooms) &&
        parseInt(house.bedrooms) >= parseInt(criteria.bedrooms) &&
        parseInt(house.bathrooms) >= parseInt(criteria.bathrooms) &&
        (criteria.amenities.length === 0 || criteria.amenities.every((amenity) => house.amenities.includes(amenity))) &&
        (criteria.location === '' || house.location.toLowerCase().includes(criteria.location.toLowerCase()))
      );
    });
  
    setFilteredHouses(filtered);
  }, [houses, criteria]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
  
    setCriteria((prev) => ({
      ...prev,
      [name]: name === "maxPrice" || name === "minSize" ? parseInt(value) : value,
    }));
  };

  type SearchCriteria = {
    location: string;
    maxPrice: number;
    minSize: number;
    propertyTypes: string[];
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    amenities: string[];
    condition: House['condition'] | 'all';
  };

  const handleMultiSelectChange = <K extends keyof SearchCriteria>(
    name: K,
    value: string
  ) => {
    setCriteria((prev) => ({
      ...prev,
      [name]: Array.isArray(prev[name])
        ? prev[name].includes(value)
          ? (prev[name] as string[]).filter((item) => item !== value)
          : [...(prev[name] as string[]), value]
        : prev[name],
    }));
  };

  const getConditionStyle = (condition: House['condition']) => {
    switch (condition) {
      case 'vendu':
        return 'bg-red-500 text-white';
      case 'sous compromis':
        return 'bg-yellow-500 text-black';
      default:
        return 'bg-green-500 text-white';
    }
  };

  const getConditionText = (condition: House['condition']) => {
    switch (condition) {
      case 'vendu':
        return 'VENDU';
      case 'sous compromis':
        return 'SOUS COMPROMIS';
      default:
        return 'DISPONIBLE';
    }
  };

  const propertyTypeOptions = [
    { value: 'appartement', label: 'Appartement' },
    { value: 'maison', label: 'Maison' },
    { value: 'local commercial', label: 'Local commercial' },
    { value: 'terrain', label: 'Terrain' },
  ]

  const amenityOptions = [
    { value: 'piscine', label: 'Piscine' },
    { value: 'parking', label: 'Parking' },
    { value: 'cave', label: 'Cave' },
    { value: 'belle vue', label: 'Belle vue' },
    { value: 'ascenseur', label: 'Ascenseur' },
  ]

  const conditions = ['all', 'disponible', 'sous compromis', 'vendu'] as const;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Disponible à la vente</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-violet-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-violet-700 transition-colors duration-200 flex items-center"
          >
            {showFilters ? <X className="mr-2" /> : <Search className="mr-2" />}
            {showFilters ? 'Fermer les filtres' : 'Afficher les filtres'}
          </button>
        </div>

        <div className="flex justify-center space-x-4 mb-6">
            {conditions.map((condition) => (
            <button
              key={condition}
              onClick={() => setCriteria(prev => ({ ...prev, condition }))}
              className={`py-2 px-4 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                criteria.condition === condition
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {condition === 'all' ? 'Tous' : condition.charAt(0).toUpperCase() + condition.slice(1)}
            </button>
          ))}
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
              Surface Minimum (m²)
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
              Annexes
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
            {filteredHouses.map((house) => (
              <Link
                to={`/house/${house.id}`}
                key={house.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative">
                <img 
                  src={house.principalImage} 
                  alt={house.title} 
                  className="w-full h-48 object-cover"
                />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{house.title}</h3>
                  <div className="flex justify-between">
                    <p className="text-gray-600">{house.location}</p>
                    <div
                      className={`m-1 px-2 py-1 rounded-full text-xs font-bold ${getConditionStyle(house.condition)}`}
                    >
                      {getConditionText(house.condition)}
                    </div>
                  </div>
                  <p className="text-violet-600 font-bold mb-2">
                    {(() => {
                      const cleanPrice = house.price.replace(/[^0-9.-]+/g, ''); // Remove non-numeric characters
                      const numericPrice = Number(cleanPrice); // Convert to a number
                      return !isNaN(numericPrice)
                        ? numericPrice.toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0, // No centimes
                            maximumFractionDigits: 0, // No centimes
                          })
                        : 'Invalid price';
                    })()}
                  </p>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{house.size} m²</span>
                    <span>{house.rooms} pièces</span>
                    <span>{house.bedrooms} ch.</span>
                    <span>{house.bathrooms} sdb.</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {house.amenities.map((amenity) => (
                      <span key={amenity} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

