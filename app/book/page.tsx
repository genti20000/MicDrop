'use client';

import React, { useState, useEffect, useRef } from 'react';
import { calculatePrice } from '@/lib/utils';
import { Loader2, Calendar, Clock, User, ArrowLeft, ArrowRight, ShieldCheck, ChevronDown, Users } from 'lucide-react';
import { API_URL } from '@/constants';

const TIMES = Array.from({ length: 12 }, (_, i) => `${i + 12}:00`); // 12:00 to 23:00

type Step = 'config' | 'details' | 'payment';

export default function BookingWizard() {
  const [step, setStep] = useState<Step>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dateInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch(`${API_URL}/sumup/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: 'main-location',
          roomType: 'soho',
          date, 
          time, 
          durationHours: duration, 
          guestCount: guests,
          ...details
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingRef(data.bookingRef);
      setCheckoutId(data.checkoutId);
      setTotalPrice(data.amount); 
      setStep('payment');
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount SumUp Widget
  useEffect(() => {
    if (step === 'payment' && checkoutId) {
      const mountSumUp = () => {
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.SumUpCard) {
            try {
              window.SumUpCard.mount({
                id: 'sumup-card',
                checkoutId: checkoutId,
                onResponse: async (type: string, body: any) => {
                  if (type === 'success') {
                    window.location.hash = `confirmation?ref=${bookingRef}`;
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
  }, [step, checkoutId, bookingRef]);

  const handleBoxClick = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch (e) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const renderConfig = () => (
    <div className="space-y-8 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center mb-8">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Select Your Session</h2>
        <p className="text-neutral-500 text-sm font-medium uppercase tracking-widest">London Karaoke Club • Soho Suite</p>
      </div>

      <div className="space-y-6">
        {/* Date Selector */}
        <div className="flex flex-col">
          <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em]">Booking Date</label>
          <div 
            onClick={handleBoxClick}
            className="relative group bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 hover:border-neutral-600 rounded-2xl transition-all cursor-pointer flex items-center min-h-[4.5rem]"
          >
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-hover:text-brand-yellow transition-colors pointer-events-none z-20" size={20} />
            <input 
              ref={dateInputRef}
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              value={date}
              className="w-full h-full bg-transparent border-none focus:ring-0 outline-none text-white font-bold text-lg pl-14 pr-4 cursor-pointer z-10"
              style={{ colorScheme: 'dark' }}
            />
            {!date && (
              <span className="absolute left-14 top-1/2 -translate-y-1/2 text-neutral-600 font-bold text-lg pointer-events-none">
                Choose a date
              </span>
            )}
            <div className="absolute inset-0 rounded-2xl border border-transparent group-focus-within:border-brand-yellow/50 transition-all pointer-events-none"></div>
          </div>
        </div>
        
        {/* Time and Duration Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em]">Start Time</label>
             <div className="relative group">
               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-brand-yellow transition-colors pointer-events-none z-10" size={18} />
              <select 
                onChange={(e) => setTime(e.target.value)}
                value={time}
                className="w-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 hover:border-neutral-600 rounded-2xl py-5 pl-12 pr-10 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-bold text-lg transition-all"
              >
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none group-focus-within:text-brand-yellow transition-colors" size={16} />
            </div>
          </div>
          <div>
            <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em]">Duration</label>
            <div className="relative group">
              <select 
                onChange={(e) => setDuration(Number(e.target.value))}
                value={duration}
                className="w-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 hover:border-neutral-600 rounded-2xl py-5 px-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-bold text-lg transition-all"
              >
                {[2,3,4,5].map(n => <option key={n} value={n}>{n} Hours</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none group-focus-within:text-brand-yellow transition-colors" size={16} />
            </div>
          </div>
        </div>

        {/* Guest Selector */}
        <div>
            <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em]">Number of Guests</label>
            <div className="relative group">
               <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-brand-yellow transition-colors pointer-events-none z-10" size={18} />
               <select 
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 hover:border-neutral-600 rounded-2xl py-5 pl-12 pr-10 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-bold text-lg transition-all"
              >
                {Array.from({ length: 93 }, (_, i) => i + 8).map(num => (
                  <option key={num} value={num}>{num} People</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none group-focus-within:text-brand-yellow transition-colors" size={16} />
            </div>
            <p className="mt-2 text-[10px] text-neutral-500 font-bold uppercase tracking-wider text-center">Minimum 8 guests required for Soho Suite</p>
        </div>
      </div>

      <div className="bg-neutral-900/30 backdrop-blur-md p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <span>Room Base (2hrs)</span>
            <span className="text-white">£{(guests * 19).toFixed(2)}</span>
          </div>
          {duration > 2 && (
               <div className="flex justify-between items-center text-xs font-bold text-neutral-500 uppercase tracking-widest">
                  <span className="text-brand-yellow">Time Extension (+{duration - 2}hr)</span>
                  <span className="text-brand-yellow">
                      {duration === 3 && '+£100.00'}
                      {duration === 4 && '+£175.00'}
                      {duration >= 5 && '+£225.00'}
                  </span>
               </div>
          )}
        </div>
        <div className="flex justify-between items-center pt-4 border-t border-white/5">
          <span className="font-black text-white uppercase tracking-[0.2em] text-[10px]">Grand Total</span>
          <span className="text-4xl font-black text-brand-yellow tracking-tighter drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">£{totalPrice}</span>
        </div>
      </div>

      <button 
        disabled={!date}
        onClick={() => setStep('details')}
        className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-[0.15em] py-5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.98] shadow-[0_10px_30px_rgba(255,215,0,0.2)] flex items-center justify-center gap-3 text-sm"
      >
        Personal Details <ArrowRight size={18} strokeWidth={3} />
      </button>
      
      <p className="text-center text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
        Full soundproofed suite with private bar included
      </p>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
       <button onClick={() => setStep('config')} className="text-neutral-500 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Selection
       </button>
       
       <div className="text-center mb-8">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Guest Info</h2>
        <p className="text-neutral-500 text-sm mt-1 uppercase tracking-widest">Secure your session in Soho</p>
       </div>

       <div className="space-y-4">
          <div className="relative group">
            <input 
               placeholder="Full Name"
               value={details.name}
               onChange={e => setDetails({...details, name: e.target.value})}
               className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold"
            />
          </div>
          <div className="relative group">
            <input 
               type="email"
               placeholder="Email Address"
               value={details.email}
               onChange={e => setDetails({...details, email: e.target.value})}
               className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold"
            />
          </div>
          <div className="relative group">
            <input 
               type="tel"
               placeholder="Phone Number"
               value={details.phone}
               onChange={e => setDetails({...details, phone: e.target.value})}
               className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold"
            />
          </div>
          <div className="relative group">
            <textarea
               placeholder="Special Requests (Optional)"
               value={details.specialRequests}
               onChange={e => setDetails({...details, specialRequests: e.target.value})}
               className="w-full bg-neutral-900/80 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold min-h-[120px] resize-none"
            />
          </div>
       </div>

       <div className="flex flex-col gap-4">
          <button 
            onClick={handleCreateCheckout}
            disabled={isLoading || !details.name || !details.email}
            className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-[0.15em] py-5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.98] shadow-[0_10px_30px_rgba(255,215,0,0.2)] flex items-center justify-center gap-3 text-sm"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm & Pay Securely'}
          </button>
       </div>
    </div>
  );

  const renderPayment = () => (
    <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-3">Secure Checkout</h2>
        <div className="inline-flex items-center justify-center gap-3 bg-neutral-900/50 px-6 py-3 rounded-full border border-neutral-800">
            <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Amount Due:</span>
            <span className="text-brand-yellow font-black text-xl drop-shadow-sm">£{totalPrice}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-2xl text-red-200 text-sm text-center font-bold">
            {error}
        </div>
      )}

      {/* SumUp Container */}
      <div id="sumup-card" className="bg-white rounded-3xl min-h-[150px] mb-8 shadow-2xl overflow-hidden ring-4 ring-neutral-900"></div>

      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-neutral-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-neutral-500" />
          PCI Compliant Secure Payment Gateway
        </p>
        
        <button 
          onClick={() => setStep('details')}
          className="text-neutral-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          Cancel Payment
        </button>
      </div>

      {checkoutId.startsWith('mock-') && (
         <div className="mt-8 p-6 bg-brand-yellow/5 border border-brand-yellow/20 rounded-3xl text-center">
            <p className="text-brand-yellow text-[10px] font-black uppercase tracking-widest mb-2">Development Sandbox</p>
            <p className="text-neutral-500 text-xs mb-4">SumUp credentials missing. Use mock success to test flow.</p>
            <button 
                onClick={() => window.location.hash = `confirmation?ref=${bookingRef}`}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-black uppercase tracking-widest py-3 rounded-xl border border-neutral-800 transition-all text-[10px]"
            >
                Simulate Payment Success
            </button>
         </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-12 flex flex-col justify-start">
      {/* Progress Track */}
      <div className="flex justify-center mb-16 gap-3">
        {['config', 'details', 'payment'].map((s, idx) => (
          <div 
            key={s} 
            className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
              step === s ? 'w-20 bg-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'w-4 bg-neutral-900'
            } ${idx < ['config', 'details', 'payment'].indexOf(step) ? 'bg-neutral-700' : ''}`} 
          />
        ))}
      </div>

      <div className="w-full">
        {error && step !== 'payment' && (
             <div className="max-w-lg mx-auto mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-2xl text-red-200 text-sm text-center animate-in fade-in font-bold">
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