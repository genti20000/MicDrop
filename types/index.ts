
export type Venue = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
};

export type RoomType = 'small' | 'medium' | 'large' | 'vip';

export const ROOM_CONFIG: Record<RoomType, { label: string; capacity: string; price: number }> = {
  small: { label: 'Small Room', capacity: '1-4 Guests', price: 25 },
  medium: { label: 'Medium Room', capacity: '5-8 Guests', price: 40 },
  large: { label: 'Large Room', capacity: '9-15 Guests', price: 60 },
  vip: { label: 'VIP Suite', capacity: '10-20 Guests', price: 100 },
};

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
