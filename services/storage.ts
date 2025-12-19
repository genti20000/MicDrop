
import { ConfirmedBooking } from '../types';
import { API_URL } from '../constants';

export const getBookings = async (): Promise<ConfirmedBooking[]> => {
  const token = localStorage.getItem('lkc_token');
  const response = await fetch(`${API_URL}/bookings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to fetch bookings');
  return response.json();
};

export const deleteBooking = async (id: string): Promise<void> => {
  const token = localStorage.getItem('lkc_token');
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) throw new Error('Failed to delete booking');
};

export const fetchAvailability = async (roomId: string, date: string) => {
  const response = await fetch(`${API_URL}/availability?roomId=${roomId}&date=${date}`);
  if (!response.ok) return [];
  return response.json();
};
