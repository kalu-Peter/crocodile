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
