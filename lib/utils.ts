
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ROOM_CONFIG, RoomType } from "@/types/index";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePrice(roomType: RoomType, durationHours: number, dateStr: string): number {
  const baseRate = ROOM_CONFIG[roomType].price;
  const baseTotal = baseRate * durationHours;
  
  const date = new Date(dateStr);
  const day = date.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 5 || day === 6; // Fri or Sat

  if (isWeekend) {
    return Number((baseTotal * 1.2).toFixed(2)); // +20%
  }
  return Number(baseTotal.toFixed(2));
}

export function generateBookingRef(): string {
  return `BK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}