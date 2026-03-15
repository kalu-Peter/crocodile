// Villa Types and Constants
export interface PricingTier {
  guestMin: number;
  guestMax: number;
  price: number;
}

export interface Villa {
  id: string;
  name: string;
  type: 'Villa' | 'Lodge' | 'Apartment' | 'Bungalow';
  maxGuests: number;
  description: string;
  isAvailable: boolean;
  pricing: PricingTier[];
  color: string;
  image: string;
  gallery?: string[];
  amenities?: string[];
  bedrooms?: number;
  bathrooms?: number;
}

export interface Reservation {
  id: string;
  villaId: string;
  villaName: string;
  guestCount: number;
  checkInDate: string;
  checkOutDate: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
}

export interface PaymentInfo {
  phoneNumber: string;
  amount: number;
  reservationId: string;
  status: "pending" | "completed" | "failed";
}

// Villa Pricing Configuration
export const VILLAS: Villa[] = [
  {
    id: "blue-villa",
    name: "Blue Villa",
    type: "Villa",
    maxGuests: 8,
    description:
      "A luxurious blue-themed villa sleeping up to 8 guests. Features 3 double beds and 1 sofa bed, modern amenities and stunning water views.",
    isAvailable: true,
    color: "#3b82f6",
    image: "/images/bluevilla.jpg",
    pricing: [
      { guestMin: 1, guestMax: 4, price: 80 },
      { guestMin: 5, guestMax: 8, price: 120 },
    ],
  },
  {
    id: "green-villa",
    name: "Green Villa",
    type: "Villa",
    maxGuests: 8,
    description:
      "A spacious green-themed villa surrounded by lush gardens sleeping up to 8 guests. Features 3 double beds and 1 sofa bed, ideal for groups seeking comfort and nature.",
    isAvailable: true,
    color: "#10b981",
    image: "/images/greenvilla.jpg",
    pricing: [
      { guestMin: 1, guestMax: 4, price: 100 },
      { guestMin: 5, guestMax: 8, price: 150 },
    ],
  },
  {
    id: "gold-lodge",
    name: "Gold Lodge",
    type: "Lodge",
    maxGuests: 21,
    description:
      "A grand gold lodge for large groups and retreats, sleeping 14–21 guests. Features 18 single beds, 1 double bed, and 2 sofa beds across spacious communal and private spaces.",
    isAvailable: true,
    color: "#eab308",
    image: "/images/yellowvilla.jpg",
    pricing: [
      { guestMin: 14, guestMax: 17, price: 300 },
      { guestMin: 18, guestMax: 21, price: 400 },
    ],
  },
  {
    id: "apartment-1",
    name: "Blue Baobab Apartment",
    type: "Apartment",
    maxGuests: 3,
    description:
      "A modern self-contained apartment nestled under the iconic baobab. Ideal for a quick getaway with all the amenities you need.",
    isAvailable: true,
    color: "#f97316",
    image: "/images/pooltable.jpg",
    pricing: [
      { guestMin: 1, guestMax: 2, price: 90 },
      { guestMin: 3, guestMax: 3, price: 130 },
    ],
  },
  {
    id: "mango-park-bungalow",
    name: "Mango Park Bungalow",
    type: "Bungalow",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description:
      "A charming 2-bedroom bungalow nestled in the lush Mango Park grounds. Features two comfortable double bedrooms, a spacious living area, and a private garden — perfect for couples or small families seeking a serene bush retreat.",
    isAvailable: true,
    color: "#c2410c",
    image: "/images/mango park/20250731_100752.jpg",
    gallery: [
      "/images/mango park/20250731_100752.jpg",
      "/images/mango park/20250731_100808.jpg",
      "/images/mango park/20250731_100905.jpg",
      "/images/mango park/20250731_101142.jpg",
      "/images/mango park/Maisons Diani-photos-Pierre_Rich-52.jpg",
      "/images/mango park/Maisons Diani-photos-Pierre_Rich-55.jpg",
      "/images/mango park/Maisons Diani-photos-Pierre_Rich-57.jpg",
      "/images/mango park/Maisons Diani-photos-Pierre_Rich-58.jpg",
      "/images/mango park/Maisons Diani-photos-Pierre_Rich-61_BD.jpg",
    ],
    amenities: [
      "2 Double Bedrooms",
      "2 Bathrooms",
      "Private Garden",
      "Fully Equipped Kitchen",
      "Living & Dining Area",
      "Air Conditioning",
      "Free Wi-Fi",
      "Daily Housekeeping",
    ],
    pricing: [
      { guestMin: 1, guestMax: 2, price: 110 },
      { guestMin: 3, guestMax: 4, price: 150 },
    ],
  },
  {
    id: "mango-park-1st-floor",
    name: "Mango Park 1st Floor",
    type: "Bungalow",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    description:
      "An elegant first-floor suite in Mango Park with sweeping garden and pool views. Offers two bright bedrooms, a breezy balcony, and refined interiors — ideal for guests who appreciate elevated comfort and panoramic surroundings.",
    isAvailable: true,
    color: "#15803d",
    image: "/images/mango 1st floor/1st floor 1.jpg",
    gallery: [
      "/images/mango 1st floor/1st floor 1.jpg",
      "/images/mango 1st floor/1st floor 2.jpg",
      "/images/mango 1st floor/1st floor 3.jpg",
      "/images/mango 1st floor/1st floor 4.jpg",
      "/images/mango 1st floor/1st floor 5.jpg",
      "/images/mango 1st floor/1st floor 6.jpg",
      "/images/mango 1st floor/1st floor 7.jpg",
      "/images/mango 1st floor/1st floor 8.jpg",
      "/images/mango 1st floor/1st floor 9.jpg",
      "/images/mango 1st floor/1st floor 10.jpg",
    ],
    amenities: [
      "2 Double Bedrooms",
      "2 Bathrooms",
      "Private Balcony",
      "Garden & Pool Views",
      "Fully Equipped Kitchen",
      "Air Conditioning",
      "Free Wi-Fi",
      "Daily Housekeeping",
    ],
    pricing: [
      { guestMin: 1, guestMax: 2, price: 120 },
      { guestMin: 3, guestMax: 4, price: 160 },
    ],
  },
];

// Helper function to get price for a villa and guest count
export const getVillaPrice = (villaId: string, guestCount: number): number | null => {
  const villa = VILLAS.find((v) => v.id === villaId);
  if (!villa) return null;

  const tier = villa.pricing.find(
    (p) => guestCount >= p.guestMin && guestCount <= p.guestMax,
  );
  return tier ? tier.price : null;
};
