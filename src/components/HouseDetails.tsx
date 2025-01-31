import type React from "react"
import { useEffect, useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase-config"
import type { House } from "../types"

const HouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [house, setHouse] = useState<House | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  useEffect(() => {
    const fetchHouse = async () => {
      if (!id) return
      const houseDoc = doc(db, "houses", id)
      const houseSnapshot = await getDoc(houseDoc)

      if (houseSnapshot.exists()) {
        const houseData = { id: houseSnapshot.id, ...houseSnapshot.data() } as House
        setHouse(houseData)
        // Trouver l'index de l'image principale
        const principalIndex = houseData.images.indexOf(houseData.principalImage)
        setActiveImageIndex(principalIndex >= 0 ? principalIndex : 0)
      } else {
        setHouse(null)
      }
    }

    fetchHouse()
  }, [id])

  const handleNextImage = () => {
    if (house) {
      setActiveImageIndex((prev) => (prev + 1) % house.images.length)
    }
  }

  const handlePrevImage = () => {
    if (house) {
      setActiveImageIndex((prev) => (prev - 1 + house.images.length) % house.images.length)
    }
  }

  if (!house) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
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
          
          {/* Début du carrousel */}
          <div className="relative mb-6 group">
            <div className="aspect-w-16 aspect-h-9">
              <img
                src={house.images[activeImageIndex] || "/placeholder.svg"}
                alt={house.title}
                className="w-full h-96 object-cover rounded-lg transition-opacity duration-300"
              />
            </div>

            {house.images.length > 1 && (
              <>
                {/* Flèches de navigation */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white/100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white/100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Points indicateurs */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                  {house.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all ${
                        index === activeImageIndex ? 'bg-violet-600' : 'bg-white/80 hover:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Détails de la propriété</h2>
              <ul className="space-y-2">
                <li>
                  <strong>Prix:</strong> {(() => {
                    const cleanPrice = house.price.replace(/[^0-9.-]+/g, "")
                    const numericPrice = Number(cleanPrice)
                    return !isNaN(numericPrice)
                      ? numericPrice.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      : "Invalid price"
                  })()}
                </li>
                <li>
                  <strong>Surface:</strong> {house.size} m²
                </li>
                <li>
                  <strong>Types:</strong> {house.types.join(", ")}
                </li>
                <li>
                  <strong>Pièces:</strong> {house.rooms}
                </li>
                <li>
                  <strong>Chambres:</strong> {house.bedrooms}
                </li>
                <li>
                  <strong>Salles de bain:</strong> {house.bathrooms}
                </li>
                <li>
                  <strong>WC:</strong> {house.wc}
                </li>
                <li>
                  <strong>Localisation:</strong> {house.location}
                </li>
                <li>
                  <strong>Condition:</strong> {house.condition}
                </li>
                <li>
                  <strong>Consommation énergétique:</strong> {house.consomation}
                </li>
              </ul>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Annexes</h2>
              <ul className="space-y-2">
                {house.amenities.map((amenity, index) => (
                  <li
                    key={index}
                    className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                  >
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
  )
}

export default HouseDetails

