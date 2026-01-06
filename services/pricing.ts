
import { PricingBreakdown } from "../types";

// Base price calculation based on tiers
const getBaseTierPrice = (guests: number): number => {
  if (guests <= 8) return 152;
  if (guests <= 30) return guests * 19;
  if (guests <= 40) return 650;
  if (guests <= 50) return 700;
  if (guests <= 60) return 750;
  if (guests <= 70) return 800;
  if (guests <= 80) return 850;
  if (guests <= 90) return 900;
  return 1000; // 91-100
};

export interface EnhancedPricingBreakdown extends PricingBreakdown {
  discountAmount: number;
  extensionPrice: number;
}

export const calculatePrice = (
  guests: number,
  duration: number,
  dateString: string
): EnhancedPricingBreakdown => {
  const basePrice = getBaseTierPrice(guests);
  
  // Midweek Discount check (Mon, Tue, Wed)
  // Date format is YYYY-MM-DD
  const date = new Date(dateString);
  const day = date.getDay(); // 0 (Sun) to 6 (Sat)
  const isMidweek = day >= 1 && day <= 3; // Mon(1), Tue(2), Wed(3)
  
  const discountAmount = isMidweek ? basePrice * 0.25 : 0;
  
  // Extension Fees
  // 2 hours is base. 
  // +1 hr (3 total) = 100
  // +2 hr (4 total) = 175
  // +3 hr (5 total) = 250
  // +4 hr (6 total) = 300
  let extensionPrice = 0;
  const extraHours = duration - 2;
  
  if (extraHours === 1) extensionPrice = 100;
  else if (extraHours === 2) extensionPrice = 175;
  else if (extraHours === 3) extensionPrice = 250;
  else if (extraHours >= 4) extensionPrice = 300;
  
  const total = (basePrice - discountAmount) + extensionPrice;
  
  return {
    basePrice,
    isWeekend: day === 0 || day === 6 || day === 5, // Fri, Sat, Sun
    surcharge: extensionPrice,
    discountAmount,
    extensionPrice,
    total
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};
