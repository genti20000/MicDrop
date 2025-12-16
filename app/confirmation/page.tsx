
import { supabaseAdmin } from '@/lib/supabase';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function Confirmation({ searchParams }: { searchParams: { ref: string } }) {
  const { ref } = searchParams;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, venues(name)')
    .eq('booking_ref', ref)
    .single();

  if (!booking) return notFound();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center bg-neutral-950">
      <div className="w-20 h-20 bg-[#FFD700]/10 rounded-full flex items-center justify-center mb-6 text-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.2)]">
        <Check size={40} strokeWidth={4} />
      </div>
      <h1 className="text-4xl font-black uppercase text-white mb-2 tracking-tight">Booking Confirmed!</h1>
      <p className="text-neutral-400 mb-8">Get ready to perform.</p>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 max-w-sm w-full text-left space-y-4">
        <div className="flex justify-between border-b border-neutral-800 pb-2">
          <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider">Ref</span>
          <span className="font-mono text-[#FFD700]">{booking.booking_ref}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider">Date</span>
          <span className="text-white font-medium">{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500 font-bold text-xs uppercase tracking-wider">Time</span>
          <span className="text-white font-medium">{booking.start_time}</span>
        </div>
        <div className="flex justify-between font-bold text-[#FFD700] pt-4 border-t border-neutral-800 text-lg">
          <span>PAID</span>
          <span>£{booking.total_gbp}</span>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-neutral-500 hover:text-white underline underline-offset-4 text-sm font-bold uppercase tracking-wide">
          Return Home
        </Link>
      </div>
    </div>
  );
}
