
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { API_URL, SUMUP_PUBLIC_KEY } from '../constants';

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
        setLoading(true);
        const response = await fetch(`${API_URL}/sumup/create-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              amount,
              ...metadata
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || 'Failed to create checkout');
        }

        const data = await response.json();
        setCheckoutData({ id: data.checkoutId, ref: data.bookingRef });

        if (data.checkoutId.startsWith('mock-')) {
          setLoading(false);
        } else {
          // Poll for SDK readiness
          const checkSDK = setInterval(() => {
            if (window.SumUpCard) {
              mountWidget(data.checkoutId, data.bookingRef);
              clearInterval(checkSDK);
            }
          }, 500);
          
          // Timeout for SDK
          setTimeout(() => clearInterval(checkSDK), 10000);
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
          console.log('SumUp Response:', type, body);
          if (type === 'success') {
            onSuccess(body.transaction_id || id, ref);
          } else if (type === 'error') {
            setError('Payment failed or cancelled. Please check your card details.');
          }
        },
      });
      setLoading(false);
    } catch (e) {
      console.error('Mounting Error:', e);
      setError("Failed to initialize payment widget.");
      setLoading(false);
    }
  };

  const handleMockConfirm = () => {
    if (checkoutData) {
      onSuccess(checkoutData.id, checkoutData.ref);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-neutral-900/50 p-4 rounded-xl border border-zinc-800 flex justify-between items-center mb-2">
         <span className="text-zinc-500 text-xs font-bold uppercase">Amount Due</span>
         <span className="text-[#FFD700] font-black text-xl">£{amount.toFixed(2)}</span>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700] mx-auto mb-4"></div>
          <p className="text-neutral-500 text-sm animate-pulse">Establishing Secure GCP Connection...</p>
        </div>
      )}

      <div id="sumup-card" className={`bg-white rounded-xl overflow-hidden shadow-2xl transition-all duration-500 ${loading ? 'opacity-0 h-0' : 'opacity-100'}`}></div>
      
      {checkoutData?.id.startsWith('mock-') && !loading && (
        <div className="p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center space-y-4">
          <p className="text-yellow-500 text-sm font-medium">Sandbox Mode Active</p>
          <p className="text-zinc-500 text-xs">SumUp Secret Key is missing from GCP Environment Variables. Proceeding with mock checkout.</p>
          <Button fullWidth onClick={handleMockConfirm}>Confirm Mock Booking</Button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 text-red-200 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <div className="pt-4 border-t border-zinc-900">
        <Button variant="ghost" fullWidth onClick={onBack} disabled={loading}>
          Cancel and Go Back
        </Button>
      </div>
      
      <p className="text-center text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
        Secured by SumUp & Google Cloud
      </p>
    </div>
  );
};
