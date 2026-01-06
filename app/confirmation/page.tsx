'use client';

import React, { useEffect, useState } from 'react';
import { Check, Loader2, Calendar, Clock, Receipt, User, ArrowLeft, Ticket } from 'lucide-react';
import { API_URL } from '@/constants';
import Link from 'next/link';

export default function Confirmation() {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      // Parse ref from hash e.g. #confirmation?ref=XYZ
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.split('?')[1]);
      const ref = params.get('ref');

      if (!ref) {
        setError('No booking reference found.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/bookings`); 
        const data = await response.json();
        const found = data.find((b: any) => b.booking_ref === ref);
        
        if (found) {
          setBooking(found);
        } else {
          setError('Booking not found.');
        }
      } catch (err) {
        setError('Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Loader2 className="animate-spin text-brand-yellow mb-4" size={48} />
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Authenticating Booking...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-neutral-950">
        <div className="w-16 h-16 bg-red-900/10 rounded-full flex items-center justify-center mb-6 text-red-500">
           <Receipt size={32} />
        </div>
        <h2 className="text-2xl font-black uppercase text-white mb-2 tracking-tighter">Booking Lookup Failed</h2>
        <p className="text-neutral-500 mb-8 max-w-xs mx-auto text-sm">{error || 'We could not locate your reservation details.'}</p>
        <Link href="/" className="px-8 py-3 bg-neutral-900 text-white font-bold rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-all text-sm uppercase tracking-widest">
            Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 text-center bg-neutral-950 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-yellow/10 rounded-full flex items-center justify-center mb-8 text-brand-yellow shadow-[0_0_50px_rgba(255,215,0,0.2)] animate-pulse">
        <Check size={48} strokeWidth={4} className="sm:size-[56px]" />
      </div>
      
      <div className="space-y-3 mb-12">
        <h1 className="text-4xl sm:text-5xl font-black uppercase text-white tracking-tighter leading-none">Booking Confirmed</h1>
        <p className="text-neutral-400 font-medium text-sm sm:text-base tracking-wide">You're all set! Get ready to take the stage.</p>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-left space-y-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Ticket size={120} className="rotate-12" />
        </div>

        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <span className="text-neutral-500 font-black text-[10px] uppercase tracking-[0.2em]">Reservation Ref</span>
          <span className="font-mono text-brand-yellow font-black text-lg">{booking.booking_ref}</span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-brand-yellow">
                <Calendar size={18} />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Date</p>
              <p className="text-white font-black">{booking.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-brand-yellow">
                <Clock size={18} />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Time & Duration</p>
              <p className="text-white font-black">{booking.time} • {booking.duration} Hours</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-neutral-800 rounded-xl text-brand-yellow">
                <User size={18} />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Guest Count</p>
              <p className="text-white font-black">{booking.guests} People</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-neutral-800 relative z-10">
          <div className="flex flex-col">
            <span className="uppercase tracking-[0.2em] text-[10px] font-black text-neutral-500">Amount Paid</span>
            <span className="text-xs font-bold text-green-500 uppercase">Payment Successful</span>
          </div>
          <span className="text-3xl font-black text-white drop-shadow-sm">£{parseFloat(booking.amount).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center">
        <Link href="/" className="text-neutral-500 hover:text-white underline underline-offset-8 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Homepage
        </Link>
        <button 
          onClick={() => window.print()}
          className="hidden sm:flex text-neutral-500 hover:text-brand-yellow transition-colors text-xs font-black uppercase tracking-[0.2em] items-center gap-2"
        >
          Print Receipt
        </button>
      </div>

      <p className="mt-16 text-neutral-700 text-[10px] font-black uppercase tracking-[0.3em]">
        London Karaoke Club • Soho Suite
      </p>
    </div>
  );
}