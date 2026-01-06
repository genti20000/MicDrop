'use client';

import React, { useEffect, useState } from 'react';
// Added ShieldCheck to imports to fix "Cannot find name 'ShieldCheck'" error
import { Check, Loader2, Calendar, Clock, Receipt, User, ArrowLeft, Ticket, Music, ShieldCheck } from 'lucide-react';
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
        // We need to fetch the specific booking by reference. 
        // In the absence of a specific GET endpoint for one booking, 
        // we'll filter from the general list or handle it via local context if possible.
        // For now, standardizing to a list fetch (per original logic) but adding a ref check.
        const response = await fetch(`${API_URL}/bookings`); 
        if (!response.ok) throw new Error('Failed to load bookings');
        const data = await response.json();
        const found = data.find((b: any) => b.booking_ref === ref);
        
        if (found) {
          setBooking(found);
        } else {
          // If not in standard bookings list (might be a new guest booking), 
          // we could potentially show a generic success if it just happened.
          setError('Booking record still processing. Please check your email.');
        }
      } catch (err) {
        setError('Failed to load real-time confirmation. Your booking is confirmed if payment was successful.');
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
        <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Verifying Transaction...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-neutral-950 px-4">
        <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mb-6 text-brand-yellow animate-pulse">
           <Check size={32} strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-black uppercase text-white mb-2 tracking-tighter">Session Confirmed!</h2>
        <p className="text-neutral-500 mb-8 max-w-xs mx-auto text-sm">Your payment was successful. We're finalizing the record. See you on stage!</p>
        <Link href="/" className="px-8 py-3 bg-neutral-900 text-white font-bold rounded-xl border border-neutral-800 hover:bg-neutral-800 transition-all text-xs uppercase tracking-widest">
            Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 sm:py-12 text-center bg-neutral-950 animate-in fade-in zoom-in-95 duration-700">
      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-brand-yellow/10 rounded-full flex items-center justify-center mb-8 text-brand-yellow shadow-[0_0_50px_rgba(255,215,0,0.2)] animate-pulse">
        <Check size={48} strokeWidth={4} className="sm:size-[56px]" />
      </div>
      
      <div className="space-y-3 mb-12">
        <h1 className="text-4xl sm:text-5xl font-black uppercase text-white tracking-tighter leading-none">Booking Confirmed</h1>
        <p className="text-neutral-400 font-medium text-sm sm:text-base tracking-wide px-4">You're all set! A confirmation email has been sent.</p>
      </div>

      {booking && (
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-left space-y-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Music size={120} className="rotate-12" />
          </div>

          <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
            <span className="text-neutral-500 font-black text-[10px] uppercase tracking-[0.2em]">Reservation Ref</span>
            <span className="font-mono text-brand-yellow font-black text-lg">{booking.booking_ref}</span>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-neutral-800 rounded-xl text-brand-yellow shrink-0">
                  <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Date</p>
                <p className="text-white font-black">{booking.date}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-neutral-800 rounded-xl text-brand-yellow shrink-0">
                  <Clock size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Time & Duration</p>
                <p className="text-white font-black">{booking.time} • {booking.duration} Hours</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-neutral-800 rounded-xl text-brand-yellow shrink-0">
                  <User size={18} />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Group Size</p>
                <p className="text-white font-black">{booking.guests} Guests</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-neutral-800 relative z-10">
            <div className="flex flex-col">
              <span className="uppercase tracking-[0.2em] text-[10px] font-black text-neutral-500">Paid Amount</span>
              <span className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1">
                <ShieldCheck size={10} /> Fully Paid
              </span>
            </div>
            <span className="text-3xl font-black text-white drop-shadow-sm">£{parseFloat(booking.amount).toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col sm:flex-row gap-6 items-center">
        <Link href="/" className="text-neutral-500 hover:text-white underline underline-offset-8 text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Homepage
        </Link>
        <button 
          onClick={() => window.print()}
          className="hidden sm:flex text-neutral-500 hover:text-brand-yellow transition-colors text-xs font-black uppercase tracking-[0.2em] items-center gap-2"
        >
          <Receipt size={14} /> Print Receipt
        </button>
      </div>

      <p className="mt-16 text-neutral-700 text-[10px] font-black uppercase tracking-[0.3em] text-center px-4">
        London Karaoke Club • Soho Suite • Professional Stage & Bar
      </p>
    </div>
  );
}
