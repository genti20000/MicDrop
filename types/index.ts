
export type Venue = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
};

// Simplified to a single config since logic is now dynamic based on guests/duration
export const LOCATION_NAME = "London Karaoke Club";
export const LOCATION_ADDRESS = "London"; 

// Since we removed specific rooms, we use a generic type for the database
export type RoomType = 'soho';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
export type PaymentStatus = 'created' | 'paid' | 'failed' | 'refund_required' | 'refunded';

export interface Booking {
  id: string;
  booking_ref: string;
  venue_id: string;
  room_type: RoomType;
  date: string;
  start_time: string;
  duration_hours: number;
  guest_count: number;
  name: string;
  email: string;
  phone: string;
  special_requests?: string;
  total_gbp: number;
  status: BookingStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  sumup_checkout_id: string;
  amount_gbp: number;
  status: PaymentStatus;
}
