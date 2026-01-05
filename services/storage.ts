import { ConfirmedBooking } from '../types';
import { API_URL } from '../constants';

export const getBookings = async (email?: string): Promise<ConfirmedBooking[]> => {
  if (!email) return [];
  const response = await fetch(`${API_URL}?action=my_bookings&email=${encodeURIComponent(email)}`);
  if (!response.ok) return [];
  const data = await response.json();
  
  // Map DB fields to Frontend types
  return data.map((b: any) => ({
    id: b.booking_ref,
    roomName: 'Soho Suite',
    date: b.date,
    time: b.time,
    duration: b.duration,
    totalPrice: parseFloat(b.amount),
    status: b.status,
    timestamp: new Date(b.created_at).getTime()
  }));
};

export const saveBookingLocally = async (booking: ConfirmedBooking): Promise<void> => {
    // The index.php action=create_checkout and confirm_booking already handles persistence
    console.log("Booking persisted to central database via API.");
};

export const deleteBooking = async (id: string): Promise<void> => {
  // Logic for cancellation can be added to api/index.php if needed
  alert("Please contact support to cancel a confirmed booking.");
};

export const fetchAvailability = async (roomId: string, date: string) => {
  const response = await fetch(`${API_URL}?action=availability&date=${date}`);
  if (!response.ok) return [];
  return response.json();
};