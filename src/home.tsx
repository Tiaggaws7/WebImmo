import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import {collection, getDocs } from 'firebase/firestore';
import { db } from './firebase-config';

import profilePicture from './assets/profile_picture.jpg'

// Interface pour les données Firebase
interface House {
  id: string;
  title: string;
  price: string;
  size: string;
  type: string;
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  amenities: string[];
  location: string;
  image: string;
  description: string;
  condition: 'vendu' | 'disponible' | 'sous compromis';
}

// Interface pour le tableau transformé
interface SimpleHouse {
  id: string;
  imageUrl: string;
} 

function Button({ 
  children, 
  className = '', 
  variant = 'default', 
  size = 'default', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}) {
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
  const variantStyles = {
    default: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
  }
  const sizeStyles = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [houses, setHouses] = useState<SimpleHouse[]>([]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'houses')); // 'houses' est le nom de votre collection
        const data: SimpleHouse[] = querySnapshot.docs.map((doc) => {
          const house = doc.data() as House; // Cast en type House
          return {
            id: house.id, // Crée un ID numérique basé sur l'index (optionnel si déjà unique)
            imageUrl: house.image, // Utilise le champ `image` pour `imageUrl`
          };
        });
        setHouses(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
      }
    };

    fetchHouses();
  }, []);

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  // Auto-advance functionality
  useEffect(() => {
    if (!emblaApi) return

    const autoScroll = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000) // Change slide every 8 seconds

    return () => clearInterval(autoScroll) // Cleanup interval on unmount
  }, [emblaApi])

  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <section className="py-16 px-4 md:px-8 max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">À propos de moi</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <img
              src={profilePicture}
              alt="Elise BUIL"
              className="w-64 h-64 rounded-full object-cover"
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
                <a 
                  href="/NomPrenom" 
                  className="mx-auto inline-block bg-blue-600 text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-blue-700 transition duration-300"
                >
                  Contactez-moi dès aujourd'hui
                </a>
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-white">
          <div className="relative">
            <div className="embla overflow-hidden" ref={emblaRef}>
              <div className="embla__container flex">
                {houses.map((house) => (
                  <div key={house.id} className="embla__slide flex-[0_0_100%] min-w-0">
                    <img 
                      src={house.imageUrl} 
                      alt={`Maison ${house.id}`} 
                      className="w-full h-[calc(100vh-64px)] object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </section>

        <section className='my-12 flex justify-center'>
        <div className="">
          <a 
            href="/Acheter" 
            className="mx-auto inline-block bg-blue-600 text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-blue-700 transition duration-300"
          >
          Voir tous nos biens disponibles
          </a>
        </div>
        </section>
      </main>
    </div>
  )
}

export default Home;
