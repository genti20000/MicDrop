
import { Room } from "./types";

// NOTE: In a real app, use an environment variable for the key
export const STRIPE_PUBLISHABLE_KEY = "pk_test_placeholder"; 

// Using /api as base for serverless functions
export const API_URL = "/api";

export const ROOMS: Room[] = [
  {
    id: "soho",
    name: "Soho",
    capacity: 100, 
    pricePerHour: 19, // Base price per person (2 hours)
    features: ["Private Bar", "Stage", "Pro Audio", "Ensuite Bathroom", "Soundproof", "4K Screen"],
    gradient: "from-yellow-400 to-yellow-500",
    description: "The ultimate private karaoke experience in the heart of London."
  }
];

export const DURATIONS = [2, 3, 4, 5];
export const TIMES = [
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00", "22:00", "23:00"
];
