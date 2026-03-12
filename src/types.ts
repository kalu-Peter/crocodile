// Villa Types and Constants
export interface PricingTier {
  guestMin: number;
  guestMax: number;
  price: number;
}

export interface Villa {
  id: string;
  name: string;
  type: 'Villa' | 'Lodge' | 'Apartment';
  maxGuests: number;
  description: string;
  isAvailable: boolean;
  pricing: PricingTier[];
  color: string;
  image: string;
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
    maxGuests: 4,
    description:
      "A luxurious blue-themed villa perfect for small families. Features modern amenities and stunning water views.",
    isAvailable: true,
    color: "#3b82f6",
    image: "/images/bluevilla.jpg",
    pricing: [
      { guestMin: 1, guestMax: 2, price: 80 },
      { guestMin: 3, guestMax: 4, price: 120 },
    ],
  },
  {
    id: "green-villa",
    name: "Green Villa",
    type: "Villa",
    maxGuests: 6,
    description:
      "A spacious green-themed villa surrounded by lush gardens. Ideal for larger groups seeking comfort and nature.",
    isAvailable: true,
    color: "#10b981",
    image: "/images/greenvilla.jpg",
    pricing: [
      { guestMin: 1, guestMax: 3, price: 100 },
      { guestMin: 4, guestMax: 6, price: 150 },
    ],
  },
  {
    id: "yellow-villa",
    name: "Yellow Villa",
    type: "Villa",
    maxGuests: 2,
    description:
      "A cozy yellow-themed villa perfect for couples. Intimate setting with private facilities.",
    isAvailable: true,
    color: "#eab308",
    image: "/images/yellowvilla.jpg",
    pricing: [{ guestMin: 1, guestMax: 2, price: 70 }],
  },
  {
    id: "lodge-1",
    name: "The Lodge",
    type: "Lodge",
    maxGuests: 10,
    description:
      "A grand lodge with a rustic feel. Perfect for large groups and events.",
    isAvailable: true,
    color: "#84cc16",
    image: "/images/poolview.jpeg",
    pricing: [
      { guestMin: 1, guestMax: 5, price: 200 },
      { guestMin: 6, guestMax: 10, price: 300 },
    ],
  },
  {
    id: "apartment-1",
    name: "The Apartment",
    type: "Apartment",
    maxGuests: 3,
    description:
      "A modern apartment with all the amenities. Ideal for a quick getaway.",
    isAvailable: true,
    color: "#f97316",
    image: "/images/pooltable.jpg",
    pricing: [
      { guestMin: 1, guestMax: 2, price: 90 },
      { guestMin: 3, guestMax: 3, price: 130 },
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
