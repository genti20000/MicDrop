
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
        // Updated to use the new reliable endpoint
        const endpoint = `${API_URL}/sumup-checkout`;
        console.log('Initializing Payment via:', endpoint);

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              amount: amount,
              currency: 'GBP',
              roomName: metadata?.roomName || 'Soho Suite',
              date: metadata?.date,
              time: metadata?.time,
              customerEmail: metadata?.customerEmail,
              ...metadata
          }),
        });

        const contentType = response.headers.get("content-type");
        
        // Handle non-JSON responses (404/500 pages)
        if (!contentType || contentType.indexOf("application/json") === -1) {
           const text = await response.text();
           console.error('Server returned non-JSON:', text);
           throw new Error(`API Endpoint not found (404) or Server Error (${response.status}). Ensure api/sumup-checkout.js exists.`);
        }

        const data = await response.json();

        if (!response.ok) {
           throw new Error(data.error || 'Failed to initialize payment');
        }

        console.log('Checkout data received:', data);
        setCheckoutId(data.checkoutId); 
        const idToMount = data.checkoutId;

        // Handle SumUp Widget mounting
        if (idToMount && idToMount.startsWith('mock-')) {
             setLoading(false);
        } else if (window.SumUpCard && idToMount) {
             mountWidget(idToMount);
        } else if (idToMount) {
           // Retry if SDK script hasn't fully loaded yet
           let retries = 0;
           const interval = setInterval(() => {
             if (window.SumUpCard) {
               mountWidget(idToMount);
               clearInterval(interval);
             } else if (retries > 10) {
               setError("SumUp SDK failed to load. Please check your internet connection.");
               setLoading(false);
               clearInterval(interval);
             }
             retries++;
           }, 500);
        }

      } catch (err: any) {
        console.error('Payment Init Error:', err);
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
      console.error('Mounting Error:', e);
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
           <p className="text-neutral-500 text-sm">Preparing Secure Checkout...</p>
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
          <p className="text-[#FFD700] font-bold mb-2">Sandbox Mode</p>
          <p className="text-neutral-400 text-sm mb-4">SumUp Secret Key is missing or public. Simulating successful checkout.</p>
          <Button fullWidth onClick={handleMockPayment}>Confirm Booking</Button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-200 text-sm">
          <p className="font-bold mb-1 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Error
          </p>
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back to Details
        </Button>
      </div>
      
      <p className="text-center text-neutral-600 text-[10px] uppercase tracking-widest font-bold">
        Secure Payments by SumUp
      </p>
    </div>
  );
};
