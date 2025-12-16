
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePrice(guestCount: number, durationHours: number): number {
  // Base Rule: £19 per person for the first 2 hours
  // Minimum duration is usually 2 hours based on this pricing model
  const effectiveDuration = Math.max(2, durationHours);
  const basePrice = guestCount * 19;

  // Extension Fees
  // 3 hours total (+1 extra) = +£100
  // 4 hours total (+2 extra) = +£175
  // 5 hours total (+3 extra) = +£225
  
  let extensionFee = 0;
  
  if (effectiveDuration === 3) extensionFee = 100;
  else if (effectiveDuration === 4) extensionFee = 175;
  else if (effectiveDuration >= 5) extensionFee = 225;

  return Number((basePrice + extensionFee).toFixed(2));
}

export function generateBookingRef(): string {
  return `LKC-${Date.now().toString(36).toUpperCase().substring(4)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}
