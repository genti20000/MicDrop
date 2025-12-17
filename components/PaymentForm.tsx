
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { API_URL } from '../constants';

interface PaymentFormProps {
  amount: number; // in GBP
  onSuccess: (transactionId: string) => void;
  onBack: () => void;
  metadata?: any; 
}

declare global {
  interface Window {
    SumUpCard: any;
  }
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onBack, metadata }) => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  useEffect(() => {
    const initSumUp = async () => {
      try {
        const endpoint = `${API_URL}/sumup/create-checkout`;
        console.log('Initializing Payment via:', endpoint);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              amount: amount,
              currency: 'GBP',
              venueId: 'main-location', 
              roomType: metadata?.roomId || 'soho',
              date: metadata?.date,
              time: metadata?.time,
              durationHours: metadata?.duration,
              guestCount: 8,
              email: metadata?.customerEmail,
              ...metadata
          }),
        });

        const contentType = response.headers.get("content-type");
        
        // 1. Check for JSON content type explicitly
        if (!contentType || contentType.indexOf("application/json") === -1) {
           throw new Error(`Server API Error (${response.status}) at ${endpoint}. Please verify API route configuration.`);
        }

        const data = await response.json();

        // 2. Check logic success
        if (!response.ok) {
           throw new Error(data.error || 'Failed to initialize payment');
        }

        setCheckoutId(data.checkoutId); 
        const idToMount = data.checkoutId;

        // 3. Mount SumUp Widget
        if (idToMount && idToMount.startsWith('mock-')) {
             setLoading(false);
        } else if (window.SumUpCard && idToMount) {
             mountWidget(idToMount);
        } else {
           if (idToMount) {
             setTimeout(() => {
               if (window.SumUpCard) mountWidget(idToMount);
               else {
                 setError("Payment provider failed to load. Please refresh.");
                 setLoading(false);
               }
             }, 1000);
           } else {
             setError("Failed to generate checkout ID.");
             setLoading(false);
           }
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
      }
    };

    initSumUp();
    
  }, [amount, metadata]);

  const mountWidget = (id: string) => {
    try {
      window.SumUpCard.mount({
        id: 'sumup-card',
        checkoutId: id,
        onResponse: (type: string, body: any) => {
          console.log('SumUp Response:', type, body);
          if (type === 'success') {
             onSuccess(body.transaction_id || id); 
          } else if (type === 'error') {
             setError('Payment failed or cancelled.');
          }
        },
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setError("Failed to load payment widget.");
      setLoading(false);
    }
  };

  const handleMockPayment = () => {
    setLoading(true);
    setTimeout(() => {
       onSuccess("mock_txn_" + Date.now());
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      
      {loading && (
        <div className="text-center py-8">
           <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FFD700] mx-auto mb-2"></div>
           <p className="text-neutral-500 text-sm">Initializing Secure Payment...</p>
        </div>
      )}

      {/* SumUp Widget Container */}
      <div 
        id="sumup-card" 
        className={`bg-white rounded-xl overflow-hidden min-h-[50px] transition-opacity duration-500 ${loading ? 'opacity-0 h-0' : 'opacity-100'}`}
      ></div>
      
      {/* Mock Mode Fallback UI */}
      {!loading && checkoutId?.startsWith('mock-') && (
        <div className="bg-neutral-900 border border-yellow-500/50 p-6 rounded-xl text-center animate-in fade-in">
          <p className="text-[#FFD700] font-bold mb-2">Dev Mode Active</p>
          <p className="text-neutral-400 text-sm mb-4">SumUp keys not detected. Simulating payment flow.</p>
          <Button fullWidth onClick={handleMockPayment}>Simulate Successful Payment</Button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
      </div>
      
      <p className="text-center text-neutral-500 text-xs">
        Payments processed securely by SumUp.
      </p>
    </div>
  );
};
