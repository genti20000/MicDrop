import { Room, PricingBreakdown } from "../types";

export const calculatePrice = (
  room: Room,
  duration: number,
  dateString: string
): PricingBreakdown => {
  const basePrice = room.pricePerHour * duration;
  
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  const isWeekend = day === 5 || day === 6; // Friday or Saturday
  
  const surcharge = isWeekend ? basePrice * 0.2 : 0;
  
  return {
    basePrice,
    isWeekend,
    surcharge,
    total: basePrice + surcharge
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};
