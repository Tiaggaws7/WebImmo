import { useState, useEffect } from 'react'
import { Helmet } from "react-helmet-async";
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { House } from './types'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase-config'
import profilePicture from './assets/profile_picture.jpg'

function Home() {
  const [houses, setHouses] = useState<House[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [mouseDownX, setMouseDownX] = useState(0)
  const [mouseMoveX, setMouseMoveX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  // Récupération des maisons
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'houses'))
        const data = querySnapshot.docs.map(doc => ({
          ...doc.data() as House,
          id: doc.id
        }))
        setHouses(data)
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error)
      }
    }
    fetchHouses()
  }, [])

  // Navigation
  const handleNext = () => setActiveIndex(prev => (prev + 1) % houses.length)
  const handlePrev = () => setActiveIndex(prev => (prev - 1 + houses.length) % houses.length)

  // Défilement automatique
  useEffect(() => {
    const interval = setInterval(handleNext, 5000)
    return () => clearInterval(interval)
  }, [houses.length])

  // Gestion des gestes tactiles
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)
  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) handleNext()
    if (touchStart - touchEnd < -50) handlePrev()
  }

  // Gestion du glissement souris
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownX(e.clientX)
    setMouseMoveX(e.clientX)
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseDownX !== 0) {
      setIsDragging(true)
      setMouseMoveX(e.clientX)
    }
  }

  const handleMouseEnd = () => {
    if (isDragging) {
      const delta = mouseDownX - mouseMoveX
      if (delta > 50) handleNext()
      if (delta < -50) handlePrev()
    }
    setMouseDownX(0)
    setIsDragging(false)
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Accueil | Elise Buil Immobilier Guadeloupe</title>
        <meta name="description" content="Découvrez les meilleures offres immobilières en Guadeloupe avec Elise Buil. Achat, vente et estimation de biens immobiliers." />
        <meta name="keywords" content="Immobilier Guadeloupe, Achat maison Guadeloupe, Vente appartement, Annonces immobilières" />
        <meta name="author" content="Elise Buil" />
        
        {/* Open Graph for Facebook & Social Media */}
        <meta property="og:title" content="Accueil | Elise Buil Immobilier Guadeloupe" />
        <meta property="og:description" content="Découvrez les meilleures offres immobilières en Guadeloupe avec Elise Buil." />
        <meta property="og:url" content="https://elisebuilimmobilierguadeloupe.com/" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL (SEO best practice) */}
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/" />
      </Helmet>
      <main className="flex-grow">
        <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">À propos de moi</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={profilePicture}
              alt="Elise BUIL"
              className="w-64 h-90 rounded-full object-cover"
            />
            <div>
              <p className="text-lg mb-4">
              Bien plus qu'un métier, une véritable passion!
              </p>
              <p className="text-lg mb-4">
              Riche d’une forte expérience dans le secteur de l’immobilier, je mets mon expertise à votre service pour vous accompagner dans toutes vos démarches liées à la vente de votre bien. Je mets un point d’honneur à développer une véritable relation basée sur l’écoute et le respect de vos besoins.  
              </p>
              <p className="text-lg mb-4">
              Issue d'une formation juridique en droit immobilier, je vous propose un accompagnement spécialisé dans la concrétisation de vos projets immobiliers, notamment en proposant la rédaction du compromis de vente en collaboration avec votre notaire , vous faisant ainsi bénéficier d'un temps précieux.
              </p>
              <p className="text-lg mb-4">
              Mon service de vente immobilière se distingue par une approche unique alliant expertise juridique et authentique relation d’échanges.
              </p>
              <p className="text-lg mb-4">
              N'hésitez pas à prendre contact avec moi pour échanger sur vos projets, je me ferai un plaisir de pouvoir répondre à vos questions.
              <br/> Ensemble, construisons une relation solide et fiable pour mener à bien votre vente immobilière en toute sécurité!              </p>
              <p className="text-lg">
              Au plaisir de vous rencontrer, 
              </p>
              <div className="mt-12">
                <Link to="/EliseBUIL" className="mx-auto inline-block bg-primary text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-black transition duration-300">
                  Contactez-moi dès aujourd'hui 
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-white">
        <div className="relative group">
          <div 
            className="overflow-hidden relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex transition-transform duration-300 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
              {houses.map(house => (
                <div key={house.id} className="w-full flex-shrink-0 relative">
                  <Link to={`/house/${house.id}`} className="block">
                    <img 
                      src={house.principalImage} 
                      alt={`Maison ${house.id}`} 
                      className="w-full h-64 md:h-[calc(100vh-64px)] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/10"></div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

    {houses.length > 1 && (
      <>
        <button
          onClick={handlePrev}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-8 w-8 text-gray-900 hover:text-blue-600" />
        </button>
        <button
          onClick={handleNext}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-300 opacity-0 group-hover:opacity-100"
          aria-label="Next image"
        >
          <ChevronRight className="h-8 w-8 text-gray-900 hover:text-blue-600" />
        </button>

        {/* Progress Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {houses.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                index === activeIndex 
                  ? 'bg-blue-600 scale-125' 
                  : 'bg-white/80 hover:bg-white scale-100'
              }`}
            />
          ))}
        </div>
      </>
    )}
  </div>
</section>

        <section className='my-12 flex justify-center'>
        <div className="">
          <Link to="/Acheter" className="mx-auto inline-block bg-primary text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-black transition duration-300">
            Voir tous nos biens
          </Link>
        </div>
        </section>
      </main>
    </div>
  )
}

export default Home;
