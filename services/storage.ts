import { ConfirmedBooking } from '../types';

const STORAGE_KEY = 'lkc_bookings_local';

export const getBookings = async (): Promise<ConfirmedBooking[]> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBookingLocally = async (booking: ConfirmedBooking): Promise<void> => {
  const bookings = await getBookings();
  bookings.unshift(booking);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
};

export const deleteBooking = async (id: string): Promise<void> => {
  const bookings = await getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const fetchAvailability = async (roomId: string, date: string) => {
  // Without a central DB, we treat all slots as open
  return [];
};
