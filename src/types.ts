
export interface House {
  id: string;
  title: string;
  price: string;
  size: string;
  types: string[];
  rooms: string;
  bedrooms: string;
  bathrooms: string;
  wc: string;
  amenities: string[];
  location: string;
  images: string[];
  videos: string[];
  principalImage: string;
  description: string;
  condition: 'vendu' | 'disponible' | 'sous compromis' | 'sous offre' | 'en attente';
  consomation: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  virtualTourUrl?: string;
}

export type Article = {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: any; // Contentful rich text might be an object
  author: string;
  date: string;
};
