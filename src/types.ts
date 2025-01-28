
export interface House {
    id: string;
    title: string;
    price: string;
    size: string;
    types: string[];
    rooms: string;
    bedrooms: string;
    bathrooms: string;
    wc:string;
    amenities: string[];
    location: string;
    image: string;
    description: string;
    condition: 'vendu' | 'disponible' | 'sous compromis';
    consomation: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  }