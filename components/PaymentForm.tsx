
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
        // 1. Create Checkout via Backend
        const response = await fetch(`${API_URL}/create-sumup-checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
              amount: amount,
              currency: 'GBP',
              metadata
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error?.message || 'Failed to initialize payment');
        }

        const data = await response.json();
        setCheckoutId(data.id);
        
        // 2. Mount SumUp Widget
        // Check if SumUp SDK is loaded
        if (window.SumUpCard && data.id) {
          if (data.id.startsWith('mock-')) {
             // Handle Mock Mode visually
             setLoading(false);
          } else {
             mountWidget(data.id);
          }
        } else {
           setError("Payment provider failed to load. Please refresh.");
           setLoading(false);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'An unexpected error occurred');
        setLoading(false);
      }
    };

    initSumUp();
    
    // Cleanup
    return () => {
      // Logic to unmount or cleanup if SumUp SDK supports it would go here
    };
  }, [amount]);

  const mountWidget = (id: string) => {
    try {
      window.SumUpCard.mount({
        id: 'sumup-card',
        checkoutId: id,
        onResponse: (type: string, body: any) => {
          console.log('SumUp Response:', type, body);
          if (type === 'success') {
             onSuccess(body.transaction_id || id); // body usually contains transaction_id
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

  // Handler for Mock Mode
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
        <div className="bg-neutral-900 border border-yellow-500/50 p-6 rounded-xl text-center">
          <p className="text-[#FFD700] font-bold mb-2">Demo Mode (No API Key)</p>
          <p className="text-neutral-400 text-sm mb-4">SumUp API key not found on server. Proceeding with mock payment.</p>
          <Button fullWidth onClick={handleMockPayment}>Complete Mock Payment</Button>
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
