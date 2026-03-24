import { useState, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet-async';
import { Search, Heart, MapPin, Bed, Bath, Maximize, SlidersHorizontal, ChevronDown } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { House } from '../types';

const CustomSelect = ({ value, onChange, options, placeholder = "Sélectionner...", triggerClassName }: { value: string, onChange: (v: string) => void, options: { label: string, value: string }[], placeholder?: string, triggerClassName?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center outline-none ${triggerClassName}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <ul className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-primary/10 text-primary font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';


import { getAuth } from "firebase/auth";
const auth = getAuth();
console.log("Current user:", auth.currentUser);

export default function HouseExplorer() {
  const [houses, setHouses] = useState<House[]>([])
  const [filteredHouses, setFilteredHouses] = useState<House[]>([])
  const [searchParams] = useSearchParams()
  const initialLocation = searchParams.get('location') || ""
  const initialType = searchParams.get('type')

  const [criteria, setCriteria] = useState<SearchCriteria>({
    location: initialLocation,
    maxPrice: 100000000,
    minSize: 0,
    propertyTypes: initialType ? [initialType] : [],
    rooms: '0',
    bedrooms: '0',
    bathrooms: '0',
    amenities: [],
    condition: 'disponible',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    // Fetch data from Firestore
    const fetchHouses = async () => {
      const houseCollection = collection(db, 'houses');
      const houseSnapshot = await getDocs(houseCollection);
      const houseList = houseSnapshot.docs.map((doc) => {
        const data = doc.data() as House;
        return {
          ...data,
          id: doc.id,
        };
      });

      setHouses(houseList);
    };

    fetchHouses();
  }, []);

  useEffect(() => {
    const filtered = houses.filter((house) => {
      // Exclure les biens "en attente" de tous les affichages, sauf si explicitement sélectionné
      if (house.condition === 'en attente' && criteria.condition !== 'en attente') {
        return false;
      }

      return (
        (criteria.condition === 'all' || house.condition === criteria.condition) &&
        parseInt(house.price || '0') <= criteria.maxPrice &&
        parseInt(house.size || '0') >= criteria.minSize &&
        (criteria.propertyTypes.length === 0 ||
          (Array.isArray(house.types) &&
            house.types.some((type) => criteria.propertyTypes.includes(type)))) &&
        parseInt(house.rooms || '0') >= parseInt(criteria.rooms) &&
        parseInt(house.bedrooms || '0') >= parseInt(criteria.bedrooms) &&
        parseInt(house.bathrooms || '0') >= parseInt(criteria.bathrooms) &&
        (criteria.amenities.length === 0 || criteria.amenities.every((amenity) => (house.amenities || []).includes(amenity))) &&
        (criteria.location === '' || (house.location || '').toLowerCase().includes(criteria.location.toLowerCase()))
      );
    });

    // Application du tri
    let sorted = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price?.replace(/[^0-9.-]+/g, '') || '0');
          const priceB = parseInt(b.price?.replace(/[^0-9.-]+/g, '') || '0');
          return priceA - priceB;
        });
        break;
      case 'price-desc':
        sorted.sort((a, b) => {
          const priceA = parseInt(a.price?.replace(/[^0-9.-]+/g, '') || '0');
          const priceB = parseInt(b.price?.replace(/[^0-9.-]+/g, '') || '0');
          return priceB - priceA;
        });
        break;
      case 'size-asc':
        sorted.sort((a, b) => parseInt(a.size || '0') - parseInt(b.size || '0'));
        break;
      case 'size-desc':
        sorted.sort((a, b) => parseInt(b.size || '0') - parseInt(a.size || '0'));
        break;
      default:
        // 'newest' ou par défaut: garder l'ordre Firestore (ou l'inverser si on veut les derniers créés en premier)
        break;
    }

    setFilteredHouses(sorted);
  }, [houses, criteria, sortBy]);


  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setCriteria((prev) => ({
      ...prev,
      [name]: name === "maxPrice" || name === "minSize" ? (parseInt(value) || 0) : value,
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
        return 'bg-red-600 text-white';
      case 'sous compromis':
        return 'bg-yellow-500 text-black';
      case 'sous offre':
        return 'bg-orange-500 text-white';
      case 'en attente':
        return 'bg-gray-500 text-white';
      default:
        // Use EXCLUSIVITÉ styling or fallback to green
        return 'bg-primary text-white';
    }
  };

  const getConditionText = (condition: House['condition']) => {
    switch (condition) {
      case 'vendu':
        return 'VENDU';
      case 'sous compromis':
        return 'SOUS COMPROMIS';
      case 'sous offre':
        return 'SOUS OFFRE';
      case 'en attente':
        return 'EN ATTENTE';
      case 'disponible':
        return 'DISPONIBLE';
      default:
        return '';
    }
  };

  const housesByCondition = houses.filter((house) => {
    if (house.condition === 'en attente' && criteria.condition !== 'en attente') {
      return false;
    }
    return criteria.condition === 'all' || house.condition === criteria.condition;
  });

  const dynamicLocationOptions = Array.from(new Set(housesByCondition.map(h => h.location).filter(Boolean)))
    .sort()
    .map(loc => ({
      value: loc,
      label: loc
    }));

  const dynamicPropertyTypeOptions = Array.from(new Set(housesByCondition.flatMap(h => h.types || [])))
    .filter(Boolean)
    .sort()
    .map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1)
    }));

  const maxPriceOptions = [
    { value: '100000000', label: 'Pas de limite' },
    { value: '100000', label: '100 000 €' },
    { value: '150000', label: '150 000 €' },
    { value: '200000', label: '200 000 €' },
    { value: '250000', label: '250 000 €' },
    { value: '300000', label: '300 000 €' },
    { value: '400000', label: '400 000 €' },
    { value: '500000', label: '500 000 €' },
    { value: '600000', label: '600 000 €' },
    { value: '800000', label: '800 000 €' },
    { value: '1000000', label: '1 000 000 €' },
    { value: '1500000', label: '1 500 000 €' },
    { value: '2000000', label: '2 000 000 €' },
    { value: '3000000', label: '3 000 000 €' }
  ];

  const availableRooms = Array.from(new Set(housesByCondition.map(h => parseInt(h.rooms || '0')).filter(n => !isNaN(n)))).sort((a, b) => a - b);
  const dynamicRoomOptions = [
    { value: '0', label: 'Peu importe' },
    ...availableRooms.map(num => ({ value: num.toString(), label: `${num} ${num === 1 ? 'pièce' : 'pièces'}` }))
  ];

  const availableBedrooms = Array.from(new Set(housesByCondition.map(h => parseInt(h.bedrooms || '0')).filter(n => !isNaN(n)))).sort((a, b) => a - b);
  const dynamicBedroomOptions = [
    { value: '0', label: 'Peu importe' },
    ...availableBedrooms.map(num => ({ value: num.toString(), label: `${num} ${num === 1 ? 'chambre' : 'chambres'}` }))
  ];

  const availableBathrooms = Array.from(new Set(housesByCondition.map(h => parseInt(h.bathrooms || '0')).filter(n => !isNaN(n)))).sort((a, b) => a - b);
  const dynamicBathroomOptions = [
    { value: '0', label: 'Peu importe' },
    ...availableBathrooms.map(num => ({ value: num.toString(), label: `${num} ${num === 1 ? 'salle de bain' : 'salles de bain'}` }))
  ];

  const dynamicAmenityOptions = Array.from(new Set(housesByCondition.flatMap(h => h.amenities || [])))
    .filter(Boolean)
    .sort()
    .map(amenity => ({
      value: amenity,
      label: amenity.charAt(0).toUpperCase() + amenity.slice(1)
    }));

  const conditions = ['all', 'disponible', 'sous compromis', 'vendu', 'sous offre'] as const;


  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <Helmet>
        <title>Biens Disponibles à la Vente - Votre Agence Immobilière</title>
        <meta name="description" content="Découvrez tous nos biens immobiliers disponibles à la vente. Trouvez la maison ou l'appartement idéal selon vos critères de recherche." />
        <meta name="keywords" content="immobilier, achat maison, achat appartement, biens à vendre, immobilier France" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Elise Buil" />
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/Acheter" />
      </Helmet>

      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">Disponible à la vente</h2>
        </div>

        {/* Condition Tabs */}
        <div className="flex justify-center md:justify-start flex-wrap gap-2 mb-8">
          {conditions.map((condition) => (
            <button
              key={condition}
              onClick={() => setCriteria(prev => ({ ...prev, condition }))}
              className={`py-2 px-5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${criteria.condition === condition
                ? 'bg-black text-white scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-black border border-gray-200'
                }`}
            >
              {condition === 'all' ? 'Tous' :
                condition === 'sous offre' ? 'Sous Offre' :
                  condition === 'sous compromis' ? 'Sous Compromis' :
                    condition.charAt(0).toUpperCase() + condition.slice(1)}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-3 mb-6 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x border border-gray-100">
          {/* Type */}
          <div className="flex-1 px-5 py-3 w-full">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type de Propriété</label>
            <CustomSelect
              value={criteria.propertyTypes[0] || ""}
              onChange={(val) => setCriteria(prev => ({ ...prev, propertyTypes: val ? [val] : [] }))}
              options={[{ value: '', label: 'Tous les biens' }, ...dynamicPropertyTypeOptions]}
              placeholder="Tous les biens"
              triggerClassName="text-[15px] font-semibold text-gray-900 bg-transparent cursor-pointer"
            />
          </div>

          {/* Localisation */}
          <div className="flex-1 px-5 py-3 w-full">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Localisation</label>
            <CustomSelect
              value={criteria.location}
              onChange={(val) => handleInputChange({ target: { name: 'location', value: val } } as any)}
              options={[{ value: '', label: 'Toute la Guadeloupe' }, ...dynamicLocationOptions]}
              placeholder="Toute la Guadeloupe"
              triggerClassName="text-[15px] font-semibold text-gray-900 bg-transparent cursor-pointer"
            />
          </div>

          {/* Budget Max */}
          <div className="flex-1 px-5 py-3 w-full">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Prix Maximum</label>
            <CustomSelect
              value={criteria.maxPrice.toString()}
              onChange={(val) => setCriteria(prev => ({ ...prev, maxPrice: val ? parseInt(val) : 100000000 }))}
              options={maxPriceOptions}
              placeholder="Pas de limite"
              triggerClassName="text-[15px] font-semibold text-gray-900 bg-transparent cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="px-5 py-3 flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3.5 rounded-xl transition-colors flex items-center justify-center border ${showFilters ? 'bg-gray-100 border-gray-300 text-black' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              title="Filtres avancés"
            >
              <SlidersHorizontal size={20} />
            </button>

            <button className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl text-[15px] font-bold transition-all shadow-md hover:shadow-lg flex items-center flex-1 justify-center whitespace-nowrap">
              <Search size={18} className="mr-2" />
              Rechercher
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
            <div>
              <label htmlFor="minSize" className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Surface Minimum (m²)
              </label>
              <div className="relative">
                <input
                  id="minSize"
                  name="minSize"
                  type="number"
                  value={criteria.minSize || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 50"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium bg-gray-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Pièces minimum
              </label>
              <CustomSelect
                value={criteria.rooms}
                onChange={(val) => handleInputChange({ target: { name: 'rooms', value: val } } as any)}
                options={dynamicRoomOptions}
                placeholder="Peu importe"
                triggerClassName="px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Chambres minimum
              </label>
              <CustomSelect
                value={criteria.bedrooms}
                onChange={(val) => handleInputChange({ target: { name: 'bedrooms', value: val } } as any)}
                options={dynamicBedroomOptions}
                placeholder="Peu importe"
                triggerClassName="px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                Salles de bain minimum
              </label>
              <CustomSelect
                value={criteria.bathrooms}
                onChange={(val) => handleInputChange({ target: { name: 'bathrooms', value: val } } as any)}
                options={dynamicBathroomOptions}
                placeholder="Peu importe"
                triggerClassName="px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm font-medium bg-gray-50"
              />
            </div>
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                Annexes et commodités
              </label>
              <div className="flex flex-wrap gap-2">
                {dynamicAmenityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleMultiSelectChange('amenities', option.value)}
                    className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 border ${criteria.amenities.includes(option.value)
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Info Bar */}
        <div className="flex justify-between items-center mb-6 text-sm">
          <span className="text-gray-500">
            <strong className="text-black font-extrabold text-base mr-1">{filteredHouses.length}</strong>
            propriétés correspondent à votre recherche
          </span>
          <div className="w-56">
            <CustomSelect
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'newest', label: 'Plus récents' },
                { value: 'price-asc', label: 'Prix croissant' },
                { value: 'price-desc', label: 'Prix décroissant' },
                { value: 'size-asc', label: 'Surface croissante' },
                { value: 'size-desc', label: 'Surface décroissante' },
              ]}
              placeholder="Trier par"
              triggerClassName="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all bg-white shadow-sm"
            />
          </div>
        </div>

        {filteredHouses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun bien trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche.</p>
            <button
              onClick={() => setCriteria({
                location: "", maxPrice: 100000000, minSize: 0, propertyTypes: [], rooms: '0', bedrooms: '0', bathrooms: '0', amenities: [], condition: 'disponible'
              })}
              className="mt-6 text-primary font-semibold hover:underline"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHouses.map((house) => (
              <Link
                to={`/house/${house.id}`}
                key={house.id}
                className="group relative bg-white rounded-2xl overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 flex flex-col border border-transparent hover:border-gray-100"
              >
                {/* Image Section */}
                <div className="relative h-64 overflow-hidden bg-gray-100 w-full">
                  <img
                    src={house.thumbnailImage || house.principalImage}
                    alt={house.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-0"
                    loading="lazy"
                    onLoad={(e) => {
                      e.currentTarget.classList.remove('opacity-0');
                      e.currentTarget.classList.add('opacity-100');
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {getConditionText(house.condition) && (
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg tracking-wider ${getConditionStyle(house.condition)}`}>
                        {getConditionText(house.condition)}
                      </span>
                    )}
                    {house.types?.[0] && (
                      <span className="bg-white text-gray-900 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider">
                        {house.types[0]}
                      </span>
                    )}
                  </div>

                  {/* Heart Icon */}
                  <button onClick={(e) => e.preventDefault()} className="absolute top-4 right-4 p-2.5 bg-black/20 hover:bg-black/50 rounded-full text-white backdrop-blur-md transition-all duration-300 group-hover:scale-110">
                    <Heart size={18} className="fill-transparent hover:fill-current" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Title and Price */}
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-tight flex-1">
                      {house.title}
                    </h3>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary whitespace-nowrap">
                        {(() => {
                          const cleanPrice = house.price.replace(/[^0-9.-]+/g, '');
                          const numericPrice = Number(cleanPrice);
                          return !isNaN(numericPrice)
                            ? numericPrice.toLocaleString('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })
                            : 'Sur demande';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center text-gray-500 text-sm font-medium">
                      <MapPin size={16} className="mr-1.5 text-primary flex-shrink-0" />
                      <span className="line-clamp-1">{house.location}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mt-auto border-t border-gray-100 pt-5 flex items-center gap-5 text-gray-700">
                    {house.bedrooms && parseInt(house.bedrooms) > 0 && (
                      <div className="flex items-center gap-2" title={`${house.bedrooms} chambres`}>
                        <Bed size={18} className="text-gray-400" />
                        <span className="font-bold text-sm">{house.bedrooms} <span className="text-gray-500 font-medium">Ch.</span></span>
                      </div>
                    )}

                    {house.bathrooms && parseInt(house.bathrooms) > 0 && (
                      <div className="flex items-center gap-2" title={`${house.bathrooms} salles de bain`}>
                        <Bath size={18} className="text-gray-400" />
                        <span className="font-bold text-sm">{house.bathrooms} <span className="text-gray-500 font-medium">Sdb.</span></span>
                      </div>
                    )}

                    {house.size && (
                      <div className="flex items-center gap-2 ml-auto" title={`Surface: ${house.size} m²`}>
                        <Maximize size={18} className="text-gray-400" />
                        <span className="font-bold text-sm">{house.size} <span className="text-gray-500 font-medium">m²</span></span>
                      </div>
                    )}
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