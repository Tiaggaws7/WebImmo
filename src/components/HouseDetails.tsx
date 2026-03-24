import type React from "react"
import ReactMarkdown from 'react-markdown';
import { useEffect, useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ChevronLeft, ChevronRight, MapPin,
  Ruler, Bed, Bath, DoorOpen, Mail, X, Grid,
} from "lucide-react"
import { doc, getDoc, collection, getDocs } from "firebase/firestore"
import { db } from "../firebase-config"
import type { House } from "../types"
import { Helmet } from "react-helmet-async"

const HouseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [house, setHouse] = useState<House | null>(null)
  const [similarHouses, setSimilarHouses] = useState<House[]>([])

  // Lightbox & Image states
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const preloadedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fetchHouse = async () => {
      if (!id) return
      window.scrollTo(0, 0);
      const houseDoc = doc(db, "houses", id)
      const houseSnapshot = await getDoc(houseDoc)

      if (houseSnapshot.exists()) {
        const houseData = { id: houseSnapshot.id, ...houseSnapshot.data() } as House
        setHouse(houseData)
        // Trouver l'index de l'image principale
        const principalIndex = houseData.images.indexOf(houseData.principalImage)
        setActiveImageIndex(principalIndex >= 0 ? principalIndex : 0)

        // Fetch similar properties (same location or just recent)
        const housesRef = collection(db, "houses")
        // Fetch all and filter client side to avoid FireStore index issues
        const similarSnapshot = await getDocs(housesRef)
        const similarData = similarSnapshot.docs
          .map(d => {
            const data = d.data() as House;
            return {
              ...data,
              id: d.id
            }
          })
          .filter(h => h.id !== id && ['disponible', 'sous offre'].includes(h.condition))
          .slice(0, 3)
        setSimilarHouses(similarData)
      } else {
        setHouse(null)
      }
    }

    fetchHouse()
  }, [id])

  // Preload images progressively: next, then next+1, etc. (skips already loaded)
  useEffect(() => {
    if (!house || house.images.length <= 1) return;

    let cancelled = false;

    const preloadSequentially = async () => {
      const total = house.images.length;
      for (let offset = 1; offset < total; offset++) {
        if (cancelled) break;
        const index = (activeImageIndex + offset) % total;
        const url = house.images[index];
        if (preloadedRef.current.has(url)) continue; // Already loaded, skip
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => { preloadedRef.current.add(url); resolve(); };
          img.onerror = () => resolve();
          img.src = url;
        });
      }
    };

    preloadSequentially();

    return () => { cancelled = true; };
  }, [house, activeImageIndex])

  const handleNextImage = () => {
    if (house) setActiveImageIndex((prev) => (prev + 1) % house.images.length)
  }

  const handlePrevImage = () => {
    if (house) setActiveImageIndex((prev) => (prev - 1 + house.images.length) % house.images.length)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isGalleryOpen) return;
      if (e.key === 'Escape') closeGallery();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGalleryOpen, house]);

  const openGallery = (index: number) => {
    setActiveImageIndex(index)
    setIsGalleryOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeGallery = () => {
    setIsGalleryOpen(false)
    document.body.style.overflow = 'auto'
  }

  if (!house) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <Helmet>
        <title>{house ? `${house.title} | Maison à vendre en Guadeloupe` : "Détails du bien | Immobilier Guadeloupe"}</title>
        <meta name="description" content={house ? `Découvrez cette propriété à ${house.location} : ${house.size} m², ${house.rooms} pièces, ${house.bedrooms} chambres. Prix : ${house.price}. Contactez-nous pour plus d'infos !` : "Trouvez la maison de vos rêves en Guadeloupe avec nos annonces immobilières exclusives."} />
        <meta name="keywords" content="maison à vendre Guadeloupe, immobilier Guadeloupe, achat maison, maison avec piscine, annonces immobilières" />
        <meta name="author" content="Elise Buil" />
        <link rel="canonical" href={house ? `https://elisebuilimmobilierguadeloupe.com/Acheter/${house.id}` : "https://elisebuilimmobilierguadeloupe.com/Acheter"} />
      </Helmet>
      {/* Lightbox Gallery Modal */}
      {isGalleryOpen && house && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="p-4 flex justify-between items-center text-white">
            <span className="text-sm font-medium">{activeImageIndex + 1} / {house.images.length}</span>
            <button onClick={closeGallery} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-8 h-8" />
            </button>
          </div>

          <div
            className="flex-1 relative flex items-center justify-center p-4 min-h-0"
            onClick={closeGallery}
          >
            <button
              onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
              className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full transition-all z-10"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <img
              key={activeImageIndex}
              src={house.images[activeImageIndex]}
              alt={`${house.title} - Image ${activeImageIndex + 1}`}
              className="max-w-full max-h-full object-contain pointer-events-none select-none"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
              className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 text-white p-3 hover:bg-white/10 rounded-full transition-all z-10"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          </div>

          {/* Thumbnails strip - Minimalist flow without overlap */}
          <div className="py-2 px-4 flex justify-center bg-black/20 group/miniatures border-t border-white/5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 max-w-full">
              {house.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-12 md:w-16 h-8 md:h-12 rounded-sm overflow-hidden transition-all duration-300 ${idx === activeImageIndex
                    ? 'ring-1 ring-white/60 opacity-100 scale-105'
                    : 'opacity-20 group-hover/miniatures:opacity-40 hover:!opacity-100'
                    }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Start of New Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <nav className="flex text-sm text-gray-500 mb-6 uppercase tracking-wider font-semibold">
            <Link to="/" className="hover:text-black hover:underline transition-colors shrink-0">Accueil</Link>
            <span className="mx-2 text-gray-300">›</span>
            <Link to="/Acheter" className="hover:text-black hover:underline transition-colors shrink-0">Propriétés</Link>
            <span className="mx-2 text-gray-300">›</span>
            <span className="text-black truncate">{house.title}</span>
          </nav>

          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">{house.title}</h1>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                <span className="text-lg">{house.location}</span>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {(() => {
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
              </div>
            </div>
          </div>
        </div>

        {/* New Image Grid */}
        <div className="relative group rounded-xl overflow-hidden bg-gray-100 mb-8 max-h-[600px] flex">
          {house.images.length === 0 ? (
            <div className="w-full h-[400px] flex items-center justify-center text-gray-400">Aucune photo</div>
          ) : house.images.length === 1 || house.images.length === 2 ? (
            // Fallback for 1 or 2 images
            <div className={`grid gap-2 w-full h-full ${house.images.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {house.images.slice(0, 2).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={house.title}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openGallery(idx)}
                />
              ))}
            </div>
          ) : (
            // Desktop Grid: 1 large on left, 2 stacked on right
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full h-[400px] md:h-[600px]">
              <div className="md:col-span-2 h-full">
                <img
                  src={house.images[0]}
                  alt={house.title}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openGallery(0)}
                />
              </div>
              <div className="hidden md:grid grid-rows-2 gap-2 h-full">
                <img
                  src={house.images[1]}
                  alt={`${house.title} 2`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openGallery(1)}
                />
                <div className="relative w-full h-full">
                  <img
                    src={house.images[2]}
                    alt={`${house.title} 3`}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-colors cursor-pointer"
                    onClick={() => openGallery(2)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* View All Photos Button */}
          {house.images.length > 0 && (
            <button
              onClick={() => openGallery(0)}
              className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-black font-semibold py-2 px-4 rounded-lg shadow-lg flex items-center gap-2 transition-colors z-10"
            >
              <Grid className="w-5 h-5" />
              <span className="hidden sm:inline">Voir toutes les photos</span>
              <span className="sm:hidden">Photo{house.images.length > 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        {/* Key Metrics Bar */}
        <div className="bg-gray-50 border-y border-gray-200 py-6 mb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-x divide-gray-200 text-center">
            <div className="flex flex-col items-center justify-center">
              <Ruler className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-gray-900">{house.size} m²</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Surface Habitable</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Bed className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-gray-900">{house.bedrooms}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Chambre{Number(house.bedrooms) > 1 ? 's' : ''}</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <Bath className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-gray-900">{house.bathrooms}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Salle{Number(house.bathrooms) > 1 ? 's' : ''} de bain</span>
            </div>
            <div className="flex flex-col items-center justify-center">
              <DoorOpen className="w-8 h-8 text-primary mb-2" strokeWidth={1.5} />
              <span className="text-2xl font-bold text-gray-900">{house.rooms}</span>
              <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Pièce{Number(house.rooms) > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content (Left) */}
          <div className="lg:w-2/3 flex flex-col gap-10">

            {/* Description */}
            <section>
              <div className="prose max-w-none text-gray-600 leading-relaxed space-y-4">
                <ReactMarkdown>{house.description}</ReactMarkdown>
              </div>
            </section>

            {/* Caractéristiques Techniques */}
            <section className="bg-gray-50 border border-gray-100 rounded-xl p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Caractéristiques Techniques</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                {house.types.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500 uppercase tracking-wide text-xs">Type</span>
                    <span className="font-semibold text-gray-900 text-right">{house.types.join(", ")}</span>
                  </div>
                )}
                {house.condition && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500 uppercase tracking-wide text-xs">Condition</span>
                    <span className="font-semibold text-gray-900 text-right capitalize">{house.condition}</span>
                  </div>
                )}
                {house.wc && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500 uppercase tracking-wide text-xs">WC</span>
                    <span className="font-semibold text-gray-900 text-right">{house.wc}</span>
                  </div>
                )}
                {house.consomation && (
                  <div className="flex justify-between py-2 border-b border-gray-200 items-center">
                    <span className="text-gray-500 uppercase tracking-wide text-xs">Diagnostic Énergétique</span>
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">
                      Classe {house.consomation}
                    </span>
                  </div>
                )}
                {/* Annexes / Amenities mapped as features */}
                {house.amenities.map((amenity, index) => (
                  <div key={index} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500 uppercase tracking-wide text-xs">Annexe</span>
                    <span className="font-semibold text-gray-900 text-right">{amenity}</span>
                  </div>
                ))}
                {/* Additional stats if needed to pad */}
                {house.rooms && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500 uppercase tracking-wide text-xs">Pièces Total</span>
                    <span className="font-semibold text-gray-900 text-right">{house.rooms}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Vidéos */}
            {house.videos && house.videos.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Vidéos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {house.videos.map((videoUrl, index) => (
                    <div key={index} className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-sm">
                      <video src={videoUrl} controls className="w-full h-full object-cover bg-black">
                        Votre navigateur ne supporte pas la lecture de vidéos.
                      </video>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Visite virtuelle */}
            {house.virtualTourUrl && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Visite Virtuelle</h2>
                <div className="rounded-xl overflow-hidden shadow-sm">
                  <div style={{ position: 'relative', height: 0, paddingTop: '60%' }}>
                    <iframe
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      src={house.virtualTourUrl}
                      title="Visite virtuelle"
                      frameBorder="0"
                      allowFullScreen
                      allow="fullscreen; accelerometer; gyroscope; magnetometer; vr; xr; xr-spatial-tracking; autoplay; camera; microphone"
                    />
                  </div>
                </div>
              </section>
            )}

          </div>

          {/* Sticky Sidebar (Right) */}
          <div className="lg:w-1/3">
            <div className="sticky top-24">
              {/* Agent Card */}
              <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden mb-4 ring-4 ring-gray-50">
                  <img src="/assets/Affiche_Elise_Buil (8).png" alt="Elise Buil" className="w-full h-full object-cover bg-gray-200" onError={(e) => { e.currentTarget.src = 'https://ui-avatars.com/api/?name=Elise+Buil&background=random' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Elise BUIL</h3>
                <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold mb-6">Accompagnement Commercial, Administratif et Juridique</p>

                <Link
                  to="/EliseBUIL"
                  className="w-full bg-primary hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-6 transition-all shadow-md hover:shadow-lg text-center"
                >
                  <Mail className="w-5 h-5" />
                  Contacter Elise Buil
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Section Propriétés Similaires */}
        {similarHouses.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Découvrir nos autres propriétés</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {similarHouses.map(similar => (
                <Link to={`/house/${similar.id}`} key={similar.id} className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="aspect-w-16 aspect-h-10 relative overflow-hidden bg-gray-100 h-64">
                    {similar.images && similar.images.length > 0 ? (
                      <img src={similar.images[0]} alt={similar.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Aucune photo</div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{similar.location}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 line-clamp-2 leading-tight">{similar.title}</h3>
                    <div className="mt-auto text-primary font-bold text-xl">
                      {(() => {
                        const cleanPrice = similar.price.replace(/[^0-9.-]+/g, "")
                        const numericPrice = Number(cleanPrice)
                        return !isNaN(numericPrice)
                          ? numericPrice.toLocaleString("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 })
                          : similar.price
                      })()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HouseDetails

