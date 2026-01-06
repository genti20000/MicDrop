import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePrice(guestCount: number, durationHours: number): number {
  // Base Rule: £19 per person for the first 2 hours
  const effectiveDuration = Math.max(2, durationHours);
  const basePrice = guestCount * 19;

  // Extension Fees (Flat rates regardless of guest count)
  let extensionFee = 0;
  
  if (effectiveDuration === 3) extensionFee = 100;
  else if (effectiveDuration === 4) extensionFee = 175;
  else if (effectiveDuration >= 5) extensionFee = 225;

  return Number((basePrice + extensionFee).toFixed(2));
}

export function generateBookingRef(): string {
  // Format: BK<timestamp>
  return `BK${Date.now()}`;
}