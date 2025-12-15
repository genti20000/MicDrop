
import { supabase } from '../lib/supabase';
import { ConfirmedBooking } from '../types';
import { API_URL } from '../constants';

export const saveBooking = async (booking: any): Promise<void> => {
  // This is now mostly handled by server-side sumup confirmation
  // But if we need manual save:
  const { error } = await supabase
    .from('bookings')
    .insert([booking]);
    
  if (error) throw new Error(error.message);
};

export const getBookings = async (): Promise<ConfirmedBooking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, venues(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  // Transform to match ConfirmedBooking interface if needed
  return data.map((b: any) => ({
    id: b.id,
    booking_ref: b.booking_ref,
    roomName: b.venues?.name + ' - ' + b.room_type,
    date: b.date,
    time: b.start_time,
    duration: b.duration_hours,
    totalPrice: b.total_gbp,
    status: b.status,
    customer: { name: b.name, email: b.email, phone: b.phone }
  })) as unknown as ConfirmedBooking[];
};

export const deleteBooking = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' }) // Soft delete/cancel
    .eq('id', id);

  if (error) throw new Error(error.message);
};

export interface BusySlot {
  time: string;
  duration: number;
}

export const fetchAvailability = async (roomId: string, date: string): Promise<BusySlot[]> => {
  // Use the API route for availability to keep logic centralized or use Supabase RPC
  // For now, let's call the API route we defined (or should define) or simple query
  const response = await fetch(`${API_URL}/availability?roomId=${roomId}&date=${date}`);
  if (!response.ok) return [];
  return response.json();
};