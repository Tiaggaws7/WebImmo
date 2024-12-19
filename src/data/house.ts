import house1 from '../assets/house1.jpg'
import house2 from '../assets/house2.jpg'
import house3 from '../assets/house3.jpg'
import house4 from '../assets/house4.jpg'
import houseGwada from '../assets/houseGwada.jpg'

interface House {
    id: number
    title: string
    price: number
    size: number
    type: string
    rooms: number
    bedrooms: number
    bathrooms: number
    amenities: string[]
    location: string
    image: string
    condition: 'vendu' | 'disponible' | 'sous compromis';
  }

export const houses: House[] = [
    {
      id: 1,
      title: "Appartement moderne au centre-ville",
      price: 350000,
      size: 75,
      type: "appartement",
      rooms: 3,
      bedrooms: 2,
      bathrooms: 1,
      amenities: ["parking", "ascenseur"],
      location: "Paris",
      image: house1,
      condition: 'vendu'
    },
    {
      id: 2,
      title: "Maison familiale avec jardin",
      price: 550000,
      size: 150,
      type: "maison",
      rooms: 5,
      bedrooms: 3,
      bathrooms: 2,
      amenities: ["piscine", "parking"],
      location: "Lyon",
      image: house2,
      condition: 'sous compromis'
    },
    {
      id: 3,
      title: "Loft industriel rénové",
      price: 420000,
      size: 100,
      type: "local commercial",
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: ["parking"],
      location: "Marseille",
      image: house3,
      condition: 'disponible'
    },
    {
      id: 4,
      title: "Appartement cosy proche des transports",
      price: 280000,
      size: 60,
      type: "appartement",
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: ["ascenseur"],
      location: "Bordeaux",
      image: house4,
      condition:"disponible"
    },
    {
      id: 5,
      title: "Villa de luxe avec vue sur mer",
      price: 1500000,
      size: 300,
      type: "maison",
      rooms: 8,
      bedrooms: 5,
      bathrooms: 4,
      amenities: ["piscine", "belle vue", "parking"],
      location: "Nice",
      image: houseGwada,
      condition:'disponible'
    },
  ]