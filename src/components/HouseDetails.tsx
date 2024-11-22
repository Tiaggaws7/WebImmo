import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// Import house images
import house1 from "../assets/house1.jpg"
import house2 from "../assets/house2.jpg"
import house3 from "../assets/house3.jpg"
import house4 from "../assets/house4.jpg"
import houseGwada from "../assets/houseGwada.jpg"

interface House {
  id: number;
  title: string;
  price: number;
  size: number;
  type: string;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  location: string;
  image: string;
  description: string;
}

const HouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [house, setHouse] = useState<House | null>(null);

  useEffect(() => {
    // In a real application, you would fetch this data from an API
    const fetchHouse = async () => {
      // Simulating an API call
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
          image: house1,
          description: "Superbe appartement moderne situé au cœur de Paris. Idéalement placé, cet appartement lumineux offre un cadre de vie confortable avec ses 2 chambres et son salon spacieux. Parfait pour les citadins à la recherche de praticité et de style."
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
          image: house2,
          description: "Magnifique maison familiale située dans un quartier calme de Lyon. Cette propriété spacieuse offre un cadre de vie idéal avec son grand jardin et sa piscine. Parfaite pour les familles à la recherche d'espace et de confort."
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
          image: house3,
          description: "Loft industriel entièrement rénové au cœur de Marseille. Cet espace unique allie le charme de l'ancien avec le confort moderne. Idéal pour les amateurs de design et d'architecture atypique."
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
          image: house4,
          description: "Charmant appartement cosy situé à proximité immédiate des transports à Bordeaux. Parfait pour un premier achat ou un investissement locatif, cet appartement offre un agencement optimal et une atmosphère chaleureuse."
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
          image: houseGwada,
          description: "Somptueuse villa de luxe offrant une vue imprenable sur la mer à Nice. Cette propriété d'exception dispose de vastes espaces de vie, d'une piscine à débordement et de finitions haut de gamme. L'incarnation du luxe et du raffinement sur la Côte d'Azur."
        },
      ];

      const selectedHouse = mockHouses.find(h => h.id === Number(id));
      setHouse(selectedHouse || null);
    };

    fetchHouse();
  }, [id]);

  if (!house) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <Link to="/Acheter" className="inline-flex items-center text-violet-600 hover:text-violet-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Link>
          <h1 className="text-3xl font-bold mb-4">{house.title}</h1>
          <img src={house.image} alt={house.title} className="w-full h-64 object-cover rounded-lg mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Détails de la propriété</h2>
              <ul className="space-y-2">
                <li><strong>Prix:</strong> {house.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</li>
                <li><strong>Taille:</strong> {house.size} m²</li>
                <li><strong>Type:</strong> {house.type}</li>
                <li><strong>Pièces:</strong> {house.rooms}</li>
                <li><strong>Chambres:</strong> {house.bedrooms}</li>
                <li><strong>Salles de bain:</strong> {house.bathrooms}</li>
                <li><strong>Localisation:</strong> {house.location}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Commodités</h2>
              <ul className="space-y-2">
                {house.amenities.map((amenity, index) => (
                  <li key={index} className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{house.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseDetails;

