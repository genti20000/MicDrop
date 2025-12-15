import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/Button';
import { API_URL } from '../constants';
import { PricingBreakdown } from '../types';

interface PaymentFormProps {
  amount: number; // in GBP
  onSuccess: (paymentIntentId: string) => void;
  onBack: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // 1. Create PaymentIntent on the backend
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            amount: Math.round(amount * 100), // Convert to pennies
            currency: 'gbp' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment');
      }

      const { clientSecret } = await response.json();

      // 2. Confirm Card Payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
        <h3 className="text-lg font-medium text-white mb-4">Card Details</h3>
        <div className="p-4 bg-black border border-zinc-700 rounded-lg">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#ffffff',
                  '::placeholder': {
                    color: '#a1a1aa',
                  },
                },
                invalid: {
                  color: '#ef4444',
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="secondary" onClick={onBack} disabled={processing}>
          Back
        </Button>
        <Button type="submit" fullWidth disabled={!stripe || processing}>
          {processing ? 'Processing...' : `Pay £${amount.toFixed(2)}`}
        </Button>
      </div>
      
      <p className="text-center text-zinc-500 text-xs">
        Payments are secured by Stripe. No card data is stored on our servers.
      </p>
    </form>
  );
};
