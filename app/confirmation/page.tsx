
'use client';

import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { API_URL } from '@/constants';

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
        const response = await fetch(`${API_URL}/bookings`); // We can't filter by ref easily without specific endpoint
        // Alternatively, if we had an endpoint like /api/bookings/:ref
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
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[#FFD700] mb-4" size={40} />
        <p className="text-neutral-500">Verifying your booking...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
        <p className="text-neutral-500 mb-6">{error || 'Something went wrong.'}</p>
        <button onClick={() => window.location.hash = ''} className="text-[#FFD700] underline font-bold">Return Home</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center bg-neutral-950 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 bg-[#FFD700]/10 rounded-full flex items-center justify-center mb-6 text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.2)]">
        <Check size={40} strokeWidth={4} />
      </div>
      <h1 className="text-4xl font-black uppercase text-white mb-2 tracking-tight">Booking Confirmed!</h1>
      <p className="text-neutral-400 mb-8">Get ready to perform.</p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full text-left space-y-4 shadow-2xl">
        <div className="flex justify-between border-b border-neutral-800 pb-2">
          <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider">Ref</span>
          <span className="font-mono text-[#FFD700] font-bold">{booking.booking_ref}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider">Date</span>
          <span className="text-white font-medium">{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider">Time</span>
          <span className="text-white font-medium">{booking.time}</span>
        </div>
        <div className="flex justify-between font-bold text-[#FFD700] pt-4 border-t border-neutral-800 text-lg">
          <span className="uppercase tracking-widest text-xs">Status: PAID</span>
          <span>£{parseFloat(booking.amount).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={() => window.location.hash = ''} className="text-neutral-500 hover:text-white underline underline-offset-4 text-sm font-bold uppercase tracking-wide transition-colors">
          Return Home
        </button>
      </div>
    </div>
  );
}
