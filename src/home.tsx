import { useState, useEffect, useRef } from 'react'
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from 'react-router-dom'
import { House } from './types'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase-config'
import profilePicture from './assets/profile_picture.jpg'
import GoogleReviews from './components/GoogleReviews';
import { MapPin, Search, Phone, CheckCircle2, ChevronDown, ArrowRight, Home as HomeIcon } from 'lucide-react'

function Home() {
  const [houses, setHouses] = useState<House[]>([])
  const [heroImage, setHeroImage] = useState<string>(() => localStorage.getItem('home_hero_bg') || '')
  const [isHovered, setIsHovered] = useState<number | null>(null)
  const [searchLocation, setSearchLocation] = useState('')
  const [searchType, setSearchType] = useState('')
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const navigate = useNavigate()
  const locationRef = useRef<HTMLDivElement>(null)
  const typeRef = useRef<HTMLDivElement>(null)

  const availableLocations = Array.from(new Set(houses.map(h => h.location).filter(Boolean))).sort() as string[]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false)
      }
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLocationSelect = (e: React.MouseEvent, loc: string) => {
    e.stopPropagation()
    setSearchLocation(loc)
    setIsLocationOpen(false)
  }

  const handleTypeSelect = (e: React.MouseEvent, type: string) => {
    e.stopPropagation()
    setSearchType(type)
    setIsTypeOpen(false)
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchLocation) params.append('location', searchLocation)
    if (searchType) params.append('type', searchType)
    navigate(`/Acheter?${params.toString()}`)
  }

  // Récupération des maisons
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        // Optimization: Limit to 24 items for faster initial load
        const querySnapshot = await getDocs(collection(db, 'houses'))
        const data = querySnapshot.docs.slice(0, 24).map(doc => ({
          ...doc.data() as House,
          id: doc.id
        })).filter(house => house.condition === 'disponible')

        // Sorting by price descending to put the most expensive first
        data.sort((a, b) => {
          const getPrice = (h: any) => {
            const priceStr = h.price?.toString().replace(/[^0-9.]/g, '') || h.prix?.toString().replace(/[^0-9.]/g, '') || "0";
            return parseFloat(priceStr) || 0;
          };
          return getPrice(b) - getPrice(a);
        });

        setHouses(data)

        // Update hero image and cache it
        if (data.length > 0 && data[0].principalImage) {
          setHeroImage(data[0].principalImage);
          localStorage.setItem('home_hero_bg', data[0].principalImage);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error)
      }
    }
    fetchHouses()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#fafafa]">
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
        {/* Google Tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17711266631"
        ></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17711266631');
          `}
        </script>
        {/* Canonical URL (SEO best practice) */}
        <link rel="canonical" href="https://elisebuilimmobilierguadeloupe.com/" />
      </Helmet>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] flex items-center pt-20">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {(houses.length > 0 || heroImage) ? (
              <img
                src={houses.length > 0 ? houses[0].principalImage : heroImage}
                alt="Hero Background"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
            <div className="absolute inset-0 bg-black/55"></div>
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-2xl">
                L'immobilier<br />autrement en<br />
                <span className="text-primary">Guadeloupe.</span>
              </h1>
              <p className="text-xl text-white/95 mb-10 max-w-xl font-light drop-shadow-lg">
                Un accompagnement sur mesure pour vos projets de vente et d'acquisition sur l'archipel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Link to="/Acheter" className="bg-white text-gray-900 font-bold py-4 px-10 rounded-xl text-center hover:bg-gray-100 transition duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 transform">
                  Voir nos biens
                </Link>
                <Link to="/EliseBUIL" className="bg-transparent border-2 border-white/60 text-white font-bold py-4 px-10 rounded-xl text-center hover:bg-white/10 transition duration-300 shadow-xl hover:-translate-y-1 transform">
                  Me contacter
                </Link>
              </div>

              {/* Search Bar - Functional */}
              <div className="bg-white rounded-[1.5rem] shadow-2xl p-3 flex flex-col md:flex-row gap-2 items-center transform translate-y-16 max-w-4xl border border-gray-100">

                {/* Location Dropdown */}
                <div
                  ref={locationRef}
                  className="flex-1 flex items-center gap-4 px-6 py-4 border-b md:border-b-0 md:border-r border-gray-100 w-full hover:bg-gray-50 rounded-xl transition duration-200 relative cursor-pointer"
                  onClick={() => setIsLocationOpen(!isLocationOpen)}
                >
                  <div className="bg-red-50 p-2 rounded-full hidden sm:block">
                    <MapPin className="text-primary w-5 h-5" />
                  </div>
                  <div className="flex-1 w-full flex justify-between items-center text-gray-700 font-medium">
                    <span className={`truncate ${!searchLocation ? 'text-gray-400' : 'text-gray-700'}`}>
                      {searchLocation || "Localisation en Guadeloupe..."}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isLocationOpen && (
                    <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
                      <div
                        className="px-6 py-3 hover:bg-red-50 hover:text-primary transition-colors cursor-pointer text-gray-600 font-medium flex items-center justify-between group"
                        onClick={(e) => handleLocationSelect(e, "")}
                      >
                        Toutes localisations
                      </div>
                      {availableLocations.map(loc => (
                        <div
                          key={loc}
                          className="px-6 py-3 hover:bg-red-50 hover:text-primary transition-colors cursor-pointer text-gray-700 font-medium flex items-center justify-between group"
                          onClick={(e) => handleLocationSelect(e, loc)}
                        >
                          {loc}
                          {searchLocation === loc && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Type Dropdown */}
                <div
                  ref={typeRef}
                  className="flex-1 flex items-center gap-4 px-6 py-4 w-full hover:bg-gray-50 rounded-xl transition duration-200 relative cursor-pointer"
                  onClick={() => setIsTypeOpen(!isTypeOpen)}
                >
                  <div className="bg-red-50 p-2 rounded-full hidden sm:block">
                    <HomeIcon className="text-primary w-5 h-5" />
                  </div>
                  <div className="flex-1 w-full flex justify-between items-center text-gray-700 font-medium">
                    <span className={`truncate ${!searchType ? 'text-gray-400' : 'text-gray-700'}`}>
                      {searchType === "appartement" ? "Appartement" :
                        searchType === "maison" ? "Maison" :
                          searchType === "local commercial" ? "Local commercial" :
                            searchType === "terrain" ? "Terrain" :
                              "Type de bien"}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${isTypeOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {isTypeOpen && (
                    <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 py-3 z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top">
                      <div
                        className="px-6 py-3 hover:bg-red-50 hover:text-primary transition-colors cursor-pointer text-gray-600 font-medium flex items-center justify-between group"
                        onClick={(e) => handleTypeSelect(e, "")}
                      >
                        Tous types
                      </div>
                      {[
                        { label: "Appartement", value: "appartement" },
                        { label: "Maison", value: "maison" },
                        { label: "Local commercial", value: "local commercial" },
                        { label: "Terrain", value: "terrain" }
                      ].map(type => (
                        <div
                          key={type.value}
                          className="px-6 py-3 hover:bg-red-50 hover:text-primary transition-colors cursor-pointer text-gray-700 font-medium flex items-center justify-between group"
                          onClick={(e) => handleTypeSelect(e, type.value)}
                        >
                          {type.label}
                          {searchType === type.value && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submmit Button */}
                <button
                  onClick={handleSearch}
                  className="bg-primary text-white font-bold py-4 px-8 rounded-xl w-full md:w-auto flex items-center justify-center gap-3 hover:bg-red-700 transition duration-300 shadow-[0_8px_30px_rgb(217,1,21,0.3)] hover:shadow-[0_8px_30px_rgb(217,1,21,0.5)] transform hover:-translate-y-0.5 m-1"
                >
                  <Search className="w-5 h-5" />
                  <span>Rechercher</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Sélection Exclusive Section */}
        <section className="pt-40 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Sélection Exclusive</h2>
              <p className="text-gray-500 max-w-2xl text-lg font-light">
                Découvrez nos dernières opportunités immobilières soigneusement sélectionnées pour leur caractère et leur emplacement privilégié.
              </p>
            </div>
            <Link to="/Acheter" className="hidden md:flex items-center text-primary font-bold hover:text-red-700 transition gap-2 group text-lg border-b-2 border-transparent hover:border-red-700 pb-1">
              Voir tout le catalogue <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {houses.length > 0 && (
              <div
                className="lg:col-span-2 group rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
                onMouseEnter={() => setIsHovered(0)}
                onMouseLeave={() => setIsHovered(null)}
              >
                <Link to={`/house/${houses[0].id}`} className="block relative h-full min-h-[450px]">
                  <img src={houses[0].principalImage} alt={houses[0].title || "Maison principale"} className={`w-full h-full object-cover transition-transform duration-1000 ${isHovered === 0 ? 'scale-110' : 'scale-100'}`} />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pt-32 pb-8 px-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                      <div>
                        <h3 className="text-white text-3xl font-extrabold mb-3 group-hover:text-primary transition-colors duration-300">{houses[0].title || `Maison ${houses[0].id}`}</h3>
                        <p className="text-gray-300 flex items-center gap-2 text-base font-medium">
                          <MapPin className="w-5 h-5 text-gray-400" /> {houses[0].location || "Guadeloupe"}
                        </p>
                      </div>
                      <span className="text-primary text-3xl font-extrabold bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 whitespace-nowrap">
                        {(() => {
                          const cleanPrice = (houses[0] as any).price?.replace(/[^0-9.-]+/g, '') || (houses[0] as any).prix?.toString().replace(/[^0-9.-]+/g, '');
                          const numericPrice = Number(cleanPrice);
                          return !isNaN(numericPrice) && numericPrice > 0
                            ? numericPrice.toLocaleString('fr-FR') + ' €'
                            : 'Sur demande';
                        })()}
                      </span>
                    </div>
                    {/* Tags */}
                    <div className="flex gap-6 mt-6 pt-6 border-t border-white/20 text-white/90 text-sm font-semibold tracking-wide">
                      {houses[0].size && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>{houses[0].size} m²</span>}
                      {houses[0].rooms && <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-primary"></div>{houses[0].rooms} pièces</span>}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-8">
              {houses.slice(1, 3).map((house, idx) => (
                <div
                  key={house.id}
                  className="rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer group bg-white border border-gray-100 h-1/2 flex flex-col"
                  onMouseEnter={() => setIsHovered(idx + 1)}
                  onMouseLeave={() => setIsHovered(null)}
                >
                  <Link to={`/house/${house.id}`} className="flex flex-col h-full">
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      <img src={house.thumbnailImage || house.principalImage} alt={house.title || `Maison ${house.id}`} className={`w-full h-full object-cover transition-transform duration-1000 ${isHovered === idx + 1 ? 'scale-110' : 'scale-100'}`} />
                    </div>
                    <div className="p-6 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="text-gray-900 text-xl font-extrabold mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">{house.title || `Propriété ${house.id}`}</h3>
                        <p className="text-gray-500 flex items-center gap-2 text-sm font-medium mb-4">
                          <MapPin className="w-4 h-4 text-gray-400" /> {house.location || "Guadeloupe"}
                        </p>
                      </div>
                      <span className="text-primary text-2xl font-extrabold">
                        {(() => {
                          const cleanPrice = (house as any).price?.replace(/[^0-9.-]+/g, '') || (house as any).prix?.toString().replace(/[^0-9.-]+/g, '');
                          const numericPrice = Number(cleanPrice);
                          return !isNaN(numericPrice) && numericPrice > 0
                            ? numericPrice.toLocaleString('fr-FR') + ' €'
                            : 'Sur demande';
                        })()}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex justify-center md:hidden">
            <Link to="/Acheter" className="inline-flex items-center text-primary font-bold hover:text-red-700 transition gap-2 group text-lg bg-red-50 px-6 py-3 rounded-xl">
              Voir tout le catalogue <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
          </div>
        </section>

        {/* Avis Google Section */}
        <section className="bg-[#f5f5f5] py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <GoogleReviews />
          </div>
        </section>

        {/* À propos Section */}
        <section className="bg-white py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-20 items-center">

              <div className="lg:w-5/12 relative flex justify-center mt-8 lg:mt-0">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl group w-full max-w-[400px] aspect-[4/5]">
                  <img src={profilePicture} alt="Elise BUIL" className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105" />
                </div>

                <div className="absolute bottom-8 right-0 lg:-right-10 bg-white p-4 pr-6 rounded-2xl shadow-xl flex items-center gap-4 z-10">
                  <div className="bg-primary/10 p-3 rounded-full text-primary flex-shrink-0">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 leading-none mb-1">100%</p>
                    <p className="text-sm text-gray-600 font-bold uppercase tracking-wider">À votre écoute</p>
                  </div>
                </div>
              </div>

              <div className="lg:w-7/12">
                <span className="text-primary font-bold text-sm tracking-[0.25em] uppercase mb-4 block">Fondatrice de l'agence</span>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-10 tracking-tight">À propos d'Elise BUIL</h2>

                <div className="text-gray-600 space-y-6 text-lg mb-12 leading-relaxed font-light">
                  <p className="text-2xl font-semibold text-gray-900 leading-snug">
                    Bien plus qu'un métier, une véritable passion!
                  </p>
                  <p>
                    Riche d’une forte expérience dans le secteur de l’immobilier, je mets mon expertise à votre service pour vous accompagner dans toutes vos démarches liées à la vente de votre bien. Je mets un point d’honneur à développer une véritable relation basée sur l’écoute et le respect de vos besoins.
                  </p>
                  <p>
                    Issue d'une formation juridique en droit immobilier, je vous propose un accompagnement spécialisé dans la concrétisation de vos projets immobiliers, notamment en proposant la rédaction du compromis de vente en collaboration avec votre notaire , vous faisant ainsi bénéficier d'un temps précieux.
                  </p>
                  <p>
                    Mon service de vente immobilière se distingue par une approche unique alliant expertise juridique et authentique relation d’échanges.
                  </p>
                  <p>
                    N'hésitez pas à prendre contact avec moi pour échanger sur vos projets, je me ferai un plaisir de pouvoir répondre à vos questions.
                    <br /> Ensemble, construisons une relation solide et fiable pour mener à bien votre vente immobilière en toute sécurité!
                  </p>
                  <p className="font-medium text-gray-800">
                    Au plaisir de vous rencontrer,
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center mb-4">
                  <Link to="/EliseBUIL" className="bg-primary text-white font-bold py-4 px-10 rounded-xl text-center hover:bg-red-700 transition-all duration-300 shadow-[0_8px_30px_rgb(217,1,21,0.3)] hover:shadow-[0_8px_30px_rgb(217,1,21,0.5)] w-full sm:w-auto transform hover:-translate-y-1 text-lg">
                    Découvrir mon parcours
                  </Link>
                  <div className="flex items-center gap-5 w-full sm:w-auto group bg-white border border-gray-100 py-3.5 px-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                    <Phone className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-0.5">Contact direct</p>
                      <a href="tel:+590690590565" className="font-extrabold text-gray-800 text-lg tracking-tight hover:text-primary transition-colors">
                        +590 690 590 565
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Vendre Section */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto -mt-16 relative z-10">
          <div className="bg-primary rounded-[3rem] overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-red-900/80 via-red-900/30 to-transparent pointer-events-none"></div>

            <div className="flex flex-col p-12 md:p-20 lg:p-24 gap-12 items-center text-center relative z-10">
              <div className="max-w-4xl text-white">
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-8 leading-[1.1] tracking-tight">
                  Vous souhaitez<br />vendre votre<br />bien ?
                </h2>
                <p className="text-white/90 text-xl lg:text-2xl mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                  Valorisez votre bien et vendez dans des conditions idéales grâce à une estimation offerte dès aujourd’hui
                </p>
                <div className="flex flex-col md:flex-row justify-center gap-8 mb-16">
                  <div className="flex items-center gap-4 text-lg">
                    <CheckCircle2 className="w-7 h-7 text-white bg-white/20 rounded-full p-1 flex-shrink-0" />
                    <span className="font-medium">Étude comparative de marché</span>
                  </div>
                  <div className="flex items-center gap-4 text-lg">
                    <CheckCircle2 className="w-7 h-7 text-white bg-white/20 rounded-full p-1 flex-shrink-0" />
                    <span className="font-medium">Analyse des tendances locales</span>
                  </div>
                  <div className="flex items-center gap-4 text-lg">
                    <CheckCircle2 className="w-7 h-7 text-white bg-white/20 rounded-full p-1 flex-shrink-0" />
                    <span className="font-medium">Rapport d'expertise complet</span>
                  </div>
                </div>
                <Link to="/Estimation" className="inline-block bg-white text-primary font-extrabold py-5 px-12 rounded-2xl shadow-[0_15px_40px_rgb(0,0,0,0.2)] hover:bg-gray-50 hover:shadow-[0_20px_50px_rgb(0,0,0,0.3)] transition-all duration-300 transform hover:-translate-y-1.5 text-xl w-full sm:w-auto text-center">
                  Estimer mon bien
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Adding custom animations */}
      <style>{`
      `}</style>
    </div>
  )
}

export default Home;
