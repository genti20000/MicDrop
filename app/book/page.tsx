
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { calculatePrice } from '@/lib/utils';
import { Loader2, Calendar, Clock, User, ArrowLeft, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';

const TIMES = Array.from({ length: 12 }, (_, i) => `${i + 12}:00`); // 12:00 to 23:00

type Step = 'config' | 'details' | 'payment';

export default function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [duration, setDuration] = useState(2); // Default min 2 hours
  const [guests, setGuests] = useState(8); // Default min 8 guests
  const [details, setDetails] = useState({ name: '', email: '', phone: '', specialRequests: '' });

  // Payment State
  const [bookingRef, setBookingRef] = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Update price in real-time
  useEffect(() => {
    if (guests && duration) {
      setTotalPrice(calculatePrice(guests, duration));
    }
  }, [guests, duration]);

  // Create Checkout Handler
  const handleCreateCheckout = async () => {
    if (!details.name || !details.email || !details.phone) {
      setError('Please fill in all contact details.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/sumup/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: 'main-location', // Hardcoded single location
          roomType: 'standard_suite',
          date, 
          time, 
          durationHours: duration, 
          guestCount: guests,
          ...details
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Booking failed');
      }

      const data = await res.json();
      setBookingRef(data.bookingRef);
      setCheckoutId(data.checkoutId);
      setTotalPrice(data.amount); 
      setStep('payment');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount SumUp Widget
  useEffect(() => {
    if (step === 'payment' && checkoutId) {
      const mountSumUp = () => {
        // Slight delay to ensure DOM element exists
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.SumUpCard) {
            try {
              window.SumUpCard.mount({
                id: 'sumup-card',
                checkoutId: checkoutId,
                onResponse: async (type: string, body: any) => {
                  if (type === 'success') {
                    // Optimistic redirect, but ideally verifying via API
                    router.push(`/confirmation?ref=${bookingRef}`);
                  } else if (type === 'error') {
                     setError('Payment failed or cancelled. Please try again.');
                  }
                }
              });
            } catch (e) {
              console.error('SumUp Mount Error', e);
              setError('Failed to load payment widget. Please refresh.');
            }
          }
        }, 500);
      };
      
      mountSumUp();
    }
  }, [step, checkoutId, bookingRef, router]);

  const renderConfig = () => (
    <div className="space-y-8 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1 text-center mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Book Your Room</h2>
        <p className="text-neutral-500">Select your date and squad size.</p>
      </div>

      <div>
        <label className="block text-neutral-500 mb-2 text-xs font-bold uppercase tracking-wider">Date</label>
        <div className="relative group">
          <Calendar className="absolute left-4 top-3.5 text-neutral-500 group-focus-within:text-brand-yellow transition-colors" size={20} />
          <input 
            type="date" 
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            value={date}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-medium"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-neutral-500 mb-2 text-xs font-bold uppercase tracking-wider">Start Time</label>
           <div className="relative group">
             <Clock className="absolute left-4 top-3.5 text-neutral-500 group-focus-within:text-brand-yellow transition-colors" size={20} />
            <select 
              onChange={(e) => setTime(e.target.value)}
              value={time}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-medium"
            >
              {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-neutral-500 mb-2 text-xs font-bold uppercase tracking-wider">Duration</label>
          <div className="relative">
            <select 
              onChange={(e) => setDuration(Number(e.target.value))}
              value={duration}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 px-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-medium"
            >
              {[2,3,4,5].map(n => <option key={n} value={n}>{n} Hours</option>)}
            </select>
            <div className="absolute right-4 top-4.5 pointer-events-none text-neutral-600">
               <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6Z"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div>
          <label className="block text-neutral-500 mb-2 text-xs font-bold uppercase tracking-wider">Number of Guests (8 - 100)</label>
          <div className="relative group">
             <User className="absolute left-4 top-3.5 text-neutral-500 group-focus-within:text-brand-yellow transition-colors" size={20} />
             <select 
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-medium transition-all"
            >
              {Array.from({ length: 93 }, (_, i) => i + 8).map(num => (
                <option key={num} value={num}>{num} People</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-4 text-neutral-500 pointer-events-none" size={16} />
          </div>
      </div>

      <div className="bg-neutral-900/50 p-6 rounded-xl border border-neutral-800 space-y-3">
        <div className="flex justify-between text-sm text-neutral-400">
          <span>Base Rate (2hrs @ £19pp)</span>
          <span>£{(guests * 19).toFixed(2)}</span>
        </div>
        {duration > 2 && (
             <div className="flex justify-between text-sm text-brand-yellow font-medium">
                <span className="flex flex-col">
                  <span>Extension (+{duration - 2}hr{duration - 2 > 1 ? 's' : ''})</span>
                  <span className="text-[10px] uppercase tracking-wide opacity-70 font-normal text-neutral-500">Flat rate regardless of group size</span>
                </span>
                <span>
                    {duration === 3 && '+£100.00'}
                    {duration === 4 && '+£175.00'}
                    {duration >= 5 && '+£225.00'}
                </span>
             </div>
        )}
        <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
          <span className="font-bold text-white uppercase tracking-wider text-sm">Estimated Total</span>
          <span className="text-3xl font-black text-brand-yellow tracking-tight">£{totalPrice}</span>
        </div>
      </div>

      <button 
        disabled={!date || !time}
        onClick={() => setStep('details')}
        className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2"
      >
        Continue <ArrowRight size={20} strokeWidth={3} />
      </button>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
       <button onClick={() => setStep('config')} className="text-neutral-500 hover:text-white flex items-center gap-2 text-sm font-medium mb-4 transition-colors">
          <ArrowLeft size={16} /> Change Date/Time
       </button>
       
       <div className="text-center mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Your Details</h2>
        <p className="text-neutral-500">Where should we send the confirmation?</p>
       </div>

       <div className="space-y-4">
          <input 
             placeholder="Full Name"
             value={details.name}
             onChange={e => setDetails({...details, name: e.target.value})}
             className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-medium"
          />
          <input 
             type="email"
             placeholder="Email Address"
             value={details.email}
             onChange={e => setDetails({...details, email: e.target.value})}
             className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-medium"
          />
          <input 
             type="tel"
             placeholder="Phone Number"
             value={details.phone}
             onChange={e => setDetails({...details, phone: e.target.value})}
             className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-medium"
          />
          <textarea
             placeholder="Special Requests (Optional)"
             value={details.specialRequests}
             onChange={e => setDetails({...details, specialRequests: e.target.value})}
             className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-medium min-h-[100px] resize-none"
          />
       </div>

       <div className="flex flex-col gap-4">
          <button 
            onClick={handleCreateCheckout}
            disabled={isLoading}
            className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98] shadow-lg shadow-yellow-900/20 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Proceed to Payment'}
          </button>
       </div>
    </div>
  );

  const renderPayment = () => (
    <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Secure Checkout</h2>
        <div className="inline-flex items-center justify-center gap-2 bg-neutral-900 px-4 py-2 rounded-full border border-neutral-800">
            <span className="text-neutral-400 text-sm">Total to pay:</span>
            <span className="text-brand-yellow font-black text-lg">£{totalPrice}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-xl text-red-200 text-sm text-center">
            {error}
        </div>
      )}

      {/* SumUp Container */}
      <div id="sumup-card" className="bg-white rounded-xl min-h-[150px] mb-6 shadow-2xl"></div>

      <p className="text-center text-neutral-600 text-xs flex items-center justify-center gap-2">
        <ShieldCheck size={14} />
        Payments processed securely via SumUp
      </p>

      {/* Mock Mode / Dev visual aid if needed, though hidden in prod */}
      {checkoutId.startsWith('mock-') && (
         <div className="mt-4 p-4 bg-blue-900/20 border border-blue-900/50 rounded-xl text-center">
            <p className="text-blue-400 text-sm mb-2">Dev Mode Active</p>
            <button 
                onClick={() => router.push(`/confirmation?ref=${bookingRef}`)}
                className="text-xs text-white underline"
            >
                Simulate Success
            </button>
         </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12 flex flex-col justify-start">
      {/* Step Indicator */}
      <div className="flex justify-center mb-12 gap-2">
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'config' ? 'w-12 bg-brand-yellow' : 'w-4 bg-neutral-800'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'details' ? 'w-12 bg-brand-yellow' : 'w-4 bg-neutral-800'}`} />
        <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 'payment' ? 'w-12 bg-brand-yellow' : 'w-4 bg-neutral-800'}`} />
      </div>

      <div className="w-full">
        {error && step !== 'payment' && (
             <div className="max-w-lg mx-auto mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-xl text-red-200 text-sm text-center animate-in fade-in">
                {error}
            </div>
        )}

        {step === 'config' && renderConfig()}
        {step === 'details' && renderDetails()}
        {step === 'payment' && renderPayment()}
      </div>
    </div>
  );
}
