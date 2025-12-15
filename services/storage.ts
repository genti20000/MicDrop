import { ConfirmedBooking } from "../types";

const STORAGE_KEY = "micdrop_bookings";

export const saveBooking = (booking: ConfirmedBooking): void => {
  const existing = getBookings();
  const updated = [booking, ...existing];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getBookings = (): ConfirmedBooking[] => {
  const data = window.localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as ConfirmedBooking[];
  } catch (e) {
    console.error("Failed to parse bookings", e);
    return [];
  }
};

export const deleteBooking = (id: string): void => {
  const existing = getBookings();
  const updated = existing.filter((b) => b.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
