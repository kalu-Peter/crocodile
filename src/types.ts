// Villa Types and Constants
export interface PricingTier {
  guestMin: number;
  guestMax: number;
  price: number;
}

export interface Villa {
  id: string;
  name: string;
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
    maxGuests: 6,
    description:
      "An spacious green-themed villa surrounded by lush gardens. Ideal for larger groups seeking comfort and nature.",
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
    maxGuests: 2,
    description:
      "A cozy yellow-themed villa perfect for couples. Intimate setting with private facilities.",
    isAvailable: true,
    color: "#eab308",
    image: "/images/yellowvilla.jpg",
    pricing: [{ guestMin: 1, guestMax: 2, price: 70 }],
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
