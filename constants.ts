import { Room } from "./types";

// NOTE: In a real app, use an environment variable for the key
export const STRIPE_PUBLISHABLE_KEY = "pk_test_51O7S8dG8X5d5X5d5X5d5X5d5X5d5X5d5X5d5X5d5X5d5X5d5X5d5X5d5"; 

// Safely check if we are in production. 
// import.meta.env comes from Vite. If it's undefined, we default to development.
const env = (import.meta as any).env;
const isProd = env ? env.PROD : false;

// Use relative path in production (Vercel), absolute path for local dev
export const API_URL = isProd
  ? "/api" 
  : "http://localhost:3001/api";

export const ROOMS: Room[] = [
  {
    id: "neon-den",
    name: "The Neon Den",
    capacity: 8,
    features: ["Soundproof", "4K Screen", "Ring Light"],
    gradient: "from-pink-500 to-rose-500",
    description: "Compact vibe, expanded for groups."
  },
  {
    id: "disco-lounge",
    name: "Disco Lounge",
    capacity: 12,
    features: ["Disco Ball", "Smoke Machine", "Dual Mics"],
    gradient: "from-violet-600 to-indigo-600",
    description: "Perfect for parties and celebrations."
  },
  {
    id: "rockstar-suite",
    name: "Rockstar Suite",
    capacity: 20,
    features: ["Private Bar", "Stage", "Pro Audio"],
    gradient: "from-cyan-500 to-blue-500",
    description: "The ultimate VIP experience."
  },
  {
    id: "platinum-vip",
    name: "Platinum VIP",
    capacity: 50,
    features: ["Butler Service", "Panoramic View", "Laser Show"],
    gradient: "from-amber-400 to-orange-500",
    description: "Luxury without compromise."
  }
];

export const DURATIONS = [1, 2, 3, 4];
export const TIMES = [
  "14:00", "15:00", "16:00", "17:00", "18:00", 
  "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"
];