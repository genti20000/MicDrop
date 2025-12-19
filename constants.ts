
import { Room } from "./types";

// The Google Cloud Run Service URL
export const API_URL = "https://micdrop-641703602093.us-west1.run.app/api";

export const ROOMS: Room[] = [
  {
    id: "soho",
    name: "Soho Suite",
    capacity: 100, 
    pricePerHour: 19, 
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
