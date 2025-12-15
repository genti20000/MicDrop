import { Room, PricingBreakdown } from "../types";

export const calculatePrice = (
  duration: number,
  guests: number
): PricingBreakdown => {
  const PRICE_PER_PERSON = 19;
  const PRICE_EXTRA_HOUR = 90;

  // Base price is driven by guest count (covers first hour)
  const perPersonTotal = guests * PRICE_PER_PERSON;

  // Extra hours calculation (subtract 1 from duration, min 0)
  const extraHours = Math.max(0, duration - 1);
  const extraTimeTotal = extraHours * PRICE_EXTRA_HOUR;

  return {
    perPersonTotal,
    extraTimeTotal,
    total: perPersonTotal + extraTimeTotal
  };
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};