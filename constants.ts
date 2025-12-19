import { Room } from "./types";

// For Hostinger, we use the relative /api path
// The .htaccess routes /api/... to gateway.php
export const API_URL = "/api";

// SumUp Public Key (for frontend initialization)
export const SUMUP_PUBLIC_KEY = "sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr";

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