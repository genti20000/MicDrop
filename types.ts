export interface Room {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number; // in GBP
  features: string[];
  gradient: string;
  description: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface BookingState {
  step: number;
  selectedRoomId: string | null;
  date: string;
  time: string;
  duration: number;
  guests: number;
  customer: CustomerDetails;
}

export interface ConfirmedBooking {
  id: string;
  roomName: string;
  date: string;
  time: string;
  duration: number;
  totalPrice: number;
  customer: CustomerDetails;
  paymentIntentId: string;
  status: 'confirmed';
  timestamp: number;
}

export interface PricingBreakdown {
  basePrice: number;
  isWeekend: boolean;
  surcharge: number;
  total: number;
}
