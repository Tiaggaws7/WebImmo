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
      <Navbar />

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

        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Pourquoi choisir ExpertImmo ?</h2>
            <p className="text-xl mb-8">Nous offrons une expertise inégalée et une large sélection de propriétés de qualité.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-2">Agents experts</h3>
                <p>Notre équipe d'agents expérimentés est dédiée à la recherche de la maison parfaite pour vous.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Annonces premium</h3>
                <p>Accédez à des propriétés exclusives que vous ne trouverez nulle part ailleurs.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Service personnalisé</h3>
                <p>Nous adaptons notre approche pour répondre à vos besoins et préférences uniques.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Home;
