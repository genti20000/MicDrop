import { ConfirmedBooking } from "../types";
import { API_URL } from "../constants";

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const saveBooking = async (booking: ConfirmedBooking): Promise<void> => {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(booking),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to save booking to database');
  }
};

export const getBookings = async (): Promise<ConfirmedBooking[]> => {
  const response = await fetch(`${API_URL}/bookings`, {
    headers: getHeaders()
  });
  
  if (response.status === 401 || response.status === 403) {
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    console.error("Failed to fetch bookings");
    return [];
  }
  return response.json();
};

export const deleteBooking = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/bookings/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to delete booking');
  }
};

export interface BusySlot {
  time: string;
  duration: number;
}

export const fetchAvailability = async (roomId: string, date: string): Promise<BusySlot[]> => {
  const response = await fetch(`${API_URL}/availability?roomId=${roomId}&date=${date}`);
  if (!response.ok) {
    console.error("Failed to fetch availability");
    return [];
  }
  return response.json();
};