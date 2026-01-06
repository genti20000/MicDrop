'use client';

import React, { useState, useEffect, useRef } from 'react';
import { calculatePrice, formatCurrency } from '@/services/pricing';
import { Loader2, Calendar, Clock, ArrowLeft, ArrowRight, ShieldCheck, ChevronDown, Users, MapPin } from 'lucide-react';
import { API_URL } from '@/constants';
import { cn } from '@/lib/utils';

const TIMES = Array.from({ length: 12 }, (_, i) => `${i + 12}:00`); // 12:00 to 23:00

type Step = 'config' | 'details' | 'payment';

export default function BookingWizard() {
  const [step, setStep] = useState<Step>('config');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('20:00');
  const [duration, setDuration] = useState(2); 
  const [guests, setGuests] = useState(8); 
  const [details, setDetails] = useState({ name: '', email: '', phone: '', specialRequests: '' });

  // Pricing State
  const [pricing, setPricing] = useState(calculatePrice(8, 2, new Date().toISOString().split('T')[0]));

  // Payment State
  const [bookingRef, setBookingRef] = useState('');
  const [checkoutId, setCheckoutId] = useState('');

  // Update price in real-time
  useEffect(() => {
    if (guests && duration && date) {
      setPricing(calculatePrice(guests, duration, date));
    }
  }, [guests, duration, date]);

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
          amount: pricing.total,
          ...details
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setBookingRef(data.bookingRef);
      setCheckoutId(data.checkoutId);
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
    <div className="space-y-6 sm:space-y-8 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white text-balance">Select Your Session</h2>
        <p className="text-neutral-500 text-xs sm:text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-2">
           <MapPin size={14} className="text-brand-yellow" /> Soho Suite • Private Bar Included
        </p>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Date Selector */}
        <div className="flex flex-col">
          <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Booking Date</label>
          <div 
            onClick={handleBoxClick}
            className="relative group bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-brand-yellow/40 rounded-2xl transition-all cursor-pointer flex items-center h-16 sm:h-20 shadow-xl overflow-hidden"
          >
            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-500 group-hover:text-brand-yellow transition-colors pointer-events-none z-20" size={20} />
            <input 
              ref={dateInputRef}
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              value={date}
              className="w-full h-full bg-transparent border-none focus:ring-0 outline-none text-white font-bold text-lg pl-14 pr-4 cursor-pointer z-10"
            />
            <div className="absolute inset-0 rounded-2xl border border-transparent group-focus-within:border-brand-yellow transition-all pointer-events-none"></div>
          </div>
        </div>
        
        {/* Time and Duration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Start Time</label>
             <div className="relative group">
               <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-brand-yellow transition-colors pointer-events-none z-10" size={18} />
              <select 
                onChange={(e) => setTime(e.target.value)}
                value={time}
                className="w-full h-16 sm:h-20 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-brand-yellow/40 rounded-2xl pl-12 pr-10 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-bold text-lg transition-all"
              >
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none group-focus-within:text-brand-yellow transition-colors" size={16} />
            </div>
          </div>
          <div>
            <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Duration</label>
            <div className="relative group">
              <select 
                onChange={(e) => setDuration(Number(e.target.value))}
                value={duration}
                className="w-full h-16 sm:h-20 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-brand-yellow/40 rounded-2xl px-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-bold text-lg transition-all"
              >
                {[2,3,4,5].map(n => <option key={n} value={n}>{n} Hours</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 pointer-events-none group-focus-within:text-brand-yellow transition-colors" size={16} />
            </div>
          </div>
        </div>

        {/* Guest Selector */}
        <div>
            <label className="block text-brand-yellow mb-2 text-[10px] font-black uppercase tracking-[0.2em] ml-1">Number of Guests</label>
            <div className="relative group">
               <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-brand-yellow transition-colors pointer-events-none z-10" size={18} />
               <select 
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full h-16 sm:h-20 bg-neutral-900/60 backdrop-blur-md border border-neutral-800 hover:border-brand-yellow/40 rounded-2xl pl-12 pr-10 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none appearance-none cursor-pointer font-bold text-lg transition-all"
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

      <div className="bg-neutral-900/40 backdrop-blur-lg p-5 sm:p-6 rounded-3xl border border-white/5 space-y-4 shadow-2xl relative overflow-hidden group/card">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover/card:bg-brand-yellow/10 transition-colors"></div>
        
        <div className="space-y-3 relative z-10">
          <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-neutral-500 uppercase tracking-widest">
            <span>Base Room Fee (2hrs)</span>
            <span className="text-white font-mono">{formatCurrency(pricing.basePrice)}</span>
          </div>
          
          {pricing.discountAmount > 0 && (
             <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-in slide-in-from-left-2">
                <span className="text-green-500">Midweek Discount (25% off)</span>
                <span className="text-green-500 font-mono">-{formatCurrency(pricing.discountAmount)}</span>
             </div>
          )}

          {pricing.extensionPrice > 0 && (
             <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-in slide-in-from-left-2">
                <span className="text-brand-yellow">Time Extension (+{duration - 2}hr)</span>
                <span className="text-brand-yellow font-mono">+{formatCurrency(pricing.extensionPrice)}</span>
             </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-5 border-t border-white/10 relative z-10">
          <span className="font-black text-white uppercase tracking-[0.2em] text-[10px]">Grand Total</span>
          <span className="text-3xl sm:text-4xl font-black text-brand-yellow tracking-tighter drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]">
            {formatCurrency(pricing.total)}
          </span>
        </div>
      </div>

      <button 
        disabled={!date}
        onClick={() => setStep('details')}
        className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-[0.15em] py-5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.98] shadow-[0_10px_40px_rgba(255,215,0,0.15)] flex items-center justify-center gap-3 text-sm group"
      >
        Personal Details <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
      </button>
      
      <p className="text-center text-[10px] text-neutral-600 font-bold uppercase tracking-widest px-4">
        "If you're not able to find space available online, please contact us via WhatsApp."
      </p>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500">
       <button onClick={() => setStep('config')} className="text-neutral-500 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Selection
       </button>
       
       <div className="text-center mb-8 px-4">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white">Guest Info</h2>
        <p className="text-neutral-500 text-xs sm:text-sm mt-1 uppercase tracking-widest">Authorized Contact for Soho Suite</p>
       </div>

       <div className="space-y-4">
          <div className="relative group px-1">
            <input 
               placeholder="Full Name"
               value={details.name}
               onChange={e => setDetails({...details, name: e.target.value})}
               className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold"
            />
          </div>
          <div className="relative group px-1">
            <input 
               type="email"
               placeholder="Email Address"
               value={details.email}
               onChange={e => setDetails({...details, email: e.target.value})}
               className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold"
            />
          </div>
          <div className="relative group px-1">
            <input 
               type="tel"
               placeholder="Phone Number"
               value={details.phone}
               onChange={e => setDetails({...details, phone: e.target.value})}
               className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold"
            />
          </div>
          <div className="relative group px-1">
            <textarea
               placeholder="Special Requests (Optional)"
               value={details.specialRequests}
               onChange={e => setDetails({...details, specialRequests: e.target.value})}
               className="w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 text-white focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all placeholder-neutral-600 font-bold min-h-[120px] resize-none"
            />
          </div>
       </div>

       <div className="flex flex-col gap-4 px-1">
          <button 
            onClick={handleCreateCheckout}
            disabled={isLoading || !details.name || !details.email}
            className="w-full bg-brand-yellow hover:bg-yellow-400 text-black font-black uppercase tracking-[0.15em] py-5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all transform hover:-translate-y-1 active:scale-[0.98] shadow-[0_10px_40px_rgba(255,215,0,0.15)] flex items-center justify-center gap-3 text-sm"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Confirm & Pay Securely'}
          </button>
       </div>
    </div>
  );

  const renderPayment = () => (
    <div className="max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-500 px-4">
      <div className="text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white mb-3 text-balance">Complete Your Booking</h2>
        <div className="inline-flex items-center justify-center gap-3 bg-neutral-900/80 px-6 sm:px-8 py-3 sm:py-4 rounded-full border border-neutral-800 shadow-xl">
            <span className="text-neutral-500 text-[10px] font-black uppercase tracking-widest">Amount Due:</span>
            <span className="text-brand-yellow font-black text-xl sm:text-2xl drop-shadow-sm">{formatCurrency(pricing.total)}</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-950/30 border border-red-900/50 p-4 rounded-2xl text-red-200 text-sm text-center font-bold animate-in shake">
            {error}
        </div>
      )}

      {/* SumUp Container */}
      <div id="sumup-card" className="bg-white rounded-3xl min-h-[200px] mb-8 shadow-2xl overflow-hidden ring-4 ring-neutral-900"></div>

      <div className="flex flex-col items-center gap-6">
        <p className="text-center text-neutral-600 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <ShieldCheck size={14} className="text-green-600" />
          PCI-DSS Level 1 Secure Payment Gateway
        </p>
        
        <button 
          onClick={() => setStep('details')}
          className="text-neutral-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest border-b border-transparent hover:border-white pb-0.5"
        >
          Cancel and return to details
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:py-12 flex flex-col justify-start">
      {/* Progress Track */}
      <div className="flex justify-center mb-10 sm:mb-16 gap-3">
        {['config', 'details', 'payment'].map((s, idx) => (
          <div 
            key={s} 
            className={cn(
              "h-1.5 rounded-full transition-all duration-700 ease-out",
              step === s ? 'w-12 sm:w-20 bg-brand-yellow shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 'w-4 bg-neutral-900',
              ['config', 'details', 'payment'].indexOf(step) > idx ? 'bg-neutral-600' : ''
            )} 
          />
        ))}
      </div>

      <div className="w-full">
        {step === 'config' && renderConfig()}
        {step === 'details' && renderDetails()}
        {step === 'payment' && renderPayment()}
      </div>
    </div>
  );
}