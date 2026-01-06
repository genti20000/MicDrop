import { PricingBreakdown } from "../types";

// Dynamic configuration for future-proofing
const PRICING_CONFIG = {
  rooms: {
    soho: {
      minGuests: 8,
      basePricePerGuest: 19,
      tiers: [
        { min: 1, max: 8, price: 152 },
        { min: 9, max: 30, perGuest: 19 },
        { min: 31, max: 40, price: 650 },
        { min: 41, max: 50, price: 700 },
        { min: 51, max: 60, price: 750 },
        { min: 61, max: 70, price: 800 },
        { min: 71, max: 80, price: 850 },
        { min: 81, max: 90, price: 900 },
        { min: 91, max: 100, price: 1000 },
      ],
      extensionFees: {
        1: 100, // +1 hr (3 total)
        2: 175, // +2 hr (4 total)
        3: 250, // +3 hr (5 total)
        4: 300, // +4 hr (6 total)
      }
    }
  },
  discounts: {
    midweek: {
      days: [1, 2, 3], // Mon, Tue, Wed
      percentage: 0.25
    }
  }
};

export interface EnhancedPricingBreakdown extends PricingBreakdown {
  discountAmount: number;
  extensionPrice: number;
}

export const calculatePrice = (
  guests: number,
  duration: number,
  dateString: string,
  roomId: string = 'soho'
): EnhancedPricingBreakdown => {
  const roomConfig = (PRICING_CONFIG.rooms as any)[roomId] || PRICING_CONFIG.rooms.soho;
  
  // 1. Base Tier Calculation
  let basePrice = 0;
  const tier = roomConfig.tiers.find((t: any) => guests >= t.min && guests <= t.max);
  
  if (tier) {
    basePrice = tier.price || (guests * (tier.perGuest || roomConfig.basePricePerGuest));
  } else {
    // Fallback if no tier matches
    basePrice = guests * roomConfig.basePricePerGuest;
  }

  // 2. Midweek Discount
  const date = new Date(dateString);
  const day = date.getDay(); 
  const midweekConfig = PRICING_CONFIG.discounts.midweek;
  const isMidweek = midweekConfig.days.includes(day);
  const discountAmount = isMidweek ? basePrice * midweekConfig.percentage : 0;

  // 3. Extension Fees
  const extraHours = duration - 2;
  const extensionPrice = (roomConfig.extensionFees as any)[extraHours] || 0;

  const total = (basePrice - discountAmount) + extensionPrice;

  return {
    basePrice,
    isWeekend: day === 0 || day === 5 || day === 6, // Sun, Fri, Sat
    surcharge: extensionPrice,
    discountAmount,
    extensionPrice,
    total: Number(total.toFixed(2))
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};
