
'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ROOM_CONFIG, RoomType } from '@/types/index';
import { calculatePrice, cn } from '@/lib/utils';
import { Loader2, Check, MapPin, Music, Calendar, Clock, User } from 'lucide-react';

const VENUES = [
  { id: 'soho_berwick', name: 'Soho (Berwick St)', address: '19 Berwick Street' },
  { id: 'soho_greek', name: 'Soho (Greek St)', address: '18 Greek Street' },
  { id: 'holborn_fulwood', name: 'Holborn', address: '14 Fulwood Place' },
];

const TIMES = Array.from({ length: 12 }, (_, i) => `${i + 12}:00`); // 12:00 to 23:00

type Step = 'venue' | 'room' | 'datetime' | 'details' | 'payment';

export default function BookingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('venue');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [venueId, setVenueId] = useState('');
  const [roomType, setRoomType] = useState<RoomType | ''>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(2);
  const [guests, setGuests] = useState(4);
  const [details, setDetails] = useState({ name: '', email: '', phone: '', specialRequests: '' });

  // Payment State
  const [bookingRef, setBookingRef] = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  // Computed Price
  useEffect(() => {
    if (roomType && date) {
      setTotalPrice(calculatePrice(roomType as RoomType, duration, date));
    }
  }, [roomType, duration, date]);

  // Create Checkout Handler
  const handleCreateCheckout = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/sumup/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId, roomType, date, time, durationHours: duration, guestCount: guests,
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
      setTotalPrice(data.amount); // Ensure we use server price
      setStep('payment');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Mount SumUp Widget
  const mountSumUp = () => {
    if (typeof window !== 'undefined' && window.SumUpCard && checkoutId) {
      try {
        window.SumUpCard.mount({
          id: 'sumup-card',
          checkoutId: checkoutId,
          onResponse: async (type: string, body: any) => {
            if (type === 'success') {
              // Verify on server
              try {
                const verify = await fetch('/api/bookings/confirm', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bookingRef, checkoutId })
                });
                if (verify.ok) {
                  router.push(`/confirmation?ref=${bookingRef}`);
                } else {
                  setError('Payment successful but confirmation failed. Contact support.');
                }
              } catch (e) {
                setError('Network error verifying payment.');
              }
            } else if (type === 'error') {
               setError('Payment failed. Please try again.');
            }
          }
        });
      } catch (e) {
        console.error('SumUp Mount Error', e);
      }
    }
  };

  useEffect(() => {
    if (step === 'payment') mountSumUp();
  }, [step, checkoutId]);

  // Components per step
  const renderVenue = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {VENUES.map(v => (
        <button
          key={v.id}
          onClick={() => { setVenueId(v.id); setStep('room'); }}
          className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition text-left group"
        >
          <MapPin className="mb-4 text-cyan-500 group-hover:scale-110 transition" />
          <h3 className="text-xl font-bold text-white">{v.name}</h3>
          <p className="text-slate-400 text-sm">{v.address}</p>
        </button>
      ))}
    </div>
  );

  const renderRoom = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(Object.keys(ROOM_CONFIG) as RoomType[]).map(rt => (
        <button
          key={rt}
          onClick={() => { setRoomType(rt); setStep('datetime'); }}
          className="p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-fuchsia-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] transition text-left group"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-white capitalize">{ROOM_CONFIG[rt].label}</h3>
            <span className="bg-slate-800 px-2 py-1 rounded text-xs text-fuchsia-400">£{ROOM_CONFIG[rt].price}/hr</span>
          </div>
          <p className="text-slate-400 text-sm mb-4">{ROOM_CONFIG[rt].capacity}</p>
          <div className="h-1 w-full bg-gradient-to-r from-fuchsia-500/50 to-transparent rounded" />
        </button>
      ))}
    </div>
  );

  const renderDateTime = () => (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block text-slate-400 mb-2">Date</label>
        <input 
          type="date" 
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setDate(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-400 mb-2">Time</label>
          <select 
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
          >
            <option value="">Select...</option>
            {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 mb-2">Duration (Hrs)</label>
          <select 
            onChange={(e) => setDuration(Number(e.target.value))}
            value={duration}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
          >
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <div>
          <label className="block text-slate-400 mb-2">Guests</label>
          <input 
            type="number" min={1} max={20} value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
          />
      </div>
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
        <span className="text-slate-400">Total Estimate</span>
        <span className="text-xl font-bold text-cyan-400">£{totalPrice}</span>
      </div>
      <button 
        disabled={!date || !time}
        onClick={() => setStep('details')}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4 max-w-md mx-auto">
      <input 
        placeholder="Full Name" 
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-fuchsia-500 outline-none"
        onChange={e => setDetails({...details, name: e.target.value})}
      />
      <input 
        placeholder="Email" type="email"
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-fuchsia-500 outline-none"
        onChange={e => setDetails({...details, email: e.target.value})}
      />
      <input 
        placeholder="Phone" 
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-fuchsia-500 outline-none"
        onChange={e => setDetails({...details, phone: e.target.value})}
      />
      <textarea 
        placeholder="Special Requests?" 
        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-white focus:border-fuchsia-500 outline-none"
        onChange={e => setDetails({...details, specialRequests: e.target.value})}
      />
      <button 
        onClick={handleCreateCheckout}
        disabled={isLoading || !details.name || !details.email || !details.phone}
        className="w-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold py-3 rounded-lg flex justify-center items-center"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : `Pay £${totalPrice}`}
      </button>
    </div>
  );

  const renderPayment = () => (
    <div className="max-w-md mx-auto text-center">
      <h3 className="text-xl font-bold mb-4">Complete Payment</h3>
      <p className="text-slate-400 mb-6">Secure checkout via SumUp</p>
      
      <div id="sumup-card" className="min-h-[200px] bg-white rounded-lg p-4"></div>
      
      {/* Fallback script load */}
      <Script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js" strategy="lazyOnload" onLoad={() => mountSumUp()} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      {/* Steps Header */}
      <div className="flex justify-between mb-8 text-sm font-medium text-slate-500">
        <span className={cn(step === 'venue' && "text-cyan-400")}>1. Venue</span>
        <span className={cn(step === 'room' && "text-cyan-400")}>2. Room</span>
        <span className={cn(step === 'datetime' && "text-cyan-400")}>3. Date</span>
        <span className={cn(step === 'details' && "text-cyan-400")}>4. Details</span>
        <span className={cn(step === 'payment' && "text-fuchsia-400")}>5. Pay</span>
      </div>

      <div className="bg-slate-950/50 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          {step === 'venue' && 'Select Venue'}
          {step === 'room' && 'Select Room'}
          {step === 'datetime' && 'Choose Slot'}
          {step === 'details' && 'Your Info'}
          {step === 'payment' && 'Payment'}
        </h2>
        
        {error && <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded-lg text-center text-sm">{error}</div>}

        {step === 'venue' && renderVenue()}
        {step === 'room' && renderRoom()}
        {step === 'datetime' && renderDateTime()}
        {step === 'details' && renderDetails()}
        {step === 'payment' && renderPayment()}
      </div>
    </div>
  );
}