
import { Room } from "./types";

// NOTE: In a real app, use an environment variable for the key
export const STRIPE_PUBLISHABLE_KEY = "pk_test_placeholder"; 

export const API_URL = "/api";

export const ROOMS: Room[] = [
  {
    id: "standard-suite",
    name: "The Gold Room",
    capacity: 25, // Increased to allow a reasonable range starting from 8
    pricePerHour: 19, // Base price per person (2 hours)
    features: ["Soundproof", "4K Screen", "Ring Light", "Table Service"],
    gradient: "from-yellow-500 to-yellow-600",
    description: "Our signature private karaoke suite. Perfect for intimate gatherings and small parties."
  },
  {
    id: "vip-lounge",
    name: "VIP Lounge",
    capacity: 100, // Updated to 100 as requested
    pricePerHour: 19, // Base price per person (2 hours)
    features: ["Private Bar", "Stage", "Pro Audio", "Ensuite Bathroom"],
    gradient: "from-yellow-400 to-yellow-500",
    description: "More space, more luxury. The ultimate experience for larger groups."
  }
];

export const DURATIONS = [2, 3, 4, 5];
export const TIMES = [
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00", "22:00", "23:00"
];
