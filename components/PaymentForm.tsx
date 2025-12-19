
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { API_URL } from '../constants';

interface PaymentFormProps {
  amount: number; 
  onSuccess: (transactionId: string, bookingRef: string) => void;
  onBack: () => void;
  metadata?: any; 
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onBack, metadata }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState<{id: string, ref: string} | null>(null);

  useEffect(() => {
    const initSumUp = async () => {
      try {
        const response = await fetch(`${API_URL}/sumup/create-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              amount,
              ...metadata
          }),
        });

        if (!response.ok) throw new Error('Failed to create checkout');

        const data = await response.json();
        setCheckoutData({ id: data.checkoutId, ref: data.bookingRef });

        if (data.checkoutId.startsWith('mock-')) {
          setLoading(false);
        } else {
          const checkSDK = setInterval(() => {
            if (window.SumUpCard) {
              mountWidget(data.checkoutId, data.bookingRef);
              clearInterval(checkSDK);
            }
          }, 500);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    initSumUp();
  }, [amount, metadata]);

  const mountWidget = (id: string, ref: string) => {
    window.SumUpCard.mount({
      id: 'sumup-card',
      checkoutId: id,
      onResponse: (type: string, body: any) => {
        if (type === 'success') onSuccess(body.transaction_id || id, ref);
        else setError('Payment failed.');
      },
    });
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {loading && <div className="text-center py-8"><p className="text-neutral-500 animate-pulse">Initializing GCP Secure Payment...</p></div>}
      <div id="sumup-card" className="bg-white rounded-xl overflow-hidden"></div>
      {checkoutData?.id.startsWith('mock-') && !loading && (
        <Button fullWidth onClick={() => onSuccess(checkoutData.id, checkoutData.ref)}>Confirm Mock Payment</Button>
      )}
      {error && <div className="p-4 bg-red-900/20 text-red-200 rounded-lg">{error}</div>}
      <Button variant="secondary" onClick={onBack}>Cancel</Button>
    </div>
  );
};
