
import { PricingBreakdown } from "../types";

export const calculatePrice = (
  guests: number,
  duration: number
): PricingBreakdown => {
  // Base Rule: £19 per person for the first 2 hours
  const basePrice = guests * 19;
  
  // Extension Fees (Flat rates regardless of guest count)
  // +1 hour (3 total) = +100
  // +2 hours (4 total) = +175
  // +3 hours (5 total) = +225
  let extensionFee = 0;
  
  if (duration === 3) extensionFee = 100;
  else if (duration === 4) extensionFee = 175;
  else if (duration >= 5) extensionFee = 225;
  
  return {
    basePrice,
    isWeekend: false, // Legacy field, not used in new pricing model
    surcharge: extensionFee, // Using surcharge field for extension fee
    total: basePrice + extensionFee
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};
