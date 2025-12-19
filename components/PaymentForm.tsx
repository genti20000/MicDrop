
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
        const endpoint = `${API_URL}/sumup-checkout`;
        
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              amount: amount,
              roomName: metadata?.roomName,
              date: metadata?.date,
              time: metadata?.time,
              duration: metadata?.duration,
              guests: metadata?.guests || 8,
              customerEmail: metadata?.customerEmail,
              customerName: metadata?.customerName,
              customerPhone: metadata?.customerPhone,
              ...metadata
          }),
        });

        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'API Error');
        }

        const data = await response.json();
        setCheckoutData({ id: data.checkoutId, ref: data.bookingRef });

        if (data.checkoutId.startsWith('mock-')) {
             setLoading(false);
        } else {
           let retries = 0;
           const interval = setInterval(() => {
             if (window.SumUpCard) {
               mountWidget(data.checkoutId, data.bookingRef);
               clearInterval(interval);
             } else if (retries > 15) {
               setError("Payment SDK failed to load.");
               setLoading(false);
               clearInterval(interval);
             }
             retries++;
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
    try {
      window.SumUpCard.mount({
        id: 'sumup-card',
        checkoutId: id,
        onResponse: (type: string, body: any) => {
          if (type === 'success') {
             onSuccess(body.transaction_id || id, ref); 
          } else if (type === 'error') {
             setError('Payment failed.');
          }
        },
      });
      setLoading(false);
    } catch (e) {
      setError("Failed to load widget.");
      setLoading(false);
    }
  };

  const handleMockPayment = () => {
    if (checkoutData) {
      onSuccess("mock_txn_" + Date.now(), checkoutData.ref);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {loading && (
        <div className="text-center py-8">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700] mx-auto mb-2"></div>
           <p className="text-neutral-500 text-sm">Connecting to Google Cloud...</p>
        </div>
      )}
      <div id="sumup-card" className={`bg-white rounded-xl ${loading ? 'opacity-0 h-0' : 'opacity-100'}`}></div>
      {!loading && checkoutData?.id.startsWith('mock-') && (
        <div className="bg-neutral-900 border border-yellow-500/50 p-6 rounded-xl text-center">
          <p className="text-[#FFD700] font-bold mb-4">Development Mode</p>
          <Button fullWidth onClick={handleMockPayment}>Confirm Booking</Button>
        </div>
      )}
      {error && <div className="p-4 bg-red-950/30 border border-red-900 rounded-lg text-red-200 text-sm">{error}</div>}
      <Button type="button" variant="secondary" onClick={onBack}>Back</Button>
    </div>
  );
};
