import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-config'; // Import Firebase instance
import { House } from '../types';


const HouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [house, setHouse] = useState<House | null>(null);

  useEffect(() => {
    const fetchHouse = async () => {
      if (!id) return;
      const houseDoc = doc(db, 'houses', id);
      const houseSnapshot = await getDoc(houseDoc);

      if (houseSnapshot.exists()) {
        setHouse({ id: houseSnapshot.id, ...houseSnapshot.data() } as House);
      } else {
        setHouse(null);
      }
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
                <li><strong>Prix:</strong> {(() => {
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
                    })()}</li>
                <li><strong>Surface:</strong> {house.size} m²</li>
                <li><strong>Type:</strong> {house.type}</li>
                <li><strong>Pièces:</strong> {house.rooms}</li>
                <li><strong>Chambres:</strong> {house.bedrooms}</li>
                <li><strong>Salles de bain:</strong> {house.bathrooms}</li>
                <li><strong>Localisation:</strong> {house.location}</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Annexes</h2>
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

