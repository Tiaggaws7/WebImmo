import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Navbar from './components/Navbar.tsx'
import Footer from './components/Footer.tsx'

// Import house images
import house1 from './assets/house1.jpg'
import house2 from './assets/house2.jpg'
import house3 from './assets/house3.jpg'
import house4 from './assets/house4.jpg'

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

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
  }, [emblaApi, onSelect])

  const houses = [
    { id: 1, imageUrl: house1 },
    { id: 2, imageUrl: house2 },
    { id: 3, imageUrl: house3 },
    { id: 4, imageUrl: house4 },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
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

        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Trouvez votre maison de rêve</h1>
            <p className="text-xl mb-8">Découvrez une large gamme de propriétés avec ExpertImmo</p>
            <Button size="lg">Voir toutes les propriétés</Button>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Pourquoi choisir ExpertImmo ?</h2>
            <p className="text-lg md:text-xl mb-12 text-gray-700">
              Chez ExpertImmo, nous ne faisons pas que trouver une propriété, nous trouvons <strong>votre</strong> propriété. Découvrez pourquoi nous sommes le choix préféré de nos clients exigeants.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Des Agents Passionnés et Expérimentés</h3>
                <p className="text-gray-600">
                  Nos agents immobiliers sont plus que des experts, ce sont des passionnés dédiés à vous guider dans chaque étape de votre projet immobilier, avec des conseils personnalisés et une connaissance approfondie du marché.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Accès à des Propriétés Exclusives</h3>
                <p className="text-gray-600">
                  Explorez notre sélection de biens d'exception, incluant des annonces exclusives introuvables sur d'autres plateformes. Accédez au meilleur du marché immobilier avec nous.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-semibold mb-4">Un Accompagnement sur Mesure</h3>
                <p className="text-gray-600">
                  Chez ExpertImmo, chaque client est unique. Nous adaptons nos services pour répondre précisément à vos attentes, avec un suivi personnalisé et une attention constante à vos besoins.
                </p>
              </div>
            </div>
            <div className="mt-12">
              <a 
                href="/contact" 
                className="inline-block bg-blue-600 text-white text-lg font-medium py-3 px-8 rounded-lg shadow hover:bg-blue-700 transition duration-300"
              >
                Contactez-nous dès aujourd'hui
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Home;
